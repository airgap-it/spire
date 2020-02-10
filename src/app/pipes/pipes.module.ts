import { NgModule } from '@angular/core'

import { AmountConverterPipe } from './amount-converter/amount-converter.pipe'
import { FeeConverterPipe } from './fee-converter/fee-converter.pipe'
import { ShortenStringPipe } from './shorten-string/shorten-string.pipe'

@NgModule({
  declarations: [ShortenStringPipe, AmountConverterPipe, FeeConverterPipe],
  imports: [],
  exports: [ShortenStringPipe, AmountConverterPipe, FeeConverterPipe]
})
export class PipesModule {}
