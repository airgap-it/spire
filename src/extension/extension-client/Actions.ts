import { Network, P2PPairInfo, PermissionInfo } from '@airgap/beacon-sdk'

export enum WalletType {
  P2P = 'P2P',
  LEDGER = 'LEDGER',
  LOCAL_MNEMONIC = 'LOCAL_MNEMONIC'
}

interface WalletInfoTypeMap {
  [WalletType.P2P]: P2PPairInfo
  [WalletType.LEDGER]: undefined
  [WalletType.LOCAL_MNEMONIC]: { mnemonic: string }
}

export interface WalletInfo<T extends WalletType = WalletType> {
  address: string
  publicKey: string
  type: T
  info: WalletInfoTypeMap[T]
  added: number
}

export enum Action {
  HANDSHAKE = 'HANDSHAKE',
  WALLET_ADD = 'WALLET_ADD',
  WALLET_DELETE = 'WALLET_DELETE',
  WALLETS_GET = 'WALLETS_GET',
  ACTIVE_WALLET_GET = 'ACTIVE_WALLET_GET',
  ACTIVE_WALLET_SET = 'ACTIVE_WALLET_SET',
  PERMISSIONS_GET = 'PERMISSIONS_GET',
  PERMISSION_DELETE = 'PERMISSION_DELETE',
  ACTIVE_NETWORK_GET = 'ACTIVE_NETWORK_GET',
  ACTIVE_NETWORK_SET = 'ACTIVE_NETWORK_SET',
  P2P_INIT = 'P2P_INIT',
  P2P_PEERS_GET = 'P2P_GET_PEERS',
  P2P_PEER_REMOVE = 'P2P_REMOVE_PEERS',
  LEDGER_INIT = 'LEDGER_INIT',
  BEACON_ID_GET = 'BEACON_ID_GET',
  RESPONSE = 'REQUEST'
}

export interface ActionInputTypesMap {
  [Action.HANDSHAKE]: undefined
  [Action.WALLET_ADD]: { wallet: WalletInfo }
  [Action.WALLET_DELETE]: { wallet: WalletInfo }
  [Action.WALLETS_GET]: undefined
  [Action.ACTIVE_WALLET_GET]: undefined
  [Action.ACTIVE_WALLET_SET]: { wallet: WalletInfo }
  [Action.PERMISSIONS_GET]: undefined
  [Action.PERMISSION_DELETE]: { permission: PermissionInfo }
  [Action.ACTIVE_NETWORK_GET]: undefined
  [Action.ACTIVE_NETWORK_SET]: { network: Network }
  [Action.P2P_INIT]: undefined
  [Action.P2P_PEERS_GET]: undefined
  [Action.P2P_PEER_REMOVE]: undefined
  [Action.LEDGER_INIT]: undefined
  [Action.BEACON_ID_GET]: undefined
  [Action.RESPONSE]: { request: unknown; extras: unknown }
}

export interface ActionOutputTypesMap {
  [Action.HANDSHAKE]: undefined
  [Action.WALLET_ADD]: undefined
  [Action.WALLET_DELETE]: undefined
  [Action.WALLETS_GET]: { wallets: WalletInfo[] }
  [Action.ACTIVE_WALLET_GET]: { wallet?: WalletInfo }
  [Action.ACTIVE_WALLET_SET]: undefined
  [Action.PERMISSIONS_GET]: { permissions: PermissionInfo[] }
  [Action.PERMISSION_DELETE]: undefined
  [Action.ACTIVE_NETWORK_GET]: { network: Network | undefined }
  [Action.ACTIVE_NETWORK_SET]: undefined
  [Action.P2P_INIT]: { qr: P2PPairInfo }
  [Action.P2P_PEERS_GET]: undefined
  [Action.P2P_PEER_REMOVE]: undefined
  [Action.LEDGER_INIT]: { publicKey: string; address: string }
  [Action.BEACON_ID_GET]: { id: string }
  [Action.RESPONSE]: { error?: unknown }
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
