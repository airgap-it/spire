import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, ActionHandlerFunction } from './ActionMessageHandler'

export const openFullscreen: (logger: Logger) => ActionHandlerFunction<Action.OPEN_FULLSCREEN> = (
  logger: Logger
): ActionHandlerFunction<Action.OPEN_FULLSCREEN> => async (
  context: ActionContext<Action.OPEN_FULLSCREEN>
): Promise<void> => {
  logger.log('openFullscreen', context.data)

  chrome.tabs.create({
    url: chrome.runtime.getURL(context.data.data.url)
  })

  context.sendResponse({ data: undefined })
}
