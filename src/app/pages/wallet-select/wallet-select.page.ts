import { Component } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { ChromeMessagingService } from 'src/app/services/chrome-messaging.service'
import { Action, ExtensionMessageOutputPayload, WalletInfo } from 'src/extension/Methods'

@Component({
  selector: 'app-wallet-select',
  templateUrl: './wallet-select.page.html',
  styleUrls: ['./wallet-select.page.scss']
})
export class WalletSelectPage {
  public wallets: WalletInfo[] = []

  constructor(
    private readonly modalController: ModalController,
    private readonly chromeMessagingService: ChromeMessagingService
  ) {
    this.chromeMessagingService
      .sendChromeMessage(Action.WALLETS_GET, undefined)
      .then((accounts: ExtensionMessageOutputPayload<Action.WALLETS_GET>) => {
        if (accounts.data) {
          this.wallets = accounts.data.wallets
        }
      })
      .catch(console.error)
  }

  public async activateWallet(wallet: WalletInfo): Promise<void> {
    await this.chromeMessagingService.sendChromeMessage(Action.ACTIVE_WALLET_SET, { wallet })
  }

  public async deleteWallet(wallet: WalletInfo): Promise<void> {
    await this.chromeMessagingService.sendChromeMessage(Action.WALLET_DELETE, { wallet })
  }

  public async dismiss(closeParent: boolean = false): Promise<void> {
    await this.modalController.dismiss(closeParent)
  }
}
