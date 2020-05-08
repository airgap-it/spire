import { BeaconMessage, Serializer } from '@airgap/beacon-sdk'

import { Action } from '../Actions'
import { BeaconMessageHandler, BeaconMessageHandlerFunction } from '../beacon-message-handler/BeaconMessageHandler'
import { Logger } from '../Logger'

import { ActionContext, ActionHandlerFunction } from './ActionMessageHandler'

export const responseAction: (logger: Logger) => ActionHandlerFunction<Action.RESPONSE> = (
  logger: Logger
): ActionHandlerFunction<Action.RESPONSE> => async (context: ActionContext<Action.RESPONSE>): Promise<void> => {
  logger.log('responseAction', context.data)
  const beaconMessageHandler: BeaconMessageHandler = new BeaconMessageHandler(context.client)
  const handler: BeaconMessageHandlerFunction = await beaconMessageHandler.getHandler(
    (context.data.data.request as any).type
  )
  await handler(
    context.data.data as any,
    async (beaconMessage: BeaconMessage) => {
      const message: string = await new Serializer().serialize(beaconMessage)
      context.sendToPage(message)
    },
    context.sendResponse as any
  )
}
