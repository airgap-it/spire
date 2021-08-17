import { Component, Input, Output, EventEmitter } from '@angular/core'
import { IAirGapTransaction } from '@airgap/coinlib-core'
import { FullOperationGroup } from 'src/extension/tezos-types'
import { FormBuilder, FormGroup } from '@angular/forms'
import { TezosTransactionOperation } from '@airgap/coinlib-core/protocols/tezos/types/operations/Transaction'

@Component({
  selector: 'beacon-from-to',
  templateUrl: './from-to.component.html',
  styleUrls: ['./from-to.component.scss']
})
export class FromToComponent {
  public formGroups: FormGroup[] | undefined

  private operationGroup: FullOperationGroup | undefined

  @Input()
  public transactionsPromise: Promise<IAirGapTransaction[]> | undefined

  @Input()
  public operationGroupPromise: Promise<FullOperationGroup> | undefined

  @Output()
  public readonly operationGroupEmitter: EventEmitter<FullOperationGroup> = new EventEmitter<FullOperationGroup>()

  constructor(private readonly formBuilder: FormBuilder) {}

  public advanced: boolean = false

  public async initForms() {
    this.operationGroup = await this.operationGroupPromise
    if (this.operationGroup) {
      this.formGroups = this.operationGroup.contents.map(operation => {
        const transactionOperation = operation as TezosTransactionOperation
        return this.formBuilder.group({
          fee: [transactionOperation.fee],
          gas_limit: [transactionOperation.gas_limit],
          storage_limit: [transactionOperation.storage_limit]
        })
      })
    }
  }

  public confirmParams() {
    if (this.operationGroup) {
      this.operationGroup.contents = this.operationGroup.contents.map((op, idx) => {
        const operation = op as TezosTransactionOperation
        return {
          ...op,
          fee: this.formGroups ? this.formGroups[idx].controls.fee.value : operation.fee,
          gas_limit: this.formGroups ? this.formGroups[idx].controls.gas_limit.value : operation.fee,
          storage_limit: this.formGroups ? this.formGroups[idx].controls.storage_limit.value : operation.fee
        }
      })
      this.operationGroupEmitter.emit(this.operationGroup)
    }
    this.advanced = false
  }
}
