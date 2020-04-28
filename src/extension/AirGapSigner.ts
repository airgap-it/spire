import { Network } from '@airgap/beacon-sdk'
import { TezosProtocol } from 'airgap-coin-lib'

import { BeaconLedgerBridge } from './extension-client/ledger-bridge'
import { Logger } from './extension-client/Logger'
import { Signer } from './extension-client/Signer'
import { getProtocolForNetwork } from './extension-client/utils'

const logger: Logger = new Logger('AirGap Signer')

const bridge: BeaconLedgerBridge = new BeaconLedgerBridge('https://airgap-it.github.io/beacon-ledger-bridge/')
const useLedger: boolean = true

export class AirGapSigner implements Signer {
  public async sign(forgedTx: string, mnemonic: string): Promise<string> {
    if (!useLedger) {
      const protocol: TezosProtocol = new TezosProtocol() // TODO: Remove this

      const privatekey: Buffer = await protocol.getPrivateKeyFromMnemonic(mnemonic, protocol.standardDerivationPath)

      return protocol.signWithPrivateKey(privatekey, { binaryTransaction: forgedTx })
    } else {
      logger.log('WILL SIGN', forgedTx)
      const signature: string = await bridge.signOperation(forgedTx)
      logger.log('SIGNATURE', signature)

      return signature
    }
  }
  public async broadcast(network: Network, signedTx: string): Promise<string> {
    const protocol: TezosProtocol = await getProtocolForNetwork(network)

    return protocol.broadcastTransaction(signedTx)
  }
}
