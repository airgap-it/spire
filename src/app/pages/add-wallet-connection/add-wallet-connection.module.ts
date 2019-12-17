import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { QRCodeModule } from 'angular2-qrcode'

import { AddWalletConnectionPageRoutingModule } from './add-wallet-connection-routing.module'
import { AddWalletConnectionPage } from './add-wallet-connection.page'

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, AddWalletConnectionPageRoutingModule, QRCodeModule],
  declarations: [AddWalletConnectionPage]
})
export class AddWalletConnectionPageModule {}
