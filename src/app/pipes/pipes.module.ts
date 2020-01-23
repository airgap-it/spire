import { NgModule } from '@angular/core'

import { ShortenStringPipe } from './shorten-string/shorten-string.pipe'

@NgModule({
  declarations: [ShortenStringPipe],
  imports: [],
  exports: [ShortenStringPipe]
})
export class PipesModule {}
