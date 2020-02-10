/// <reference types="chrome"/>

import { Serializer } from '@airgap/beacon-sdk/dist/client/Serializer'
import { ChromeStorage } from '@airgap/beacon-sdk/dist/client/storage/ChromeStorage'
import { WalletCommunicationClient } from '@airgap/beacon-sdk/dist/client/WalletCommunicationClient'
import { MessageTypes } from '@airgap/beacon-sdk/dist/messages/Messages'
import { TezosProtocol } from 'airgap-coin-lib'
import * as bip39 from 'bip39'

import { MessageHandler } from './message-handler/MessageHandler'
import { ToBackgroundMessageHandler } from './message-handler/ToBackgroundMessageHandler'
import { ToExtensionMessageHandler } from './message-handler/ToExtensionMessageHandler'
import { ToPageMessageHandler } from './message-handler/ToPageMessageHandler'
import { Methods } from './Methods'

/*
import {DAppClient} from '@airgap/beacon-sdk/dist/client/clients/DappClient'

const client = new DAppClient('Beacon Extension')
client.init().then(transport => {
  console.log('transport', transport)
  client.
})
*/
console.log('test')
const walletClient = new WalletCommunicationClient('test', 'asdf', 1, true)
walletClient.start()

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

const storage = new ChromeStorage()

let globalPubkey

const handleLedgerInit = async (_data: any, _sendResponse: Function) => {
  console.log('handleLedgerInit')
}
const handleLocalInit = async (_data: any, sendResponse: Function) => {
  console.log('handleLocalInit')
  const mnemonic = await storage.get('mnemonic' as any)
  if (mnemonic) {
    console.log('mnemonic read', mnemonic)
    sendResponse({ mnemonic })
  } else {
    const generated = bip39.generateMnemonic()
    console.log('mnemonic generated', generated)
    console.log(sendResponse)
    sendResponse({ mnemonic: generated })
  }
}
const handleP2PInit = async (_data: any, sendResponse: Function) => {
  console.log('handshake info', walletClient.getHandshakeInfo())

  walletClient
    .listenForChannelOpening(pubkey => {
      console.log('channel opening', pubkey)
      globalPubkey = pubkey

      walletClient
        .listenForEncryptedMessage(pubkey, message => {
          console.log('got message!', message)
          sendToPage({ method: 'toPage', payload: message })
        })
        .catch(console.error)
    })
    .then(() => {
      console.log('listening for channel open')
    })
    .catch(console.error)

  sendResponse({ qr: walletClient.getHandshakeInfo() })
}
const handleResponse = async (data: any, _sendResponse: Function) => {
  console.log('handleResponse')
  if (data.request.type === MessageTypes.PermissionResponse) {
    console.log('GET PERMISSION RESPONSE', data)
    const serialized = new Serializer().serialize(data.request)
    const res = { method: 'toPage', payload: serialized }
    console.log('LOCAL REQUEST', res)
    sendToPage(res)
  } else if (data.request.type === MessageTypes.OperationRequest) {
    console.log('GET OPERATION REQUEST', data)
    const tezosProtocol = new TezosProtocol()

    const forgedTx = await tezosProtocol.forgeAndWrapOperations(data.request.wrappedOperation)
    console.log(forgedTx)
  } else if (data.request.type === MessageTypes.SignPayloadRequest) {
    console.log('GET SIGN REQUEST', data)
  } else if (data.request.type === MessageTypes.BroadcastRequest) {
    console.log('GET BROADCAST REQUEST', data)
  }
}
const handleSaveMnemonic = async (data: any, sendResponse: Function) => {
  console.log('handleSaveMnemonic')
  storage.set('mnemonic' as any, data.payload.params.mnemonic)
  sendResponse({ result: true })
}

const messageTypeHandler = new Map<string, Function>()
messageTypeHandler.set(Methods.LEDGER_INIT, handleLedgerInit)
messageTypeHandler.set(Methods.LOCAL_INIT, handleLocalInit)
messageTypeHandler.set(Methods.P2P_INIT, handleP2PInit)
messageTypeHandler.set(Methods.RESPONSE, handleResponse)
messageTypeHandler.set(Methods.LOCAL_SAVE_MNEMONIC, handleSaveMnemonic)

const handleMessage = async (data: any, sendResponse: any) => {
  console.log('handleMessage', data, sendResponse)
  const handler = messageTypeHandler.get(data.type) || ((_data: any, _sendResponse: Function) => {})
  console.log('handler', handler)
  handler(data, sendResponse)
}

const send = (message: string) => {
  console.log('sending message', globalPubkey, message)
  walletClient.sendMessage(globalPubkey, message).catch(console.log)
}

const messageHandlerMap = new Map<string, MessageHandler>()
messageHandlerMap.set('toExtension', new ToExtensionMessageHandler())
messageHandlerMap.set('toPage', new ToPageMessageHandler())
messageHandlerMap.set('toBackground', new ToBackgroundMessageHandler())

chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
  console.log('background.js: receive ', sender, data)

  const handler = messageHandlerMap.get(data.method) || new MessageHandler()
  handler.handle(data, sendResponse, send, sendToPopup, sendToPage, handleMessage, !!globalPubkey)

  // return true from the event listener to indicate you wish to send a response asynchronously
  // (this will keep the message channel open to the other end until sendResponse is called).
  return true
})
