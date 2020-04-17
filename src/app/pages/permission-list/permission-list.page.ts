import { AccountInfo } from '@airgap/beacon-sdk'
import { Component } from '@angular/core'
import { ChromeMessagingService } from 'src/app/services/chrome-messaging.service'
import { Action, ExtensionMessageOutputPayload } from 'src/extension/Methods'

@Component({
  selector: 'app-permission-list',
  templateUrl: './permission-list.page.html',
  styleUrls: ['./permission-list.page.scss']
})
export class PermissionListPage {
  public accounts: AccountInfo[] = []

  constructor(private readonly chromeMessagingService: ChromeMessagingService) {
    this.chromeMessagingService
      .sendChromeMessage(Action.ACCOUNTS_GET, undefined)
      .then((accounts: ExtensionMessageOutputPayload<Action.ACCOUNTS_GET>) => {
        if (accounts.data) {
          this.accounts = accounts.data.accounts
        }
      })
      .catch(console.error)
  }

  public async deleteAccount(account: AccountInfo): Promise<void> {
    await this.chromeMessagingService.sendChromeMessage(Action.ACCOUNT_DELETE, { account })
  }
}
