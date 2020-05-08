import { Network, TezosBaseOperation } from '@airgap/beacon-sdk'
import { TezosProtocol } from 'airgap-coin-lib'
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
    operations: TezosBaseOperation[],
    network: Network,
    publicKey: string
  ): Promise<TezosWrappedOperation> {
    const protocol: TezosProtocol = await getProtocolForNetwork(network)

    return protocol.prepareOperations(publicKey, operations)
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
}

export class LedgerSigner implements Signer {
  public async sign(forgedTx: string): Promise<string> {
    logger.log('WILL SIGN', forgedTx)
    const signature: string = await bridge.signOperation(forgedTx)
    logger.log('SIGNATURE', signature)

    return signature
  }
}
