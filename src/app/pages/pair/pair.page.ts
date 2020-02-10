import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { ModalController } from '@ionic/angular'
import { Observable } from 'rxjs'
import { SigningMethod, SigningMethodService } from 'src/app/services/signing-method.service'

import { AddWalletConnectionPage } from '../add-wallet-connection/add-wallet-connection.page'
import { Methods } from 'src/extension/Methods'

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
    this.signingMethodService.setSigningMethod(SigningMethod.WALLET)
    chrome.runtime.sendMessage({ method: 'toBackground', type: Methods.P2P_INIT }, async response => {
      console.log(response)

      const modal = await this.modalController.create({
        component: AddWalletConnectionPage,
        componentProps: {
          handshakeData: JSON.stringify(response.qr)
        }
      })

      return modal.present()
    })
  }

  public async pairHardwareWallet() {
    chrome.runtime.sendMessage({ method: 'toBackground', type: Methods.LEDGER_INIT }, response => {
      console.log(response)
      this.signingMethodService.setSigningMethod(SigningMethod.LEDGER)
    })
  }

  public async pairLocalMnemonic() {
    this.router.navigate(['local-mnemonic'])
    this.signingMethodService.setSigningMethod(SigningMethod.LOCAL_MNEMONIC)
  }
}
