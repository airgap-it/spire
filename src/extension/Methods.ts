export enum Action {
  HANDSHAKE = 'HANDSHAKE',
  ACTIVE_ACCOUNT_GET = 'ACTIVE_ACCOUNT_GET',
  ACTIVE_ACCOUNT_SET = 'ACTIVE_ACCOUNT_SET',
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
  [Action.ACTIVE_ACCOUNT_GET]: undefined
  [Action.ACTIVE_ACCOUNT_SET]: undefined
  [Action.P2P_INIT]: undefined
  [Action.P2P_GET_PEERS]: undefined
  [Action.P2P_REMOVE_PEERS]: undefined
  [Action.LEDGER_INIT]: undefined
  [Action.MNEMONIC_GET]: undefined
  [Action.MNEMONIC_GENERATE]: undefined
  [Action.MNEMONIC_SAVE]: { params: { mnemonic: string } }
  [Action.RESPONSE]: { request: unknown }
}

export interface ActionOutputTypesMap {
  [Action.HANDSHAKE]: undefined
  [Action.ACTIVE_ACCOUNT_GET]: undefined
  [Action.ACTIVE_ACCOUNT_SET]: undefined
  [Action.P2P_INIT]: { qr: { name: string; pubKey: string; relayServer: string } }
  [Action.P2P_GET_PEERS]: undefined
  [Action.P2P_REMOVE_PEERS]: undefined
  [Action.LEDGER_INIT]: { address: string }
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
