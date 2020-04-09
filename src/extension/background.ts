/// <reference types="chrome"/>

import { ExtensionClient } from './ExtensionClient'
import { Logger } from './Logger'

const logger: Logger = new Logger('background.ts')

const client: ExtensionClient = new ExtensionClient('Beacon Extension')
client
  .addListener((message: unknown) => {
    logger.log('received message', message)
  })
  .catch((listenerError: Error) => {
    logger.log('listenerError', listenerError)
  })
