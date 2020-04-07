/// <reference types="chrome"/>

import { ExtensionMessage } from '@airgap/beacon-sdk/dist/types/ExtensionMessage'

import { Logger } from './Logger'

const logger: Logger = new Logger('PopupManager')

export class PopupManager {
  private popupId: number | undefined

  private readonly queue: unknown[] = []

  constructor() {
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
      logger.log('chrome listener', 'got message from popup', message)
      while (this.queue.length > 0) {
        logger.log('chrome listener', 'items in queue', this.queue.length)
        const item: unknown = this.queue.pop()
        chrome.runtime.sendMessage({ data: item })
      }
    })
  }

  public async sendToPopup(message: ExtensionMessage<unknown>): Promise<void> {
    if (this.popupId) {
      chrome.windows.update(this.popupId, { focused: true })
      logger.log('sendToPopup', 'sending message')
      chrome.runtime.sendMessage({ data: message })
      logger.log('sendToPopup', ' message sent')

      return
    }
    const cb: (currentPopup: chrome.windows.Window | undefined) => void = (
      currentPopup: chrome.windows.Window | undefined
    ): void => {
      this.popupId = currentPopup ? currentPopup.id : undefined
      logger.log('sendToPopup', 'popupInfo', currentPopup)
    }

    chrome.windows.onRemoved.addListener((removedPopupId: number) => {
      logger.log('sendToPopup', 'popup removed!', removedPopupId)
      this.popupId = undefined
    })

    const POPUP_HEIGHT: number = 680
    const POPUP_WIDTH: number = 420

    this.queue.push(message.payload)

    chrome.windows.create(
      {
        url: `${chrome.extension.getURL('index.html')}`,
        type: 'popup',
        focused: true,
        height: POPUP_HEIGHT,
        width: POPUP_WIDTH
      },
      cb
    )
  }
}
