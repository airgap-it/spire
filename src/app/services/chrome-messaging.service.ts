import {
  BeaconMessage,
  ExtensionMessage,
  ExtensionMessageTarget,
  OperationRequest,
  Serializer
} from '@airgap/beacon-sdk'
import { Injectable, NgZone } from '@angular/core'
import { ModalController } from '@ionic/angular'
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

@Injectable({
  providedIn: 'root'
})
export class ChromeMessagingService {
  constructor(private readonly ngZone: NgZone, private readonly modalController: ModalController) {
    chrome.runtime.sendMessage({ data: 'Handshake' })
    this.sendChromeMessage(Action.HANDSHAKE, undefined).catch(console.error)
    chrome.runtime.onMessage.addListener(async (message, _sender, _sendResponse) => {
      console.log('GOT DATA FROM BACKGROUND', message)
      if (typeof message.data === 'string') {
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
      } else {
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

  private async beaconRequest(request: BeaconMessage, walletType: WalletType): Promise<void> {
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
