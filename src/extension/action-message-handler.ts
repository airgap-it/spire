import { AccountInfo, ChromeStorage, Network, StorageKey, WalletCommunicationClient } from '@airgap/beacon-sdk'
import { TezosProtocol } from 'airgap-coin-lib'
import * as bip39 from 'bip39'

import { beaconMessageHandler, BeaconMessageHandlerFunction } from './beacon-message-handler'
import { BeaconLedgerBridge } from './ledger-bridge'
import { Logger } from './Logger'
import { Action, ExtensionMessageInputPayload, ExtensionMessageOutputPayload, WalletInfo } from './Methods'

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
  _context: ActionContext
): Promise<void> => {
  logger.log('handleLedgerInit')

  let publicKey: string | undefined
  try {
    publicKey = await bridge.getAddress()
  } catch (error) {
    sendResponse({ error })

    return
  }

  const protocol: TezosProtocol = new TezosProtocol()
  const address: string = await protocol.getAddressFromPublicKey(publicKey)
  sendResponse({ data: { pubkey: publicKey, address } })
}

const handleP2pInit: MessageHandlerFunction<Action.P2P_INIT> = async (
  _data: ExtensionMessageInputPayload<Action.P2P_INIT>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.P2P_INIT>) => void,
  context: ActionContext
): Promise<void> => {
  logger.log('handleP2pInit', 'handshake info', context.p2pClient.getHandshakeInfo())

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

const handleGetMnemonic: MessageHandlerFunction<Action.MNEMONIC_GET> = async (
  _data: ExtensionMessageInputPayload<Action.MNEMONIC_GET>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.MNEMONIC_GET>) => void,
  context: ActionContext
): Promise<void> => {
  logger.log('handleGetMnemonic')
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

const handleGetActiveWallet: MessageHandlerFunction<Action.ACTIVE_WALLET_GET> = async (
  _data: ExtensionMessageInputPayload<Action.ACTIVE_WALLET_GET>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.ACTIVE_WALLET_GET>) => void,
  context: ActionContext
): Promise<void> => {
  logger.log('handleGetActiveWallet')
  const activeWallet: WalletInfo = await context.storage.get('ACTIVE_WALLET' as any)
  sendResponse({ data: { wallet: activeWallet } })
}

const handleSetActiveWallet: MessageHandlerFunction<Action.ACTIVE_WALLET_SET> = async (
  data: ExtensionMessageInputPayload<Action.ACTIVE_WALLET_SET>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.ACTIVE_WALLET_SET>) => void,
  context: ActionContext
): Promise<void> => {
  logger.log('handleSetActiveWallet')
  await context.storage.set('ACTIVE_WALLET' as any, data.data.wallet)
  sendResponse({ data: undefined })
}

const handleGetAccounts: MessageHandlerFunction<Action.ACCOUNTS_GET> = async (
  _data: ExtensionMessageInputPayload<Action.ACCOUNTS_GET>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.ACCOUNTS_GET>) => void,
  context: ActionContext
): Promise<void> => {
  logger.log('handleGetAccounts')
  const accounts: AccountInfo[] = await context.storage.get(StorageKey.ACCOUNTS)
  sendResponse({ data: { accounts } })
}

const handleDeleteAccount: MessageHandlerFunction<Action.ACCOUNT_DELETE> = async (
  data: ExtensionMessageInputPayload<Action.ACCOUNT_DELETE>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.ACCOUNT_DELETE>) => void,
  _context: ActionContext
): Promise<void> => {
  logger.log('handleDeleteAccount', data.data.account)
  sendResponse({ data: undefined })
}

const handleGetActiveNetwork: MessageHandlerFunction<Action.ACTIVE_NETWORK_GET> = async (
  _data: ExtensionMessageInputPayload<Action.ACTIVE_NETWORK_GET>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.ACTIVE_NETWORK_GET>) => void,
  context: ActionContext
): Promise<void> => {
  logger.log('handleGetActiveNetwork')
  const activeNetwork: Network = await context.storage.get('ACTIVE_NETWORK' as any)

  sendResponse({ data: { network: activeNetwork } })
}

const handleSetActiveNetwork: MessageHandlerFunction<Action.ACTIVE_NETWORK_SET> = async (
  data: ExtensionMessageInputPayload<Action.ACTIVE_NETWORK_SET>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.ACTIVE_NETWORK_SET>) => void,
  context: ActionContext
): Promise<void> => {
  logger.log('handleSetActiveNetwork', data)
  await context.storage.set('ACTIVE_NETWORK' as any, data.data.network)
  sendResponse({ data: undefined })
}

const handleAddWallet: MessageHandlerFunction<Action.WALLET_ADD> = async (
  data: ExtensionMessageInputPayload<Action.WALLET_ADD>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.WALLET_ADD>) => void,
  context: ActionContext
): Promise<void> => {
  logger.log('handleAddWallet', data)
  const wallets: WalletInfo[] = (await context.storage.get('WALLETS' as any)) || []
  if (!wallets.some((wallet: WalletInfo) => wallet.pubkey === data.data.wallet.pubkey)) {
    wallets.push(data.data.wallet)
    await context.storage.set('WALLETS' as any, wallets)
    sendResponse({ data: { added: true } })
  } else {
    sendResponse({ data: { added: false } })
  }
}

const handleDeleteWallet: MessageHandlerFunction<Action.WALLET_DELETE> = async (
  data: ExtensionMessageInputPayload<Action.WALLET_DELETE>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.WALLET_DELETE>) => void,
  context: ActionContext
): Promise<void> => {
  logger.log('handleDeleteWallet', data)
  const wallets: WalletInfo[] = (await context.storage.get('WALLETS' as any)) || []
  const filteredWallets: WalletInfo[] = wallets.filter(
    (wallet: WalletInfo) => wallet.pubkey !== data.data.wallet.pubkey
  )
  if (filteredWallets.length === wallets.length) {
    sendResponse({ data: { deleted: false } })
  } else {
    await context.storage.set('WALLETS' as any, filteredWallets)
    sendResponse({ data: { deleted: true } })
  }
}

const handleGetWallets: MessageHandlerFunction<Action.WALLETS_GET> = async (
  data: ExtensionMessageInputPayload<Action.WALLETS_GET>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.WALLETS_GET>) => void,
  context: ActionContext
): Promise<void> => {
  logger.log('handleGetWallets', data)
  const wallets: WalletInfo[] = await context.storage.get('WALLETS' as any)
  sendResponse({ data: { wallets } })
}

export const messageTypeHandler: { [key in Action]: MessageHandlerFunction<any> } = {
  [Action.HANDSHAKE]: messageTypeHandlerNotSupported,
  [Action.WALLET_ADD]: handleAddWallet,
  [Action.WALLET_DELETE]: handleDeleteWallet,
  [Action.WALLETS_GET]: handleGetWallets,
  [Action.ACTIVE_WALLET_GET]: handleGetActiveWallet,
  [Action.ACTIVE_WALLET_SET]: handleSetActiveWallet,
  [Action.ACCOUNT_DELETE]: handleDeleteAccount,
  [Action.ACCOUNTS_GET]: handleGetAccounts,
  [Action.ACTIVE_NETWORK_GET]: handleGetActiveNetwork,
  [Action.ACTIVE_NETWORK_SET]: handleSetActiveNetwork,
  [Action.P2P_INIT]: handleP2pInit,
  [Action.P2P_GET_PEERS]: messageTypeHandlerNotSupported,
  [Action.P2P_REMOVE_PEERS]: messageTypeHandlerNotSupported,
  [Action.LEDGER_INIT]: handleLedgerInit,
  [Action.MNEMONIC_GET]: handleGetMnemonic,
  [Action.MNEMONIC_GENERATE]: handleGenerateMnemonic,
  [Action.MNEMONIC_SAVE]: handleSaveMnemonic,
  [Action.RESPONSE]: handleResponse
}
