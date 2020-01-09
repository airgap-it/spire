import {
  BaseMessage,
  BroadcastRequest,
  MessageTypes,
  OperationRequest,
  PermissionRequest,
  PermissionResponse,
  SignPayloadRequest
} from '@airgap/beacon-sdk/dist/client/Messages'
import { Serializer } from '@airgap/beacon-sdk/dist/client/Serializer'
import { ChromeMessageTransport } from '@airgap/beacon-sdk/dist/client/transports/ChromeMessageTransport'
import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { SplashScreen } from '@ionic-native/splash-screen/ngx'
import { StatusBar } from '@ionic-native/status-bar/ngx'
import { AlertController, Platform } from '@ionic/angular'
import { map } from 'rxjs/operators'

import { LocalWalletService } from './services/local-wallet.service'

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
    private readonly localWalletService: LocalWalletService
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
      if (res) {
        console.log('d', res)
        const serializer = new Serializer()

        const deserialized = serializer.deserialize(res) as BaseMessage

        if (isUnknownObject(deserialized) && deserialized.type === MessageTypes.PermissionRequest) {
          this.permissionRequest((deserialized as any) as PermissionRequest)
        }

        if (isUnknownObject(deserialized) && deserialized.type === MessageTypes.SignPayloadRequest) {
          this.signRequest((deserialized as any) as SignPayloadRequest)
        }

        if (isUnknownObject(deserialized) && deserialized.type === MessageTypes.OperationRequest) {
          this.operationRequest((deserialized as any) as OperationRequest)
        }

        if (isUnknownObject(deserialized) && deserialized.type === MessageTypes.BroadcastRequest) {
          this.broadcastRequest((deserialized as any) as BroadcastRequest)
        }
      }
    })
  }

  public async permissionRequest(request: PermissionRequest): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permission request',
      message: 'Do you want to give the dapp permissions to do all the things?',
      inputs: [
        {
          name: 'read_address',
          type: 'checkbox',
          label: 'Read Address',
          value: 'read_address',
          checked: request.scope.indexOf('read_address') >= 0
        },

        {
          name: 'sign',
          type: 'checkbox',
          label: 'Sign',
          value: 'sign',
          checked: request.scope.indexOf('sign') >= 0
        },

        {
          name: 'operation_request',
          type: 'checkbox',
          label: 'Operation request',
          value: 'operation_request',
          checked: request.scope.indexOf('operation_request') >= 0
        },

        {
          name: 'threshold',
          type: 'checkbox',
          label: 'Threshold',
          value: 'threshold',
          checked: request.scope.indexOf('threshold') >= 0
        }
      ],
      buttons: [
        {
          text: 'Ok',
          handler: grantedPermissions => {
            console.log('blah', grantedPermissions)
            if (ChromeMessageTransport.isAvailable()) {
              const transport = new ChromeMessageTransport()
              const response: PermissionResponse = {
                id: request.id,
                type: MessageTypes.PermissionResponse,
                permissions: {
                  pubkey: this.localWalletService.publicKey,
                  networks: ['mainnet'],
                  scopes: grantedPermissions
                }
              }
              const serialized = new Serializer().serialize(response)

              transport.send(serialized)

              setTimeout(() => {
                window.close()
              }, 1000)
            }
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

  public async signRequest(request: SignPayloadRequest): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Sign Request',
      message: 'Do you want to sign: ' + JSON.stringify(request.payload),
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Okay',
          handler: () => {
            console.log('Confirm Okay')
          }
        }
      ]
    })

    await alert.present()
  }

  public async operationRequest(request: OperationRequest): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Operation Request',
      message: 'Do you want to create operation: ' + JSON.stringify(request.operationDetails),
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Okay',
          handler: () => {
            console.log('Confirm Okay')
          }
        }
      ]
    })

    await alert.present()
  }

  public async broadcastRequest(request: BroadcastRequest): Promise<void> {
    console.log(request)
    const alert = await this.alertController.create({
      header: 'Broadcast Request',
      message: 'Do you want to broadcast: ' + JSON.stringify(request.signedTransaction.map(buff => buff)),
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Okay',
          handler: () => {
            console.log('Confirm Okay')
          }
        }
      ]
    })

    await alert.present()
  }
}
