import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { PermissionListPageRoutingModule } from './permission-list-routing.module'

import { PermissionListPage } from './permission-list.page'

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, PermissionListPageRoutingModule],
  declarations: [PermissionListPage]
})
export class PermissionListPageModule {}
