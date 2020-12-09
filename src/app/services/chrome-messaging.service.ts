import {
  BeaconMessage,
  ExtensionMessage,
  ExtensionMessageTarget,
  OperationRequest,
  Serializer
} from '@airgap/beacon-sdk'
import { Injectable, NgZone } from '@angular/core'
import { AlertController, LoadingController, ModalController } from '@ionic/angular'
import { ReplaySubject } from 'rxjs'
import {
  Action,
  ActionInputTypesMap,
  ExtensionMessageInputPayload,
  ExtensionMessageOutputPayload,
  WalletInfo,
  WalletType
} from 'src/extension/extension-client/Actions'

import { BeaconRequestPage } from '../pages/beacon-request/beacon-request.page'
import { ErrorPage } from '../pages/error/error.page'
import { PopupService } from './popup.service'

@Injectable({
  providedIn: 'root'
})
export class ChromeMessagingService {
  private updateWalletCallback: (() => Promise<void>) | undefined
  private accountPresent: boolean = false

  private readonly loader: Promise<HTMLIonLoadingElement> = this.loadingController.create({
    message: 'Preparing beacon message...'
  })

  constructor(
    private readonly popupService: PopupService,
    private readonly ngZone: NgZone,
    private readonly loadingController: LoadingController,
    private readonly modalController: ModalController,
    private readonly alertController: AlertController
  ) {
    chrome.runtime.sendMessage({ data: 'Handshake' }) // TODO: Remove and use Action.HANDSHAKE
    this.sendChromeMessage(Action.HANDSHAKE, undefined).catch(console.error)
    chrome.runtime.onMessage.addListener(async (message, _sender, _sendResponse) => {
      console.log('debug', message)
      if (message && message.target === 'toPage') {
        return // Ignore messages that are sent to the website
      }
      this.popupService.cancelClose().catch(console.error)
      if (typeof message.data === 'string') {
        const loader: HTMLIonLoadingElement = await this.loader
        await loader.dismiss()

        const serializer: Serializer = new Serializer()
        const deserialized: BeaconMessage = (await serializer.deserialize(message.data)) as BeaconMessage

        let walletType: WalletType = WalletType.LOCAL_MNEMONIC

        if ((deserialized as OperationRequest).sourceAddress) {
          const result: ExtensionMessageOutputPayload<Action.WALLETS_GET> = await this.sendChromeMessage(
            Action.WALLETS_GET,
            undefined
          )
          if (result.data) {
            const wallet: WalletInfo | undefined = result.data.wallets.find(
              (walletInfo: WalletInfo) => walletInfo.address === (deserialized as OperationRequest).sourceAddress
            )
            if (wallet) {
              walletType = wallet.type
            }
          }
        }

        this.beaconRequest(deserialized, walletType).catch((beaconRequestError: Error) => {
          console.log('beaconRequestError', beaconRequestError)
        })
      } else if (message.data && message.data.type === 'preparing') {
        const loader: HTMLIonLoadingElement = await this.loader
        await loader.present() // present
      } else if (message.data && message.data.beaconEvent) {
        const loader: HTMLIonLoadingElement = await this.loader
        await loader.dismiss()

        await this.modalController.dismiss(true /* close parent */)

        // We need to re-load the wallets because p2p has been set as active in the background
        if (this.updateWalletCallback) {
          await this.updateWalletCallback()
        }

        const alert: HTMLIonAlertElement = await this.alertController.create({
          header: 'Success!',
          message: 'You successfully paired your wallet!.',
          buttons: [
            {
              text: 'Ok'
            }
          ]
        })

        await alert.present()
      } else {
        const loader: HTMLIonLoadingElement = await this.loader
        await loader.dismiss()

        if (message.data && message.data.error) {
          console.log('opening modal with error', message.data.error)
          const modal: HTMLIonModalElement = await this.modalController.create({
            component: ErrorPage,
            componentProps: {
              title: message.data.error.title,
              message: message.data.error.message,
              data: message.data.error.data
            }
          })

          return modal.present()
        }
      }
    })
  }

  public sendChromeMessage<K extends Action>(
    action: K,
    payload: ActionInputTypesMap[K]
  ): Promise<ExtensionMessageOutputPayload<K>> {
    console.log(`SENDING REQUEST[${action}]`, payload)

    return new Promise(resolve => {
      const message: ExtensionMessage<ExtensionMessageInputPayload<K>> = {
        target: ExtensionMessageTarget.BACKGROUND,
        payload: {
          action,
          data: payload
        }
      }
      chrome.runtime.sendMessage(message, (response: ExtensionMessageOutputPayload<K>) => {
        console.log(`GETTING RESPONSE[${action}]`, response)
        this.ngZone.run(() => {
          resolve(response)
        })
      })
    })
  }

  public async registerUpdateWalletCallback(
    wallets: ReplaySubject<WalletInfo[]>,
    callback: () => Promise<void>
  ): Promise<void> {
    this.updateWalletCallback = callback
    wallets.subscribe((walletList: WalletInfo[]) => {
      this.accountPresent = walletList && walletList.length > 0 ? true : false
    })
  }

  private async beaconRequest(request: BeaconMessage, walletType: WalletType): Promise<void> {
    if (!this.accountPresent) {
      await this.showMissingAccountAlert()
    } else {
      const modal: HTMLIonModalElement = await this.modalController.create({
        component: BeaconRequestPage,
        componentProps: {
          walletType,
          request
        }
      })

      return modal.present()
    }
  }

  private async showMissingAccountAlert(buttons: { text: string; handler(): void }[] = []): Promise<void> {
    const alert: HTMLIonAlertElement = await this.alertController.create({
      header: 'No account found!',
      message: 'You first need to pair your wallet with Beacon Extension',
      buttons: [
        ...buttons,
        {
          text: 'Ok'
        }
      ]
    })

    return alert.present()
  }

  public async dismiss(): Promise<void> {
    this.modalController.dismiss().catch(console.error)
  }
}
