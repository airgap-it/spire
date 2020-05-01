import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, MessageHandlerFunction } from './ActionMessageHandler'

export const walletDeleteAction: (logger: Logger) => MessageHandlerFunction<Action.WALLET_DELETE> = (
  logger: Logger
): MessageHandlerFunction<Action.WALLET_DELETE> => async (
  context: ActionContext<Action.WALLET_DELETE>
): Promise<void> => {
  logger.log('walletDeleteAction', context.data)
  await context.client.removeWallet(context.data.data.wallet.pubkey)
  context.sendResponse({ data: undefined })
}
