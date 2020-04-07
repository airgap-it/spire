/// <reference types="chrome"/>

import { ChromeStorage } from '@airgap/beacon-sdk/dist/storage/ChromeStorage'
import { ExtensionMessage, ExtensionMessageTarget } from '@airgap/beacon-sdk/dist/types/ExtensionMessage'
import { WalletCommunicationClient } from '@airgap/beacon-sdk/dist/WalletCommunicationClient'
import { TezosProtocol } from 'airgap-coin-lib'
import * as bip39 from 'bip39'

import { beaconMessageHandler, BeaconMessageHandlerFunction } from './beacon-message-handler'
import { BeaconLedgerBridge } from './ledger-bridge'
import { Logger } from './Logger'
import { MessageHandler } from './message-handler/MessageHandler'
import { ToBackgroundMessageHandler } from './message-handler/ToBackgroundMessageHandler'
import { ToExtensionMessageHandler } from './message-handler/ToExtensionMessageHandler'
import { ToPageMessageHandler } from './message-handler/ToPageMessageHandler'
import { Action, ExtensionMessageOutputPayload, ExtensionMessageInputPayload } from './Methods'
import { PopupManager } from './PopupManager'

// TODO: Refactor this file

const logger: Logger = new Logger('background.ts')

const popupManager: PopupManager = new PopupManager()
const sendToPopup: (message: ExtensionMessage<unknown>) => Promise<void> = (
  message: ExtensionMessage<unknown>
): Promise<void> => {
  return popupManager.sendToPopup(message)
}

const walletClient = new WalletCommunicationClient('test', 'asdf', 1, true)
walletClient.start()

const sendToPage: (data: string) => void = (data: string): void => {
  logger.log('sendToPage', 'background.js: post ', data)
  const message: ExtensionMessage<string> = { target: ExtensionMessageTarget.PAGE, payload: data }
  chrome.tabs.query({}, (tabs: chrome.tabs.Tab[]) => {
    // TODO: Find way to have direct communication with tab
    tabs.forEach(({ id }: chrome.tabs.Tab) => {
      if (id) {
        chrome.tabs.sendMessage(id, message)
      }
    }) // Send message to all tabs
  })
}

const storage: ChromeStorage = new ChromeStorage()

let globalPubkey

const bridge: BeaconLedgerBridge = new BeaconLedgerBridge('https://airgap-it.github.io/beacon-ledger-bridge/')

const handleLedgerInit: MessageHandlerFunction<Action.LEDGER_INIT> = async (
  _data: ExtensionMessageInputPayload<Action.LEDGER_INIT>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.LEDGER_INIT>) => void
): Promise<void> => {
  let publicKey: string | undefined
  try {
    publicKey = await bridge.getAddress()
  } catch (error) {
    sendResponse({ error })

    return
  }

  storage.set('ledger-publicKey' as any, publicKey)
  const protocol: TezosProtocol = new TezosProtocol()
  const address: string = await protocol.getAddressFromPublicKey(publicKey)
  sendResponse({ data: { address } })
}

const handleP2PInit: MessageHandlerFunction<Action.P2P_INIT> = async (
  _data: ExtensionMessageInputPayload<Action.P2P_INIT>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.P2P_INIT>) => void
): Promise<void> => {
  logger.log('handleP2PInit', 'handshake info', walletClient.getHandshakeInfo())

  walletClient
    .listenForChannelOpening((pubkey: string) => {
      logger.log('handleP2PInit', 'channel opening', pubkey)
      globalPubkey = pubkey

      walletClient
        .listenForEncryptedMessage(pubkey, (message: string) => {
          logger.log('handleP2PInit', 'got message!', message)
          sendToPage(message)
        })
        .catch((listenForEncryptedMessageError: Error) => {
          logger.error('handleP2PInit', listenForEncryptedMessageError)
        })
    })
    .then(() => {
      logger.log('handleP2PInit', 'listening for channel open')
    })
    .catch((listenForChannelOpeningError: Error) => {
      logger.error('handleP2PInit', listenForChannelOpeningError)
    })

  sendResponse({ data: { qr: walletClient.getHandshakeInfo() } })
}

const handleResponse: MessageHandlerFunction<Action.RESPONSE> = async (
  data: ExtensionMessageInputPayload<Action.RESPONSE>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.RESPONSE>) => void
): Promise<void> => {
  logger.log('handleResponse', data)
  const handler: BeaconMessageHandlerFunction = beaconMessageHandler[(data.data.request as any).type]
  await handler(data.data.request as any, sendToPage, sendResponse as any)
}

const handleGenerateMnemonic: MessageHandlerFunction<Action.MNEMONIC_GENERATE> = async (
  _data: ExtensionMessageInputPayload<Action.MNEMONIC_GENERATE>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.MNEMONIC_GENERATE>) => void
): Promise<void> => {
  logger.log('handleGenerateMnemonic')
  const generated: string = bip39.generateMnemonic()
  logger.log('mnemonic generated', generated)
  storage.set('mnemonic' as any, generated)
  sendResponse({ data: { mnemonic: generated } })
}

const getMnemonic: MessageHandlerFunction<Action.MNEMONIC_GET> = async (
  _data: ExtensionMessageInputPayload<Action.MNEMONIC_GET>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.MNEMONIC_GET>) => void
): Promise<void> => {
  logger.log('getMnemonic')
  const mnemonic: string = await storage.get('mnemonic' as any)
  if (mnemonic) {
    logger.log('mnemonic read', mnemonic)
    sendResponse({ data: { mnemonic } })
  } else {
    await handleGenerateMnemonic(_data as any, sendResponse as any)
  }
}

const handleSaveMnemonic: MessageHandlerFunction<Action.MNEMONIC_SAVE> = async (
  data: ExtensionMessageInputPayload<Action.MNEMONIC_SAVE>,
  sendResponse: (message: ExtensionMessageOutputPayload<Action.MNEMONIC_SAVE>) => void
): Promise<void> => {
  logger.log('handleSaveMnemonic')
  await storage.set('mnemonic' as any, data.data.params.mnemonic)
  sendResponse({ data: { result: true } })
}

type MessageHandlerFunction<T extends Action> = (
  data: ExtensionMessageInputPayload<T>,
  sendResponse: (message: ExtensionMessageOutputPayload<T>) => void
) => Promise<void>

const messageTypeHandler: Map<string, MessageHandlerFunction<any>> = new Map<string, MessageHandlerFunction<any>>()
messageTypeHandler.set(Action.LEDGER_INIT, handleLedgerInit)
messageTypeHandler.set(Action.MNEMONIC_GET, getMnemonic)
messageTypeHandler.set(Action.MNEMONIC_SAVE, handleSaveMnemonic)
messageTypeHandler.set(Action.MNEMONIC_GENERATE, handleGenerateMnemonic)
messageTypeHandler.set(Action.P2P_INIT, handleP2PInit)
messageTypeHandler.set(Action.RESPONSE, handleResponse)

const handleMessage: (
  data: ExtensionMessage<ExtensionMessageInputPayload<Action>>,
  sendResponse: (message: unknown) => void
) => Promise<void> = async (
  data: ExtensionMessage<ExtensionMessageInputPayload<Action>>,
  sendResponse: (message: unknown) => void
): Promise<void> => {
  logger.log('handleMessage', data, sendResponse)
  const handler: MessageHandlerFunction<Action> =
    messageTypeHandler.get(data.payload.action) ||
    ((_data: unknown, _sendResponse: (message: ExtensionMessageOutputPayload<Action>) => void): Promise<void> => {
      return Promise.resolve(undefined)
    })
  logger.log('handler', handler)
  await handler(data.payload, sendResponse)
}

const sendToBeacon: (message: string) => Promise<void> = async (message: string): Promise<void> => {
  logger.log('sending message', globalPubkey, message)
  walletClient.sendMessage(globalPubkey, message).catch((beaconSendError: Error) => {
    logger.error('sendToBeacon', beaconSendError)
  })
}

const messageHandlerMap: Map<string, MessageHandler> = new Map<string, MessageHandler>()
messageHandlerMap.set(
  ExtensionMessageTarget.EXTENSION,
  ((): ToExtensionMessageHandler => {
    return new ToExtensionMessageHandler(sendToBeacon, sendToPopup)
  })()
)
messageHandlerMap.set(ExtensionMessageTarget.PAGE, new ToPageMessageHandler(sendToPage))
messageHandlerMap.set(ExtensionMessageTarget.BACKGROUND, new ToBackgroundMessageHandler(handleMessage))

chrome.runtime.onMessage.addListener(
  (
    data: ExtensionMessage<unknown>,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => {
    logger.log('background.js: receive', sender, data)

    const handler: MessageHandler = messageHandlerMap.get(data.target) || new MessageHandler()
    handler.handle(data, sendResponse, !!globalPubkey).catch((handlerError: Error) => {
      logger.log('messageHandlerError', handlerError)
    })

    // return true from the event listener to indicate you wish to send a response asynchronously
    // (this will keep the message channel open to the other end until sendResponse is called).
    return true
  }
)
