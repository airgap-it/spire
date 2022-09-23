import { ChromeStorage, ExtendedP2PPairingResponse } from '@airgap/beacon-sdk'

// TODO: Export in beacon-sdk
import { DappP2PTransport } from '@airgap/beacon-dapp/dist/esm/transports/DappP2PTransport'

import { Action, ExtensionMessageInputPayload, ExtensionMessageOutputPayload } from '../Actions'
import { ExtensionClient } from '../ExtensionClient'
import { Logger } from '../Logger'

import { activeNetworkGetAction } from './active-network-get-action'
import { activeNetworkSetAction } from './active-network-set-action'
import { activeWalletGetAction } from './active-wallet-get-action'
import { activeWalletSetAction } from './active-wallet-set-action'
import { beaconIdGetAction } from './beacon-id-get-action'
import { derivationPathSetAction } from './derivation-path-set-action'
import { ledgerInitAction } from './ledger-init-action'
import { p2pInitAction } from './p2p-init-action'
import { p2pPeerRemoveAction } from './p2p-peer-remove-action'
import { p2pPeersGetAction } from './p2p-peers-get-action'
import { permissionDeleteAction } from './permission-delete-action'
import { permissionsGetAction } from './permissions-get-action'
import { responseAction } from './response-action'
import { walletAddAction } from './wallet-add-action'
import { openFullscreen } from './open-fullscreen'
import { walletDeleteAction } from './wallet-delete-action'
import { walletsGetAction } from './wallets-get-action'
import { dryRunAction } from './dry-run-action'

const logger: Logger = new Logger('action-message-handler.ts')

export interface ActionContext<T extends Action> {
  data: ExtensionMessageInputPayload<T>
  client: ExtensionClient
  p2pTransport: DappP2PTransport | undefined
  p2pTransportConnectedCallback(newPeer: ExtendedP2PPairingResponse): Promise<void>
  storage: ChromeStorage
  sendResponse(message: ExtensionMessageOutputPayload<T>): void
}

export type ActionHandlerFunction<T extends Action> = (context: ActionContext<T>) => Promise<void>

export const actionNotSupported: ActionHandlerFunction<any> = async (context: ActionContext<any>): Promise<void> => {
  logger.log('messageTypeNotHandled', context.data.action)
  context.sendResponse({ error: 'messageTypeNotHandled' })
}

export class ActionMessageHandler {
  public actionHandler: { [key in Action]: ActionHandlerFunction<any> } = {
    [Action.HANDSHAKE]: actionNotSupported,
    [Action.OPEN_FULLSCREEN]: openFullscreen(logger),
    [Action.WALLET_ADD]: walletAddAction(logger),
    [Action.WALLET_DELETE]: walletDeleteAction(logger),
    [Action.WALLETS_GET]: walletsGetAction(logger),
    [Action.ACTIVE_WALLET_GET]: activeWalletGetAction(logger),
    [Action.ACTIVE_WALLET_SET]: activeWalletSetAction(logger),
    [Action.DERIVATION_PATH_SET]: derivationPathSetAction(logger),
    [Action.PERMISSION_DELETE]: permissionDeleteAction(logger),
    [Action.PERMISSIONS_GET]: permissionsGetAction(logger),
    [Action.ACTIVE_NETWORK_GET]: activeNetworkGetAction(logger),
    [Action.ACTIVE_NETWORK_SET]: activeNetworkSetAction(logger),
    [Action.P2P_INIT]: p2pInitAction(logger),
    [Action.P2P_PEERS_GET]: p2pPeersGetAction(logger),
    [Action.P2P_PEER_REMOVE]: p2pPeerRemoveAction(logger),
    [Action.LEDGER_INIT]: ledgerInitAction(logger),
    [Action.BEACON_ID_GET]: beaconIdGetAction(logger),
    [Action.RESPONSE]: responseAction(logger),
    [Action.DRY_RUN]: dryRunAction(logger)
  }

  public async getHandler(action: Action): Promise<ActionHandlerFunction<any>> {
    return this.actionHandler[action]
  }
}
