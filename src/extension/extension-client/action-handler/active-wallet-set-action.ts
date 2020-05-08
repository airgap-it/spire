import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, ActionHandlerFunction } from './ActionMessageHandler'

export const activeWalletSetAction: (logger: Logger) => ActionHandlerFunction<Action.ACTIVE_WALLET_SET> = (
  logger: Logger
): ActionHandlerFunction<Action.ACTIVE_WALLET_SET> => async (
  context: ActionContext<Action.ACTIVE_WALLET_SET>
): Promise<void> => {
  logger.log('activeWalletSetAction')
  await context.storage.set('ACTIVE_WALLET' as any, context.data.data.wallet)
  context.sendResponse({ data: undefined })
}
