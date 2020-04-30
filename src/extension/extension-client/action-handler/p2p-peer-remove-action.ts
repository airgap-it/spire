import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, actionNotSupported, MessageHandlerFunction } from './ActionMessageHandler'

export const p2pPeerRemoveAction: (logger: Logger) => MessageHandlerFunction<Action.P2P_PEER_REMOVE> = (
  logger: Logger
): MessageHandlerFunction<Action.P2P_PEER_REMOVE> => async (
  context: ActionContext<Action.P2P_PEER_REMOVE>
): Promise<void> => {
  logger.log('p2pPeerRemoveAction', context.data.action)

  return actionNotSupported(context)
}
