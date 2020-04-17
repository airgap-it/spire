import { AccountInfo, Network } from '@airgap/beacon-sdk'

export interface WalletInfo {
  pubkey: string
  type: WalletType
  added: Date
  senderId: string
}

export enum WalletType {
  P2P = 'P2P',
  LEDGER = 'LEDGER',
  LOCAL_MNEMONIC = 'LOCAL_MNEMONIC'
}

export enum Action {
  HANDSHAKE = 'HANDSHAKE',
  WALLET_ADD = 'WALLET_ADD',
  WALLET_DELETE = 'WALLET_DELETE',
  WALLETS_GET = 'WALLETS_GET',
  ACTIVE_WALLET_GET = 'ACTIVE_WALLET_GET',
  ACTIVE_WALLET_SET = 'ACTIVE_WALLET_SET',
  ACCOUNTS_GET = 'ACCOUNTS_GET',
  ACCOUNT_DELETE = 'ACCOUNT_DELETE',
  ACTIVE_NETWORK_GET = 'ACTIVE_NETWORK_GET',
  ACTIVE_NETWORK_SET = 'ACTIVE_NETWORK_SET',
  P2P_INIT = 'P2P_INIT',
  P2P_GET_PEERS = 'P2P_GET_PEERS',
  P2P_REMOVE_PEERS = 'P2P_REMOVE_PEERS',
  LEDGER_INIT = 'LEDGER_INIT',
  MNEMONIC_GET = 'MNEMONIC_GET',
  MNEMONIC_GENERATE = 'MNEMONIC_GENERATE',
  MNEMONIC_SAVE = 'MNEMONIC_SAVE',
  RESPONSE = 'REQUEST'
}

export interface ActionInputTypesMap {
  [Action.HANDSHAKE]: undefined
  [Action.WALLET_ADD]: { wallet: WalletInfo }
  [Action.WALLET_DELETE]: { wallet: WalletInfo }
  [Action.WALLETS_GET]: undefined
  [Action.ACTIVE_WALLET_GET]: undefined
  [Action.ACTIVE_WALLET_SET]: { wallet: WalletInfo }
  [Action.ACCOUNTS_GET]: undefined
  [Action.ACCOUNT_DELETE]: { account: AccountInfo }
  [Action.ACTIVE_NETWORK_GET]: undefined
  [Action.ACTIVE_NETWORK_SET]: { network: Network }
  [Action.P2P_INIT]: undefined
  [Action.P2P_GET_PEERS]: undefined
  [Action.P2P_REMOVE_PEERS]: undefined
  [Action.LEDGER_INIT]: undefined
  [Action.MNEMONIC_GET]: undefined
  [Action.MNEMONIC_GENERATE]: undefined
  [Action.MNEMONIC_SAVE]: { mnemonic: string }
  [Action.RESPONSE]: { request: unknown }
}

export interface ActionOutputTypesMap {
  [Action.HANDSHAKE]: undefined
  [Action.WALLET_ADD]: { added: boolean }
  [Action.WALLET_DELETE]: { deleted: boolean }
  [Action.WALLETS_GET]: { wallets: WalletInfo[] }
  [Action.ACTIVE_WALLET_GET]: { wallet: WalletInfo }
  [Action.ACTIVE_WALLET_SET]: undefined
  [Action.ACCOUNTS_GET]: { accounts: AccountInfo[] }
  [Action.ACCOUNT_DELETE]: undefined
  [Action.ACTIVE_NETWORK_GET]: { network: Network | undefined }
  [Action.ACTIVE_NETWORK_SET]: undefined
  [Action.P2P_INIT]: { qr: { name: string; pubKey: string; relayServer: string } }
  [Action.P2P_GET_PEERS]: undefined
  [Action.P2P_REMOVE_PEERS]: undefined
  [Action.LEDGER_INIT]: { pubkey: string; address: string }
  [Action.MNEMONIC_GET]: { mnemonic: string }
  [Action.MNEMONIC_GENERATE]: { mnemonic: string }
  [Action.MNEMONIC_SAVE]: { result: boolean }
  [Action.RESPONSE]: undefined
}

export interface ExtensionMessageInputPayload<T extends Action> {
  action: T
  data: ActionInputTypesMap[T]
}

// TODO: Is there a way to have a type that says "if error property doesn't exist, data must be defined?". Otherwise this doesn't make sense (currently it's just a temporary type to make it compile)

interface ExtensionMessageOutputPayloadError<T extends Action> {
  error: unknown
  data?: ActionOutputTypesMap[T]
}

interface ExtensionMessageOutputPayloadSuccess<T extends Action> {
  error?: unknown
  data: ActionOutputTypesMap[T]
}

export type ExtensionMessageOutputPayload<T extends Action> =
  | ExtensionMessageOutputPayloadSuccess<T>
  | ExtensionMessageOutputPayloadError<T>
