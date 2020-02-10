import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { ComponentsModule } from 'src/app/components/components.module'

import { TransactionDetailPageRoutingModule } from './transaction-detail-routing.module'
import { TransactionDetailPage } from './transaction-detail.page'

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, TransactionDetailPageRoutingModule, ComponentsModule],
  declarations: [TransactionDetailPage]
})
export class TransactionDetailPageModule {}
