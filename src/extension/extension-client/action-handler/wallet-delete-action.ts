import { Action, WalletInfo, WalletType } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, MessageHandlerFunction } from './ActionMessageHandler'

export const walletDeleteAction: (logger: Logger) => MessageHandlerFunction<Action.WALLET_DELETE> = (
  logger: Logger
): MessageHandlerFunction<Action.WALLET_DELETE> => async (
  context: ActionContext<Action.WALLET_DELETE>
): Promise<void> => {
  logger.log('walletDeleteAction', context.data)
  const wallets: WalletInfo<WalletType>[] = (await context.storage.get('WALLETS' as any)) || []
  const filteredWallets: WalletInfo<WalletType>[] = wallets.filter(
    (wallet: WalletInfo<WalletType>) => wallet.pubkey !== context.data.data.wallet.pubkey
  )
  if (filteredWallets.length === wallets.length) {
    context.sendResponse({ data: { deleted: false } })
  } else {
    await context.storage.set('WALLETS' as any, filteredWallets)
    context.sendResponse({ data: { deleted: true } })
  }
}
