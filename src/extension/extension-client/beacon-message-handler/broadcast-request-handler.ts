import {
  BEACON_VERSION,
  BeaconBaseMessage,
  BeaconErrorType,
  BeaconMessage,
  BeaconMessageType,
  BroadcastRequestOutput,
  BroadcastResponse,
  BroadcastResponseInput
} from '@airgap/beacon-sdk'

import { ExtensionClient } from '../ExtensionClient'
import { Logger } from '../Logger'
import { to, To } from '../utils'

import { BeaconMessageHandlerFunction } from './BeaconMessageHandler'

export const broadcastRequestHandler: (client: ExtensionClient, logger: Logger) => BeaconMessageHandlerFunction = (
  client: ExtensionClient,
  logger: Logger
): BeaconMessageHandlerFunction => {
  return async (
    data: { request: BeaconBaseMessage; extras: unknown },
    sendToPage: (message: BeaconMessage) => void,
    sendResponseToPopup: (error?: unknown) => void
  ): Promise<void> => {
    const broadcastRequest: BroadcastRequestOutput = (data.request as any) as BroadcastRequestOutput
    logger.log('broadcastRequestHandler', broadcastRequest)
    const hash: To<string> = await to(
      client.operationProvider.broadcast(broadcastRequest.network, broadcastRequest.signedTransaction)
    )

    if (hash.err) {
      logger.log('error', hash.err)
      const responseInput = {
        id: broadcastRequest.id,
        type: BeaconMessageType.OperationResponse,
        errorType: BeaconErrorType.BROADCAST_ERROR
      } as any

      const response: BroadcastResponse = {
        senderId: await client.beaconId,
        version: BEACON_VERSION,
        ...responseInput
      }
      sendToPage(response)
      sendResponseToPopup({
        error: { name: hash.err.name, message: hash.err.message, stack: hash.err.stack }
      })

      throw hash.err
    }

    const responseInput: BroadcastResponseInput = {
      id: broadcastRequest.id,
      type: BeaconMessageType.BroadcastResponse,
      transactionHash: hash.res
    }

    const response: BroadcastResponse = { senderId: await client.beaconId, version: BEACON_VERSION, ...responseInput }

    sendToPage(response)
    sendResponseToPopup()
  }
}
