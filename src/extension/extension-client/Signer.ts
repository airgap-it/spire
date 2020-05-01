import { Network, TezosBaseOperation } from '@airgap/beacon-sdk'
import { TezosWrappedOperation } from 'airgap-coin-lib/dist/protocols/tezos/types/TezosWrappedOperation'

export interface Signer {
  prepareOperations(
    operations: TezosBaseOperation[],
    network: Network,
    publicKey: string
  ): Promise<TezosWrappedOperation>
  prepareAndWrapOperations(operations: TezosBaseOperation[], network: Network, publicKey: string): Promise<string>
  sign(forgedTx: string): Promise<string>
  broadcast(network: Network, signedTx: string): Promise<string>
}
