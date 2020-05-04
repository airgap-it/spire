import { Network, TezosBaseOperation } from '@airgap/beacon-sdk'
import { TezosWrappedOperation } from 'airgap-coin-lib/dist/protocols/tezos/types/TezosWrappedOperation'

export interface OperationProvider {
  prepareOperations(
    operations: TezosBaseOperation[],
    network: Network,
    publicKey: string
  ): Promise<TezosWrappedOperation>
  prepareAndWrapOperations(operations: TezosBaseOperation[], network: Network, publicKey: string): Promise<string>
  broadcast(network: Network, signedTx: string): Promise<string>
}

export interface Signer {
  sign(forgedTx: string, mnemonic?: string): Promise<string>
}
