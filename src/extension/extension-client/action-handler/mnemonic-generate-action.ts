import * as bip39 from 'bip39'

import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, MessageHandlerFunction } from './ActionMessageHandler'

export const mnemonicGenerateAction: (logger: Logger) => MessageHandlerFunction<Action.MNEMONIC_GENERATE> = (
  logger: Logger
): MessageHandlerFunction<Action.MNEMONIC_GENERATE> => async (
  context: ActionContext<Action.MNEMONIC_GENERATE>
): Promise<void> => {
  logger.log('mnemonicGenerateAction')
  const generated: string = bip39.generateMnemonic()
  logger.log('mnemonic generated', generated)
  context.storage.set('mnemonic' as any, generated).catch((error: Error): void => {
    logger.error('error', error)
  })
  context.sendResponse({ data: { mnemonic: generated } })
}
