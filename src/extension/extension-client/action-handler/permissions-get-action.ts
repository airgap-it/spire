import { Action, PermissionInfo } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, ActionHandlerFunction } from './ActionMessageHandler'

export const permissionsGetAction: (logger: Logger) => ActionHandlerFunction<Action.PERMISSIONS_GET> = (
  logger: Logger
): ActionHandlerFunction<Action.PERMISSIONS_GET> => async (
  context: ActionContext<Action.PERMISSIONS_GET>
): Promise<void> => {
  logger.log('permissionsGetAction')

  const permissions: PermissionInfo[] = await context.client.getPermissions()

  context.sendResponse({ data: { permissions } })
}
