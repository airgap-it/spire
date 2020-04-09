import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'

import { PermissionListPage } from './permission-list.page'

const routes: Routes = [
  {
    path: '',
    component: PermissionListPage
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PermissionListPageRoutingModule {}
