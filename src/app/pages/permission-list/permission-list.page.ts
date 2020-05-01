import { Component } from '@angular/core'
import { ChromeMessagingService } from 'src/app/services/chrome-messaging.service'
import { Action, ExtensionMessageOutputPayload, PermissionInfo } from 'src/extension/extension-client/Actions'

@Component({
  selector: 'app-permission-list',
  templateUrl: './permission-list.page.html',
  styleUrls: ['./permission-list.page.scss']
})
export class PermissionListPage {
  public permissions: PermissionInfo[] = []

  constructor(private readonly chromeMessagingService: ChromeMessagingService) {
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
    await this.chromeMessagingService.sendChromeMessage(Action.PERMISSION_DELETE, { permission })
    await this.loadPermissions()
  }
}
