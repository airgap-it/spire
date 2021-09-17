import { Network } from '@airgap/beacon-sdk'
import { RawTezosTransaction, TezosProtocol } from '@airgap/coinlib-core'
import { TezosWrappedOperation } from '@airgap/coinlib-core/protocols/tezos/types/TezosWrappedOperation'
import Axios from 'axios'
import { LedgerSigner, LocalSigner } from 'src/extension/AirGapSigner'
import { DryRunSignatures } from 'src/extension/tezos-types'

import { Action, WalletInfo, WalletType } from '../Actions'
import { Logger } from '../Logger'
import { Signer } from '../Signer'
import { getProtocolForNetwork, getRpcUrlForNetwork } from '../utils'

import { ActionContext, ActionHandlerFunction } from './ActionMessageHandler'

export const dryRunAction: (logger: Logger) => ActionHandlerFunction<Action.DRY_RUN> = (
  logger: Logger
): ActionHandlerFunction<Action.DRY_RUN> => async (context: ActionContext<Action.DRY_RUN>): Promise<void> => {
  logger.log('ledgerInitAction')
  const tezosWrappedOperation = context.data.data.tezosWrappedOperation
  const network = context.data.data.network
  const wallet = context.data.data.wallet
  const { rpcUrl }: { rpcUrl: string; apiUrl: string } = await getRpcUrlForNetwork(network)
  const { data: block } = await Axios.get(`${rpcUrl}/chains/main/blocks/head`)
  const forgedTx = await forgeWrappedOperation({ ...tezosWrappedOperation, branch: block.hash }, network)
  let signatures: DryRunSignatures
  if (!wallet) {
    throw new Error('NO WALLET FOUND')
  }

  if (wallet.type === WalletType.LOCAL_MNEMONIC) {
    const localWallet: WalletInfo<WalletType.LOCAL_MNEMONIC> = wallet as WalletInfo<WalletType.LOCAL_MNEMONIC>
    const signer: Signer = new LocalSigner()
    signatures = await signer.generateDryRunSignatures({ binaryTransaction: forgedTx }, localWallet.info.mnemonic)
  } else {
    const signer: Signer = new LedgerSigner()
    signatures = await signer.generateDryRunSignatures({ binaryTransaction: forgedTx }, wallet.derivationPath)
  }

  const body = {
    protocol: block.protocol,
    contents: tezosWrappedOperation.contents,
    branch: block.hash,
    signature: signatures.preapplySignature
  }

  context.sendResponse({ data: { body } })
}

export const forgeWrappedOperation = async (
  wrappedOperation: TezosWrappedOperation,
  network: Network
): Promise<string> => {
  const protocol: TezosProtocol = await getProtocolForNetwork(network)

  const forgedTx: RawTezosTransaction = await protocol.forgeAndWrapOperations(wrappedOperation)

  return forgedTx.binaryTransaction
}
