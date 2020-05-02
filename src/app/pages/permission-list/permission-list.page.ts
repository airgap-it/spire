import { Component } from '@angular/core'
import { AlertController } from '@ionic/angular'
import { ChromeMessagingService } from 'src/app/services/chrome-messaging.service'
import { Action, ExtensionMessageOutputPayload, PermissionInfo } from 'src/extension/extension-client/Actions'

@Component({
  selector: 'app-permission-list',
  templateUrl: './permission-list.page.html',
  styleUrls: ['./permission-list.page.scss']
})
export class PermissionListPage {
  public permissions: PermissionInfo[] = []

  constructor(
    private readonly chromeMessagingService: ChromeMessagingService,
    private readonly alertController: AlertController
  ) {
    this.loadPermissions().catch(console.error)
  }

  public async loadPermissions() {
    this.chromeMessagingService
      .sendChromeMessage(Action.PERMISSIONS_GET, undefined)
      .then((response: ExtensionMessageOutputPayload<Action.PERMISSIONS_GET>) => {
        if (response.data) {
          this.permissions = response.data.permissions
          console.log('permissions set', response.data.permissions)
        }
      })
      .catch(console.error)
  }

  public async deletePermission(permission: PermissionInfo): Promise<void> {
    const alert: HTMLIonAlertElement = await this.alertController.create({
      header: 'Delete Permission?',
      message:
        'Are you sure you want to delete this permission? The DApp will not be able to perform operations anymore until new permissions are granted.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Yes',
          handler: async (): Promise<void> => {
            await this.chromeMessagingService.sendChromeMessage(Action.PERMISSION_DELETE, { permission })
            await this.loadPermissions()
          }
        }
      ]
    })

    await alert.present()
  }
}
