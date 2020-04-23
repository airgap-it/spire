/// <reference types="chrome"/>

import { init, setTag } from '@sentry/browser'

import { ExtensionClient } from './extension-client/ExtensionClient'
import { Logger } from './extension-client/Logger'

init({ dsn: 'https://910a5c4d48a5409fb5fab24a5eb37cc8@sentry.papers.tech/171' })
setTag('location', 'background')

const logger: Logger = new Logger('background.ts')

const client: ExtensionClient = new ExtensionClient({ name: 'Beacon Extension' })
client
  .addListener((message: unknown) => {
    logger.log('received message', message)
  })
  .catch((listenerError: Error) => {
    logger.log('listenerError', listenerError)
  })
