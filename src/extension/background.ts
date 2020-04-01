/// <reference types="chrome"/>

import { BroadcastBeaconError } from '@airgap/beacon-sdk/dist/messages/Errors'
import {
	BaseMessage,
	BroadcastRequest,
	BroadcastResponse,
	MessageType,
	Network,
	OperationRequest,
	OperationResponse,
	SignPayloadResponse
} from '@airgap/beacon-sdk/dist/messages/Messages'
import { Serializer } from '@airgap/beacon-sdk/dist/Serializer'
import { ChromeStorage } from '@airgap/beacon-sdk/dist/storage/ChromeStorage'
import { WalletCommunicationClient } from '@airgap/beacon-sdk/dist/WalletCommunicationClient'
import { TezosProtocol } from 'airgap-coin-lib'
import * as bip39 from 'bip39'

import { MessageHandler } from './message-handler/MessageHandler'
import { ToBackgroundMessageHandler } from './message-handler/ToBackgroundMessageHandler'
import { ToExtensionMessageHandler } from './message-handler/ToExtensionMessageHandler'
import { ToPageMessageHandler } from './message-handler/ToPageMessageHandler'
import { Methods } from './Methods'
import { getProtocolForNetwork } from './utils'
import { BeaconLedgerBridge } from './ledger-bridge'

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
import {DAppClient} from '@airgap/beacon-sdk/dist/clients/DappClient'

const client = new DAppClient('Beacon Extension')
client.init().then(transport => {
  console.log('transport', transport)
  client.
})
*/

// TODO: Refactor this file

const globalProtocol: TezosProtocol = new TezosProtocol() // TODO: Remove this

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

let popupId: number | undefined

// const connectToPopup = cb => {
//   chrome.runtime.onConnect.addListener(port => {
//     port.onMessage.addListener((message, sender) => {
//       console.log('Popup message!', message, sender)
//       cb()
//     })
//     port.onDisconnect.addListener(async _event => {
//       console.log('Popup disconnected!')
//     })
//     port.postMessage('MY MESSAGE')
//   })
// }

const queue: any[] = []

chrome.runtime.onMessage.addListener(function (message, _sender, _sendResponse) {
	console.log('got message from popup', message)
	while (queue.length > 0) {
		console.log('items in queue', queue.length)
		const item = queue.pop()
		chrome.runtime.sendMessage({ data: item })
	}
})

const openPopup = message => {
	if (popupId) {
		chrome.windows.update(popupId, { focused: true })
		console.log('sending message')
		chrome.runtime.sendMessage({ data: message })
		console.log(' message sent')

		return
	}
	const cb = currentPopup => {
		popupId = currentPopup.id
		console.log('popupInfo', currentPopup)
	}

	chrome.windows.onRemoved.addListener(removedPopupId => {
		console.log('popup removed!', removedPopupId)
		popupId = undefined
	})

	return new Promise((_resolve, _reject) => {
		const POPUP_HEIGHT: number = 680
		const POPUP_WIDTH: number = 420

		queue.push(message.payload)

		chrome.windows.create(
			{
				url: `${chrome.extension.getURL('index.html')}`,
				type: 'popup',
				focused: true,
				height: POPUP_HEIGHT,
				width: POPUP_WIDTH
			},
			cb
		)
		// connectToPopup(res => {
		//   resolve(res)
		// })
	})
}

const sendToPopup = message => {
	// TODO: Consider communicating with existing popup instead of creating a new one every time.
	return openPopup(message)
}

const storage = new ChromeStorage()

let globalPubkey

const bridge = new BeaconLedgerBridge('https://airgap-it.github.io/beacon-ledger-bridge/')

const handleLedgerInit = async (_data: any, _sendResponse: Function) => {
	let publicKey
	try {
		publicKey = await bridge.getAddress()
	} catch (error) {
		return _sendResponse({ error })
	}
	storage.set('ledger-publicKey' as any, publicKey)
	const protocol = new TezosProtocol()
	const address = await protocol.getAddressFromPublicKey(publicKey)
	_sendResponse({ address })
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

const useLedger: boolean = true

const sign = async (forgedTx: string): Promise<string> => {
	if (!useLedger) {
		const mnemonic: string = await storage.get('mnemonic' as any)
		const seed: Buffer = await bip39.mnemonicToSeed(mnemonic)
		const privatekey: Buffer = globalProtocol.getPrivateKeyFromHexSecret(
			seed.toString('hex'),
			globalProtocol.standardDerivationPath
		)

		return globalProtocol.signWithPrivateKey(privatekey, { binaryTransaction: forgedTx })
	} else {
		console.log('WILL SIGN', forgedTx)
		const signature = await bridge.signOperation(forgedTx)
		console.log('SIGNATURE', signature)
		return signature
	}
}

const broadcast = async (network: Network, signedTx: string): Promise<string> => {
	const protocol: TezosProtocol = await getProtocolForNetwork(network)

	return protocol.broadcastTransaction(signedTx)
}

const beaconMessageHandlerNotSupported: (
	data: BaseMessage,
	sendResponse: Function
) => Promise<void> = (): Promise<void> => Promise.resolve()

type BeaconMessageHandlerFunction = (data: BaseMessage, sendResponse: Function) => Promise<void>

const beaconMessageHandler: { [key in MessageType]: BeaconMessageHandlerFunction } = {
	[MessageType.PermissionResponse]: async (data: any, sendResponse: Function): Promise<void> => {
		console.log('beaconMessageHandler permission-response', data)
		sendToPage(new Serializer().serialize(data))
		sendResponse()
	},
	[MessageType.OperationRequest]: async (data: any, sendResponse: Function): Promise<void> => {
		const operationRequest: OperationRequest = data
		console.log('beaconMessageHandler operation-request', data)
		const protocol: TezosProtocol = await getProtocolForNetwork(operationRequest.network)

		const mnemonic = await storage.get('mnemonic' as any)
		const seed = await bip39.mnemonicToSeed(mnemonic)

		const publicKey = protocol.getPublicKeyFromHexSecret(seed.toString('hex'), protocol.standardDerivationPath)
		const operation = await protocol.prepareOperations(publicKey, data.operationDetails)

		const forgedTx = await protocol.forgeAndWrapOperations(operation)
		console.log(forgedTx)

		let response: OperationResponse | BroadcastBeaconError
		try {
			const hash = await sign(forgedTx.binaryTransaction).then(signedTx => {
				return broadcast(operationRequest.network, signedTx)
			})
			console.log('broadcast: ', hash)
			response = {
				id: data.id,
				senderId: 'Beacon Extension',
				type: MessageType.OperationResponse,
				transactionHashes: [hash]
			}
		} catch (error) {
			console.log('sending ERROR', error)
			response = {
				id: data.id,
				senderId: 'Beacon Extension',
				type: MessageType.OperationResponse,
				errorType: error
			}
		}

		sendToPage(new Serializer().serialize(response))
		sendResponse()
	},
	[MessageType.SignPayloadRequest]: async (data: any, sendResponse: Function): Promise<void> => {
		console.log('beaconMessageHandler sign-request', data)
		const hash = await sign(data.payload[0])
		console.log('signed: ', hash)
		const response: SignPayloadResponse = {
			id: data.id,
			senderId: 'Beacon Extension',
			type: MessageType.SignPayloadResponse,
			signature: hash
		}

		sendToPage(new Serializer().serialize(response))
		sendResponse()
	},
	[MessageType.BroadcastRequest]: async (data: any, sendResponse: Function): Promise<void> => {
		const broadcastRequest: BroadcastRequest = data
		console.log('beaconMessageHandler broadcast-request', data)
		const hash = await broadcast(broadcastRequest.network, data.signedTransactions[0])
		console.log('broadcast: ', hash)
		const response: BroadcastResponse = {
			id: data.id,
			senderId: 'Beacon Extension',
			type: MessageType.BroadcastResponse,
			transactionHashes: [hash]
		}

		sendToPage(new Serializer().serialize(response))
		sendResponse()
	},
	[MessageType.PermissionRequest]: beaconMessageHandlerNotSupported,
	[MessageType.OperationResponse]: beaconMessageHandlerNotSupported,
	[MessageType.SignPayloadResponse]: beaconMessageHandlerNotSupported,
	[MessageType.BroadcastResponse]: beaconMessageHandlerNotSupported
}

const handleResponse = async (data: any, sendResponse: Function): Promise<void> => {
	console.log('handleResponse', data)
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
	const handler = messageTypeHandler.get(data.type) || ((_data: any, _sendResponse: Function) => { })
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
