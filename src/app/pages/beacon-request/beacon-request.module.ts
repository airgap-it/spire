import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { PipesModule } from 'src/app/pipes/pipes.module'

import { ComponentsModule } from '../../components/components.module'

import { BeaconRequestPageRoutingModule } from './beacon-request-routing.module'
import { BeaconRequestPage } from './beacon-request.page'

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, BeaconRequestPageRoutingModule, ComponentsModule, PipesModule],
  declarations: [BeaconRequestPage]
})
export class BeaconRequestPageModule {}
