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

// tslint:disable:max-classes-per-file

export class AirGapSigner implements Signer {
  public async prepareOperations(
    operations: TezosBaseOperation[],
    network: Network,
    publicKey: string
  ): Promise<TezosWrappedOperation> {
    const protocol: TezosProtocol = await getProtocolForNetwork(network)

    return protocol.prepareOperations(publicKey, operations)
  }

  public async prepareAndWrapOperations(
    operations: TezosBaseOperation[],
    network: Network,
    publicKey: string
  ): Promise<string> {
    const protocol: TezosProtocol = await getProtocolForNetwork(network)

    const operation: TezosWrappedOperation = await this.prepareOperations(operations, network, publicKey)
    const forgedTx: RawTezosTransaction = await protocol.forgeAndWrapOperations(operation)

    return forgedTx.binaryTransaction
  }

  public async sign(_forgedTx: string): Promise<string> {
    throw new Error('not implemented')
  }

  public async broadcast(network: Network, signedTx: string): Promise<string> {
    const protocol: TezosProtocol = await getProtocolForNetwork(network)

    return protocol.broadcastTransaction(signedTx)
  }
}

export class LocalSigner extends AirGapSigner {
  constructor(private readonly mnemonic: string) {
    super()
  }

  public async sign(forgedTx: string): Promise<string> {
    const protocol: TezosProtocol = new TezosProtocol()
    const privatekey: Buffer = await protocol.getPrivateKeyFromMnemonic(this.mnemonic, protocol.standardDerivationPath)

    return protocol.signWithPrivateKey(privatekey, { binaryTransaction: forgedTx })
  }
}

export class LedgerSigner extends AirGapSigner {
  public async sign(forgedTx: string): Promise<string> {
    logger.log('WILL SIGN', forgedTx)
    const signature: string = await bridge.signOperation(forgedTx)
    logger.log('SIGNATURE', signature)

    return signature
  }
}
