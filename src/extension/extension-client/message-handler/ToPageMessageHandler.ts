import { ConnectionContext, ExtensionMessage, Serializer, BeaconMessage } from '@airgap/beacon-sdk'

import { ExtensionClient } from '../ExtensionClient'
import { Logger } from '../Logger'

import { MessageHandler } from './MessageHandler'

const logger: Logger = new Logger('ToPageMessageHandler')

export class ToPageMessageHandler extends MessageHandler {
  constructor(private readonly client: ExtensionClient) {
    super()
  }

  public async handle(
    data: ExtensionMessage<string>,
    connectionContext: ConnectionContext,
    _beaconConnected: boolean
  ): Promise<void> {
    logger.log('ToPageMessageHandler', data)
    // Events need to be sent to the page
    await this.client.sendToPage((await new Serializer().deserialize(data.payload)) as BeaconMessage)
    if (connectionContext.extras && connectionContext.extras.sendResponse) {
      connectionContext.extras.sendResponse()
    }
  }
}
