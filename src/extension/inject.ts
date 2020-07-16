/// <reference types="chrome"/>

import type { ExtensionMessage } from '@airgap/beacon-sdk'

enum ExtensionMessageTarget {
  BACKGROUND = "toBackground",
  PAGE = "toPage",
  EXTENSION = "toExtension"
}

// Handle message from page and redirect to background.js script
window.addEventListener(
  'message',
  (event: MessageEvent) => {
    // tslint:disable-next-line: strict-comparisons
    if (event.source !== window) {
      // tslint:disable-next-line:no-console
      console.log('message ignored because source was not us', event)

      return
    }
    const data: ExtensionMessage<string> = event.data as ExtensionMessage<string>

    if (data && data.target === ExtensionMessageTarget.EXTENSION) {
      if (typeof data.payload === 'string' && data.payload === 'ping') {
        // To detect if extension is installed or not, we answer pings immediately
        window.postMessage({ target: ExtensionMessageTarget.PAGE, payload: 'pong' }, '*')
      } else {
        // tslint:disable-next-line:no-console
        console.log('BEACON EXTENSION (inject.ts): sending message from page to background', data.payload)

        data.sender = event.origin

        chrome.runtime.sendMessage(data, (responseData?: unknown) => {
          // tslint:disable-next-line:no-console
          console.log('sendMessage callback', responseData)
        })
      }
    }
  },
  false
)

// Handle message from background.js and redirect to page
chrome.runtime.onMessage.addListener((message: ExtensionMessage<string>, sender: chrome.runtime.MessageSender) => {
  if (message.target === ExtensionMessageTarget.EXTENSION) {
    return
  }

  // tslint:disable-next-line:no-console
  console.log('BEACON EXTENSION (inject.ts): sending message from background to page', message)

  window.postMessage({ message, sender }, '*')
})
