import { Component } from '@angular/core'
import { AlertController, ModalController } from '@ionic/angular'
import { combineLatest, Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { WalletService } from 'src/app/services/local-wallet.service'
import { WalletInfo } from 'src/extension/extension-client/Actions'

@Component({
  selector: 'app-wallet-select',
  templateUrl: './wallet-select.page.html',
  styleUrls: ['./wallet-select.page.scss']
})
export class WalletSelectPage {
  public activeWallet$: Observable<WalletInfo>
  public wallets$: Observable<WalletInfo[]>

  constructor(
    private readonly modalController: ModalController,
    private readonly walletService: WalletService,
    private readonly alertController: AlertController
  ) {
    this.activeWallet$ = this.walletService.activeWallet$
    this.wallets$ = combineLatest([this.walletService.wallets$, this.walletService.activeWallet$]).pipe(
      map(([wallets, activeWallet]: [WalletInfo[], WalletInfo]) => {
        return wallets.filter((wallet: WalletInfo) => wallet.publicKey !== activeWallet.publicKey)
      })
    )
  }

  public async activateWallet(wallet: WalletInfo): Promise<void> {
    await this.walletService.setActiveWallet(wallet)
    await this.dismiss()
  }

  public async deleteWallet(wallet: WalletInfo): Promise<void> {
    const alert: HTMLIonAlertElement = await this.alertController.create({
      header: 'Delete Wallet?',
      message:
        'Are you sure you want to delete this wallet? You will have to pair it again if you want to use it again.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Yes',
          handler: async (): Promise<void> => {
            await this.walletService.deleteWallet(wallet)
          }
        }
      ]
    })

    await alert.present()
  }

  public async dismiss(closeParent: boolean = false): Promise<void> {
    await this.modalController.dismiss(closeParent)
  }
}
