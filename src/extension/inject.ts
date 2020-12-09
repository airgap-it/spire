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
        window.postMessage({ target: ExtensionMessageTarget.PAGE, payload: 'pong', sender: {
          id: chrome.runtime.id, // The ID of the extension
          name: 'Beacon Extension', // The name of the extension, eg "Beacon Extension"
          // iconUrl: '' URL to an icon
        } }, '*')
      } else {
        data.sender = event.origin

        // We only respond to messages that don't have a target ID specified (broadcast), or are addressed to us
        if (!data.targetId || data.targetId === chrome.runtime.id) {
          // tslint:disable-next-line:no-console
          // console.log('BEACON EXTENSION (inject.ts): sending message from page to background (addressed to us)', data)
          chrome.runtime.sendMessage(data, (responseData?: unknown) => {
            // tslint:disable-next-line:no-console
            console.log('sendMessage callback', responseData)
          })  
        } else {
          // tslint:disable-next-line:no-console
          // console.log('BEACON EXTENSION (inject.ts): sending message from page to background (NOT addressed to us)', data)
        }
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
  // console.log('BEACON EXTENSION (inject.ts): sending message from background to page', message)

  window.postMessage({ message, sender }, '*')
})
