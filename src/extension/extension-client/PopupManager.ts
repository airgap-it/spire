/// <reference types="chrome"/>

import { ExtensionMessage } from '@airgap/beacon-sdk/dist/types/ExtensionMessage'

import { Logger } from './Logger'

const logger: Logger = new Logger('PopupManager')

enum PopupState {
  CLOSED = 'CLOSED', // Popup is closed
  STARTING = 'STARTING', // Popup was triggered to start, but callback was not invoked yet, which means we don't have an ID for the window yet
  READY = 'READY' // The webapp has fully loaded and is ready to receive commands
}

export class PopupManager {
  /**
   * This is defined as soon as the popup is started, but it doesn't mean that the website has finished loading
   */
  private popupId: number | undefined

  private popupState: PopupState = PopupState.CLOSED

  private showLoaderOnStartup: boolean = false

  private readonly queue: unknown[] = []

  constructor() {
    chrome.runtime.onMessage.addListener((_message: unknown, sender: chrome.runtime.MessageSender) => {
      if (sender.url === chrome.extension.getURL('index.html')) {
        if (this.popupState !== PopupState.STARTING) {
          return
        }

        if (this.queue.length === 0 && this.showLoaderOnStartup) {
          chrome.runtime.sendMessage({ data: { type: 'preparing' } })
        }
        this.showLoaderOnStartup = false

        setTimeout(async () => {
          if (this.popupState === PopupState.STARTING) {
            this.popupState = PopupState.READY

            await this.processQueue()
          }
        }, 200)
      }
    })

    chrome.windows.onRemoved.addListener((removedPopupId: number) => {
      logger.log('constructor', 'popup removed!', removedPopupId)
      this.popupId = undefined
      this.popupState = PopupState.CLOSED
    })
  }

  private async addToQueue(payload: unknown): Promise<void> {
    logger.log('addToQueue', payload)
    this.queue.push(payload)
    await this.processQueue()
  }

  private async processQueue(): Promise<void> {
    logger.log('processQueue')
    if (this.popupState === PopupState.READY) {
      logger.log('processQueue', 'ready')
      while (this.queue.length > 0) {
        const item: unknown = this.queue.shift()
        chrome.runtime.sendMessage({ data: item })
      }
    }
  }

  public async startPopup(showLoader: boolean = true): Promise<void> {
    if (this.popupState !== PopupState.CLOSED) {
      return
    }

    this.popupState = PopupState.STARTING
    this.showLoaderOnStartup = showLoader

    const POPUP_HEIGHT: number = 680
    const POPUP_WIDTH: number = 420

    const cb: (currentPopup: chrome.windows.Window | undefined) => void = (
      currentPopup: chrome.windows.Window | undefined
    ): void => {
      this.popupId = currentPopup ? currentPopup.id : undefined
      logger.log('startPopup', 'popup launched')
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
    }

    await this.addToQueue(message.payload)

    if (this.popupState === PopupState.CLOSED) {
      await this.startPopup(false)
    }
  }
}
