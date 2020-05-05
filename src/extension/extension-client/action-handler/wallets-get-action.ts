import { Action, WalletInfo } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, MessageHandlerFunction } from './ActionMessageHandler'

export const walletsGetAction: (logger: Logger) => MessageHandlerFunction<Action.WALLETS_GET> = (
  logger: Logger
): MessageHandlerFunction<Action.WALLETS_GET> => async (context: ActionContext<Action.WALLETS_GET>): Promise<void> => {
  logger.log('walletsGetAction', context.data)
  const wallets: WalletInfo[] = await context.client.getWallets()
  console.log('getting wallet result: ', wallets)
  context.sendResponse({ data: { wallets } })
}
