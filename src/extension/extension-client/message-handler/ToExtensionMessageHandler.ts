import {
  AcknowledgeResponse,
  AppMetadata,
  BEACON_VERSION,
  BeaconErrorType,
  BeaconMessage,
  BeaconMessageType,
  BeaconRequestMessage,
  BeaconRequestOutputMessage,
  BroadcastRequestOutput,
  ConnectionContext,
  ExtensionMessage,
  getSenderId,
  OperationRequestOutput,
  OperationResponse,
  PermissionRequestOutput,
  Serializer,
  SignPayloadRequestOutput
} from '@airgap/beacon-sdk'
import { TezosWrappedOperation } from '@airgap/coinlib-core/protocols/tezos/types/TezosWrappedOperation'

import { WalletInfo } from '../Actions'
import { ExtensionClient } from '../ExtensionClient'
import { Logger } from '../Logger'
import { To, to } from '../utils'

import { MessageHandler } from './MessageHandler'

const logger: Logger = new Logger('ToExtensionMessageHandler')

export class ToExtensionMessageHandler extends MessageHandler {
  constructor(private readonly client: ExtensionClient) {
    super()
  }

  public async handle(
    data: ExtensionMessage<unknown>,
    connectionContext: ConnectionContext,
    beaconConnected: boolean
  ): Promise<void> {
    logger.log('ToExtensionMessageHandler')

    const deserialized: BeaconRequestMessage = (await new Serializer().deserialize(
      data.payload as string
    )) as BeaconRequestMessage

    this.client.pendingRequests.push({ message: deserialized, connectionContext })

    // TODO: Decide where to send the request to
    // Use a map and check all known addresses
    // We can only do this for the operation and the sign request
    if (beaconConnected) {
      logger.log('beacon', 'relaying to wallet', data)

      return this.client.sendToBeacon(data.payload as string)
    } else {
      logger.log('not beacon', 'sending to popup', data)

      // TODO: Send acknowledge message
      if (deserialized.version !== '1') {
        await this.sendAcknowledgeResponse(deserialized)
      }

      await this.client.popupManager.startPopup()

      // TODO: Remove v1 compatibility in later version
      if ((deserialized as any).beaconId && !deserialized.senderId) {
        deserialized.senderId = (deserialized as any).beaconId
        delete (deserialized as any).beaconId
      }

      const enriched: To<BeaconRequestOutputMessage> = await to(this.enrichRequest(deserialized))

      const sendError: (error: Error, errorType: BeaconErrorType) => Promise<void> = async (
        error: Error,
        errorType: BeaconErrorType
      ): Promise<void> => {
        logger.log('error', error)
        const responseInput = {
          id: deserialized.id,
          type: BeaconMessageType.OperationResponse,
          errorType
        } as any

        const response: OperationResponse = {
          senderId: await getSenderId(await this.client.beaconId),
          version: BEACON_VERSION,
          ...responseInput
        }
        await this.client.sendToPage(response)

        const errorObject = { title: (error as any).name, message: (error as any).message, data: (error as any).data }

        return this.client.sendToPopup({ ...data, payload: { error: errorObject } })
      }

      if (enriched.err) {
        await sendError({ name: 'Wallet Error', message: `No permission` }, BeaconErrorType.NOT_GRANTED_ERROR)

        return
      }

      // Check permissions
      // if (!(await this.client.permissionManager.hasPermission(deserialized))) {
      //   await sendError({ name: 'Wallet Error', message: `No permission` }, BeaconErrorType.NOT_GRANTED_ERROR)

      //   return
      // }

      if (deserialized.type === BeaconMessageType.OperationRequest) {
        // Intercept Operation request and enrich it with information
        ; (async (): Promise<void> => {
          const operationRequest: OperationRequestOutput = enriched.res as OperationRequestOutput

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
            wallet.publicKey
          )

          operationRequest.operationDetails = operations.contents as any // TODO: Fix type
          const serialized: string = await new Serializer().serialize(operationRequest)

          return this.client.sendToPopup({ ...data, payload: serialized })
        })().catch(async (operationPrepareError: Error) => {
          if ((operationPrepareError as any).data) {
            await sendError((operationPrepareError as any).data, BeaconErrorType.TRANSACTION_INVALID_ERROR)
            logger.error('operationPrepareError', (operationPrepareError as any).data)
          } else {
            await sendError(operationPrepareError, BeaconErrorType.TRANSACTION_INVALID_ERROR)
            logger.error('operationPrepareError', operationPrepareError)
          }
        })
      } else {
        const serialized: string = await new Serializer().serialize(enriched.res)

        return this.client.sendToPopup({ ...data, payload: serialized })
      }
    }
    if (connectionContext.extras && connectionContext.extras.sendResponse) {
      connectionContext.extras.sendResponse()
    }
  }

  public async enrichRequest(message: BeaconMessage): Promise<BeaconRequestOutputMessage> {
    switch (message.type) {
      case BeaconMessageType.PermissionRequest: {
        // TODO: Remove v1 compatibility in later version
        if ((message.appMetadata as any).beaconId && !message.appMetadata.senderId) {
          message.appMetadata.senderId = (message.appMetadata as any).beaconId
          delete (message.appMetadata as any).beaconId
        }
        await this.client.appMetadataManager.addAppMetadata(message.appMetadata)
        const request: PermissionRequestOutput = message

        return request
      }
      case BeaconMessageType.OperationRequest: {
        const result: AppMetadata | undefined = await this.client.getAppMetadata(message.senderId)
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
        const result: AppMetadata | undefined = await this.client.getAppMetadata(message.senderId)
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
        const result: AppMetadata | undefined = await this.client.getAppMetadata(message.senderId)
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

  /**
   * Send an acknowledge message back to the sender
   *
   * @param request The message that was received
   */
  private async sendAcknowledgeResponse(request: BeaconRequestMessage): Promise<void> {
    // Acknowledge the message
    const acknowledgeResponse: AcknowledgeResponse = {
      id: request.id,
      type: BeaconMessageType.Acknowledge,
      senderId: await getSenderId(await this.client.beaconId),
      version: BEACON_VERSION
    }

    await this.client.sendToPage(acknowledgeResponse)
  }
}
