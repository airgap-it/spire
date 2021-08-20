import { Component, Input, Output, EventEmitter } from '@angular/core'
import { IAirGapTransaction, MainProtocolSymbols } from '@airgap/coinlib-core'
import { FullOperationGroup } from 'src/extension/tezos-types'
import { FormBuilder, FormGroup } from '@angular/forms'
import { FeeConverterPipe } from 'src/app/pipes/fee-converter/fee-converter.pipe'
import { isInjectableOperation, TezosInjectableOperation } from 'src/app/types/tezos-operation'

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

  constructor(private readonly formBuilder: FormBuilder, private readonly feeConverter: FeeConverterPipe) {}

  public advanced: boolean = false

  public async initForms() {
    this.operationGroup = await this.operationGroupPromise
    if (this.operationGroup) {
      this.formGroups = this.operationGroup.contents.filter(operation => isInjectableOperation(operation)).map(operation => {
        const injectableOperation = operation as TezosInjectableOperation
        return this.formBuilder.group({
          fee: [this.feeConverter.transform(injectableOperation.fee, { protocolIdentifier: MainProtocolSymbols.XTZ, appendSymbol: false })],
          gas_limit: [injectableOperation.gas_limit],
          storage_limit: [injectableOperation.storage_limit]
        })
      })
    }
  }

  public confirmParams() {
    if (this.operationGroup) {
      this.operationGroup.contents = this.operationGroup.contents.filter(operation => isInjectableOperation(operation)).map((op, idx) => {
        const operation = op as TezosInjectableOperation
        return {
          ...op,
          fee: this.formGroups ? this.feeConverter.transform(this.formGroups[idx].controls.fee.value, { protocolIdentifier: MainProtocolSymbols.XTZ, reverse: true, appendSymbol: false }) : operation.fee,
          gas_limit: this.formGroups ? this.formGroups[idx].controls.gas_limit.value : operation.fee,
          storage_limit: this.formGroups ? this.formGroups[idx].controls.storage_limit.value : operation.fee
        }
      })
      this.operationGroupEmitter.emit(this.operationGroup)
    }
    this.advanced = false
  }
}
