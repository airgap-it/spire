import { getAddressFromPublicKey } from '@airgap/beacon-sdk/dist/utils/crypto'

import { Action } from '../Actions'
import { BeaconLedgerBridge } from '../ledger-bridge'
import { Logger } from '../Logger'

import { ActionContext, MessageHandlerFunction } from './ActionMessageHandler'

const bridge: BeaconLedgerBridge = new BeaconLedgerBridge('https://airgap-it.github.io/beacon-ledger-bridge/')

export const ledgerInitAction: (logger: Logger) => MessageHandlerFunction<Action.LEDGER_INIT> = (
  logger: Logger
): MessageHandlerFunction<Action.LEDGER_INIT> => async (context: ActionContext<Action.LEDGER_INIT>): Promise<void> => {
  logger.log('ledgerInitAction')

  let publicKey: string | undefined
  try {
    publicKey = (await bridge.getAddress()).substr(2)
  } catch (error) {
    context.sendResponse({ error })

    return
  }

  const address: string = await getAddressFromPublicKey(publicKey)
  context.sendResponse({ data: { pubkey: publicKey, address } })
}
