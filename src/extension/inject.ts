/// <reference types="chrome"/>

// Handle message from page and redirect to background.js script
window.addEventListener(
  'message',
  (event: any) => {
    const data: { method: string; payload: unknown } = event.data
    if (data && data.method === 'toExtension') {
      if (data.payload === 'ping') {
        // To detect if extension is installed or not, we answer pings immediately
        window.postMessage({ method: 'toPage', payload: 'pong' }, '*')
      } else {
        console.log('sending message from page to background', data.payload)

        chrome.runtime.sendMessage({ method: 'toExtension', payload: data.payload })
      }
    }
  },
  false
)

// Handle message from background.js and redirect to page
chrome.runtime.onMessage.addListener(data => {
  if (data.method === 'toExtension') {
    return
  }

  console.log('sending message from background to page', data.payload)

  window.postMessage(data, '*')
})
