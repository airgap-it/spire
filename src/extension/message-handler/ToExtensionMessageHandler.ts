import { Serializer } from '@airgap/beacon-sdk/dist/Serializer'
import { ChromeStorage } from '@airgap/beacon-sdk/dist/storage/ChromeStorage'
import { ExtensionMessage } from '@airgap/beacon-sdk/dist/types/ExtensionMessage'
import { BaseMessage, MessageType, OperationRequest } from '@airgap/beacon-sdk/dist/types/Messages'
import { TezosProtocol } from 'airgap-coin-lib'
import * as bip39 from 'bip39'

import { Logger } from '../Logger'
import { getProtocolForNetwork } from '../utils'

import { MessageHandler } from './MessageHandler'

const logger: Logger = new Logger('ToExtensionMessageHandler')

const storage: ChromeStorage = new ChromeStorage()

export class ToExtensionMessageHandler extends MessageHandler {
  constructor(
    private readonly sendToBeacon: (message: string) => void,
    private readonly sendToPopup: (message: ExtensionMessage<unknown>) => Promise<void>
  ) {
    super()
  }

  public async handle(
    data: ExtensionMessage<unknown>,
    sendResponse: (response?: unknown) => void,
    beaconConnected: boolean
  ): Promise<void> {
    logger.log('ToExtensionMessageHandler')
    // TODO: Decide where to send the request to
    // Use a map and check all known addresses
    // We can only do this for the operation and the sign request
    if (beaconConnected) {
      logger.log('beacon', 'sending to wallet')
      this.sendToBeacon(data.payload as string)
    } else {
      logger.log('not beacon', 'sending to popup')
      const deserialized: BaseMessage = new Serializer().deserialize(data.payload as string) as BaseMessage

      if (deserialized.type === MessageType.OperationRequest) {
        // Intercept Operation request and enrich it with information
        ;(async (): Promise<void> => {
          const operationRequest: OperationRequest = deserialized as OperationRequest
          const protocol: TezosProtocol = await getProtocolForNetwork(operationRequest.network)
          const mnemonic: string = await storage.get('mnemonic' as any)
          const seed: Buffer = await bip39.mnemonicToSeed(mnemonic)

          const publicKey: string = protocol.getPublicKeyFromHexSecret(
            seed.toString('hex'),
            protocol.standardDerivationPath
          )
          operationRequest.operationDetails = (
            await protocol.prepareOperations(publicKey, operationRequest.operationDetails)
          ).contents
          const serialized: string = new Serializer().serialize(deserialized)

          return this.sendToPopup({ ...data, payload: serialized })
        })().catch((operationPrepareError: Error) => {
          logger.error('operationPrepareError', operationPrepareError)
        })
      } else {
        return this.sendToPopup(data)
      }
    }
    sendResponse()
  }
}
