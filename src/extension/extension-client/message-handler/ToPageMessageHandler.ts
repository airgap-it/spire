import { ExtensionMessage } from '@airgap/beacon-sdk/dist/types/ExtensionMessage'

import { Logger } from '../Logger'

import { MessageHandler } from './MessageHandler'

const logger: Logger = new Logger('ToPageMessageHandler')

export class ToPageMessageHandler extends MessageHandler {
  constructor(private readonly sendToPage: (message: string) => void) {
    super()
  }

  public async handle(
    data: ExtensionMessage<string>,
    sendResponse: (response?: unknown) => void,
    _beaconConnected: boolean
  ): Promise<void> {
    logger.log('ToPageMessageHandler', data)
    // Events need to be sent to the page
    this.sendToPage(data.payload)
    sendResponse()
  }
}
