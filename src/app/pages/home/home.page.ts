import { Component } from '@angular/core'
import { ModalController } from '@ionic/angular'

import { AddWalletConnectionPage } from '../add-wallet-connection/add-wallet-connection.page'

@Component({
  selector: 'beacon-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage {
  constructor(private readonly modalController: ModalController) {}

  public async addWalletConnection() {
    const modal = await this.modalController.create({
      component: AddWalletConnectionPage
    })

    return modal.present()
  }

  public async signWithWallet() {}

  public async signWithHardwareWallet() {}

  public async signWithLocalMnemonic() {}
}
