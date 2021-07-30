import {
  BEACON_VERSION,
  BeaconBaseMessage,
  BeaconErrorType,
  BeaconMessage,
  BeaconMessageType,
  getSenderId,
  OperationRequestOutput,
  OperationResponse,
  OperationResponseInput
} from '@airgap/beacon-sdk'
import { TezosWrappedOperation } from '@airgap/coinlib-core/protocols/tezos/types/TezosWrappedOperation'
import { AxiosResponse } from 'axios'
import { LedgerSigner, LocalSigner } from 'src/extension/AirGapSigner'

import { WalletInfo, WalletType } from '../Actions'
import { ExtensionClient } from '../ExtensionClient'
import { Logger } from '../Logger'
import { Signer } from '../Signer'
import { to, To } from '../utils'

import { BeaconMessageHandlerFunction } from './BeaconMessageHandler'

export const operationRequestHandler: (client: ExtensionClient, logger: Logger) => BeaconMessageHandlerFunction = (
  client: ExtensionClient,
  logger: Logger
): BeaconMessageHandlerFunction => {
  return async (
    data: { request: BeaconBaseMessage; extras: unknown },
    sendToPage: (message: BeaconMessage) => void,
    sendResponseToPopup: (error?: unknown) => void
  ): Promise<void> => {
    console.log('HARIBOL operationRequestHandler', data.request)
    const operationRequest: OperationRequestOutput = (data.request as any) as OperationRequestOutput
    logger.log('beaconMessageHandler operation-request', data)

    let responseInput: OperationResponseInput

    const sendError: (error: Error, errorType: BeaconErrorType) => Promise<void> = async (
      error: Error,
      errorType: BeaconErrorType
    ): Promise<void> => {
      logger.log('operationRequestHandler', 'error ', error)
      responseInput = {
        id: operationRequest.id,
        type: BeaconMessageType.OperationResponse,
        errorType,
        errorData: ((error as any) as AxiosResponse).data
      } as any

      const response: OperationResponse = {
        senderId: await getSenderId(await client.beaconId),
        version: BEACON_VERSION,
        ...responseInput
      }
      sendToPage(response)
      sendResponseToPopup({
        error: { name: error.name, message: error.message, stack: error.stack }
      })
    }

    const wallet: WalletInfo | undefined = await client.getWalletByAddress(operationRequest.sourceAddress)
    if (!wallet) {
      await sendError(
        { name: 'Wallet Error', message: `No wallet found for address ${operationRequest.sourceAddress}` },
        BeaconErrorType.NO_PRIVATE_KEY_FOUND_ERROR
      )

      throw new Error('NO WALLET FOUND')
    }

    const forgedTx: To<string> = await to(
      client.operationProvider
        .prepareOperations(operationRequest.operationDetails, operationRequest.network, wallet.publicKey)
        .then((wrappedOperation: TezosWrappedOperation) =>
          client.operationProvider.forgeWrappedOperation(wrappedOperation, operationRequest.network)
        )
    )

    if (forgedTx.err) {
      await sendError(forgedTx.err, BeaconErrorType.PARAMETERS_INVALID_ERROR)
      throw forgedTx.err
    }

    let signedTx: To<string> | undefined
    if (wallet.type === WalletType.LOCAL_MNEMONIC) {
      const localWallet: WalletInfo<WalletType.LOCAL_MNEMONIC> = wallet as WalletInfo<WalletType.LOCAL_MNEMONIC>
      const signer: Signer = new LocalSigner()
      signedTx = await to(signer.sign(forgedTx.res, localWallet.info.mnemonic))
    } else {
      const signer: Signer = new LedgerSigner()
      signedTx = await to(signer.sign(forgedTx.res, wallet.derivationPath))
    }

    if (signedTx.err) {
      await sendError(signedTx.err, BeaconErrorType.PARAMETERS_INVALID_ERROR)
      throw forgedTx.err
    }

    const hash: To<string> = await to(client.operationProvider.broadcast(operationRequest.network, signedTx.res))
    if (hash.err) {
      await sendError(hash.err, BeaconErrorType.TRANSACTION_INVALID_ERROR)
      throw forgedTx.err
    }

    logger.log('broadcast: ', hash.res)

    responseInput = {
      id: operationRequest.id,
      type: BeaconMessageType.OperationResponse,
      transactionHash: hash.res
    }

    const response: OperationResponse = {
      senderId: await getSenderId(await client.beaconId),
      version: BEACON_VERSION,
      ...responseInput
    }

    sendToPage(response)
    sendResponseToPopup()
  }
}
