import {
  AppMetadata,
  BeaconMessage,
  BeaconMessageType,
  ChromeMessageTransport,
  ChromeStorage,
  ExtensionMessage,
  ExtensionMessageTarget,
  P2PCommunicationClient,
  PermissionRequest,
  PermissionResponse,
  Serializer
} from '@airgap/beacon-sdk'
import { BeaconClient } from '@airgap/beacon-sdk/dist/clients/beacon-client/BeaconClient'
import { ConnectionContext } from '@airgap/beacon-sdk/dist/types/ConnectionContext'
import { getAddressFromPublicKey } from '@airgap/beacon-sdk/dist/utils/crypto'
import { getAccountIdentifier } from '@airgap/beacon-sdk/dist/utils/get-account-identifier'
import * as sodium from 'libsodium-wrappers'

import { AirGapOperationProvider, LocalSigner } from '../AirGapSigner'

import { ActionHandlerFunction, ActionMessageHandler } from './action-handler/ActionMessageHandler'
import { Action, ExtensionMessageInputPayload, PermissionInfo, WalletInfo, WalletType } from './Actions'
import { ExtensionClientOptions } from './ExtensionClientOptions'
import { Logger } from './Logger'
import { MessageHandler } from './message-handler/MessageHandler'
import { ToBackgroundMessageHandler } from './message-handler/ToBackgroundMessageHandler'
import { ToExtensionMessageHandler } from './message-handler/ToExtensionMessageHandler'
import { ToPageMessageHandler } from './message-handler/ToPageMessageHandler'
import { PopupManager } from './PopupManager'
import { Signer } from './Signer'

const logger: Logger = new Logger('ExtensionClient')

export class ExtensionClient extends BeaconClient {
  public pendingRequests: BeaconMessage[] = []

  public readonly operationProvider: AirGapOperationProvider = new AirGapOperationProvider()
  public readonly signer: Signer = new LocalSigner()

  public readonly popupManager: PopupManager = new PopupManager()

  private p2pClient: P2PCommunicationClient | undefined
  private p2pPubkey: string | undefined = ''

  private readonly transport: ChromeMessageTransport

  private readonly listeners: any[] = []

  constructor(config: ExtensionClientOptions) {
    super({ name: config.name, storage: new ChromeStorage() })

    this.transport = new ChromeMessageTransport(config.name)

    this.keyPair
      .then((keyPair: sodium.KeyPair) => {
        this.p2pClient = new P2PCommunicationClient(config.name, keyPair, 1, true)

        this.p2pClient.start().catch((p2pClientStartError: Error) => {
          logger.error('p2pClientStartError', p2pClientStartError)
        })
      })
      .catch(console.error)

    const messageHandlerMap: Map<string, MessageHandler> = new Map<string, MessageHandler>()
    messageHandlerMap.set(ExtensionMessageTarget.EXTENSION, new ToExtensionMessageHandler(this))
    messageHandlerMap.set(ExtensionMessageTarget.PAGE, new ToPageMessageHandler(this))
    messageHandlerMap.set(ExtensionMessageTarget.BACKGROUND, new ToBackgroundMessageHandler(this.handleMessage))

    const transportListener: any = (message: ExtensionMessage<unknown>, connectionContext: ConnectionContext): void => {
      console.log('getting message!', message, connectionContext)

      const handler: MessageHandler = messageHandlerMap.get(message.target) || new MessageHandler()
      handler.handle(message, connectionContext, false).catch((handlerError: Error) => {
        logger.error('messageHandlerError', handlerError)
      })

      this.listeners.forEach(listener => {
        listener(message, connectionContext)
      })
    }

    this.transport.addListener(transportListener).catch(console.error)
  }

  public async sendToPopup(message: ExtensionMessage<unknown>): Promise<void> {
    return this.popupManager.sendToPopup(message)
  }

  public async sendToBeacon(message: string): Promise<void> {
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
    const handler: ActionHandlerFunction<Action> = await new ActionMessageHandler().getHandler(data.payload.action)

    await handler({
      data: data.payload,
      sendResponse,
      client: this,
      p2pClient: this.p2pClient,
      storage: this.storage,
      setP2pPubkey: (pubkey: string): void => {
        this.p2pPubkey = pubkey
      }
    })
  }

  public async addListener(listener: Function): Promise<any> {
    this.listeners.push(listener)
  }

  public async getPermissions(): Promise<PermissionInfo[]> {
    logger.log('getPermissions')

    return (await this.storage.get('permissions' as any)) || [] // TODO: Fix when permissions type is in sdk
  }

  public async getPermission(accountIdentifier: string): Promise<PermissionInfo | undefined> {
    const permissions: PermissionInfo[] = (await this.storage.get('permissions' as any)) || [] // TODO: Fix when wallets type is in sdk

    return permissions.find((permission: PermissionInfo) => permission.accountIdentifier === accountIdentifier)
  }

  public async addPermission(permissionInfo: PermissionInfo): Promise<void> {
    logger.log('addPermission', permissionInfo)
    const permissions: PermissionInfo[] = (await this.storage.get('permissions' as any)) || [] // TODO: Fix when permissions type is in sdk

    if (
      !permissions.some(
        (permission: PermissionInfo) => permission.accountIdentifier === permissionInfo.accountIdentifier
      )
    ) {
      permissions.push(permissionInfo)
    }

    return this.storage.set('permissions' as any, permissions)
  }

  public async removePermission(accountIdentifier: string): Promise<void> {
    const permissions: PermissionInfo[] = (await this.storage.get('permissions' as any)) || [] // TODO: Fix when permissions type is in sdk

    const filteredPermissions: PermissionInfo[] = permissions.filter(
      (permissionInfo: PermissionInfo) => permissionInfo.accountIdentifier !== accountIdentifier
    )

    return this.storage.set('permissions' as any, filteredPermissions)
  }

  public async removeAllPermissions(): Promise<void> {
    return this.storage.delete('permissions' as any)
  }

  public async getWallets(): Promise<WalletInfo[]> {
    logger.log('getWallets')

    return (await this.storage.get('wallets' as any)) || [] // TODO: Fix when wallets type is in sdk
  }

  public async getWallet(pubkey: string): Promise<WalletInfo | undefined> {
    const wallets: WalletInfo[] = (await this.storage.get('wallets' as any)) || [] // TODO: Fix when wallets type is in sdk

    return wallets.find((wallet: WalletInfo) => wallet.pubkey === pubkey)
  }

  public async getWalletByAddress(address: string): Promise<WalletInfo | undefined> {
    const wallets: WalletInfo[] = (await this.storage.get('wallets' as any)) || [] // TODO: Fix when wallets type is in sdk

    return wallets.find((wallet: WalletInfo) => wallet.address === address)
  }

  public async addWallet(walletInfo: WalletInfo): Promise<void> {
    logger.log('addWallet', walletInfo)
    const wallets: WalletInfo[] = (await this.storage.get('wallets' as any)) || [] // TODO: Fix when wallets type is in sdk

    let newWallets: WalletInfo[] = wallets
    if (!wallets.some((wallet: WalletInfo) => wallet.pubkey === walletInfo.pubkey)) {
      if (walletInfo.type === WalletType.LOCAL_MNEMONIC) {
        // There can only be one local mnemonic. So we have to delete the old one if we add a new one
        const filteredWallets: WalletInfo[] = wallets.filter(
          (walletInfoElement: WalletInfo) => walletInfoElement.type !== WalletType.LOCAL_MNEMONIC
        )
        filteredWallets.push(walletInfo)
        newWallets = filteredWallets
      } else {
        newWallets.push(walletInfo)
      }
    }

    return this.storage.set('wallets' as any, newWallets)
  }

  public async removeWallet(pubkey: string): Promise<void> {
    const wallets: WalletInfo[] = (await this.storage.get('wallets' as any)) || [] // TODO: Fix when wallets type is in sdk

    const filteredWallets: WalletInfo[] = wallets.filter((walletInfo: WalletInfo) => walletInfo.pubkey !== pubkey)

    return this.storage.set('wallets' as any, filteredWallets)
  }

  public async removeAllWallets(): Promise<void> {
    return this.storage.delete('wallets' as any)
  }

  public async getAppMetadataList(): Promise<AppMetadata[]> {
    logger.log('getAppMetadataList')

    return (await this.storage.get('appMetadataList' as any)) || [] // TODO: Fix when appMetadataList type is in sdk
  }

  public async getAppMetadata(beaconId: string): Promise<AppMetadata | undefined> {
    const appMetadataList: AppMetadata[] = (await this.storage.get('appMetadataList' as any)) || [] // TODO: Fix when wallets type is in sdk

    return appMetadataList.find((appMetadata: AppMetadata) => appMetadata.beaconId === beaconId)
  }

  public async addAppMetadata(appMetadata: AppMetadata): Promise<void> {
    logger.log('addAppMetadata', appMetadata)
    const appMetadataList: AppMetadata[] = (await this.storage.get('appMetadataList' as any)) || [] // TODO: Fix when appMetadataList type is in sdk

    if (
      !appMetadataList.some((appMetadataElement: AppMetadata) => appMetadataElement.beaconId === appMetadata.beaconId)
    ) {
      appMetadataList.push(appMetadata)
    }

    return this.storage.set('appMetadataList' as any, appMetadataList)
  }

  public async removeAppMetadata(beaconId: string): Promise<void> {
    const appMetadataList: AppMetadata[] = (await this.storage.get('appMetadataList' as any)) || [] // TODO: Fix when appMetadataList type is in sdk

    const filteredAppMetadataList: AppMetadata[] = appMetadataList.filter(
      (appMetadata: AppMetadata) => appMetadata.beaconId !== beaconId
    )

    return this.storage.set('appMetadataList' as any, filteredAppMetadataList)
  }

  public async removeAllAppMetadata(): Promise<void> {
    return this.storage.delete('appMetadataList' as any)
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
      const request: BeaconMessage | undefined = this.pendingRequests.find(
        (requestElement: BeaconMessage) => requestElement.id === permissionResponse.id
      )
      if (!request) {
        throw new Error('Matching request not found')
      }

      const permissionRequest: PermissionRequest = request as PermissionRequest
      const permission: PermissionInfo = {
        accountIdentifier: await getAccountIdentifier(permissionResponse.pubkey, permissionResponse.network),
        beaconId: permissionResponse.beaconId,
        appMetadata: permissionRequest.appMetadata,
        website: 'https://placeholder.com', // TODO: Use actual website
        address: await getAddressFromPublicKey(permissionResponse.pubkey),
        pubkey: permissionResponse.pubkey,
        network: permissionResponse.network,
        scopes: permissionResponse.scopes,
        connectedAt: new Date()
      }
      await this.addPermission(permission)
    }
  }

  public async sendToPage(data: string): Promise<void> {
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
}
