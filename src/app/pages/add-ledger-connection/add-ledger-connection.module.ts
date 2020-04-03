import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { AddLedgerConnectionPageRoutingModule } from './add-ledger-connection-routing.module'

import { AddLedgerConnectionPage } from './add-ledger-connection.page'

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, AddLedgerConnectionPageRoutingModule],
  declarations: [AddLedgerConnectionPage]
})
export class AddLedgerConnectionPageModule {}
