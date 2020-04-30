import { AccountInfo, StorageKey } from '@airgap/beacon-sdk'

import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, MessageHandlerFunction } from './ActionMessageHandler'

export const accountsGetAction: (logger: Logger) => MessageHandlerFunction<Action.ACCOUNTS_GET> = (
  logger: Logger
): MessageHandlerFunction<Action.ACCOUNTS_GET> => async (
  context: ActionContext<Action.ACCOUNTS_GET>
): Promise<void> => {
  logger.log('accountsGetAction')
  const accounts: AccountInfo[] = await context.storage.get(StorageKey.ACCOUNTS)
  context.sendResponse({ data: { accounts } })
}
