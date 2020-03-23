import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { PipesModule } from 'src/app/pipes/pipes.module'

import { LocalMnemonicPage } from './local-mnemonic.page'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: '',
        component: LocalMnemonicPage
      }
    ]),
    PipesModule
  ],
  declarations: [LocalMnemonicPage]
})
export class ListPageModule {}
