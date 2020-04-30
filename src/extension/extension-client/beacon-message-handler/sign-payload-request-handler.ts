import {
  BeaconBaseMessage,
  BeaconMessage,
  BeaconMessageType,
  ChromeStorage,
  SignPayloadRequestOutput,
  SignPayloadResponse,
  SignPayloadResponseInput
} from '@airgap/beacon-sdk'
import { SDK_VERSION } from '@airgap/beacon-sdk/dist/constants'

import { ExtensionClient } from '../ExtensionClient'
import { Logger } from '../Logger'

import { BeaconMessageHandlerFunction } from './BeaconMessageHandler'

const storage: ChromeStorage = new ChromeStorage()

export const signPayloadRequestHandler: (client: ExtensionClient, logger: Logger) => BeaconMessageHandlerFunction = (
  client: ExtensionClient,
  logger: Logger
): BeaconMessageHandlerFunction => {
  return async (
    data: { request: BeaconBaseMessage; extras: unknown },
    sendToPage: (message: BeaconMessage) => void,
    sendResponse: () => void
  ): Promise<void> => {
    const signRequest: SignPayloadRequestOutput = (data.request as any) as SignPayloadRequestOutput
    logger.log('beaconMessageHandler sign-request', data)
    const mnemonic: string = await storage.get('mnemonic' as any)

    const signature: string = await client.signer.sign(signRequest.payload[0], mnemonic)
    logger.log('signed: ', signature)
    const responseInput: SignPayloadResponseInput = {
      id: signRequest.id,
      type: BeaconMessageType.SignPayloadResponse,
      signature
    }

    const response: SignPayloadResponse = { beaconId: await client.beaconId, version: SDK_VERSION, ...responseInput }

    sendToPage(response)
    sendResponse()
  }
}
