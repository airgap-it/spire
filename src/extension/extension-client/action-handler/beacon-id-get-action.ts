import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, ActionHandlerFunction } from './ActionMessageHandler'

export const beaconIdGetAction: (logger: Logger) => ActionHandlerFunction<Action.BEACON_ID_GET> = (
  logger: Logger
): ActionHandlerFunction<Action.BEACON_ID_GET> => async (
  context: ActionContext<Action.BEACON_ID_GET>
): Promise<void> => {
  logger.log('beaconIdGetAction', context.data)
  const beaconId: string = await context.client.beaconId
  context.sendResponse({ data: { id: beaconId } })
}
