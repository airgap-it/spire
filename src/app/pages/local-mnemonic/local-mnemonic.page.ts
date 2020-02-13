import { Component } from '@angular/core'
import { AlertController } from '@ionic/angular'
import { AirGapMarketWallet } from 'airgap-coin-lib'

import { LocalWalletService } from '../../services/local-wallet.service'

@Component({
  selector: 'beacon-local-mnemonic',
  templateUrl: 'local-mnemonic.page.html',
  styleUrls: ['local-mnemonic.page.scss']
})
export class LocalMnemonicPage {
  public saveButtonDisabled: boolean = true
  public mnemonic: string = ''

  constructor(
    public readonly alertController: AlertController,
    public readonly localWalletService: LocalWalletService
  ) {
    this.localWalletService.mnemonic.subscribe(mnemonic => {
      this.mnemonic = mnemonic
    })
  }

  public async mnemonicFocused(): Promise<void> {
    this.saveButtonDisabled = false
  }

  public async generateMnemonic(): Promise<void> {
    const alert: HTMLIonAlertElement = await this.alertController.create({
      header: 'Overwrite Mnemonic?',
      message:
        'Are you sure you want generate a new mnemonic? The previous version will be lost, make sure you have a backup if you might need it.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Yes',
          handler: async () => {
            this.saveButtonDisabled = true
            await this.localWalletService.generateMnemonic()
          }
        }
      ]
    })

    await alert.present()
  }

  public async saveMnemonic(mnemonic: string): Promise<void> {
    const alert: HTMLIonAlertElement = await this.alertController.create({
      header: 'Overwrite Mnemonic?',
      message:
        'Are you sure you want to edit the mnemonic? The previous version will be lost, make sure you have a backup if you might need it.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Yes',
          handler: async () => {
            this.saveButtonDisabled = true
            await this.localWalletService.saveMnemonic(mnemonic)
          }
        }
      ]
    })

    await alert.present()
  }

  public getBalance(wallet: AirGapMarketWallet | undefined): void {
    if (wallet) {
      return wallet.currentBalance
    }
  }
}
