import { Network, NetworkType } from '@airgap/beacon-sdk'

import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, ActionHandlerFunction } from './ActionMessageHandler'

export const activeNetworkGetAction: (logger: Logger) => ActionHandlerFunction<Action.ACTIVE_NETWORK_GET> = (
  logger: Logger
): ActionHandlerFunction<Action.ACTIVE_NETWORK_GET> => async (
  context: ActionContext<Action.ACTIVE_NETWORK_GET>
): Promise<void> => {
  logger.log('activeNetworkGetAction')
  const activeNetwork: Network = (await context.storage.get('ACTIVE_NETWORK' as any)) || { type: NetworkType.MAINNET }

  context.sendResponse({ data: { network: activeNetwork } })
}
