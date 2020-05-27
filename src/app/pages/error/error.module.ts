import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'

import { ErrorPageRoutingModule } from './error-routing.module'
import { ErrorPage } from './error.page'

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, ErrorPageRoutingModule],
  declarations: [ErrorPage]
})
export class ErrorPageModule {}
