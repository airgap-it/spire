import { Action, WalletInfo } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, MessageHandlerFunction } from './ActionMessageHandler'

export const activeWalletGetAction: (logger: Logger) => MessageHandlerFunction<Action.ACTIVE_WALLET_GET> = (
  logger: Logger
): MessageHandlerFunction<Action.ACTIVE_WALLET_GET> => async (
  context: ActionContext<Action.ACTIVE_WALLET_GET>
): Promise<void> => {
  logger.log('activeWalletGetAction')
  const activeWallet: WalletInfo = await context.storage.get('ACTIVE_WALLET' as any)
  context.sendResponse({ data: { wallet: activeWallet } })
}
