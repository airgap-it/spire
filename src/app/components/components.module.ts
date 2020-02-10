import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'

import { FromToComponent } from './from-to/from-to.component'
import { IdenticonComponent } from './identicon/identicon.component'

@NgModule({
  declarations: [IdenticonComponent, FromToComponent],
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule],
  exports: [IdenticonComponent, FromToComponent]
})
export class ComponentsModule {}
