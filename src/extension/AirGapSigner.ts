import { Network, TezosOperation } from '@airgap/beacon-sdk'
import { TezosProtocol } from 'airgap-coin-lib'
import * as bs58check from 'airgap-coin-lib/dist/dependencies/src/bs58check-2.1.2'
import { TezosWrappedOperation } from 'airgap-coin-lib/dist/protocols/tezos/types/TezosWrappedOperation'
import { RawTezosTransaction } from 'airgap-coin-lib/dist/serializer/types'
import Axios, { AxiosError, AxiosResponse } from 'axios'

import { BeaconLedgerBridge } from './extension-client/ledger-bridge'
import { Logger } from './extension-client/Logger'
import { OperationProvider, Signer } from './extension-client/Signer'
import { getProtocolForNetwork, getRpcUrlForNetwork } from './extension-client/utils'

const logger: Logger = new Logger('AirGap Signer')

const bridge: BeaconLedgerBridge = new BeaconLedgerBridge('https://airgap-it.github.io/beacon-ledger-bridge/')

// tslint:disable:max-classes-per-file

export class AirGapOperationProvider implements OperationProvider {
  public async prepareOperations(
    operations: Partial<TezosOperation>[],
    network: Network,
    publicKey: string
  ): Promise<TezosWrappedOperation> {
    const protocol: TezosProtocol = await getProtocolForNetwork(network)

    return protocol.prepareOperations(publicKey, operations as any) // TODO: Fix type
  }

  public async forgeWrappedOperation(wrappedOperation: TezosWrappedOperation, network: Network): Promise<string> {
    const protocol: TezosProtocol = await getProtocolForNetwork(network)

    const forgedTx: RawTezosTransaction = await protocol.forgeAndWrapOperations(wrappedOperation)

    return forgedTx.binaryTransaction
  }

  public async broadcast(network: Network, signedTx: string): Promise<string> {
    const { rpcUrl }: { rpcUrl: string; apiUrl: string } = await getRpcUrlForNetwork(network)

    try {
      const { data: injectionResponse }: { data: string } = await Axios.post(
        `${rpcUrl}/injection/operation?chain=main`,
        JSON.stringify(signedTx),
        {
          headers: { 'content-type': 'application/json' }
        }
      )

      // returns hash if successful
      return injectionResponse
    } catch (err) {
      const axiosResponse: AxiosResponse = (err as AxiosError).response as AxiosResponse
      if (axiosResponse.status === 404) {
        throw {
          name: 'Node Unreachable',
          message: 'The node is not reachable, please try again later or make sure the URL is correct.',
          stack: axiosResponse.data
        }
      } else if (axiosResponse.status === 500) {
        throw {
          name: 'Node Error',
          message: 'The operation could not be processed by the node.',
          stack: axiosResponse.data
        }
      } else {
        throw { name: 'Node Error', message: 'Unknown error', stack: axiosResponse.data }
      }
    }
  }
}

export class LocalSigner implements Signer {
  public async sign(forgedTx: string, mnemonic: string): Promise<string> {
    const protocol: TezosProtocol = new TezosProtocol()
    const privatekey: Buffer = await protocol.getPrivateKeyFromMnemonic(mnemonic, protocol.standardDerivationPath)

    return protocol.signWithPrivateKey(privatekey, { binaryTransaction: forgedTx })
  }

  public async signMessage(message: string, mnemonic: string): Promise<string> {
    logger.log('Signing Message:', message)

    const protocol: TezosProtocol = new TezosProtocol()
    const privateKey: Buffer = await protocol.getPrivateKeyFromMnemonic(mnemonic, protocol.standardDerivationPath)

    return protocol.signMessage(message, { privateKey })
  }
}

export class LedgerSigner implements Signer {
  public async sign(forgedTx: string, derivationPath: string): Promise<string> {
    const signature: string = await bridge.signOperation(forgedTx, derivationPath)

    return forgedTx + signature
  }

  public async signMessage(message: string): Promise<string> {
    logger.log('Signing Message:', message)

    const rawSignature: string = await bridge.signHash(Buffer.from(message).toString('hex'))

    const edsigPrefix: Uint8Array = new Uint8Array([9, 245, 205, 134, 18])

    const edSignature: string = bs58check.encode(
      Buffer.concat([Buffer.from(edsigPrefix), Buffer.from(rawSignature, 'hex')])
    )

    return edSignature
  }
}
