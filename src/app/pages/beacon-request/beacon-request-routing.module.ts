import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { BeaconRequestPage } from './beacon-request.page'

const routes: Routes = [
  {
    path: '',
    component: BeaconRequestPage
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BeaconRequestPageRoutingModule {}
