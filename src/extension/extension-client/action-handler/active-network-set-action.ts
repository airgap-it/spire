import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, ActionHandlerFunction } from './ActionMessageHandler'

export const activeNetworkSetAction: (logger: Logger) => ActionHandlerFunction<Action.ACTIVE_NETWORK_SET> = (
  logger: Logger
): ActionHandlerFunction<Action.ACTIVE_NETWORK_SET> => async (
  context: ActionContext<Action.ACTIVE_NETWORK_SET>
): Promise<void> => {
  logger.log('activeNetworkSetAction', context.data)
  await context.storage.set('ACTIVE_NETWORK' as any, context.data.data.network)
  context.sendResponse({ data: undefined })
}
