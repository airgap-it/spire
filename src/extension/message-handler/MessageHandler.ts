export class MessageHandler {
  public handle(
    data: unknown,
    sendResponse: Function,
    _relay: Function,
    _openPopup: Function,
    _sendToPage: Function,
    _handleMessage: Function,
    _beaconConnected: boolean
  ) {
    console.log('unknown data', data)
    sendResponse()
  }
}
