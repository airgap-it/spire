import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, ActionHandlerFunction } from './ActionMessageHandler'

export const p2pInitAction: (logger: Logger) => ActionHandlerFunction<Action.P2P_INIT> = (
  logger: Logger
): ActionHandlerFunction<Action.P2P_INIT> => async (context: ActionContext<Action.P2P_INIT>): Promise<void> => {
  if (!context.p2pTransport) {
    return // TODO: Improve
  }
  logger.log('p2pInitAction', 'handshake info', await (context.p2pTransport as any).client.getHandshakeInfo())

  context.p2pTransport.connectNewPeer().catch(error => logger.error(error))

  context.sendResponse({ data: { qr: await (context.p2pTransport as any).client.getHandshakeInfo() } })
}
