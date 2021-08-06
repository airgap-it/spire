import { TezosTransactionOperation } from '@airgap/beacon-sdk'
import { Component, Input } from '@angular/core'
import { FormGroup } from '@angular/forms'
import { ModalController } from '@ionic/angular'

@Component({
  selector: 'app-customize-operation-parameters',
  templateUrl: './customize-operation-parameters.page.html',
  styleUrls: ['./customize-operation-parameters.page.scss']
})
export class CustomizeOperationParametersPage {
  @Input()
  public operationDetails: TezosTransactionOperation[] | undefined

  public forms: FormGroup[] | undefined = []

  constructor(private readonly modalController: ModalController) {}

  public async dismiss(): Promise<void> {
    await this.modalController.dismiss()
  }

  public async confirm(): Promise<void> {
    const html = document.getElementById('json')
    const modifiedOperationDetails = html ? JSON.parse(html.innerHTML) : undefined
    await this.modalController.dismiss(modifiedOperationDetails as TezosTransactionOperation[])
  }
}
