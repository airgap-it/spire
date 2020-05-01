import { BeaconMessage, BeaconMessageType, ExtensionMessage, OperationRequest, Serializer } from '@airgap/beacon-sdk'
import { TezosWrappedOperation } from 'airgap-coin-lib/dist/protocols/tezos/types/TezosWrappedOperation'

import { WalletInfo, WalletType } from '../Actions'
import { ExtensionClient } from '../ExtensionClient'
import { Logger } from '../Logger'

import { MessageHandler } from './MessageHandler'

const logger: Logger = new Logger('ToExtensionMessageHandler')

export class ToExtensionMessageHandler extends MessageHandler {
  constructor(
    private readonly sendToBeacon: (message: string) => void,
    private readonly sendToPopup: (message: ExtensionMessage<unknown>) => Promise<void>,
    private readonly client: ExtensionClient
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
      const deserialized: BeaconMessage = (await new Serializer().deserialize(data.payload as string)) as BeaconMessage

      if (deserialized.type === BeaconMessageType.OperationRequest) {
        // Intercept Operation request and enrich it with information
        ;(async (): Promise<void> => {
          const operationRequest: OperationRequest = deserialized

          const wallet: WalletInfo<WalletType> | undefined = await this.client.getWalletByAddress(
            operationRequest.sourceAddress
          )
          if (!wallet) {
            throw new Error('NO WALLET FOUND') // TODO: Send error to DApp
          }

          const operations: TezosWrappedOperation = await this.client.signer.prepareOperations(
            operationRequest.operationDetails,
            operationRequest.network,
            wallet.pubkey
          )

          operationRequest.operationDetails = operations.contents
          const serialized: string = await new Serializer().serialize(deserialized)

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
