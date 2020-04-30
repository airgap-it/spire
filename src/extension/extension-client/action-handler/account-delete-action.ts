import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, actionNotSupported, MessageHandlerFunction } from './ActionMessageHandler'

export const accountDeleteAction: (logger: Logger) => MessageHandlerFunction<Action.ACCOUNT_DELETE> = (
  logger: Logger
): MessageHandlerFunction<Action.ACCOUNT_DELETE> => async (
  context: ActionContext<Action.ACCOUNT_DELETE>
): Promise<void> => {
  logger.log('accountDeleteAction', context.data.data.account)

  // TODO: Implement

  return actionNotSupported(context)
}
