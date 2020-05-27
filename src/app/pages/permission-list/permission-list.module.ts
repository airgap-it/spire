import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'

import { ComponentsModule } from '../../components/components.module'

import { PermissionListPageRoutingModule } from './permission-list-routing.module'
import { PermissionListPage } from './permission-list.page'

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, PermissionListPageRoutingModule, ComponentsModule],
  declarations: [PermissionListPage]
})
export class PermissionListPageModule {}
