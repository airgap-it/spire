import { ConnectionContext, ExtensionMessage } from '@airgap/beacon-sdk'

import { Logger } from '../Logger'

const logger: Logger = new Logger('MessageHandler')

export class MessageHandler {
  public async handle(
    data: ExtensionMessage<unknown>,
    connectionContext: ConnectionContext,
    _beaconConnected: boolean
  ): Promise<void> {
    logger.log('unknown data', data)
    if (connectionContext.extras && connectionContext.extras.sendResponse) {
      connectionContext.extras.sendResponse()
    }
  }
}
