import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, MessageHandlerFunction } from './ActionMessageHandler'
import { mnemonicGenerateAction } from './mnemonic-generate-action'

export const mnemonicGetAction: (logger: Logger) => MessageHandlerFunction<Action.MNEMONIC_GET> = (
  logger: Logger
): MessageHandlerFunction<Action.MNEMONIC_GET> => async (
  context: ActionContext<Action.MNEMONIC_GET>
): Promise<void> => {
  logger.log('mnemonicGetAction')
  const mnemonic: string = await context.storage.get('mnemonic' as any)
  if (mnemonic) {
    logger.log('mnemonic read', mnemonic)
    context.sendResponse({ data: { mnemonic } })
  } else {
    await mnemonicGenerateAction(logger)(context as any)
  }
}
