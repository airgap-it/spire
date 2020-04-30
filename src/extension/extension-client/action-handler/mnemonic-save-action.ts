import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, MessageHandlerFunction } from './ActionMessageHandler'

export const mnemonicSaveAction: (logger: Logger) => MessageHandlerFunction<Action.MNEMONIC_SAVE> = (
  logger: Logger
): MessageHandlerFunction<Action.MNEMONIC_SAVE> => async (
  context: ActionContext<Action.MNEMONIC_SAVE>
): Promise<void> => {
  logger.log('mnemonicSaveAction')
  await context.storage.set('mnemonic' as any, context.data.data.mnemonic).catch((error: Error): void => {
    logger.error('error', error)
  })
  context.sendResponse({ data: { result: true } })
}
