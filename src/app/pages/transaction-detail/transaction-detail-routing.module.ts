import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'

import { TransactionDetailPage } from './transaction-detail.page'

const routes: Routes = [
  {
    path: '',
    component: TransactionDetailPage
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TransactionDetailPageRoutingModule {}
