import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, MessageHandlerFunction } from './ActionMessageHandler'

export const permissionDeleteAction: (logger: Logger) => MessageHandlerFunction<Action.PERMISSION_DELETE> = (
  logger: Logger
): MessageHandlerFunction<Action.PERMISSION_DELETE> => async (
  context: ActionContext<Action.PERMISSION_DELETE>
): Promise<void> => {
  logger.log('permissionDeleteAction', context.data.data.permission)

  await context.client.removePermission(context.data.data.permission.accountIdentifier)

  context.sendResponse({ data: undefined })
}
