import { Action, WalletInfo, WalletType } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, MessageHandlerFunction } from './ActionMessageHandler'

export const walletAddAction: (logger: Logger) => MessageHandlerFunction<Action.WALLET_ADD> = (
  logger: Logger
): MessageHandlerFunction<Action.WALLET_ADD> => async (context: ActionContext<Action.WALLET_ADD>): Promise<void> => {
  logger.log('walletAddAction', context.data)

  const wallets: WalletInfo<WalletType>[] = (await context.storage.get('WALLETS' as any)) || []
  if (!wallets.some((wallet: WalletInfo<WalletType>) => wallet.pubkey === context.data.data.wallet.pubkey)) {
    wallets.push(context.data.data.wallet)
    await context.storage.set('WALLETS' as any, wallets)
    context.sendResponse({ data: { added: true } })
  } else {
    context.sendResponse({ data: { added: false } })
  }
}
