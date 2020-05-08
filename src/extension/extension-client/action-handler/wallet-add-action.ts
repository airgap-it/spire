import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, ActionHandlerFunction } from './ActionMessageHandler'

export const walletAddAction: (logger: Logger) => ActionHandlerFunction<Action.WALLET_ADD> = (
  logger: Logger
): ActionHandlerFunction<Action.WALLET_ADD> => async (context: ActionContext<Action.WALLET_ADD>): Promise<void> => {
  logger.log('walletAddAction', context.data)

  await context.client.addWallet(context.data.data.wallet)

  context.sendResponse({ data: undefined })
}
