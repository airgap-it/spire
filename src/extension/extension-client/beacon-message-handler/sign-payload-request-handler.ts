import {
  BEACON_VERSION,
  BeaconBaseMessage,
  BeaconErrorType,
  BeaconMessage,
  BeaconMessageType,
  SignPayloadRequestOutput,
  SignPayloadResponse,
  SignPayloadResponseInput
} from '@airgap/beacon-sdk'
import { LedgerSigner, LocalSigner } from 'src/extension/AirGapSigner'

import { WalletInfo, WalletType } from '../Actions'
import { ExtensionClient } from '../ExtensionClient'
import { Logger } from '../Logger'
import { Signer } from '../Signer'
import { to, To } from '../utils'

import { BeaconMessageHandlerFunction } from './BeaconMessageHandler'

export const signPayloadRequestHandler: (client: ExtensionClient, logger: Logger) => BeaconMessageHandlerFunction = (
  client: ExtensionClient,
  logger: Logger
): BeaconMessageHandlerFunction => {
  return async (
    data: { request: BeaconBaseMessage; extras: unknown },
    sendToPage: (message: BeaconMessage) => void,
    sendResponseToPopup: (error?: unknown) => void
  ): Promise<void> => {
    const signRequest: SignPayloadRequestOutput = (data.request as any) as SignPayloadRequestOutput
    logger.log('signPayloadRequestHandler', data)

    const sendError: (error: Error, errorType: BeaconErrorType) => Promise<void> = async (
      error: Error,
      errorType: BeaconErrorType
    ): Promise<void> => {
      logger.log('error', error)
      const responseInput = {
        id: signRequest.id,
        type: BeaconMessageType.SignPayloadResponse,
        errorType
      } as any

      const response: SignPayloadResponse = {
        beaconId: await client.beaconId,
        version: BEACON_VERSION,
        ...responseInput
      }
      sendToPage(response)
      sendResponseToPopup({
        error: { name: error.name, message: error.message, stack: error.stack }
      })
    }

    const wallet: WalletInfo | undefined = await client.getWalletByAddress(signRequest.sourceAddress)
    if (!wallet) {
      await sendError(
        { name: 'Wallet Error', message: `No wallet found for address ${signRequest.sourceAddress}` },
        BeaconErrorType.NO_PRIVATE_KEY_FOUND_ERROR
      )

      throw new Error('NO WALLET FOUND')
    }

    let signature: To<string> | undefined
    if (wallet.type === WalletType.LOCAL_MNEMONIC) {
      const localWallet: WalletInfo<WalletType.LOCAL_MNEMONIC> = wallet as WalletInfo<WalletType.LOCAL_MNEMONIC>
      const signer: Signer = new LocalSigner()
      signature = await to(signer.signMessage(signRequest.payload, localWallet.info.mnemonic))
    } else {
      const signer: Signer = new LedgerSigner()
      signature = await to(signer.signMessage(signRequest.payload))
    }

    if (signature.err) {
      await sendError(signature.err, BeaconErrorType.PARAMETERS_INVALID_ERROR)
      throw signature.err
    }

    logger.log('signed: ', signature.res)

    const responseInput: SignPayloadResponseInput = {
      id: signRequest.id,
      type: BeaconMessageType.SignPayloadResponse,
      signature: signature.res
    }

    const response: SignPayloadResponse = { beaconId: await client.beaconId, version: BEACON_VERSION, ...responseInput }

    sendToPage(response)
    sendResponseToPopup()
  }
}
