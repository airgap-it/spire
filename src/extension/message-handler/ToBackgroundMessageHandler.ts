import { ExtensionMessage } from '@airgap/beacon-sdk/dist/types/ExtensionMessage'

import { Logger } from '../Logger'
import { Action, ExtensionMessageInputPayload } from '../Methods'

import { MessageHandler } from './MessageHandler'

const logger: Logger = new Logger('ToBackgroundMessageHandler')

export class ToBackgroundMessageHandler extends MessageHandler {
  constructor(
    private readonly handleMessage: (
      data: ExtensionMessage<ExtensionMessageInputPayload<Action>>,
      sendResponse: (response?: unknown) => void
    ) => Promise<void>
  ) {
    super()
  }
  public async handle(
    data: ExtensionMessage<ExtensionMessageInputPayload<Action>>,
    sendResponse: (response?: unknown) => void,
    _beaconConnected: boolean
  ): Promise<void> {
    logger.log('data', data)

    return this.handleMessage(data, sendResponse)
  }
}
