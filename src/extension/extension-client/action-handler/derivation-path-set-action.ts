import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, ActionHandlerFunction } from './ActionMessageHandler'

export const derivationPathSetAction: (logger: Logger) => ActionHandlerFunction<Action.DERIVATION_PATH_SET> = (
  logger: Logger
): ActionHandlerFunction<Action.DERIVATION_PATH_SET> => async (
  context: ActionContext<Action.DERIVATION_PATH_SET>
): Promise<void> => {
  logger.log('derivationPathSetAction', context.data)
  await context.storage.set('DERIVATION_PATH' as any, context.data.data.derivationPath)
  context.sendResponse({ data: undefined })
}
