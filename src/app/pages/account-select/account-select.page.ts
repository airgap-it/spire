import { AccountInfo } from '@airgap/beacon-sdk/dist/clients/Client'
import { Component } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { ChromeMessagingService } from 'src/app/services/chrome-messaging.service'
import { Action, ExtensionMessageOutputPayload } from 'src/extension/Methods'

@Component({
  selector: 'app-account-select',
  templateUrl: './account-select.page.html',
  styleUrls: ['./account-select.page.scss']
})
export class AccountSelectPage {
  public accounts: AccountInfo[] = []

  constructor(
    private readonly modalController: ModalController,
    private readonly chromeMessagingService: ChromeMessagingService
  ) {
    this.chromeMessagingService
      .sendChromeMessage(Action.ACCOUNTS_GET, undefined)
      .then((accounts: ExtensionMessageOutputPayload<Action.ACCOUNTS_GET>) => {
        if (accounts.data) {
          this.accounts = accounts.data.accounts
        }
      })
      .catch(console.error)
  }

  public async dismiss(closeParent: boolean = false): Promise<void> {
    await this.modalController.dismiss(closeParent)
  }
}
