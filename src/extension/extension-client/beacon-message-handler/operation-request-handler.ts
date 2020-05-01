import {
  BeaconBaseMessage,
  BeaconMessage,
  BeaconMessageType,
  OperationRequestOutput,
  OperationResponse,
  OperationResponseInput
} from '@airgap/beacon-sdk'
import { BEACON_VERSION } from '@airgap/beacon-sdk/dist/constants'

import { WalletInfo, WalletType } from '../Actions'
import { ExtensionClient } from '../ExtensionClient'
import { Logger } from '../Logger'

import { BeaconMessageHandlerFunction } from './BeaconMessageHandler'
import { AirGapSigner, LocalSigner, LedgerSigner } from 'src/extension/AirGapSigner'

export const operationRequestHandler: (client: ExtensionClient, logger: Logger) => BeaconMessageHandlerFunction = (
  client: ExtensionClient,
  logger: Logger
): BeaconMessageHandlerFunction => {
  return async (
    data: { request: BeaconBaseMessage; extras: unknown },
    sendToPage: (message: BeaconMessage) => void,
    sendResponse: () => void
  ): Promise<void> => {
    const operationRequest: OperationRequestOutput = (data.request as any) as OperationRequestOutput
    logger.log('beaconMessageHandler operation-request', data)

    const wallet: WalletInfo<WalletType> | undefined = await client.getWalletByAddress(operationRequest.sourceAddress)
    if (!wallet) {
      throw new Error('NO WALLET FOUND') // TODO: Send error to DApp
    }

    const forgedTx: string = await client.signer.prepareAndWrapOperations(
      operationRequest.operationDetails,
      operationRequest.network,
      wallet.pubkey
    )

    let signer: AirGapSigner
    if (wallet.type === WalletType.LOCAL_MNEMONIC) {
      const localWallet: WalletInfo<WalletType.LOCAL_MNEMONIC> = wallet as WalletInfo<WalletType.LOCAL_MNEMONIC>
      signer = new LocalSigner(localWallet.info.mnemonic)
    } else {
      signer = new LedgerSigner()
    }

    logger.log(JSON.stringify(forgedTx))

    let responseInput: OperationResponseInput
    try {
      const hash: string = await signer.sign(forgedTx).then((signedTx: string) => {
        return signer.broadcast(operationRequest.network, signedTx)
      })
      logger.log('broadcast: ', hash)
      responseInput = {
        id: operationRequest.id,
        type: BeaconMessageType.OperationResponse,
        transactionHash: hash
      }
    } catch (error) {
      logger.log('sending ERROR', error)
      responseInput = {
        id: operationRequest.id,
        type: BeaconMessageType.OperationResponse,
        errorType: error
      } as any
    }

    const response: OperationResponse = { beaconId: await client.beaconId, version: BEACON_VERSION, ...responseInput }

    sendToPage(response)
    sendResponse()
  }
}
