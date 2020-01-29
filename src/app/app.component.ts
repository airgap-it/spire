import { Serializer } from '@airgap/beacon-sdk/dist/client/Serializer'
import { BaseMessage } from '@airgap/beacon-sdk/dist/messages/Messages'
import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { SplashScreen } from '@ionic-native/splash-screen/ngx'
import { StatusBar } from '@ionic-native/status-bar/ngx'
import { ModalController, Platform } from '@ionic/angular'
import { map } from 'rxjs/operators'

import { BeaconRequestPage } from './pages/beacon-request/beacon-request.page'

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
      title: 'Pair',
      url: '/pair',
      icon: 'code-working'
    },
    {
      title: 'Local Mnemonic',
      url: '/local-mnemonic',
      icon: 'list'
    },
    {
      title: 'Settings',
      url: '/settings',
      icon: 'settings'
    }
  ]

  constructor(
    private readonly platform: Platform,
    private readonly splashScreen: SplashScreen,
    private readonly statusBar: StatusBar,
    private readonly activatedRoute: ActivatedRoute,
    private readonly modalController: ModalController
  ) {
    this.initializeApp()
  }

  public initializeApp() {
    if (this.platform.is('cordova')) {
      this.platform.ready().then(() => {
        this.statusBar.styleDefault()
        this.splashScreen.hide()
      })
    }

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
