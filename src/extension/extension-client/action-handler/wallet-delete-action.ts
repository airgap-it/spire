import { Action, WalletInfo } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, MessageHandlerFunction } from './ActionMessageHandler'

export const walletDeleteAction: (logger: Logger) => MessageHandlerFunction<Action.WALLET_DELETE> = (
  logger: Logger
): MessageHandlerFunction<Action.WALLET_DELETE> => async (
  context: ActionContext<Action.WALLET_DELETE>
): Promise<void> => {
  logger.log('walletDeleteAction', context.data)
  const wallets: WalletInfo[] = (await context.storage.get('WALLETS' as any)) || []
  const filteredWallets: WalletInfo[] = wallets.filter(
    (wallet: WalletInfo) => wallet.pubkey !== context.data.data.wallet.pubkey
  )
  if (filteredWallets.length === wallets.length) {
    context.sendResponse({ data: { deleted: false } })
  } else {
    await context.storage.set('WALLETS' as any, filteredWallets)
    context.sendResponse({ data: { deleted: true } })
  }
}
