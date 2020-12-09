import { getAddressFromPublicKey } from '@airgap/beacon-sdk'

import { Action } from '../Actions'
import { BeaconLedgerBridge } from '../ledger-bridge'
import { Logger } from '../Logger'

import { ActionContext, ActionHandlerFunction } from './ActionMessageHandler'

const bridge: BeaconLedgerBridge = new BeaconLedgerBridge('https://airgap-it.github.io/beacon-ledger-bridge/')

export const ledgerInitAction: (logger: Logger) => ActionHandlerFunction<Action.LEDGER_INIT> = (
  logger: Logger
): ActionHandlerFunction<Action.LEDGER_INIT> => async (context: ActionContext<Action.LEDGER_INIT>): Promise<void> => {
  logger.log('ledgerInitAction')

  let publicKey: string | undefined
  try {
    const derivationPath = await context.storage.get('DERIVATION_PATH' as any)
    publicKey = (await bridge.getAddress(derivationPath)).substr(2)
  } catch (error) {
    context.sendResponse({ error })
    return
  }

  const address: string = await getAddressFromPublicKey(publicKey)
  context.sendResponse({ data: { publicKey, address } })
}
