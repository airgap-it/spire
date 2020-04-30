import { ChromeStorage, P2PCommunicationClient } from '@airgap/beacon-sdk'

import { Action, ExtensionMessageInputPayload, ExtensionMessageOutputPayload } from '../Actions'
import { ExtensionClient } from '../ExtensionClient'
import { Logger } from '../Logger'

import { accountDeleteAction } from './account-delete-action'
import { accountsGetAction } from './accounts-get-action'
import { activeNetworkGetAction } from './active-network-get-action'
import { activeNetworkSetAction } from './active-network-set-action'
import { activeWalletGetAction } from './active-wallet-get-action'
import { activeWalletSetAction } from './active-wallet-set-action'
import { beaconIdGetAction } from './beacon-id-get-action'
import { ledgerInitAction } from './ledger-init-action'
import { mnemonicGenerateAction } from './mnemonic-generate-action'
import { mnemonicGetAction } from './mnemonic-get-action'
import { mnemonicSaveAction } from './mnemonic-save-action'
import { p2pInitAction } from './p2p-init-action'
import { p2pPeerRemoveAction } from './p2p-peer-remove-action'
import { p2pPeersGetAction } from './p2p-peers-get-action'
import { responseAction } from './response-action'
import { walletAddAction } from './wallet-add-action'
import { walletDeleteAction } from './wallet-delete-action'
import { walletsGetAction } from './wallets-get-action'

const logger: Logger = new Logger('action-message-handler.ts')

export interface ActionContext<T extends Action> {
  data: ExtensionMessageInputPayload<T>
  client: ExtensionClient
  p2pClient: P2PCommunicationClient | undefined
  storage: ChromeStorage
  sendResponse(message: ExtensionMessageOutputPayload<T>): void
  sendToPage(message: unknown): void
  setP2pPubkey(pubkey: string): void
}

export type MessageHandlerFunction<T extends Action> = (context: ActionContext<T>) => Promise<void>

export const actionNotSupported: MessageHandlerFunction<any> = async (context: ActionContext<any>): Promise<void> => {
  logger.log('messageTypeNotHandled', context.data.action)
  context.sendResponse({ error: 'messageTypeNotHandled' })
}

export class ActionMessageHandler {
  public actionHandler: { [key in Action]: MessageHandlerFunction<any> } = {
    [Action.HANDSHAKE]: actionNotSupported,
    [Action.WALLET_ADD]: walletAddAction(logger),
    [Action.WALLET_DELETE]: walletDeleteAction(logger),
    [Action.WALLETS_GET]: walletsGetAction(logger),
    [Action.ACTIVE_WALLET_GET]: activeWalletGetAction(logger),
    [Action.ACTIVE_WALLET_SET]: activeWalletSetAction(logger),
    [Action.ACCOUNT_DELETE]: accountDeleteAction(logger),
    [Action.ACCOUNTS_GET]: accountsGetAction(logger),
    [Action.ACTIVE_NETWORK_GET]: activeNetworkGetAction(logger),
    [Action.ACTIVE_NETWORK_SET]: activeNetworkSetAction(logger),
    [Action.P2P_INIT]: p2pInitAction(logger),
    [Action.P2P_PEERS_GET]: p2pPeersGetAction(logger),
    [Action.P2P_PEER_REMOVE]: p2pPeerRemoveAction(logger),
    [Action.LEDGER_INIT]: ledgerInitAction(logger),
    [Action.MNEMONIC_GET]: mnemonicGetAction(logger),
    [Action.MNEMONIC_GENERATE]: mnemonicGenerateAction(logger),
    [Action.MNEMONIC_SAVE]: mnemonicSaveAction(logger),
    [Action.BEACON_ID_GET]: beaconIdGetAction(logger),
    [Action.RESPONSE]: responseAction(logger)
  }

  public async getHandler(action: Action): Promise<MessageHandlerFunction<any>> {
    return this.actionHandler[action]
  }
}