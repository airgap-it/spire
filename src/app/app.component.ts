import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { SplashScreen } from '@ionic-native/splash-screen/ngx'
import { StatusBar } from '@ionic-native/status-bar/ngx'
import { AlertController, Platform } from '@ionic/angular'
import { map } from 'rxjs/operators'
import { MessageTypes } from '@airgap/beacon-sdk/dist/client/Messages'

import { CryptoService } from './services/crypto.service'

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
    private readonly alertController: AlertController,
    private readonly cryptoService: CryptoService
  ) {
    this.initializeApp()
  }

  initializeApp() {
    if (this.platform.is('cordova')) {
      this.platform.ready().then(() => {
        this.statusBar.styleDefault()
        this.splashScreen.hide()
      })
    }

    const data = this.activatedRoute.queryParamMap.pipe(map(params => params.get('d')))
    data.subscribe(res => {
      console.log(res)
      if (res === MessageTypes.PermissionRequest) {
        this.permissionRequest()
      }
    })
  }

  public async permissionRequest(/*request: PermissionRequest*/) {
    const alert = await this.alertController.create({
      header: 'Permission request',
      message: 'Do you want to give the dapp permissions to do all the things?',
      inputs: [
        {
          name: 'read_address',
          type: 'checkbox',
          label: 'Read Address',
          value: 'read_address',
          checked: true
        },

        {
          name: 'sign',
          type: 'checkbox',
          label: 'Sign',
          value: 'sign',
          checked: true
        },

        {
          name: 'payment_request',
          type: 'checkbox',
          label: 'Payment request',
          value: 'payment_request',
          checked: true
        },

        {
          name: 'threshold',
          type: 'checkbox',
          label: 'Threshold',
          value: 'threshold',
          checked: true
        }
      ],
      buttons: [
        {
          text: 'Ok',
          handler: grantedPermissions => {
            console.log('blah', grantedPermissions)
            chrome.runtime.sendMessage({
              address: this.cryptoService.address,
              networks: ['mainnet'],
              permissions: grantedPermissions
            })
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    })

    await alert.present()
  }
}
