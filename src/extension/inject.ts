/// <reference types="chrome"/>

// Subscribe from postMessages from page

const readyStateCheckInterval = setInterval(function() {
  if (document.readyState === 'complete') {
    clearInterval(readyStateCheckInterval)

    window.addEventListener(
      'message',
      ({ data }) => {
        if (data && data.method && data.data) {
          if (data.method === 'toExtension') {
            console.log('sending message from page to background', data.data)
            // Handle message from page and redirect to background script
            chrome.runtime.sendMessage({ method: 'toExtension', data: data.data })
          }
        } else {
          console.error('could not parse post message data', data)
        }
      },
      false
    )

    // Handle message from background and redirect to page
    chrome.runtime.onMessage.addListener(event => {
      if (event.method === 'toExtension') {
        return
      }
      const data = event.data
      console.log('sending message from background to page', data)

      window.postMessage({ method: 'toPage', data }, '*')
    })
  } else {
    console.log('inject.js: not ready')
  }
}, 100)
