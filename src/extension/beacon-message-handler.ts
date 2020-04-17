import {
  BeaconBaseMessage,
  BeaconErrorMessage,
  BeaconMessageType,
  BroadcastRequest,
  BroadcastResponse,
  ChromeStorage,
  Network,
  OperationRequest,
  OperationResponse,
  Serializer,
  SignPayloadRequest,
  SignPayloadResponse
} from '@airgap/beacon-sdk'
import { TezosProtocol } from 'airgap-coin-lib'
import { TezosWrappedOperation } from 'airgap-coin-lib/dist/protocols/tezos/types/TezosWrappedOperation'
import { RawTezosTransaction } from 'airgap-coin-lib/dist/serializer/types'
import * as bip39 from 'bip39'

import { BeaconLedgerBridge } from './ledger-bridge'
import { Logger } from './Logger'
import { getProtocolForNetwork } from './utils'

const logger: Logger = new Logger('BeaconMessageHandler')
const storage: ChromeStorage = new ChromeStorage()

const bridge: BeaconLedgerBridge = new BeaconLedgerBridge('https://airgap-it.github.io/beacon-ledger-bridge/')
const useLedger: boolean = true

const broadcast: (network: Network, signedTx: string) => Promise<string> = async (
  network: Network,
  signedTx: string
): Promise<string> => {
  const protocol: TezosProtocol = await getProtocolForNetwork(network)

  return protocol.broadcastTransaction(signedTx)
}

const sign: (forgedTx: string) => Promise<string> = async (forgedTx: string): Promise<string> => {
  if (!useLedger) {
    const protocol: TezosProtocol = new TezosProtocol() // TODO: Remove this

    const mnemonic: string = await storage.get('mnemonic' as any)
    const seed: Buffer = await bip39.mnemonicToSeed(mnemonic)
    const privatekey: Buffer = protocol.getPrivateKeyFromHexSecret(
      seed.toString('hex'),
      protocol.standardDerivationPath
    )

    return protocol.signWithPrivateKey(privatekey, { binaryTransaction: forgedTx })
  } else {
    logger.log('WILL SIGN', forgedTx)
    const signature: string = await bridge.signOperation(forgedTx)
    logger.log('SIGNATURE', signature)

    return signature
  }
}

const beaconMessageHandlerNotSupported: (
  data: BeaconBaseMessage,
  sendToPage: (message: string) => void,
  sendResponse: () => void
) => Promise<void> = (): Promise<void> => Promise.resolve()

export type BeaconMessageHandlerFunction = (
  data: BeaconBaseMessage,
  sendToPage: (message: string) => void,
  sendResponse: () => void
) => Promise<void>

export const beaconMessageHandler: { [key in BeaconMessageType]: BeaconMessageHandlerFunction } = {
  [BeaconMessageType.PermissionResponse]: async (
    data: BeaconBaseMessage,
    sendToPage: (message: string) => void,
    sendResponse: Function
  ): Promise<void> => {
    logger.log('beaconMessageHandler permission-response', data)
    sendToPage(await new Serializer().serialize(data))
    sendResponse()
  },
  [BeaconMessageType.OperationRequest]: async (
    data: BeaconBaseMessage,
    sendToPage: (message: string) => void,
    sendResponse: () => void
  ): Promise<void> => {
    const operationRequest: OperationRequest = data as OperationRequest
    logger.log('beaconMessageHandler operation-request', data)
    const protocol: TezosProtocol = await getProtocolForNetwork(operationRequest.network)

    const mnemonic: string = await storage.get('mnemonic' as any)
    const seed: Buffer = await bip39.mnemonicToSeed(mnemonic)

    const publicKey: string = protocol.getPublicKeyFromHexSecret(seed.toString('hex'), protocol.standardDerivationPath)
    const operation: TezosWrappedOperation = await protocol.prepareOperations(
      publicKey,
      operationRequest.operationDetails
    )

    const forgedTx: RawTezosTransaction = await protocol.forgeAndWrapOperations(operation)
    logger.log(JSON.stringify(forgedTx))

    let response: OperationResponse | BeaconErrorMessage
    try {
      const hash: string = await sign(forgedTx.binaryTransaction).then((signedTx: string) => {
        return broadcast(operationRequest.network, signedTx)
      })
      logger.log('broadcast: ', hash)
      response = {
        id: data.id,
        beaconId: 'Beacon Extension',
        type: BeaconMessageType.OperationResponse,
        transactionHash: hash
      }
    } catch (error) {
      logger.log('sending ERROR', error)
      response = {
        id: data.id,
        beaconId: 'Beacon Extension',
        type: BeaconMessageType.OperationResponse,
        errorType: error
      }
    }

    sendToPage(await new Serializer().serialize(response))
    sendResponse()
  },
  [BeaconMessageType.SignPayloadRequest]: async (
    data: BeaconBaseMessage,
    sendToPage: (message: string) => void,
    sendResponse: () => void
  ): Promise<void> => {
    const signRequest: SignPayloadRequest = data as SignPayloadRequest
    logger.log('beaconMessageHandler sign-request', data)
    const signature: string = await sign(signRequest.payload[0])
    logger.log('signed: ', signature)
    const response: SignPayloadResponse = {
      id: data.id,
      beaconId: 'Beacon Extension',
      type: BeaconMessageType.SignPayloadResponse,
      signature
    }

    sendToPage(await new Serializer().serialize(response))
    sendResponse()
  },
  [BeaconMessageType.BroadcastRequest]: async (
    data: BeaconBaseMessage,
    sendToPage: (message: string) => void,
    sendResponse: () => void
  ): Promise<void> => {
    const broadcastRequest: BroadcastRequest = data as BroadcastRequest
    logger.log('beaconMessageHandler broadcast-request', broadcastRequest)
    const hash: string = await broadcast(broadcastRequest.network, broadcastRequest.signedTransaction)
    logger.log('broadcast: ', hash)
    const response: BroadcastResponse = {
      id: data.id,
      beaconId: 'Beacon Extension',
      type: BeaconMessageType.BroadcastResponse,
      transactionHash: hash
    }

    sendToPage(await new Serializer().serialize(response))
    sendResponse()
  },
  [BeaconMessageType.PermissionRequest]: beaconMessageHandlerNotSupported,
  [BeaconMessageType.OperationResponse]: beaconMessageHandlerNotSupported,
  [BeaconMessageType.SignPayloadResponse]: beaconMessageHandlerNotSupported,
  [BeaconMessageType.BroadcastResponse]: beaconMessageHandlerNotSupported
}
