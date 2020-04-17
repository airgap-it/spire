import { BeaconBaseMessage, ExtensionMessage, ExtensionMessageTarget, Serializer } from '@airgap/beacon-sdk'
import { Injectable } from '@angular/core'
import { ModalController } from '@ionic/angular'
import {
  Action,
  ActionInputTypesMap,
  ExtensionMessageInputPayload,
  ExtensionMessageOutputPayload,
  WalletType
} from 'src/extension/Methods'

import { BeaconRequestPage } from '../pages/beacon-request/beacon-request.page'

@Injectable({
  providedIn: 'root'
})
export class ChromeMessagingService {
  constructor(private readonly modalController: ModalController) {
    chrome.runtime.sendMessage({ data: 'Handshake' })
    this.sendChromeMessage(Action.HANDSHAKE, undefined).catch(console.error)
    chrome.runtime.onMessage.addListener(async (message, _sender, _sendResponse) => {
      console.log('GOT DATA FROM BACKGROUND', message.data)
      const serializer: Serializer = new Serializer()

      const deserialized: BeaconBaseMessage = (await serializer.deserialize(message.data)) as BeaconBaseMessage

      this.beaconRequest(deserialized, WalletType.LEDGER).catch((beaconRequestError: Error) => {
        console.log('beaconRequestError', beaconRequestError)
      })
    })
  }

  public sendChromeMessage<K extends Action>(
    action: K,
    payload: ActionInputTypesMap[K]
  ): Promise<ExtensionMessageOutputPayload<K>> {
    console.log('SENDING MESSAGE', action, payload)

    return new Promise(resolve => {
      const message: ExtensionMessage<ExtensionMessageInputPayload<K>> = {
        target: ExtensionMessageTarget.BACKGROUND,
        payload: {
          action,
          data: payload
        }
      }
      chrome.runtime.sendMessage(message, (response: ExtensionMessageOutputPayload<K>) => {
        console.log('GETTING RESPONSE', response)
        resolve(response)
      })
    })
  }

  private async beaconRequest(request: BeaconBaseMessage, walletType: WalletType): Promise<void> {
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
