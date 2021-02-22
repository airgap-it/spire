import { Component } from '@angular/core'
import { ModalController, ToastController } from '@ionic/angular'

@Component({
  selector: 'beacon-add-wallet-connection',
  templateUrl: './add-wallet-connection.page.html',
  styleUrls: ['./add-wallet-connection.page.scss']
})
export class AddWalletConnectionPage {
  public handshakeData: string | undefined

  constructor(private readonly modalController: ModalController, private readonly toastController: ToastController) {}

  public async dismiss(): Promise<void> {
    await this.modalController.dismiss()
  }

  public async copyToClipboard(): Promise<void> {
    console.log(this.handshakeData)
    navigator.clipboard.writeText(this.handshakeData || '').then(
      async () => {
        const toast = await this.toastController.create({
          header: 'Success',
          message: 'Code was copied to clipboard!',
          duration: 3000
        })
        toast.present()

        console.log('Copying to clipboard was successful!')
      },
      err => {
        console.error('Could not copy text to clipboard: ', err)
      }
    )
  }
}
