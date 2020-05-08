import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, actionNotSupported, ActionHandlerFunction } from './ActionMessageHandler'

export const p2pPeersGetAction: (logger: Logger) => ActionHandlerFunction<Action.P2P_PEERS_GET> = (
  logger: Logger
): ActionHandlerFunction<Action.P2P_PEERS_GET> => async (
  context: ActionContext<Action.P2P_PEERS_GET>
): Promise<void> => {
  logger.log('p2pPeersGetAction', context.data.action)

  return actionNotSupported(context)
}
