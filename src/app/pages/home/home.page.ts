import { Component } from '@angular/core'
import { ModalController } from '@ionic/angular'

import { AddWalletConnectionPage } from '../add-wallet-connection/add-wallet-connection.page'
import { Router } from '@angular/router'

@Component({
  selector: 'beacon-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage {
  constructor(private readonly modalController: ModalController, private readonly router: Router) { }

  public async pairWallet() {
    const modal = await this.modalController.create({
      component: AddWalletConnectionPage
    })

    return modal.present()
  }

  public async pairHardwareWallet() { }

  public async pairLocalMnemonic() {
    this.router.navigate(['local-mnemonic'])
  }
}
