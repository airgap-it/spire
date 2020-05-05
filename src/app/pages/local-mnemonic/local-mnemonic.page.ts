import { ChangeDetectorRef, Component } from '@angular/core'
import { AlertController } from '@ionic/angular'
import * as bip39 from 'bip39'
import { WalletInfo, WalletType } from 'src/extension/extension-client/Actions'

import { WalletService } from '../../services/local-wallet.service'

@Component({
  selector: 'beacon-local-mnemonic',
  templateUrl: 'local-mnemonic.page.html',
  styleUrls: ['local-mnemonic.page.scss']
})
export class LocalMnemonicPage {
  public saveButtonDisabled: boolean = true
  public mnemonic: string = ''
  public publicKey: string = ''
  public address: string = ''

  constructor(
    public readonly alertController: AlertController,
    public readonly walletService: WalletService,
    private readonly ref: ChangeDetectorRef
  ) {
    this.walletService.wallets$.subscribe(async (wallets: WalletInfo[]) => {
      const localWallet: WalletInfo<WalletType.LOCAL_MNEMONIC> | undefined = wallets.find(
        (wallet: WalletInfo) => wallet.type === WalletType.LOCAL_MNEMONIC
      ) as WalletInfo<WalletType.LOCAL_MNEMONIC>
      if (localWallet) {
        this.mnemonic = localWallet.info.mnemonic
        this.publicKey = localWallet.pubkey
        this.address = localWallet.address
        this.ref.detectChanges()
      } else {
        await this.generateAndSaveMnemonic()
      }
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
          handler: async (): Promise<void> => {
            this.saveButtonDisabled = true
            await this.generateAndSaveMnemonic()
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
          handler: async (): Promise<void> => {
            this.saveButtonDisabled = true
            await this.walletService.saveMnemonic(mnemonic)
          }
        }
      ]
    })

    await alert.present()
  }

  private async generateAndSaveMnemonic(): Promise<void> {
    const mnemonic: string = bip39.generateMnemonic()
    await this.walletService.saveMnemonic(mnemonic)
  }
}
