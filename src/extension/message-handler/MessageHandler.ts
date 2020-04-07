import { ExtensionMessage } from '@airgap/beacon-sdk/dist/types/ExtensionMessage'
import { Logger } from '../Logger'

const logger: Logger = new Logger('MessageHandler')

export class MessageHandler {
  public async handle(
    data: ExtensionMessage<unknown>,
    sendResponse: (response?: unknown) => void,
    _beaconConnected: boolean
  ): Promise<void> {
    logger.log('unknown data', data)
    sendResponse()
  }
}
