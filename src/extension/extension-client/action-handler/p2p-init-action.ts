import { P2PPairingRequest } from '@airgap/beacon-sdk'

import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, ActionHandlerFunction } from './ActionMessageHandler'

export const p2pInitAction: (logger: Logger) => ActionHandlerFunction<Action.P2P_INIT> = (
  logger: Logger
): ActionHandlerFunction<Action.P2P_INIT> => async (context: ActionContext<Action.P2P_INIT>): Promise<void> => {
  if (!context.p2pTransport) {
    return // TODO: Improve
  }
  const pairingRequest: P2PPairingRequest = await context.p2pTransport.getPairingRequestInfo()
  logger.log('p2pInitAction', 'handshake info', pairingRequest)

  // tslint:disable-next-line: no-unbound-method
  context.p2pTransport.listenForNewPeer(context.p2pTransportConnectedCallback).catch(error => logger.error(error))

  context.sendResponse({ data: { qr: pairingRequest } })
}
