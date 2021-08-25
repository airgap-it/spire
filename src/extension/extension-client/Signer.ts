import { Network, TezosOperation } from '@airgap/beacon-sdk'
import { RawTezosTransaction } from '@airgap/coinlib-core'
import { TezosWrappedOperation } from '@airgap/coinlib-core/protocols/tezos/types/TezosWrappedOperation'
import { DryRunSignatures } from '../tezos-types'

export interface OperationProvider {
  prepareOperations(
    operations: Partial<TezosOperation>[],
    network: Network,
    publicKey: string
  ): Promise<TezosWrappedOperation>
  forgeWrappedOperation(wrappedOperation: TezosWrappedOperation, network: Network): Promise<string>
  broadcast(network: Network, signedTx: string): Promise<string>
}

export interface Signer {
  sign(forgedTx: string, mnemonic?: string): Promise<string>
  generateDryRunSignatures(transaction: RawTezosTransaction, mnemonic?: string): Promise<DryRunSignatures>
  signMessage(message: string, mnemonic?: string): Promise<string>
}
