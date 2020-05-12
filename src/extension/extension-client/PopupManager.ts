/// <reference types="chrome"/>

import { ExtensionMessage } from '@airgap/beacon-sdk/dist/types/ExtensionMessage'

import { Logger } from './Logger'

const logger: Logger = new Logger('PopupManager')

export class PopupManager {
  /**
   * This is defined as soon as the popup is started, but it doesn't mean that the website has finished loading
   */
  private popupId: number | undefined
  /**
   * Will be set to true once the page in the popup has loaded
   */
  private popupReady: boolean = false

  private showLoaderOnStartup: boolean = false

  private readonly queue: unknown[] = []

  constructor() {
    chrome.runtime.onMessage.addListener((_message: unknown, sender: chrome.runtime.MessageSender) => {
      if (sender.url === chrome.extension.getURL('index.html')) {
        this.popupReady = true

        if (this.queue.length === 0 && this.showLoaderOnStartup) {
          this.queue.push({ type: 'preparing' })
        }

        this.showLoaderOnStartup = false

        while (this.queue.length > 0) {
          const item: unknown = this.queue.shift()
          chrome.runtime.sendMessage({ data: item })
        }
      }
    })

    chrome.windows.onRemoved.addListener((removedPopupId: number) => {
      logger.log('constructor', 'popup removed!', removedPopupId)
      this.popupId = undefined
      this.popupReady = false
    })
  }

  private async addToQueue(payload: unknown): Promise<void> {
    logger.log('addToQueue', payload)
    this.queue.push(payload)
  }

  public async startPopup(showLoader: boolean = true): Promise<void> {
    this.showLoaderOnStartup = showLoader

    const POPUP_HEIGHT: number = 680
    const POPUP_WIDTH: number = 420

    const cb: (currentPopup: chrome.windows.Window | undefined) => void = (
      currentPopup: chrome.windows.Window | undefined
    ): void => {
      this.popupId = currentPopup ? currentPopup.id : undefined
      logger.log('sendToPopup', 'popup launched')
    }

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

  public async sendToPopup(message: ExtensionMessage<unknown>): Promise<void> {
    if (this.popupId) {
      chrome.windows.update(this.popupId, { focused: true })
      if (this.popupReady) {
        logger.log('sendToPopup', 'popup ready, sending message without adding to queue', message)
        chrome.runtime.sendMessage({ data: message.payload })
      } else {
        await this.addToQueue(message.payload)
      }

      return
    }

    await this.addToQueue(message.payload)
    await this.startPopup(false)
  }
}
