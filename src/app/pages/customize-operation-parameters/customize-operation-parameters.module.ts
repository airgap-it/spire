import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { CustomizeOperationParametersPageRoutingModule } from './customize-operation-parameters-routing.module'

import { CustomizeOperationParametersPage } from './customize-operation-parameters.page'
import { DirectivesModule } from 'src/app/directives/directives.module'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    CustomizeOperationParametersPageRoutingModule,
    DirectivesModule
  ],
  declarations: [CustomizeOperationParametersPage]
})
export class CustomizeOperationParametersPageModule {}
