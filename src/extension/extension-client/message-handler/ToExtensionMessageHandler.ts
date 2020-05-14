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
  PermissionScope,
  Serializer,
  SignPayloadRequestOutput
} from '@airgap/beacon-sdk'
import { BEACON_VERSION } from '@airgap/beacon-sdk/dist/constants'
import { ConnectionContext } from '@airgap/beacon-sdk/dist/types/ConnectionContext'
import { getAccountIdentifier } from '@airgap/beacon-sdk/dist/utils/get-account-identifier'
import { TezosWrappedOperation } from 'airgap-coin-lib/dist/protocols/tezos/types/TezosWrappedOperation'

import { PermissionInfo, WalletInfo } from '../Actions'
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
    // TODO: Decide where to send the request to
    // Use a map and check all known addresses
    // We can only do this for the operation and the sign request
    if (beaconConnected) {
      logger.log('beacon', 'relaying to wallet', data)

      return this.client.sendToBeacon(data.payload as string)
    } else {
      logger.log('not beacon', 'sending to popup', data)

      await this.client.popupManager.startPopup()

      const deserialized: BeaconMessage = (await new Serializer().deserialize(data.payload as string)) as BeaconMessage
      this.client.pendingRequests.push({ message: deserialized, connectionContext })

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
          beaconId: await this.client.beaconId,
          version: BEACON_VERSION,
          ...responseInput
        }
        await this.client.sendToPage(await new Serializer().serialize(response))

        const errorObject = { title: (error as any).name, message: (error as any).message, data: (error as any).data }

        return this.client.sendToPopup({ ...data, payload: { error: errorObject } })
      }

      if (enriched.err) {
        await sendError({ name: 'Wallet Error', message: `No permission` }, BeaconErrorType.NOT_GRANTED_ERROR)

        return
      }

      // Check permissions

      if (deserialized.type === BeaconMessageType.OperationRequest) {
        // Intercept Operation request and enrich it with information
        ;(async (): Promise<void> => {
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
            wallet.pubkey
          )

          operationRequest.operationDetails = operations.contents
          const serialized: string = await new Serializer().serialize(operationRequest)

          return this.client.sendToPopup({ ...data, payload: serialized })
        })().catch(async (operationPrepareError: Error) => {
          if ((operationPrepareError as any).data) {
            await sendError(operationPrepareError, BeaconErrorType.PARAMETERS_INVALID_ERROR)
            logger.error('operationPrepareError', (operationPrepareError as any).data)
          } else {
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

  public async checkPermission(message: BeaconMessage): Promise<boolean> {
    switch (message.type) {
      case BeaconMessageType.PermissionRequest: {
        return true
      }
      case BeaconMessageType.OperationRequest: {
        // const permissions = await this.client.getPermissions()
        const accountIdentifier: string = await getAccountIdentifier(message.sourceAddress, message.network)

        const permission: PermissionInfo | undefined = await this.client.getPermission(accountIdentifier)
        if (!permission) {
          return true
        }

        return permission.scopes.includes(PermissionScope.OPERATION_REQUEST)
      }
      case BeaconMessageType.SignPayloadRequest: {
        const accountIdentifier: string = ''

        const permission: PermissionInfo | undefined = await this.client.getPermission(accountIdentifier)
        if (!permission) {
          return true
        }

        return true
      }
      case BeaconMessageType.BroadcastRequest: {
        return true
      }

      default:
        throw new Error('Message not handled')
    }
  }
}
