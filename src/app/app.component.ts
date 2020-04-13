import { Serializer } from '@airgap/beacon-sdk/dist/Serializer'
import { BaseMessage } from '@airgap/beacon-sdk/dist/types/Messages'
import { Component } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { Action } from 'src/extension/Methods'

import { BeaconRequestPage } from './pages/beacon-request/beacon-request.page'
import { ChromeMessagingService } from './services/chrome-messaging.service'
import { SettingsService } from './services/settings.service'
import { SigningMethod } from './services/signing-method.service'

export function isUnknownObject(x: unknown): x is { [key in PropertyKey]: unknown } {
  return x !== null && typeof x === 'object'
}

interface MenuItem {
  title: string
  url: string
  icon: string
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  public appPages: MenuItem[] = []

  constructor(
    private readonly modalController: ModalController,
    private readonly settingsService: SettingsService,
    private readonly chromeMessagingService: ChromeMessagingService
  ) {
    this.initializeApp()
  }

  public initializeApp(): void {
    const menu: MenuItem[] = [
      {
        title: 'Overview',
        url: '/home',
        icon: 'layers-outline'
      },
      {
        title: 'Permissions',
        url: '/permission-list',
        icon: 'options-outline'
      },
      {
        title: 'Settings',
        url: '/settings',
        icon: 'settings-outline'
      }
    ]

    this.settingsService.getDevSettingsEnabled().subscribe(enabled => {
      this.appPages = [...menu]

      if (enabled) {
        this.appPages.push({
          title: 'Local Secret',
          url: '/local-mnemonic',
          icon: 'key-outline'
        })
      }
    })

    // TODO: I think this can be deleted
    // const data = this.activatedRoute.queryParamMap.pipe(map(params => params.get('d')))
    // data.subscribe(res => {
    //   if (res) {
    //     console.log('d', res)
    //     const serializer = new Serializer()

    //     const deserialized = serializer.deserialize(res) as BaseMessage

    //     this.beaconRequest(deserialized, SigningMethod.LEDGER)
    //   }
    // })

    chrome.runtime.sendMessage({ data: 'Handshake' })
    this.chromeMessagingService.sendChromeMessage(Action.HANDSHAKE, undefined).catch(console.error)
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
      console.log('GOT DATA FROM BACKGROUND', message.data)
      const serializer = new Serializer()

      const deserialized = serializer.deserialize(message.data) as BaseMessage

      this.beaconRequest(deserialized, SigningMethod.LEDGER)
    })
  }

  public async beaconRequest(request: BaseMessage, signingMethod: SigningMethod): Promise<void> {
    const modal = await this.modalController.create({
      component: BeaconRequestPage,
      componentProps: {
        signingMethod,
        request
      }
    })

    return modal.present()
  }
}
