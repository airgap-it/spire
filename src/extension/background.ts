/// <reference types="chrome"/>

const sendToPage = data => {
  console.log('background.js: post ', data)
  chrome.tabs.query({}, tabs => {
    // TODO think about direct communication with tab
    tabs.forEach(({ id }) => {
      if (id) {
        chrome.tabs.sendMessage(id, data)
      }
    }) // Send message to all tabs
  })
}

const connectToPopup = cb => {
  chrome.runtime.onConnect.addListener(port => {
    port.onMessage.addListener((message, sender) => {
      console.log('Popup message!', message, sender)
      cb()
    })
    port.onDisconnect.addListener(async _event => {
      console.log('Popup disconnected!')
    })
    port.postMessage('MY MESSAGE')
  })
}

const openPopup = message => {
  return new Promise((resolve, _reject) => {
    chrome.windows.create({
      url: `./index.html/#/pair/?d=${message.payload}`,
      type: 'popup',
      height: 680,
      width: 420
    })
    connectToPopup(res => {
      resolve(res)
    })
  })
}

const sendToPopup = message => {
  // TODO: Consider communicating with existing popup instead of creating a new one every time.
  return openPopup(message)
}

chrome.runtime.onMessage.addListener((data, _sender) => {
  console.log('background.js: receive ', data)
  if (data.method === 'toExtension') {
    sendToPopup(data)
  } else if (data.method === 'toPage') {
    sendToPage(data)
  }
})
