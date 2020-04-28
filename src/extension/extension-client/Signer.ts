import { Network } from '@airgap/beacon-sdk'

export interface Signer {
  sign(forgedTx: string): Promise<string>
  broadcast(network: Network, signedTx: string): Promise<string>
}
