import {
  BeaconBaseMessage,
  BeaconMessage,
  BeaconMessageType,
  PermissionRequestOutput,
  PermissionResponse,
  PermissionResponseInput,
  PermissionScope
} from '@airgap/beacon-sdk'
import { BEACON_VERSION } from '@airgap/beacon-sdk/dist/constants'

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
      pubkey: string
      scopes: PermissionScope[]
    } = data.extras as any

    const responseInput: PermissionResponseInput = {
      id: request.id,
      type: BeaconMessageType.PermissionResponse,
      pubkey: extras.pubkey,
      network: {
        ...request.network
      },
      scopes: extras.scopes
    }

    const response: PermissionResponse = { beaconId: await client.beaconId, version: BEACON_VERSION, ...responseInput }

    sendToPage(response)
    sendResponseToPopup()
  }
}
