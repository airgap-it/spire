import {
  BeaconBaseMessage,
  BeaconMessage,
  BeaconMessageType,
  SignPayloadRequestOutput,
  SignPayloadResponse,
  SignPayloadResponseInput
} from '@airgap/beacon-sdk'
import { BEACON_VERSION } from '@airgap/beacon-sdk/dist/constants'
import { AirGapSigner, LedgerSigner, LocalSigner } from 'src/extension/AirGapSigner'

import { WalletInfo, WalletType } from '../Actions'
import { ExtensionClient } from '../ExtensionClient'
import { Logger } from '../Logger'

import { BeaconMessageHandlerFunction } from './BeaconMessageHandler'

export const signPayloadRequestHandler: (client: ExtensionClient, logger: Logger) => BeaconMessageHandlerFunction = (
  client: ExtensionClient,
  logger: Logger
): BeaconMessageHandlerFunction => {
  return async (
    data: { request: BeaconBaseMessage; extras: unknown },
    sendToPage: (message: BeaconMessage) => void,
    sendResponse: () => void
  ): Promise<void> => {
    const signRequest: SignPayloadRequestOutput = (data.request as any) as SignPayloadRequestOutput
    logger.log('beaconMessageHandler sign-request', data)

    const wallet: WalletInfo<WalletType> | undefined = await client.getWalletByAddress(signRequest.sourceAddress)
    if (!wallet) {
      throw new Error('NO WALLET FOUND') // TODO: Send error to DApp
    }

    let signer: AirGapSigner
    if (wallet.type === WalletType.LOCAL_MNEMONIC) {
      const localWallet: WalletInfo<WalletType.LOCAL_MNEMONIC> = wallet as WalletInfo<WalletType.LOCAL_MNEMONIC>
      signer = new LocalSigner(localWallet.info.mnemonic)
    } else {
      signer = new LedgerSigner()
    }

    const signature: string = await signer.sign(signRequest.payload)
    logger.log('signed: ', signature)

    const responseInput: SignPayloadResponseInput = {
      id: signRequest.id,
      type: BeaconMessageType.SignPayloadResponse,
      signature
    }

    const response: SignPayloadResponse = { beaconId: await client.beaconId, version: BEACON_VERSION, ...responseInput }

    sendToPage(response)
    sendResponse()
  }
}
