import { Serializer } from '@airgap/beacon-sdk/dist/client/Serializer'
import { BaseMessage } from '@airgap/beacon-sdk/dist/messages/Messages'
import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ModalController } from '@ionic/angular'
import { map } from 'rxjs/operators'

import { BeaconRequestPage } from './pages/beacon-request/beacon-request.page'
import { SettingsService } from './services/settings.service'

export function isUnknownObject(x: unknown): x is { [key in PropertyKey]: unknown } {
  return x !== null && typeof x === 'object'
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  public appPages = [
    {
      title: 'Home',
      url: '/home',
      icon: 'home'
    },
    {
      title: 'Pair',
      url: '/pair',
      icon: 'code-working'
    }

    // {
    //   title: 'Settings',
    //   url: '/settings',
    //   icon: 'settings'
    // }
  ]

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly modalController: ModalController,
    private readonly settingsService: SettingsService
  ) {
    this.initializeApp()
  }

  public initializeApp() {
    const menu = [
      {
        title: 'Home',
        url: '/home',
        icon: 'home'
      }

      // {
      //   title: 'Settings',
      //   url: '/settings',
      //   icon: 'settings'
      // }
    ]

    this.settingsService.getDevSettingsEnabled().subscribe(enabled => {
      this.appPages = [...menu]

      if (enabled) {
        this.appPages.push({
          title: 'Local Mnemonic',
          url: '/local-mnemonic',
          icon: 'list'
        })
      }
    })

    const data = this.activatedRoute.queryParamMap.pipe(map(params => params.get('d')))
    data.subscribe(res => {
      if (res) {
        console.log('d', res)
        const serializer = new Serializer()

        const deserialized = serializer.deserialize(res) as BaseMessage

        this.beaconRequest(deserialized)
      }
    })
  }

  public async beaconRequest(request: BaseMessage): Promise<void> {
    const modal = await this.modalController.create({
      component: BeaconRequestPage,
      componentProps: {
        request
      }
    })

    return modal.present()
  }
}
