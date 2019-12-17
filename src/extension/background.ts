/// <reference types="chrome"/>

const postToContent = data => {
  console.log('background.js: post ', data)
  chrome.tabs.query({}, function(tabs) {
    // TODO think about direct communication with tab
    const message = { method: 'toPage', data }
    tabs.forEach(({ id }) => {
      if (id) {
        chrome.tabs.sendMessage(id, message)
      }
    }) // Send message to all tabs
  })
}

const connectToPopup = cb => {
  chrome.runtime.onConnect.addListener(port => {
    port.onMessage.addListener((msg, sender) => {
      console.log('Popup message!', msg, sender)
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
      url: `./index.html/#/home/?d=${message.data}`,
      type: 'popup',
      height: 680,
      width: 420
    })
    connectToPopup(res => {
      resolve(res)
    })
  })
}

chrome.runtime.onMessage.addListener((msg, _sender) => {
  console.log('background.js: receive ', msg)
  if (msg.method === 'toExtension') {
    openPopup(msg)
  } else {
    postToContent(msg)
  }
})
