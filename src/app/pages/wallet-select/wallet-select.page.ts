import { ChangeDetectorRef, Component } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { ChromeMessagingService } from 'src/app/services/chrome-messaging.service'
import { Action, ExtensionMessageOutputPayload, WalletInfo } from 'src/extension/Methods'

@Component({
  selector: 'app-wallet-select',
  templateUrl: './wallet-select.page.html',
  styleUrls: ['./wallet-select.page.scss']
})
export class WalletSelectPage {
  public activeWallet: WalletInfo | undefined
  public wallets: WalletInfo[] = []

  constructor(
    private readonly modalController: ModalController,
    private readonly chromeMessagingService: ChromeMessagingService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.refreshWallets()
  }

  public async refreshWallets(): Promise<void> {
    this.chromeMessagingService
      .sendChromeMessage(Action.WALLETS_GET, undefined)
      .then((accounts: ExtensionMessageOutputPayload<Action.WALLETS_GET>) => {
        if (accounts.data) {
          this.wallets = accounts.data.wallets
          this.cdr.detectChanges()
        }
      })
      .catch(console.error)
    this.chromeMessagingService
      .sendChromeMessage(Action.ACTIVE_WALLET_GET, undefined)
      .then((accounts: ExtensionMessageOutputPayload<Action.ACTIVE_WALLET_GET>) => {
        if (accounts.data) {
          this.activeWallet = accounts.data.wallet
          this.cdr.detectChanges()
        }
      })
      .catch(console.error)
  }

  public async activateWallet(wallet: WalletInfo): Promise<void> {
    await this.chromeMessagingService.sendChromeMessage(Action.ACTIVE_WALLET_SET, { wallet })
    this.refreshWallets()
  }

  public async deleteWallet(wallet: WalletInfo): Promise<void> {
    await this.chromeMessagingService.sendChromeMessage(Action.WALLET_DELETE, { wallet })
    this.refreshWallets()
  }

  public async dismiss(closeParent: boolean = false): Promise<void> {
    await this.modalController.dismiss(closeParent)
  }
}
