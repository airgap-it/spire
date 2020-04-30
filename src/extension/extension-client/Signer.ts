import { Network, TezosBaseOperation } from '@airgap/beacon-sdk'
import { TezosWrappedOperation } from 'airgap-coin-lib/dist/protocols/tezos/types/TezosWrappedOperation'

export interface Signer {
  prepareOperations(
    operations: TezosBaseOperation[],
    network: Network,
    mnemonic: string
  ): Promise<TezosWrappedOperation>
  prepareAndWrapOperations(operations: TezosBaseOperation[], network: Network, mnemonic: string): Promise<string>
  sign(forgedTx: string, mnemonic: string): Promise<string>
  broadcast(network: Network, signedTx: string): Promise<string>
}
