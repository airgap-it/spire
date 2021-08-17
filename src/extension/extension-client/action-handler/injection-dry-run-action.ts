import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, ActionHandlerFunction } from './ActionMessageHandler'

export const injectionDryRunAction: (logger: Logger) => ActionHandlerFunction<Action.DRY_RUN> = (
  logger: Logger
): ActionHandlerFunction<Action.DRY_RUN> => async (context: ActionContext<Action.DRY_RUN>): Promise<void> => {
  logger.log('activeWalletGetAction')
  // const activeWallet: WalletInfo = await context.storage.get('ACTIVE_WALLET' as any)
  context.sendResponse({ data: { dryRunPreview: 'JGD' } })
}
