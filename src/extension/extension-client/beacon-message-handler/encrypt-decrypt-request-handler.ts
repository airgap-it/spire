import {
  BEACON_VERSION,
  BeaconBaseMessage,
  BeaconErrorType,
  BeaconMessage,
  BeaconMessageType,
  getSenderId,
  EncryptPayloadRequestOutput,
  EncryptPayloadResponse,
  EncryptPayloadResponseInput,
  EncryptionType
} from '@airgap/beacon-sdk'
import { LocalSigner } from 'src/extension/AirGapSigner'

import { WalletInfo, WalletType } from '../Actions'
import { ExtensionClient } from '../ExtensionClient'
import { Logger } from '../Logger'
import { to, To } from '../utils'

import { BeaconMessageHandlerFunction } from './BeaconMessageHandler'

export const encryptDecryptRequestHandler: (client: ExtensionClient, logger: Logger) => BeaconMessageHandlerFunction = (
  client: ExtensionClient,
  logger: Logger
): BeaconMessageHandlerFunction => {
  return async (
    data: { request: BeaconBaseMessage; extras: unknown },
    sendToPage: (message: BeaconMessage) => void,
    sendResponseToPopup: (error?: unknown) => void
  ): Promise<void> => {
    const encryptRequest: EncryptPayloadRequestOutput = (data.request as any) as EncryptPayloadRequestOutput
    logger.log('encryptDecryptRequestHandler', data)

    const sendError: (error: Error, errorType: BeaconErrorType) => Promise<void> = async (
      error: Error,
      errorType: BeaconErrorType
    ): Promise<void> => {
      logger.log('error', error)
      const responseInput = {
        id: encryptRequest.id,
        type: BeaconMessageType.EncryptPayloadResponse,
        errorType
      } as any

      const response: EncryptPayloadResponse = {
        beaconId: await getSenderId(await client.beaconId),
        version: BEACON_VERSION,
        ...responseInput
      }
      sendToPage(response)
      sendResponseToPopup({
        error: { name: error.name, message: error.message, stack: error.stack }
      })
    }

    const wallet: WalletInfo | undefined = await client.getWalletByAddress(encryptRequest.sourceAddress)
    if (!wallet) {
      await sendError(
        { name: 'Wallet Error', message: `No wallet found for address ${encryptRequest.sourceAddress}` },
        BeaconErrorType.NO_PRIVATE_KEY_FOUND_ERROR
      )

      throw new Error('NO WALLET FOUND')
    }

    let encrypted: To<string> | undefined
    if (wallet.type === WalletType.LOCAL_MNEMONIC) {
      const localWallet: WalletInfo<WalletType.LOCAL_MNEMONIC> = wallet as WalletInfo<WalletType.LOCAL_MNEMONIC>
      const signer: LocalSigner = new LocalSigner()
      if (encryptRequest.encryptionType === EncryptionType.ENCRYPT_ASYMMETRIC) {
        encrypted = await to(signer.encryptAsync(encryptRequest.payload, localWallet.info.mnemonic))
      } else if (encryptRequest.encryptionType === EncryptionType.DECRYPT_ASYMMETRIC) {
        encrypted = await to(signer.decryptAsync(encryptRequest.payload, localWallet.info.mnemonic))
      } else {
        throw new Error('CANNOT HANDLE SYMMETRIC ENCRYPTION')
      }
    } else {
      throw new Error('CANNOT ENCRYPT/DECRYPT WITH LEDGER')
      // TODO: Is this possible?
      // const signer: Signer = new LedgerSigner()
      // signature = await to(signer.encryptMessage(encryptRequest.payload, wallet.derivationPath))
    }

    if (encrypted.err) {
      await sendError(encrypted.err, BeaconErrorType.PARAMETERS_INVALID_ERROR)
      throw encrypted.err
    }

    logger.log('signed: ', encrypted.res)

    const responseInput: EncryptPayloadResponseInput = {
      id: encryptRequest.id,
      type: BeaconMessageType.EncryptPayloadResponse,
      encryptionType: encryptRequest.encryptionType,
      payload: encrypted.res
    }

    const response: EncryptPayloadResponse = {
      senderId: await getSenderId(await client.beaconId),
      version: BEACON_VERSION,
      ...responseInput
    }

    sendToPage(response)
    sendResponseToPopup()
  }
}
