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
    .listenForChannelOpening((publicKey: string) => {
      logger.log('handleP2PInit', 'channel opening', publicKey)
      context.setP2pPubkey(publicKey)

      if (!context.p2pClient) {
        return // TODO: Improve
      }
      context.p2pClient
        .listenForEncryptedMessage(publicKey, async (message: string) => {
          logger.log('handleP2PInit', 'got message!', message)
          await context.client.sendToPage(message)
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

  context.sendResponse({ data: { qr: await context.p2pClient.getHandshakeInfo() } })
}
