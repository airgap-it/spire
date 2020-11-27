import {
  BEACON_VERSION,
  BeaconBaseMessage,
  BeaconMessage,
  BeaconMessageType,
  ErrorResponse,
  getSenderId
} from '@airgap/beacon-sdk'
import { ErrorResponseInput } from '@airgap/beacon-sdk/dist/cjs/types/beacon/messages/BeaconResponseInputMessage'

import { ExtensionClient } from '../ExtensionClient'
import { Logger } from '../Logger'

import { BeaconMessageHandlerFunction } from './BeaconMessageHandler'

export const errorResponseHandler: (client: ExtensionClient, logger: Logger) => BeaconMessageHandlerFunction = (
  client: ExtensionClient,
  logger: Logger
): BeaconMessageHandlerFunction => {
  return async (
    data: { request: BeaconBaseMessage; extras: unknown },
    sendToPage: (message: BeaconMessage) => void,
    sendResponseToPopup: (error?: unknown) => void
  ): Promise<void> => {
    const request: BeaconBaseMessage = (data.request as any) as BeaconBaseMessage
    logger.log('errorResponseHandler', request)

    const responseInput: ErrorResponseInput = {
      id: request.id,
      type: BeaconMessageType.Error,
      errorType: (data.extras as any).errorType
    }

    const response: ErrorResponse = {
      senderId: await getSenderId(await client.beaconId),
      version: BEACON_VERSION,
      ...responseInput
    }

    sendToPage(response)
    sendResponseToPopup()
  }
}
