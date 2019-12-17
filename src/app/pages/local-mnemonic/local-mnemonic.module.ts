import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { RouterModule } from '@angular/router'

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
    ])
  ],
  declarations: [LocalMnemonicPage]
})
export class ListPageModule {}
