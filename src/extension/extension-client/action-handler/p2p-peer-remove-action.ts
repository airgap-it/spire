import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, ActionHandlerFunction, actionNotSupported } from './ActionMessageHandler'

export const p2pPeerRemoveAction: (logger: Logger) => ActionHandlerFunction<Action.P2P_PEER_REMOVE> = (
  logger: Logger
): ActionHandlerFunction<Action.P2P_PEER_REMOVE> => async (
  context: ActionContext<Action.P2P_PEER_REMOVE>
): Promise<void> => {
  logger.log('p2pPeerRemoveAction', context.data.action)

  return actionNotSupported(context)
}
