import {
  AccountInfo,
  BeaconMessage,
  BeaconMessageType,
  ChromeMessageTransport,
  ChromeStorage,
  ExtensionMessage,
  ExtensionMessageTarget,
  Origin,
  P2PCommunicationClient,
  PermissionResponse,
  Serializer,
  Storage,
  StorageKey
} from '@airgap/beacon-sdk'
import { ConnectionContext } from '@airgap/beacon-sdk/dist/types/ConnectionContext'
import { getKeypairFromSeed, toHex } from '@airgap/beacon-sdk/dist/utils/crypto'
import { ExposedPromise, exposedPromise } from '@airgap/beacon-sdk/dist/utils/exposed-promise'
import { generateGUID } from '@airgap/beacon-sdk/dist/utils/generate-uuid'
import * as sodium from 'libsodium-wrappers'

import { AirGapSigner } from '../AirGapSigner'

import {
  MessageHandlerFunction,
  messageTypeHandler,
  messageTypeHandlerNotSupported
} from './action-handler/action-message-handler'
import { ExtensionClientOptions } from './ExtensionClientOptions'
import { Logger } from './Logger'
import { MessageHandler } from './message-handler/MessageHandler'
import { ToBackgroundMessageHandler } from './message-handler/ToBackgroundMessageHandler'
import { ToExtensionMessageHandler } from './message-handler/ToExtensionMessageHandler'
import { ToPageMessageHandler } from './message-handler/ToPageMessageHandler'
import { Action, ExtensionMessageInputPayload } from './Methods'
import { PopupManager } from './PopupManager'
import { Signer } from './Signer'

const logger: Logger = new Logger('ExtensionClient')

const popupManager: PopupManager = new PopupManager()
const sendToPopup: (message: ExtensionMessage<unknown>) => Promise<void> = (
  message: ExtensionMessage<unknown>
): Promise<void> => {
  return popupManager.sendToPopup(message)
}

export class ExtensionClient {
  // private pendingRequests: BeaconMessage[] = []

  protected beaconId: string | undefined
  protected _keyPair: ExposedPromise<sodium.KeyPair> = exposedPromise()
  protected get keyPair(): Promise<sodium.KeyPair> {
    return this._keyPair.promise
  }

  public readonly signer: Signer = new AirGapSigner()

  private p2pClient: P2PCommunicationClient | undefined
  private p2pPubkey: string | undefined = ''

  private readonly storage: Storage
  private readonly transport: ChromeMessageTransport

  private readonly listeners: any[] = []

  constructor(config: ExtensionClientOptions) {
    this.storage = new ChromeStorage()
    this.transport = new ChromeMessageTransport(config.name)

    this.loadOrCreateBeaconSecret().catch(console.error)
    this.keyPair
      .then((keyPair: sodium.KeyPair) => {
        this.beaconId = toHex(keyPair.publicKey)
        this.p2pClient = new P2PCommunicationClient(config.name, keyPair, 1, true)

        this.p2pClient.start().catch((p2pClientStartError: Error) => {
          logger.error('p2pClientStartError', p2pClientStartError)
        })
      })
      .catch(console.error)

    const messageHandlerMap: Map<string, MessageHandler> = new Map<string, MessageHandler>()
    messageHandlerMap.set(
      ExtensionMessageTarget.EXTENSION,
      new ToExtensionMessageHandler(this.sendToBeacon, sendToPopup, this.signer)
    )
    messageHandlerMap.set(
      ExtensionMessageTarget.PAGE,
      new ToPageMessageHandler(
        (pageData: string): Promise<void> => {
          return this.sendToPage(pageData)
        }
      )
    )
    messageHandlerMap.set(ExtensionMessageTarget.BACKGROUND, new ToBackgroundMessageHandler(this.handleMessage))

    const transportListener: any = (message: ExtensionMessage<unknown>, connectionContext: ConnectionContext): void => {
      console.log('getting message!', message, connectionContext)

      const handler: MessageHandler = messageHandlerMap.get(message.target) || new MessageHandler()
      handler
        .handle(
          message,
          connectionContext.extras ? connectionContext.extras.sendResponse : (_response?: unknown): void => undefined,
          false
        )
        .catch((handlerError: Error) => {
          logger.error('messageHandlerError', handlerError)
        })

      this.listeners.forEach(listener => {
        listener(message, connectionContext)
      })
    }

    this.transport.addListener(transportListener).catch(console.error)
  }

  public sendToBeacon = async (message: string): Promise<void> => {
    logger.log('sending message', this.p2pPubkey, message)
    if (this.p2pPubkey && this.p2pClient) {
      this.p2pClient.sendMessage(this.p2pPubkey, message).catch((beaconSendError: Error) => {
        logger.error('sendToBeacon', beaconSendError)
      })
    } else {
      throw new Error('p2p not ready')
    }
  }

  public handleMessage: (
    data: ExtensionMessage<ExtensionMessageInputPayload<Action>>,
    sendResponse: (message: unknown) => void
  ) => Promise<void> = async (
    data: ExtensionMessage<ExtensionMessageInputPayload<Action>>,
    sendResponse: (message: unknown) => void
  ): Promise<void> => {
    logger.log('handleMessage', data, sendResponse)
    const handler: MessageHandlerFunction<Action> =
      messageTypeHandler[data.payload.action] || messageTypeHandlerNotSupported
    logger.log('handler', handler)
    await handler(data.payload, sendResponse, {
      client: this,
      p2pClient: this.p2pClient,
      storage: this.storage,
      sendToPage: (pageData: string): Promise<void> => {
        return this.sendToPage(pageData)
      },
      setP2pPubkey: (pubkey: string): void => {
        this.p2pPubkey = pubkey
      }
    })
  }

  public async addListener(listener: Function): Promise<any> {
    this.listeners.push(listener)
  }

  public async getAccounts(): Promise<AccountInfo[]> {
    logger.log('getAccounts')

    return this.storage.get(StorageKey.ACCOUNTS)
  }

  public async getAccount(accountIdentifier: string): Promise<AccountInfo | undefined> {
    const accounts: AccountInfo[] = await this.storage.get(StorageKey.ACCOUNTS)

    return accounts.find((account: AccountInfo) => account.accountIdentifier === accountIdentifier)
  }

  public async addAccount(accountInfo: AccountInfo): Promise<void> {
    logger.log('addAccount', accountInfo)
    const accounts: AccountInfo[] = await this.storage.get(StorageKey.ACCOUNTS)

    if (!accounts.some((account: AccountInfo) => account.accountIdentifier === accountInfo.accountIdentifier)) {
      accounts.push(accountInfo)
    }

    return this.storage.set(StorageKey.ACCOUNTS, accounts)
  }

  public async removeAccount(accountIdentifier: string): Promise<void> {
    const accounts: AccountInfo[] = await this.storage.get(StorageKey.ACCOUNTS)

    const filteredAccounts: AccountInfo[] = accounts.filter(
      (accountInfo: AccountInfo) => accountInfo.accountIdentifier !== accountIdentifier
    )

    return this.storage.set(StorageKey.ACCOUNTS, filteredAccounts)
  }

  public async removeAllAccounts(): Promise<void> {
    return this.storage.delete(StorageKey.ACCOUNTS)
  }

  /**
   * Process the message before it gets sent to the page.
   *
   * @param data The serialized message that will be sent to the page
   */
  private async processMessage(data: string): Promise<void> {
    const beaconMessage: BeaconMessage = (await new Serializer().deserialize(data)) as BeaconMessage
    if (beaconMessage.type === BeaconMessageType.PermissionResponse) {
      const permissionResponse: PermissionResponse = beaconMessage
      const account: AccountInfo = {
        ...permissionResponse,
        origin: {
          type: Origin.EXTENSION, // TODO: Fix
          id: permissionResponse.beaconId
        },
        beaconId: '',
        connectedAt: new Date()
      }
      await this.addAccount(account)
    }
  }

  private async sendToPage(data: string): Promise<void> {
    logger.log('sendToPage', 'background.js: post ', data)
    await this.processMessage(data)
    const message: ExtensionMessage<string> = { target: ExtensionMessageTarget.PAGE, payload: data }
    chrome.tabs.query({}, (tabs: chrome.tabs.Tab[]) => {
      // TODO: Find way to have direct communication with tab
      tabs.forEach(({ id }: chrome.tabs.Tab) => {
        if (id) {
          chrome.tabs.sendMessage(id, message)
        }
      }) // Send message to all tabs
    })
  }

  private async loadOrCreateBeaconSecret(): Promise<void> {
    const storageValue: unknown = await this.storage.get(StorageKey.BEACON_SDK_SECRET_SEED)
    if (storageValue && typeof storageValue === 'string') {
      this._keyPair.resolve(getKeypairFromSeed(storageValue))
    } else {
      const key: string = generateGUID()
      await this.storage.set(StorageKey.BEACON_SDK_SECRET_SEED, key)
      this._keyPair.resolve(getKeypairFromSeed(key))
    }
  }
}
