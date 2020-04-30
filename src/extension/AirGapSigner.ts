import { Network, TezosBaseOperation } from '@airgap/beacon-sdk'
import { TezosProtocol } from 'airgap-coin-lib'
import { TezosWrappedOperation } from 'airgap-coin-lib/dist/protocols/tezos/types/TezosWrappedOperation'
import { RawTezosTransaction } from 'airgap-coin-lib/dist/serializer/types'

import { BeaconLedgerBridge } from './extension-client/ledger-bridge'
import { Logger } from './extension-client/Logger'
import { Signer } from './extension-client/Signer'
import { getProtocolForNetwork } from './extension-client/utils'

const logger: Logger = new Logger('AirGap Signer')

const bridge: BeaconLedgerBridge = new BeaconLedgerBridge('https://airgap-it.github.io/beacon-ledger-bridge/')
const useLedger: boolean = false

export class AirGapSigner implements Signer {
  public async prepareOperations(
    operations: TezosBaseOperation[],
    network: Network,
    mnemonic: string
  ): Promise<TezosWrappedOperation> {
    const protocol: TezosProtocol = await getProtocolForNetwork(network)

    const publicKey: string = await protocol.getPublicKeyFromMnemonic(mnemonic, protocol.standardDerivationPath)

    return protocol.prepareOperations(publicKey, operations)
  }

  public async prepareAndWrapOperations(
    operations: TezosBaseOperation[],
    network: Network,
    mnemonic: string
  ): Promise<string> {
    const protocol: TezosProtocol = await getProtocolForNetwork(network)

    const operation: TezosWrappedOperation = await this.prepareOperations(operations, network, mnemonic)
    const forgedTx: RawTezosTransaction = await protocol.forgeAndWrapOperations(operation)

    return forgedTx.binaryTransaction
  }
  public async sign(forgedTx: string, mnemonic: string): Promise<string> {
    const protocol: TezosProtocol = new TezosProtocol()
    if (!useLedger) {
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
