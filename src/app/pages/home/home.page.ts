import { Component } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { AirGapMarketWallet } from 'airgap-coin-lib'
import { LocalWalletService } from 'src/app/services/local-wallet.service'
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

  constructor(
    public readonly localWalletService: LocalWalletService,
    private readonly signingMethodService: SigningMethodService,
    private readonly modalController: ModalController,
    private readonly storageService: StorageService
  ) {
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

  public getBalance(wallet: AirGapMarketWallet | undefined): void {
    if (wallet) {
      return wallet.currentBalance
    }
  }
}
