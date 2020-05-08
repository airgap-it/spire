import { Action } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, ActionHandlerFunction } from './ActionMessageHandler'

export const p2pInitAction: (logger: Logger) => ActionHandlerFunction<Action.P2P_INIT> = (
  logger: Logger
): ActionHandlerFunction<Action.P2P_INIT> => async (context: ActionContext<Action.P2P_INIT>): Promise<void> => {
  if (!context.p2pClient) {
    return // TODO: Improve
  }
  logger.log('p2pInitAction', 'handshake info', context.p2pClient.getHandshakeInfo())

  context.p2pClient
    .listenForChannelOpening((pubkey: string) => {
      logger.log('handleP2PInit', 'channel opening', pubkey)
      context.setP2pPubkey(pubkey)

      if (!context.p2pClient) {
        return // TODO: Improve
      }
      context.p2pClient
        .listenForEncryptedMessage(pubkey, (message: string) => {
          logger.log('handleP2PInit', 'got message!', message)
          context.sendToPage(message)
        })
        .catch((listenForEncryptedMessageError: Error) => {
          logger.error('handleP2PInit', listenForEncryptedMessageError)
        })
    })
    .then(() => {
      logger.log('handleP2PInit', 'listening for channel open')
    })
    .catch((listenForChannelOpeningError: Error) => {
      logger.error('handleP2PInit', listenForChannelOpeningError)
    })

  context.sendResponse({ data: { qr: context.p2pClient.getHandshakeInfo() } })
}
