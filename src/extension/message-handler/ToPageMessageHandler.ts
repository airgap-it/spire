import { MessageHandler } from './MessageHandler'

export class ToPageMessageHandler extends MessageHandler {
  public handle(
    data: any,
    sendResponse: Function,
    _relay: Function,
    _openPopup: Function,
    sendToPage: Function,
    _handleMessage: Function,
    _beaconConnected: boolean
  ) {
    console.log('ToPageMessageHandler')
    // Events need to be sent to the page
    sendToPage(data)
    sendResponse()
  }
}
