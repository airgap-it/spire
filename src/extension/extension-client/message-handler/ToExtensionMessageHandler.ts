import {
  AppMetadata,
  BeaconErrorType,
  BeaconMessage,
  BeaconMessageType,
  BeaconRequestOutputMessage,
  BroadcastRequestOutput,
  ExtensionMessage,
  OperationRequestOutput,
  OperationResponse,
  PermissionRequestOutput,
  Serializer,
  SignPayloadRequestOutput
} from '@airgap/beacon-sdk'
import { BEACON_VERSION } from '@airgap/beacon-sdk/dist/constants'
import { TezosWrappedOperation } from 'airgap-coin-lib/dist/protocols/tezos/types/TezosWrappedOperation'

import { WalletInfo } from '../Actions'
import { ExtensionClient } from '../ExtensionClient'
import { Logger } from '../Logger'

import { MessageHandler } from './MessageHandler'

const logger: Logger = new Logger('ToExtensionMessageHandler')

export class ToExtensionMessageHandler extends MessageHandler {
  constructor(
    private readonly sendToBeacon: (message: string) => void,
    private readonly sendToPopup: (message: ExtensionMessage<unknown>) => Promise<void>,
    private readonly client: ExtensionClient
  ) {
    super()
  }

  public async handle(
    data: ExtensionMessage<unknown>,
    sendResponse: (response?: unknown) => void,
    beaconConnected: boolean
  ): Promise<void> {
    logger.log('ToExtensionMessageHandler')
    // TODO: Decide where to send the request to
    // Use a map and check all known addresses
    // We can only do this for the operation and the sign request
    if (beaconConnected) {
      logger.log('beacon', 'sending to wallet')
      this.sendToBeacon(data.payload as string)
    } else {
      logger.log('not beacon', 'sending to popup')
      const deserialized: BeaconMessage = (await new Serializer().deserialize(data.payload as string)) as BeaconMessage
      this.client.pendingRequests.push(deserialized)

      const enriched: BeaconRequestOutputMessage = await this.enrichRequest(deserialized)

      if (deserialized.type === BeaconMessageType.OperationRequest) {
        // Intercept Operation request and enrich it with information
        ;(async (): Promise<void> => {
          const operationRequest: OperationRequestOutput = enriched as OperationRequestOutput

          const sendError: (error: Error, errorType: BeaconErrorType) => Promise<void> = async (
            error: Error,
            errorType: BeaconErrorType
          ): Promise<void> => {
            logger.log('error', error)
            const responseInput = {
              id: operationRequest.id,
              type: BeaconMessageType.OperationResponse,
              errorType
            } as any

            const response: OperationResponse = {
              beaconId: await this.client.beaconId,
              version: BEACON_VERSION,
              ...responseInput
            }
            sendResponse(response)
          }

          const wallet: WalletInfo | undefined = await this.client.getWalletByAddress(operationRequest.sourceAddress)
          if (!wallet) {
            await sendError(
              { name: 'Wallet Error', message: `No wallet found for address ${operationRequest.sourceAddress}` },
              BeaconErrorType.NO_PRIVATE_KEY_FOUND_ERROR
            )

            throw new Error('NO WALLET FOUND')
          }

          const operations: TezosWrappedOperation = await this.client.operationProvider.prepareOperations(
            operationRequest.operationDetails,
            operationRequest.network,
            wallet.pubkey
          )

          operationRequest.operationDetails = operations.contents
          const serialized: string = await new Serializer().serialize(operationRequest)

          return this.sendToPopup({ ...data, payload: serialized })
        })().catch((operationPrepareError: Error) => {
          logger.error('operationPrepareError', operationPrepareError)
        })
      } else {
        const serialized: string = await new Serializer().serialize(enriched)

        return this.sendToPopup({ ...data, payload: serialized })
      }
    }
    sendResponse()
  }

  public async enrichRequest(message: BeaconMessage): Promise<BeaconRequestOutputMessage> {
    switch (message.type) {
      case BeaconMessageType.PermissionRequest: {
        await this.client.addAppMetadata(message.appMetadata)
        const request: PermissionRequestOutput = message

        return request
      }
      case BeaconMessageType.OperationRequest: {
        const result: AppMetadata | undefined = await this.client.getAppMetadata(message.beaconId)
        if (!result) {
          throw new Error('AppMetadata not available')
        }
        const request: OperationRequestOutput = {
          appMetadata: result,
          ...message
        }

        return request
      }
      case BeaconMessageType.SignPayloadRequest: {
        const result: AppMetadata | undefined = await this.client.getAppMetadata(message.beaconId)
        if (!result) {
          throw new Error('AppMetadata not available')
        }
        const request: SignPayloadRequestOutput = {
          appMetadata: result,
          ...message
        }

        return request
      }
      case BeaconMessageType.BroadcastRequest: {
        const result: AppMetadata | undefined = await this.client.getAppMetadata(message.beaconId)
        if (!result) {
          throw new Error('AppMetadata not available')
        }
        const request: BroadcastRequestOutput = {
          appMetadata: result,
          ...message
        }

        return request
      }

      default:
        throw new Error('Message not handled')
    }
  }
}
