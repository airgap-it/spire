import {
  BeaconBaseMessage,
  BeaconMessage,
  BeaconMessageType,
  BroadcastRequestOutput,
  BroadcastResponse,
  BroadcastResponseInput
} from '@airgap/beacon-sdk'
import { SDK_VERSION } from '@airgap/beacon-sdk/dist/constants'

import { ExtensionClient } from '../ExtensionClient'
import { Logger } from '../Logger'

import { BeaconMessageHandlerFunction } from './BeaconMessageHandler'

export const broadcastRequestHandler: (client: ExtensionClient, logger: Logger) => BeaconMessageHandlerFunction = (
  client: ExtensionClient,
  logger: Logger
): BeaconMessageHandlerFunction => {
  return async (
    data: { request: BeaconBaseMessage; extras: unknown },
    sendToPage: (message: BeaconMessage) => void,
    sendResponse: () => void
  ): Promise<void> => {
    const broadcastRequest: BroadcastRequestOutput = (data.request as any) as BroadcastRequestOutput
    logger.log('beaconMessageHandler broadcast-request', broadcastRequest)
    const hash: string = await client.signer.broadcast(broadcastRequest.network, broadcastRequest.signedTransaction)
    logger.log('broadcast: ', hash)
    const responseInput: BroadcastResponseInput = {
      id: broadcastRequest.id,
      type: BeaconMessageType.BroadcastResponse,
      transactionHash: hash
    }

    const response: BroadcastResponse = { beaconId: await client.beaconId, version: SDK_VERSION, ...responseInput }

    sendToPage(response)
    sendResponse()
  }
}
