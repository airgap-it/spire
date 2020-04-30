import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { PipesModule } from 'src/app/pipes/pipes.module'

import { ComponentsModule } from '../../components/components.module'

import { HomePageRoutingModule } from './home-routing.module'
import { HomePage } from './home.page'

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, HomePageRoutingModule, PipesModule, ComponentsModule],
  declarations: [HomePage]
})
export class HomePageModule {}
