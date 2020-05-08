import { ExtensionMessage } from '@airgap/beacon-sdk/dist/types/ExtensionMessage'

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
    sendResponse: (response?: unknown) => void,
    _beaconConnected: boolean
  ): Promise<void> {
    logger.log('ToPageMessageHandler', data)
    // Events need to be sent to the page
    await this.client.sendToPage(data.payload)
    sendResponse()
  }
}
