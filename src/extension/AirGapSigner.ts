import { Network } from '@airgap/beacon-sdk'

import { Signer } from './extension-client/Signer'

export class AirGapSigner implements Signer {
  public async sign(_forgedTx: string): Promise<string> {
    return ''
  }
  public async broadcast(_network: Network, _signedTx: string): Promise<string> {
    return ''
  }
}
