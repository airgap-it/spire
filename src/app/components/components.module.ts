import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { AlertModule } from 'ngx-bootstrap/alert'
import { MomentModule } from 'ngx-moment'
import { DirectivesModule } from '../directives/directives.module'
import { PipesModule } from '../pipes/pipes.module'
import { AddressRowComponent } from './address-row/address-row.component'
import { ErrorItemComponent } from './error-item/error.component'
import { FromToComponent } from './from-to/from-to.component'
import { IdenticonComponent } from './identicon/identicon.component'
import { CollapsableJSONComponent } from './collapsable-json/collapsable-json.component'

@NgModule({
  declarations: [
    IdenticonComponent,
    FromToComponent,
    AddressRowComponent,
    ErrorItemComponent,
    CollapsableJSONComponent
  ],
  imports: [
    IonicModule,
    CommonModule,
    AlertModule.forRoot(),
    FormsModule,
    ReactiveFormsModule,
    PipesModule,
    MomentModule,
    DirectivesModule
  ],
  exports: [IdenticonComponent, FromToComponent, AddressRowComponent, ErrorItemComponent, CollapsableJSONComponent]
})
export class ComponentsModule {}
