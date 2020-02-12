/// <reference types="chrome"/>

import { Serializer } from '@airgap/beacon-sdk/dist/client/Serializer'
import { ChromeStorage } from '@airgap/beacon-sdk/dist/client/storage/ChromeStorage'
import { WalletCommunicationClient } from '@airgap/beacon-sdk/dist/client/WalletCommunicationClient'
import {
  BaseMessage,
  MessageTypes,
  BroadcastResponse,
  SignPayloadResponse,
  OperationResponse
} from '@airgap/beacon-sdk/dist/messages/Messages'
import { TezosProtocol } from 'airgap-coin-lib'
import * as bip39 from 'bip39'

import { MessageHandler } from './message-handler/MessageHandler'
import { ToBackgroundMessageHandler } from './message-handler/ToBackgroundMessageHandler'
import { ToExtensionMessageHandler } from './message-handler/ToExtensionMessageHandler'
import { ToPageMessageHandler } from './message-handler/ToPageMessageHandler'
import { Methods } from './Methods'

export enum Destinations {
  BACKGROUND = 'toBackground',
  PAGE = 'toPage',
  EXTENSION = 'toExtension'
}

interface ExtensionMessage {
  method: Destinations
  payload: string
}

/*
import {DAppClient} from '@airgap/beacon-sdk/dist/client/clients/DappClient'

const client = new DAppClient('Beacon Extension')
client.init().then(transport => {
  console.log('transport', transport)
  client.
})
*/

// TODO: Refactor this file

const protocol: TezosProtocol = new TezosProtocol()

console.log('test')
const walletClient = new WalletCommunicationClient('test', 'asdf', 1, true)
walletClient.start()

const sendToPage = (data: string): void => {
  console.log('background.js: post ', data)
  const message: ExtensionMessage = { method: Destinations.PAGE, payload: data }
  chrome.tabs.query({}, tabs => {
    // TODO think about direct communication with tab
    tabs.forEach(({ id }) => {
      if (id) {
        chrome.tabs.sendMessage(id, message)
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

const handleP2PInit = async (_data: any, sendResponse: Function) => {
  console.log('handshake info', walletClient.getHandshakeInfo())

  walletClient
    .listenForChannelOpening(pubkey => {
      console.log('channel opening', pubkey)
      globalPubkey = pubkey

      walletClient
        .listenForEncryptedMessage(pubkey, message => {
          console.log('got message!', message)
          sendToPage(message)
        })
        .catch(console.error)
    })
    .then(() => {
      console.log('listening for channel open')
    })
    .catch(console.error)

  sendResponse({ qr: walletClient.getHandshakeInfo() })
}

const sign = async (forgedTx: string): Promise<string> => {
  const mnemonic: string = await storage.get('mnemonic' as any)
  const seed: Buffer = await bip39.mnemonicToSeed(mnemonic)
  const privatekey: Buffer = protocol.getPrivateKeyFromHexSecret(seed.toString('hex'), protocol.standardDerivationPath)

  return protocol.signWithPrivateKey(privatekey, { binaryTransaction: forgedTx })
}

const broadcast = async (signedTx: string): Promise<string> => {
  return protocol.broadcastTransaction(signedTx)
}

const beaconMessageHandlerNotSupported: (
  data: BaseMessage,
  sendResponse: Function
) => Promise<void> = (): Promise<void> => Promise.resolve()

type BeaconMessageHandlerFunction = (data: BaseMessage, sendResponse: Function) => Promise<void>

const beaconMessageHandler: { [key in MessageTypes]: BeaconMessageHandlerFunction } = {
  [MessageTypes.PermissionResponse]: async (data: any, sendResponse: Function): Promise<void> => {
    console.log('beaconMessageHandler permission-response', data)
    sendToPage(new Serializer().serialize(data))
    sendResponse()
  },
  [MessageTypes.OperationRequest]: async (data: any, sendResponse: Function): Promise<void> => {
    console.log('beaconMessageHandler operation-request', data)
    const tezosProtocol = new TezosProtocol()
    const mnemonic = await storage.get('mnemonic' as any)
    const seed = await bip39.mnemonicToSeed(mnemonic)

    const publicKey = tezosProtocol.getPublicKeyFromHexSecret(
      seed.toString('hex'),
      tezosProtocol.standardDerivationPath
    )
    const operation = await tezosProtocol.prepareOperations(publicKey, data.operationDetails)

    const forgedTx = await tezosProtocol.forgeAndWrapOperations(operation)
    console.log(forgedTx)
    const hash = await sign(forgedTx.binaryTransaction).then(broadcast)

    console.log('broadcast: ', hash)
    const response: OperationResponse = {
      id: data.id,
      type: MessageTypes.OperationResponse,
      transactionHashes: [hash]
    }

    sendToPage(new Serializer().serialize(response))
    sendResponse()
  },
  [MessageTypes.SignPayloadRequest]: async (data: any, sendResponse: Function): Promise<void> => {
    console.log('beaconMessageHandler sign-request', data)
    const hash = await sign(data.payload[0])
    console.log('broadcast: ', hash)
    const response: SignPayloadResponse = {
      id: data.id,
      type: MessageTypes.SignPayloadResponse,
      signature: [hash as any]
    }

    sendToPage(new Serializer().serialize(response))
    sendResponse()
  },
  [MessageTypes.BroadcastRequest]: async (data: any, sendResponse: Function): Promise<void> => {
    console.log('beaconMessageHandler broadcast-request', data)
    const hash = await broadcast(data.signedTransactions[0])
    console.log('broadcast: ', hash)
    const response: BroadcastResponse = {
      id: data.id,
      type: MessageTypes.BroadcastResponse,
      transactionHashes: [hash]
    }

    sendToPage(new Serializer().serialize(response))
    sendResponse()
  },
  [MessageTypes.PermissionRequest]: beaconMessageHandlerNotSupported,
  [MessageTypes.OperationResponse]: beaconMessageHandlerNotSupported,
  [MessageTypes.SignPayloadResponse]: beaconMessageHandlerNotSupported,
  [MessageTypes.BroadcastResponse]: beaconMessageHandlerNotSupported
}

const handleResponse = async (data: any, sendResponse: Function): Promise<void> => {
  console.log('handleResponse')
  const handler: BeaconMessageHandlerFunction = beaconMessageHandler[data.request.type]
  await handler(data.request, sendResponse)
}

const handleLocalInit = async (_data: any, sendResponse: Function) => {
  console.log('handleLocalInit')
  const mnemonic = await storage.get('mnemonic' as any)
  if (mnemonic) {
    console.log('mnemonic read', mnemonic)
    sendResponse({ mnemonic })
  } else {
    handleGenerateMnemonic(_data, sendResponse)
  }
}

const handleSaveMnemonic = async (data: any, sendResponse: Function) => {
  console.log('handleSaveMnemonic')
  storage.set('mnemonic' as any, data.payload.params.mnemonic)
  sendResponse({ result: true })
}

const handleGenerateMnemonic = async (_data: any, sendResponse: Function) => {
  console.log('handleGenerateMnemonic')
  const generated = bip39.generateMnemonic()
  console.log('mnemonic generated', generated)
  storage.set('mnemonic' as any, generated)
  sendResponse({ mnemonic: generated })
}

const messageTypeHandler = new Map<string, Function>()
messageTypeHandler.set(Methods.LEDGER_INIT, handleLedgerInit)
messageTypeHandler.set(Methods.LOCAL_GET_MNEMONIC, handleLocalInit)
messageTypeHandler.set(Methods.LOCAL_SAVE_MNEMONIC, handleSaveMnemonic)
messageTypeHandler.set(Methods.LOCAL_GENERATE_MNEMONIC, handleGenerateMnemonic)
messageTypeHandler.set(Methods.P2P_INIT, handleP2PInit)
messageTypeHandler.set(Methods.RESPONSE, handleResponse)

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
messageHandlerMap.set(Destinations.EXTENSION, new ToExtensionMessageHandler())
messageHandlerMap.set(Destinations.PAGE, new ToPageMessageHandler())
messageHandlerMap.set(Destinations.BACKGROUND, new ToBackgroundMessageHandler())

chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
  console.log('background.js: receive ', sender, data)

  const handler = messageHandlerMap.get(data.method) || new MessageHandler()
  handler.handle(data, sendResponse, send, sendToPopup, sendToPage, handleMessage, !!globalPubkey)

  // return true from the event listener to indicate you wish to send a response asynchronously
  // (this will keep the message channel open to the other end until sendResponse is called).
  return true
})
