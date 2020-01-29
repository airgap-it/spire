import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { ModalController } from '@ionic/angular'
import { Observable } from 'rxjs'
import { SigningMethod, SigningMethodService } from 'src/app/services/signing-method.service'

import { AddWalletConnectionPage } from '../add-wallet-connection/add-wallet-connection.page'

@Component({
  selector: 'beacon-pair',
  templateUrl: 'pair.page.html',
  styleUrls: ['pair.page.scss']
})
export class PairPage {
  public currentSigningMethod: Observable<string | undefined>
  public developerModeEnabled: boolean = false

  constructor(
    private readonly modalController: ModalController,
    private readonly router: Router,
    private readonly signingMethodService: SigningMethodService
  ) {
    this.currentSigningMethod = this.signingMethodService.signingMethod.asObservable()
  }

  public async pairWallet() {
    const modal = await this.modalController.create({
      component: AddWalletConnectionPage
    })
    this.signingMethodService.setSigningMethod(SigningMethod.WALLET)

    return modal.present()
  }

  public async pairHardwareWallet() {
    this.signingMethodService.setSigningMethod(SigningMethod.LEDGER)
  }

  public async pairLocalMnemonic() {
    this.router.navigate(['local-mnemonic'])
    this.signingMethodService.setSigningMethod(SigningMethod.LOCAL_MNEMONIC)
  }
}
