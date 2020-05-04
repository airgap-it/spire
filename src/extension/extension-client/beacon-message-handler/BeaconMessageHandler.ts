import { BeaconBaseMessage, BeaconMessage, BeaconMessageType } from '@airgap/beacon-sdk'

import { ExtensionClient } from '../ExtensionClient'
import { Logger } from '../Logger'

import { broadcastRequestHandler } from './broadcast-request-handler'
import { operationRequestHandler } from './operation-request-handler'
import { permissionRequestHandler } from './permission-request-handler'
import { signPayloadRequestHandler } from './sign-payload-request-handler'

const logger: Logger = new Logger('BeaconMessageHandler')

const beaconMessageHandlerNotSupported: (
  data: { request: BeaconBaseMessage; extras: unknown },
  sendToPage: (message: BeaconMessage) => void,
  sendResponse: () => void
) => Promise<void> = (): Promise<void> => Promise.resolve()

export type BeaconMessageHandlerFunction = (
  data: { request: BeaconBaseMessage; extras: unknown },
  sendToPage: (message: BeaconMessage) => void,
  sendResponseToPopup: (error?: unknown) => void
) => Promise<void>

export class BeaconMessageHandler {
  public beaconMessageHandler: { [key in BeaconMessageType]: BeaconMessageHandlerFunction } = {
    [BeaconMessageType.PermissionRequest]: permissionRequestHandler(this.client, logger),
    [BeaconMessageType.OperationRequest]: operationRequestHandler(this.client, logger),
    [BeaconMessageType.SignPayloadRequest]: signPayloadRequestHandler(this.client, logger),
    [BeaconMessageType.BroadcastRequest]: broadcastRequestHandler(this.client, logger),
    [BeaconMessageType.PermissionResponse]: beaconMessageHandlerNotSupported,
    [BeaconMessageType.OperationResponse]: beaconMessageHandlerNotSupported,
    [BeaconMessageType.SignPayloadResponse]: beaconMessageHandlerNotSupported,
    [BeaconMessageType.BroadcastResponse]: beaconMessageHandlerNotSupported
  }

  constructor(private readonly client: ExtensionClient) {
    /* */
  }

  public async getHandler(key: BeaconMessageType): Promise<BeaconMessageHandlerFunction> {
    return this.beaconMessageHandler[key]
  }
}
