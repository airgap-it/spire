import { Action, PermissionInfo } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, MessageHandlerFunction } from './ActionMessageHandler'

export const permissionsGetAction: (logger: Logger) => MessageHandlerFunction<Action.PERMISSIONS_GET> = (
  logger: Logger
): MessageHandlerFunction<Action.PERMISSIONS_GET> => async (
  context: ActionContext<Action.PERMISSIONS_GET>
): Promise<void> => {
  logger.log('permissionsGetAction')

  const permissions: PermissionInfo[] = await context.client.getPermissions()

  context.sendResponse({ data: { permissions } })
}
