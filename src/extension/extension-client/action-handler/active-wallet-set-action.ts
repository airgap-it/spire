import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, MessageHandlerFunction } from './ActionMessageHandler'

export const activeWalletSetAction: (logger: Logger) => MessageHandlerFunction<Action.ACTIVE_WALLET_SET> = (
  logger: Logger
): MessageHandlerFunction<Action.ACTIVE_WALLET_SET> => async (
  context: ActionContext<Action.ACTIVE_WALLET_SET>
): Promise<void> => {
  logger.log('activeWalletSetAction')
  await context.storage.set('ACTIVE_WALLET' as any, context.data.data.wallet)
  context.sendResponse({ data: undefined })
}
