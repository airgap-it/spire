import { Component, NgZone, OnInit } from '@angular/core'
import { ModalController } from '@ionic/angular'

import { CommunicationService } from '../../services/communication.service'

@Component({
  selector: 'beacon-add-wallet-connection',
  templateUrl: './add-wallet-connection.page.html',
  styleUrls: ['./add-wallet-connection.page.scss']
})
export class AddWalletConnectionPage implements OnInit {
  public handshakeData: string | undefined

  constructor(
    private readonly communicationService: CommunicationService,
    private readonly modalController: ModalController,
    private readonly ngZone: NgZone
  ) {}

  public async ngOnInit(): Promise<void> {
    this.handshakeData = await this.communicationService.getQrData()
    await this.ngZone.run(async () => {}) // Trigger change detection
    console.log(this.handshakeData)
  }

  public async dismiss(): Promise<void> {
    await this.modalController.dismiss()
  }
}
