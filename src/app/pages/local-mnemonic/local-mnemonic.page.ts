import { Network } from '@airgap/beacon-sdk'
import { ChangeDetectorRef, Component } from '@angular/core'
import { AlertController } from '@ionic/angular'
import { TezosProtocol } from 'airgap-coin-lib'
import { SettingsService } from 'src/app/services/settings.service'

import { LocalWalletService } from '../../services/local-wallet.service'

@Component({
  selector: 'beacon-local-mnemonic',
  templateUrl: 'local-mnemonic.page.html',
  styleUrls: ['local-mnemonic.page.scss']
})
export class LocalMnemonicPage {
  public saveButtonDisabled: boolean = true
  public mnemonic: string = ''
  public balance: string = ''

  constructor(
    public readonly alertController: AlertController,
    public readonly localWalletService: LocalWalletService,
    private readonly settingsService: SettingsService,
    private readonly ref: ChangeDetectorRef
  ) {
    this.localWalletService.mnemonic.subscribe(mnemonic => {
      this.mnemonic = mnemonic
    })
    this.localWalletService.address.subscribe(async address => {
      this.balance = await this.getBalance(address)
      this.ref.detectChanges()
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

  public async getBalance(address: string | null): Promise<string> {
    console.log('getBalance', address)
    if (!address) {
      return ''
    }
    const network: Network | undefined = await this.settingsService.getNetwork()

    if (network) {
      const protocol: TezosProtocol = await this.settingsService.getProtocolForNetwork(network)

      const amount = await protocol.getBalanceOfAddresses([address])
      console.log('getBalance', amount)

      return amount
    } else {
      return ''
    }
  }
}
