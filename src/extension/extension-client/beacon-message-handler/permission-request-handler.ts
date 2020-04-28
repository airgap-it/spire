import {
  BeaconBaseMessage,
  BeaconMessage,
  BeaconMessageType,
  PermissionRequestOutput,
  PermissionResponse,
  PermissionResponseInput,
  PermissionScope
} from '@airgap/beacon-sdk'
import { SDK_VERSION } from '@airgap/beacon-sdk/dist/constants'

import { ExtensionClient } from '../ExtensionClient'
import { Logger } from '../Logger'

import { BeaconMessageHandlerFunction } from './BeaconMessageHandler'

export const permissionRequestHandler: (client: ExtensionClient, logger: Logger) => BeaconMessageHandlerFunction = (
  _client: ExtensionClient,
  logger: Logger
): BeaconMessageHandlerFunction => {
  return async (
    data: { request: BeaconBaseMessage; extras: unknown },
    sendToPage: (message: BeaconMessage) => void,
    sendResponse: Function
  ): Promise<void> => {
    logger.log('permission-response', data)
    const request: PermissionRequestOutput = (data.request as any) as PermissionRequestOutput
    const extras: {
      pubkey: string
      accountIdentifier: string
      scopes: PermissionScope[]
    } = data.extras as any

    const responseInput: PermissionResponseInput = {
      id: request.id,
      type: BeaconMessageType.PermissionResponse,
      accountIdentifier: extras.accountIdentifier,
      pubkey: extras.pubkey,
      network: {
        ...request.network
      },
      scopes: extras.scopes
    }

    const response: PermissionResponse = { beaconId: '0', version: SDK_VERSION, ...responseInput }

    sendToPage(response)
    sendResponse()
  }
}
