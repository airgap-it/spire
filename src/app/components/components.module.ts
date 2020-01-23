import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'

import { IdenticonComponent } from './identicon/identicon.component'

@NgModule({
  declarations: [IdenticonComponent],
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule],
  exports: [IdenticonComponent]
})
export class ComponentsModule {}
