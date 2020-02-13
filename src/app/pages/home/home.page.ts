import { Component } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { SigningMethodService } from 'src/app/services/signing-method.service'

import { PairPage } from '../pair/pair.page'

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage {
  public currentSigningMethod: string = 'Unpaired'

  constructor(
    private readonly signingMethodService: SigningMethodService,
    private readonly modalController: ModalController
  ) {
    this.signingMethodService.signingMethod.asObservable().subscribe(method => {
      if (method === 'WALLET') {
        this.currentSigningMethod = 'Wallet'
      } else if (method === 'LOCAL_MNEMONIC') {
        this.currentSigningMethod = 'Local Secret'
      } else {
        this.currentSigningMethod = method
      }
    })
  }

  public async showPairPage(): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: PairPage
    })

    return modal.present()
  }
}
