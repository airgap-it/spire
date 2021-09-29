import { BeaconMessageType, BroadcastRequestOutput, Network, OperationRequestOutput } from '@airgap/beacon-sdk'
import { Component, Input, OnInit } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { ChromeMessagingService } from 'src/app/services/chrome-messaging.service'
import { Action } from 'src/extension/extension-client/Actions'
import { PreapplyResponse, TezosGenericOperationError } from 'src/extension/tezos-types'

@Component({
  selector: 'app-dry-run-preview',
  templateUrl: './dry-run-preview.page.html',
  styleUrls: ['./dry-run-preview.page.scss']
})
export class DryRunPreviewPage implements OnInit {
  public errors: TezosGenericOperationError[] = []

  public jsonString: string | undefined

  @Input()
  public preapplyResponse!: PreapplyResponse[]

  @Input()
  public signedTransaction!: string

  @Input()
  public network!: Network

  @Input()
  public request!: OperationRequestOutput

  constructor(
    private readonly modalController: ModalController,
    private readonly chromeMessagingService: ChromeMessagingService
  ) {}

  ngOnInit(): void {
    if (this.preapplyResponse) {
      this.jsonString = JSON.stringify(this.preapplyResponse)
      const operationResultErrors = this.preapplyResponse[0].contents.map(operation => {
        return operation.metadata.operation_result.errors as TezosGenericOperationError[]
      })
      const internalOperationResultErrors = this.preapplyResponse[0].contents.map(operation => {
        const arr = operation.metadata.internal_operation_results
          ? operation.metadata.internal_operation_results.map(internal_operation_results => {
              return internal_operation_results.result.errors as TezosGenericOperationError[]
            })
          : []
        return this.flatten(arr)
      })

      this.errors = this.flatten(operationResultErrors.concat(internalOperationResultErrors)).filter(
        e => e !== undefined
      )
    }
  }

  async confirm() {
    const broadcastRequest: BroadcastRequestOutput = {
      id: this.request.id,
      senderId: this.request.senderId,
      appMetadata: this.request.appMetadata,
      type: BeaconMessageType.BroadcastRequest,
      network: this.network,
      signedTransaction: this.signedTransaction
    }
    this.chromeMessagingService.sendChromeMessage(Action.RESPONSE, {
      request: broadcastRequest,
      extras: undefined
    })
    this.dismiss()
  }

  private flatten<T>(arr: T[][]): T[] {
    return Array.prototype.concat.apply([], arr)
  }

  public async dismiss(): Promise<void> {
    await this.modalController.dismiss(true)
  }
}
