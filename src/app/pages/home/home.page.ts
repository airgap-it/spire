import { Network } from '@airgap/beacon-sdk/dist/types/Messages'
import { ChangeDetectorRef, Component } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { TezosProtocol } from 'airgap-coin-lib'
import { LocalWalletService } from 'src/app/services/local-wallet.service'
import { SettingsService } from 'src/app/services/settings.service'
import { SigningMethodService } from 'src/app/services/signing-method.service'
import { StorageKey, StorageService } from 'src/app/services/storage.service'

import { PairPage } from '../pair/pair.page'

enum SigningMethods {
  WALLET = 'WALLET',
  LEDGER = 'LEDGER',
  LOCAL_MNEMONIC = 'LOCAL_MNEMONIC'
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage {
  public signingMethods: typeof SigningMethods = SigningMethods
  public currentSigningMethod: string = 'Unpaired'
  public balance: string = ''
  public network: Network | undefined

  constructor(
    public readonly localWalletService: LocalWalletService,
    private readonly signingMethodService: SigningMethodService,
    private readonly modalController: ModalController,
    private readonly storageService: StorageService,
    private readonly settingsService: SettingsService,
    private readonly ref: ChangeDetectorRef
  ) {
    this.settingsService.getNetwork().then(network => (this.network = network))
    this.signingMethodService.signingMethod.asObservable().subscribe(method => {
      if (method === SigningMethods.WALLET) {
        this.currentSigningMethod = 'Wallet'
      } else if (method === SigningMethods.LOCAL_MNEMONIC) {
        this.currentSigningMethod = 'Local Secret'
      } else if (method === SigningMethods.LEDGER) {
        this.currentSigningMethod = 'Ledger'
      } else {
        this.currentSigningMethod = method
      }
    })

    this.checkOnboarding().catch(console.error)

    this.localWalletService.address.subscribe(async address => {
      this.balance = await this.getBalance(address)
      this.ref.detectChanges()
    })
  }

  public async showPairPage(): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: PairPage
    })

    return modal.present()
  }

  public async checkOnboarding(): Promise<void> {
    const hasOnboarded: boolean = await this.storageService.get(StorageKey.HAS_ONBOARDED)

    if (!hasOnboarded) {
      await this.showPairPage()
      await this.storageService.set(StorageKey.HAS_ONBOARDED, true)
    }
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
