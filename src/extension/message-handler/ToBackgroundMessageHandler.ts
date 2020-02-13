import { MessageHandler } from './MessageHandler'

export class ToBackgroundMessageHandler extends MessageHandler {
  public handle(
    data: any,
    sendResponse: Function,
    _relay: Function,
    _openPopup: Function,
    _sendToPage: Function,
    handleMessage: Function,
    _beaconConnected: boolean
  ) {
    console.log('ToBackgroundMessageHandler')
    handleMessage(data, sendResponse)
  }
}
