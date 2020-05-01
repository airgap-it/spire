import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, MessageHandlerFunction } from './ActionMessageHandler'

export const walletAddAction: (logger: Logger) => MessageHandlerFunction<Action.WALLET_ADD> = (
  logger: Logger
): MessageHandlerFunction<Action.WALLET_ADD> => async (context: ActionContext<Action.WALLET_ADD>): Promise<void> => {
  logger.log('walletAddAction', context.data)

  await context.client.addWallet(context.data.data.wallet)

  context.sendResponse({ data: undefined })
}
