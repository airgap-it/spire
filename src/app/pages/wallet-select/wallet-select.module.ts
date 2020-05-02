import { ComponentsModule } from '../../components/components.module'
import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'

import { WalletSelectPageRoutingModule } from './wallet-select-routing.module'
import { WalletSelectPage } from './wallet-select.page'

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, WalletSelectPageRoutingModule, ComponentsModule],
  declarations: [WalletSelectPage]
})
export class WalletSelectPageModule {}
