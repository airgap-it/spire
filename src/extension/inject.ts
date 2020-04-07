/// <reference types="chrome"/>

import { ExtensionMessage, ExtensionMessageTarget } from '@airgap/beacon-sdk/dist/types/ExtensionMessage'

// Handle message from page and redirect to background.js script
window.addEventListener(
  'message',
  (event: MessageEvent) => {
    const data: { target: string; payload: unknown } = event.data as ExtensionMessage<string>
    if (data && data.target === ExtensionMessageTarget.EXTENSION) {
      if (typeof data.payload === 'string' && data.payload === 'ping') {
        // To detect if extension is installed or not, we answer pings immediately
        window.postMessage({ target: ExtensionMessageTarget.PAGE, payload: 'pong' }, '*')
      } else {
        // tslint:disable:no-console
        console.log('BEACON EXTENSION (inject.ts): sending message from page to background', data.payload)
        // tslint:enable:no-console

        chrome.runtime.sendMessage({ target: ExtensionMessageTarget.EXTENSION, payload: data.payload })
      }
    }
  },
  false
)

// Handle message from background.js and redirect to page
chrome.runtime.onMessage.addListener((data: ExtensionMessage<string>) => {
  if (data.target === ExtensionMessageTarget.EXTENSION) {
    return
  }

  // tslint:disable:no-console
  console.log('BEACON EXTENSION (inject.ts): sending message from background to page', data.payload)
  // tslint:enable:no-console

  window.postMessage(data, '*')
})
