import { Component, Input } from '@angular/core'
import { IAirGapTransaction } from '@airgap/coinlib-core'

@Component({
  selector: 'beacon-from-to',
  templateUrl: './from-to.component.html',
  styleUrls: ['./from-to.component.scss']
})
export class FromToComponent {
  @Input()
  public transaction: IAirGapTransaction | undefined

  public displayRawData: boolean = false
}
