import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, ActionHandlerFunction } from './ActionMessageHandler'

export const walletDeleteAction: (logger: Logger) => ActionHandlerFunction<Action.WALLET_DELETE> = (
  logger: Logger
): ActionHandlerFunction<Action.WALLET_DELETE> => async (
  context: ActionContext<Action.WALLET_DELETE>
): Promise<void> => {
  logger.log('walletDeleteAction', context.data)
  await context.client.removeWallet(context.data.data.wallet.publicKey)
  context.sendResponse({ data: undefined })
}
