import { AccountInfo } from '@airgap/beacon-sdk/dist/clients/Client'
import { ChromeStorage } from '@airgap/beacon-sdk/dist/storage/ChromeStorage'
import { StorageKey } from '@airgap/beacon-sdk/dist/storage/Storage'
import { WalletCommunicationClient } from '@airgap/beacon-sdk/dist/WalletCommunicationClient'
import { TezosProtocol } from 'airgap-coin-lib'
import * as bip39 from 'bip39'

import { beaconMessageHandler, BeaconMessageHandlerFunction } from './beacon-message-handler'
import { BeaconLedgerBridge } from './ledger-bridge'
import { Logger } from './Logger'
import { Action, ExtensionMessageInputPayload, ExtensionMessageOutputPayload } from './Methods'

const bridge: BeaconLedgerBridge = new BeaconLedgerBridge('https://airgap-it.github.io/beacon-ledger-bridge/')

const logger: Logger = new Logger('action-message-handler.ts')

const logError: (error: Error) => void = (error: Error): void => {
  logger.error('error', error)
}

interface ActionContext {
  p2pClient: WalletCommunicationClient
  storage: ChromeStorage
  sendToPage(message: unknown): void
  setP2pPubkey(pubkey: string): void
}

export type MessageHandlerFunction<T extends Action> = (
  data: ExtensionMessageInputPayload<T>,
  sendResponse: (message: ExtensionMessageOutputPayload<T>) => void,
  context: ActionContext
) => Promise<void>

export const messageTypeHandlerNotSupported: MessageHandlerFunction<any> = async (
  data: ExtensionMessageInputPayload<any>,
  sendResponse: (message: ExtensionMessageOutputPayload<any>) => void,
  _context: ActionContext
): Promise<void> => {
  logger.log('messageTypeNotHandled', data.action)
  sendResponse({ error: 'messageTypeNotHandled' })
}

const handleLedgerInit: MessageHandlerFunction<Action.LEDGER_INIT> = async (
  _data: ExtensionMessageInputPayload<Action.LEDGER_INIT>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.LEDGER_INIT>) => void,
  context: ActionContext
): Promise<void> => {
  let publicKey: string | undefined
  try {
    publicKey = await bridge.getAddress()
  } catch (error) {
    sendResponse({ error })

    return
  }

  context.storage.set('ledger-publicKey' as any, publicKey).catch(logError)
  const protocol: TezosProtocol = new TezosProtocol()
  const address: string = await protocol.getAddressFromPublicKey(publicKey)
  sendResponse({ data: { address } })
}

const p2pInit: MessageHandlerFunction<Action.P2P_INIT> = async (
  _data: ExtensionMessageInputPayload<Action.P2P_INIT>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.P2P_INIT>) => void,
  context: ActionContext
): Promise<void> => {
  logger.log('handleP2PInit', 'handshake info', context.p2pClient.getHandshakeInfo())

  context.p2pClient
    .listenForChannelOpening((pubkey: string) => {
      logger.log('handleP2PInit', 'channel opening', pubkey)
      context.setP2pPubkey(pubkey)

      context.p2pClient
        .listenForEncryptedMessage(pubkey, (message: string) => {
          logger.log('handleP2PInit', 'got message!', message)
          context.sendToPage(message)
        })
        .catch((listenForEncryptedMessageError: Error) => {
          logger.error('handleP2PInit', listenForEncryptedMessageError)
        })
    })
    .then(() => {
      logger.log('handleP2PInit', 'listening for channel open')
    })
    .catch((listenForChannelOpeningError: Error) => {
      logger.error('handleP2PInit', listenForChannelOpeningError)
    })

  sendResponse({ data: { qr: context.p2pClient.getHandshakeInfo() } })
}

const handleResponse: MessageHandlerFunction<Action.RESPONSE> = async (
  data: ExtensionMessageInputPayload<Action.RESPONSE>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.RESPONSE>) => void,
  context: ActionContext
): Promise<void> => {
  logger.log('handleResponse', data)
  const handler: BeaconMessageHandlerFunction = beaconMessageHandler[(data.data.request as any).type]
  await handler(
    data.data.request as any,
    (message: string) => {
      context.sendToPage(message)
    },
    sendResponse as any
  )
}

const handleGenerateMnemonic: MessageHandlerFunction<Action.MNEMONIC_GENERATE> = async (
  _data: ExtensionMessageInputPayload<Action.MNEMONIC_GENERATE>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.MNEMONIC_GENERATE>) => void,
  context: ActionContext
): Promise<void> => {
  logger.log('handleGenerateMnemonic')
  const generated: string = bip39.generateMnemonic()
  logger.log('mnemonic generated', generated)
  context.storage.set('mnemonic' as any, generated).catch(logError)
  sendResponse({ data: { mnemonic: generated } })
}

const getMnemonic: MessageHandlerFunction<Action.MNEMONIC_GET> = async (
  _data: ExtensionMessageInputPayload<Action.MNEMONIC_GET>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.MNEMONIC_GET>) => void,
  context: ActionContext
): Promise<void> => {
  logger.log('getMnemonic')
  const mnemonic: string = await context.storage.get('mnemonic' as any)
  if (mnemonic) {
    logger.log('mnemonic read', mnemonic)
    sendResponse({ data: { mnemonic } })
  } else {
    await handleGenerateMnemonic(_data as any, sendResponse as any, context)
  }
}

const handleSaveMnemonic: MessageHandlerFunction<Action.MNEMONIC_SAVE> = async (
  data: ExtensionMessageInputPayload<Action.MNEMONIC_SAVE>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.MNEMONIC_SAVE>) => void,
  context: ActionContext
): Promise<void> => {
  logger.log('handleSaveMnemonic')
  await context.storage.set('mnemonic' as any, data.data.mnemonic).catch(logError)
  sendResponse({ data: { result: true } })
}

const getActiveAccount: MessageHandlerFunction<Action.ACTIVE_ACCOUNT_GET> = async (
  _data: ExtensionMessageInputPayload<Action.ACTIVE_ACCOUNT_GET>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.ACTIVE_ACCOUNT_GET>) => void,
  context: ActionContext
): Promise<void> => {
  logger.log('getActiveAccount')
  const accountIdentifier: string | undefined = await context.storage.get(StorageKey.ACTIVE_ACCOUNT)
  const accounts: AccountInfo[] = await context.storage.get(StorageKey.ACCOUNTS)
  const account: AccountInfo | undefined = accounts.find(
    (el: AccountInfo) => el.accountIdentifier === accountIdentifier
  )
  sendResponse({ data: { account } })
}

const setActiveAccount: MessageHandlerFunction<Action.ACTIVE_ACCOUNT_SET> = async (
  data: ExtensionMessageInputPayload<Action.ACTIVE_ACCOUNT_SET>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.ACTIVE_ACCOUNT_SET>) => void,
  context: ActionContext
): Promise<void> => {
  logger.log('setActiveAccount')
  await context.storage.set(StorageKey.ACTIVE_ACCOUNT, data.data.account.accountIdentifier)
  sendResponse({ data: undefined })
}

const getAccounts: MessageHandlerFunction<Action.ACCOUNTS_GET> = async (
  _data: ExtensionMessageInputPayload<Action.ACCOUNTS_GET>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.ACCOUNTS_GET>) => void,
  context: ActionContext
): Promise<void> => {
  logger.log('getAccounts')
  const accounts: AccountInfo[] = await context.storage.get(StorageKey.ACCOUNTS)
  sendResponse({ data: { accounts } })
}

export const messageTypeHandler: { [key in Action]: MessageHandlerFunction<any> } = {
  [Action.HANDSHAKE]: messageTypeHandlerNotSupported,
  [Action.ACCOUNTS_GET]: getAccounts,
  [Action.ACTIVE_ACCOUNT_GET]: getActiveAccount,
  [Action.ACTIVE_ACCOUNT_SET]: setActiveAccount,
  [Action.P2P_INIT]: p2pInit,
  [Action.P2P_GET_PEERS]: messageTypeHandlerNotSupported,
  [Action.P2P_REMOVE_PEERS]: messageTypeHandlerNotSupported,
  [Action.LEDGER_INIT]: handleLedgerInit,
  [Action.MNEMONIC_GET]: getMnemonic,
  [Action.MNEMONIC_GENERATE]: handleGenerateMnemonic,
  [Action.MNEMONIC_SAVE]: handleSaveMnemonic,
  [Action.RESPONSE]: handleResponse
}
