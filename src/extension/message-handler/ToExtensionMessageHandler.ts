import { BaseMessage, MessageType, OperationRequest } from '@airgap/beacon-sdk/dist/messages/Messages'
import { Serializer } from '@airgap/beacon-sdk/dist/Serializer'
import { ChromeStorage } from '@airgap/beacon-sdk/dist/storage/ChromeStorage'
import { TezosProtocol } from 'airgap-coin-lib'
import * as bip39 from 'bip39'

import { getProtocolForNetwork } from '../utils'

import { MessageHandler } from './MessageHandler'

const storage: ChromeStorage = new ChromeStorage()

export class ToExtensionMessageHandler extends MessageHandler {
  public handle(
    data: any,
    sendResponse: Function,
    relay: Function,
    openPopup: Function,
    _sendToPage: Function,
    _handleMessage: Function,
    beaconConnected: boolean
  ) {
    console.log('ToExtensionMessageHandler')
    // TODO: Decide where to send the request to
    // Use a map and check all known addresses
    // We can only do this for the operation and the sign request
    if (beaconConnected) {
      console.log('sending to wallet')
      relay(data.payload)
    } else {
      console.log('sending to popup')
      const deserialized = new Serializer().deserialize(data.payload) as BaseMessage

      if (deserialized.type === MessageType.OperationRequest) {
        // Intercept Operation request and enrich it with information
        ;(async () => {
          const protocol: TezosProtocol = await getProtocolForNetwork((deserialized as OperationRequest).network as any)
          const mnemonic = await storage.get('mnemonic' as any)
          const seed = await bip39.mnemonicToSeed(mnemonic)

          const publicKey = protocol.getPublicKeyFromHexSecret(seed.toString('hex'), protocol.standardDerivationPath)
          ;(deserialized as any).operationDetails = (
            await protocol.prepareOperations(publicKey, (deserialized as any).operationDetails)
          ).contents
          const serialized = new Serializer().serialize(deserialized)
          openPopup({ ...data, payload: serialized })
        })().catch(console.error)
      } else {
        openPopup(data)
      }
    }
    sendResponse()
  }
}
