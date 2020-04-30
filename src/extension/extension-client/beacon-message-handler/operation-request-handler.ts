import {
  BeaconBaseMessage,
  BeaconMessage,
  BeaconMessageType,
  ChromeStorage,
  OperationRequestOutput,
  OperationResponse,
  OperationResponseInput
} from '@airgap/beacon-sdk'
import { SDK_VERSION } from '@airgap/beacon-sdk/dist/constants'

import { ExtensionClient } from '../ExtensionClient'
import { Logger } from '../Logger'

import { BeaconMessageHandlerFunction } from './BeaconMessageHandler'

const storage: ChromeStorage = new ChromeStorage()

export const operationRequestHandler: (client: ExtensionClient, logger: Logger) => BeaconMessageHandlerFunction = (
  client: ExtensionClient,
  logger: Logger
): BeaconMessageHandlerFunction => {
  return async (
    data: { request: BeaconBaseMessage; extras: unknown },
    sendToPage: (message: BeaconMessage) => void,
    sendResponse: () => void
  ): Promise<void> => {
    const operationRequest: OperationRequestOutput = (data.request as any) as OperationRequestOutput
    logger.log('beaconMessageHandler operation-request', data)

    const mnemonic: string = await storage.get('mnemonic' as any)

    const forgedTx: string = await client.signer.prepareAndWrapOperations(
      operationRequest.operationDetails,
      operationRequest.network,
      mnemonic
    )

    logger.log(JSON.stringify(forgedTx))

    let responseInput: OperationResponseInput
    try {
      const hash: string = await client.signer.sign(forgedTx, mnemonic).then((signedTx: string) => {
        return client.signer.broadcast(operationRequest.network, signedTx)
      })
      logger.log('broadcast: ', hash)
      responseInput = {
        id: operationRequest.id,
        type: BeaconMessageType.OperationResponse,
        transactionHash: hash
      }
    } catch (error) {
      logger.log('sending ERROR', error)
      responseInput = {
        id: operationRequest.id,
        type: BeaconMessageType.OperationResponse,
        errorType: error
      } as any
    }

    const response: OperationResponse = { beaconId: await client.beaconId, version: SDK_VERSION, ...responseInput }

    sendToPage(response)
    sendResponse()
  }
}
