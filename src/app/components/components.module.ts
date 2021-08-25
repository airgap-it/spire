import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { MomentModule } from 'ngx-moment'
import { DirectivesModule } from '../directives/directives.module'
import { PipesModule } from '../pipes/pipes.module'
import { AddressRowComponent } from './address-row/address-row.component'
import { FromToComponent } from './from-to/from-to.component'
import { IdenticonComponent } from './identicon/identicon.component'
import { CollapsableJSONComponent } from './collapsable-json/collapsable-json.component'

@NgModule({
  declarations: [
    IdenticonComponent,
    FromToComponent,
    AddressRowComponent,
    CollapsableJSONComponent
  ],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PipesModule,
    MomentModule,
    DirectivesModule
  ],
  exports: [IdenticonComponent, FromToComponent, AddressRowComponent, CollapsableJSONComponent]
})
export class ComponentsModule {}
