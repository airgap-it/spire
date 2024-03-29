import { Network, TezosOperation } from '@airgap/beacon-sdk'
import { TezosCryptoClient, TezosProtocol } from '@airgap/coinlib-core'
import * as bs58check from '@airgap/coinlib-core/dependencies/src/bs58check-2.1.2'
import { TezosWrappedOperation } from '@airgap/coinlib-core/protocols/tezos/types/TezosWrappedOperation'
import { RawTezosTransaction } from '@airgap/coinlib-core/serializer/types'
import Axios, { AxiosError, AxiosResponse } from 'axios'

import { bridge } from './extension-client/ledger-bridge'
import { Logger } from './extension-client/Logger'
import { OperationProvider, Signer } from './extension-client/Signer'
import { getProtocolForNetwork, getRpcUrlForNetwork } from './extension-client/utils'
import { DryRunSignatures, PreapplyResponse } from './tezos-types'

const logger: Logger = new Logger('AirGap Signer')

// tslint:disable:max-classes-per-file

export class AirGapOperationProvider implements OperationProvider {
  public async prepareOperations(
    operations: Partial<TezosOperation>[],
    network: Network,
    publicKey: string
  ): Promise<TezosWrappedOperation> {
    const protocol: TezosProtocol = await getProtocolForNetwork(network)

    return protocol.prepareOperations(publicKey, operations as any, false) // don't override parameters // TODO: Fix type
  }

  public async forgeWrappedOperation(wrappedOperation: TezosWrappedOperation, network: Network): Promise<string> {
    const protocol: TezosProtocol = await getProtocolForNetwork(network)

    const forgedTx: RawTezosTransaction = await protocol.forgeAndWrapOperations(wrappedOperation)

    return forgedTx.binaryTransaction
  }

  public async completeWrappedOperation(
    tezosWrappedOperation: TezosWrappedOperation,
    network: Network
  ): Promise<TezosWrappedOperation> {
    const { rpcUrl }: { rpcUrl: string; apiUrl: string } = await getRpcUrlForNetwork(network)
    const { data: branch } = await Axios.get(`${rpcUrl}/chains/main/blocks/head/hash`)
    return { ...tezosWrappedOperation, branch: branch }
  }

  public async performDryRun(body: any, network: Network): Promise<PreapplyResponse[]> {
    return this.send(network, [body], '/chains/main/blocks/head/helpers/preapply/operations')
  }

  public async broadcast(network: Network, signedTx: string): Promise<string> {
    return this.send(network, signedTx, '/injection/operation?chain=main')
  }

  private async send(network: Network, payload: any, endpoint: string): Promise<any> {
    const { rpcUrl }: { rpcUrl: string; apiUrl: string } = await getRpcUrlForNetwork(network)

    try {
      const { data: response }: { data: string } = await Axios.post(`${rpcUrl}${endpoint}`, JSON.stringify(payload), {
        headers: { 'content-type': 'application/json' }
      })
      return response
    } catch (err) {
      throw this.handleAxiosError(err)
    }
  }

  private handleAxiosError(err: AxiosError) {
    const axiosResponse: AxiosResponse | undefined = err.response
    if (axiosResponse && axiosResponse.status === 404) {
      throw {
        name: 'Node Unreachable',
        message: 'The node is not reachable, please try again later or make sure the URL is correct.',
        stack: axiosResponse.data
      }
    } else if (axiosResponse && axiosResponse.status === 500) {
      throw {
        name: 'Node Error',
        message: 'The operation could not be processed by the node.',
        stack: axiosResponse.data
      }
    } else if (axiosResponse && axiosResponse.status) {
      throw { name: 'Node Error', message: 'Unknown error', stack: axiosResponse.data }
    } else {
      throw { name: 'Node Error', message: 'Unknown error' }
    }
  }
}

export class LocalSigner implements Signer {
  protocol: TezosProtocol = new TezosProtocol()

  public async sign(forgedTx: string, mnemonic: string): Promise<string> {
    const privatekey: Buffer = await this.protocol.getPrivateKeyFromMnemonic(
      mnemonic,
      this.protocol.standardDerivationPath
    )
    return this.protocol.signWithPrivateKey(privatekey, { binaryTransaction: forgedTx })
  }

  public async signMessage(message: string, mnemonic: string): Promise<string> {
    logger.log('Signing Message:', message)

    const privateKey: Buffer = await this.protocol.getPrivateKeyFromMnemonic(
      mnemonic,
      this.protocol.standardDerivationPath
    )

    return this.protocol.signMessage(message, { privateKey })
  }

  public async generateDryRunSignatures(transaction: RawTezosTransaction, mnemonic: string): Promise<DryRunSignatures> {
    const privateKey: Buffer = await this.protocol.getPrivateKeyFromMnemonic(
      mnemonic,
      this.protocol.standardDerivationPath
    )

    const signedTransaction = await this.sign(transaction.binaryTransaction, mnemonic)
    const tezosCryptoClient = new TezosCryptoClient()

    const opSignature: Buffer = await tezosCryptoClient.operationSignature(privateKey, transaction)

    const edsigPrefix: Uint8Array = new Uint8Array([9, 245, 205, 134, 18])

    return {
      preapplySignature: bs58check.encode(Buffer.concat([Buffer.from(edsigPrefix), Buffer.from(opSignature)])),
      signedTransaction
    }
  }
}

export class LedgerSigner implements Signer {
  public async sign(forgedTx: string, derivationPath: string): Promise<string> {
    const signature: string = await bridge.signOperation(forgedTx, derivationPath)

    return forgedTx + signature
  }

  public async generateDryRunSignatures(
    transaction: RawTezosTransaction,
    derivationPath: string
  ): Promise<DryRunSignatures> {
    const txSignature: string = await bridge.signOperation(transaction.binaryTransaction, derivationPath)
    const edsigPrefix: Uint8Array = new Uint8Array([9, 245, 205, 134, 18])
    return {
      preapplySignature: bs58check.encode(Buffer.concat([Buffer.from(edsigPrefix), Buffer.from(txSignature, 'hex')])),
      signedTransaction: `${transaction.binaryTransaction}${txSignature}`
    }
  }

  public async signMessage(message: string): Promise<string> {
    logger.log('Signing Message:', message)

    const tezosCryptoClient = new TezosCryptoClient()

    const bufferMessage: Buffer = await tezosCryptoClient.toBuffer(message)
    const hash: Uint8Array = await tezosCryptoClient.hash(bufferMessage)

    const rawSignature: string = await bridge.signHash(Buffer.from(hash).toString('hex'))

    const edsigPrefix: Uint8Array = tezosCryptoClient.edsigPrefix

    const edSignature: string = bs58check.encode(
      Buffer.concat([Buffer.from(edsigPrefix), Buffer.from(rawSignature, 'hex')])
    )

    return edSignature
  }
}
