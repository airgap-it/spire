import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { ModalController } from '@ionic/angular'

import { AddWalletConnectionPage } from '../add-wallet-connection/add-wallet-connection.page'

@Component({
  selector: 'beacon-pair',
  templateUrl: 'pair.page.html',
  styleUrls: ['pair.page.scss']
})
export class PairPage {
  public developerModeEnabled: boolean = false

  constructor(private readonly modalController: ModalController, private readonly router: Router) {}

  public async pairWallet() {
    const modal = await this.modalController.create({
      component: AddWalletConnectionPage
    })

    return modal.present()
  }

  public async pairHardwareWallet() {}

  public async pairLocalMnemonic() {
    this.router.navigate(['local-mnemonic'])
  }
}
