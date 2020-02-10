import { Component } from '@angular/core'
import { ModalController } from '@ionic/angular'

@Component({
  selector: 'beacon-add-wallet-connection',
  templateUrl: './add-wallet-connection.page.html',
  styleUrls: ['./add-wallet-connection.page.scss']
})
export class AddWalletConnectionPage {
  public handshakeData: string | undefined

  constructor(private readonly modalController: ModalController) {}

  public async dismiss(): Promise<void> {
    await this.modalController.dismiss()
  }
}
