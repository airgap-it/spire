import { Component, Input } from '@angular/core'
import { TezosGenericOperationError } from 'src/extension/tezos-types'

@Component({
  selector: 'error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss']
})
export class ErrorItemComponent {
  @Input()
  public errors: TezosGenericOperationError[] = []
  public showOverlay: boolean = true

  dismiss(error?: TezosGenericOperationError) {
    if (error) {
      this.errors = this.errors.filter(err => {
        return err.id !== error.id || err.kind !== error.kind
      })
    }

    this.showOverlay = this.errors.length > 0 ? true : false
  }
}
