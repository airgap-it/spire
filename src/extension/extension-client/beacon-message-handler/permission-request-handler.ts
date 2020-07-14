import {
  BEACON_VERSION,
  BeaconBaseMessage,
  BeaconMessage,
  BeaconMessageType,
  PermissionRequestOutput,
  PermissionResponse,
  PermissionResponseInput,
  PermissionScope
} from '@airgap/beacon-sdk'

import { ExtensionClient } from '../ExtensionClient'
import { Logger } from '../Logger'

import { BeaconMessageHandlerFunction } from './BeaconMessageHandler'

export const permissionRequestHandler: (client: ExtensionClient, logger: Logger) => BeaconMessageHandlerFunction = (
  client: ExtensionClient,
  logger: Logger
): BeaconMessageHandlerFunction => {
  return async (
    data: { request: BeaconBaseMessage; extras: unknown },
    sendToPage: (message: BeaconMessage) => void,
    sendResponseToPopup: (error?: unknown) => void
  ): Promise<void> => {
    logger.log('permission-response', data)
    const request: PermissionRequestOutput = (data.request as any) as PermissionRequestOutput
    const extras: {
      publicKey: string
      scopes: PermissionScope[]
    } = data.extras as any

    const responseInput: PermissionResponseInput = {
      id: request.id,
      type: BeaconMessageType.PermissionResponse,
      publicKey: extras.publicKey,
      network: {
        ...request.network
      },
      scopes: extras.scopes
    }

    const response: PermissionResponse = {
      senderId: await client.beaconId,
      version: BEACON_VERSION,
      ...responseInput
    }
    ;(response as any).pubkey = response.publicKey // TODO: 0.7.0 backwards compatibility. Should be removed after 1.0.0

    sendToPage(response)
    sendResponseToPopup()
  }
}
