import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddLedgerConnectionPage } from './add-ledger-connection.page';

const routes: Routes = [
  {
    path: '',
    component: AddLedgerConnectionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddLedgerConnectionPageRoutingModule {}
