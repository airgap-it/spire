import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, MessageHandlerFunction } from './ActionMessageHandler'

export const beaconIdGetAction: (logger: Logger) => MessageHandlerFunction<Action.BEACON_ID_GET> = (
  logger: Logger
): MessageHandlerFunction<Action.BEACON_ID_GET> => async (
  context: ActionContext<Action.BEACON_ID_GET>
): Promise<void> => {
  logger.log('beaconIdGetAction', context.data)
  // TODO: get actual beacon ID
  context.sendResponse({ data: { id: 'BEACON_ID_PLACEHOLDER' } })
}
