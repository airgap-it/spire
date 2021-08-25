import { Component, Input, Output, EventEmitter } from '@angular/core'
import { getProtocolByIdentifier, IAirGapTransaction, MainProtocolSymbols } from '@airgap/coinlib-core'
import { FullOperationGroup } from 'src/extension/tezos-types'
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms'
import { FeeConverterPipe } from 'src/app/pipes/fee-converter/fee-converter.pipe'
import { isInjectableOperation } from 'src/app/types/tezos-operation'

@Component({
  selector: 'beacon-from-to',
  templateUrl: './from-to.component.html',
  styleUrls: ['./from-to.component.scss']
})
export class FromToComponent {
  public formGroup: FormGroup | undefined

  @Input()
  public transactions: IAirGapTransaction[] | undefined

  @Input()
  public operationGroup: FullOperationGroup | undefined

  @Output()
  public readonly onOperationGroupUpdate: EventEmitter<FullOperationGroup> = new EventEmitter<FullOperationGroup>()

  constructor(private readonly formBuilder: FormBuilder, private readonly feeConverter: FeeConverterPipe) {}

  public advanced: boolean = false

  public get operationControls(): FormArray | undefined {
    if (this.formGroup === undefined) {
      return undefined
    }
    return this.formGroup.controls.operations as FormArray
  }

  public async initForms() {
    if (this.operationGroup === undefined) {
      return
    }
    const protocol = getProtocolByIdentifier(MainProtocolSymbols.XTZ)
    this.formGroup = this.formBuilder.group({
      operations: this.formBuilder.array(
        this.operationGroup.contents.map(operation => {
          if (!isInjectableOperation(operation)) {
            return this.formBuilder.group({})
          }
          const feeValue = this.feeConverter.transform(operation.fee, { protocolIdentifier: MainProtocolSymbols.XTZ, appendSymbol: false })
          const feeControl = this.formBuilder.control(feeValue, [
            Validators.required,
            Validators.pattern(`^[0-9]+(\.[0-9]{1,${protocol.feeDecimals}})*$`)
          ])
          const gasLimitControl = this.formBuilder.control(operation.gas_limit, [
            Validators.required,
            Validators.min(0)
          ])
          const storageLimitControl = this.formBuilder.control(operation.storage_limit, [
            Validators.required,
            Validators.min(0)
          ])
          return this.formBuilder.group({
            fee: feeControl,
            gasLimit: gasLimitControl,
            storageLimit: storageLimitControl
          })
        })
      )
    })
  }

  public updateOperationGroup() {
    if (this.operationGroup === undefined) {
      return
    }
    this.operationGroup.contents = this.operationGroup.contents.map((operation, index) => {
      if (!isInjectableOperation(operation) || this.formGroup === undefined) {
        return operation
      }
      const group = (this.formGroup.controls.operations as FormArray).controls[index] as FormGroup
      const fee = this.feeConverter.transform(group.controls.fee.value, { protocolIdentifier: MainProtocolSymbols.XTZ, reverse: true, appendSymbol: false })
      return {
        ...operation,
        fee,
        gas_limit: String(group.controls.gasLimit.value),
        storage_limit: String(group.controls.storageLimit.value),
      }
    })
    this.onOperationGroupUpdate.emit(this.operationGroup)
    this.advanced = false
  }
}
