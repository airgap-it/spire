import { ChromeMessageTransport } from '@airgap/beacon-sdk/dist/client/transports/ChromeMessageTransport'
import { Transport } from '@airgap/beacon-sdk/dist/client/transports/Transport'
import {
  BaseMessage,
  BroadcastRequest,
  MessageTypes,
  OperationRequest,
  PermissionRequest,
  PermissionResponse,
  SignPayloadRequest
} from '@airgap/beacon-sdk/dist/messages/Messages'
import { Component, OnInit } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { IAirGapTransaction, TezosProtocol } from 'airgap-coin-lib'
import { take } from 'rxjs/operators'
import { LocalWalletService } from 'src/app/services/local-wallet.service'
import { Methods } from 'src/extension/Methods'
import { TezosSpendOperation } from 'airgap-coin-lib/dist/protocols/tezos/TezosProtocol'

export function isUnknownObject(x: unknown): x is { [key in PropertyKey]: unknown } {
  return x !== null && typeof x === 'object'
}

@Component({
  selector: 'beacon-request',
  templateUrl: './beacon-request.page.html',
  styleUrls: ['./beacon-request.page.scss']
})
export class BeaconRequestPage implements OnInit {
  public protocol: TezosProtocol = new TezosProtocol()

  public request: BaseMessage | undefined
  public requesterName: string = ''
  public address: string = ''
  public inputs?: any
  public transactions: IAirGapTransaction[] | undefined

  public responseHandler: (() => Promise<void>) | undefined

  public transport: Transport = new ChromeMessageTransport('Beacon Extension')

  constructor(
    private readonly modalController: ModalController,
    private readonly localWalletService: LocalWalletService
  ) {
    this.localWalletService.address.pipe(take(1)).subscribe(address => {
      this.address = address
    })
  }

  public ngOnInit() {
    console.log('new request', this.request)
    if (isUnknownObject(this.request) && this.request.type === MessageTypes.PermissionRequest) {
      this.requesterName = ((this.request as any) as PermissionRequest).name
      this.permissionRequest((this.request as any) as PermissionRequest)
    }

    if (isUnknownObject(this.request) && this.request.type === MessageTypes.SignPayloadRequest) {
      this.signRequest((this.request as any) as SignPayloadRequest)
    }

    if (isUnknownObject(this.request) && this.request.type === MessageTypes.OperationRequest) {
      this.operationRequest((this.request as any) as OperationRequest)
    }

    if (isUnknownObject(this.request) && this.request.type === MessageTypes.BroadcastRequest) {
      this.broadcastRequest((this.request as any) as BroadcastRequest)
    }
  }

  public async dismiss() {
    this.modalController.dismiss().catch(console.error)
  }

  public async done() {
    if (this.responseHandler) {
      await this.responseHandler()
    }
    this.dismiss()
  }

  private async permissionRequest(request: PermissionRequest): Promise<void> {
    this.localWalletService.publicKey.pipe(take(1)).subscribe(pubKey => {
      this.inputs = [
        {
          name: 'read_address',
          type: 'checkbox',
          label: 'Read Address',
          value: 'read_address',
          icon: 'eye',
          checked: request.scope.indexOf('read_address') >= 0
        },

        {
          name: 'sign',
          type: 'checkbox',
          label: 'Sign transactions',
          value: 'sign',
          icon: 'create',
          checked: request.scope.indexOf('sign') >= 0
        },

        {
          name: 'operation_request',
          type: 'checkbox',
          label: 'Operation request',
          value: 'operation_request',
          icon: 'color-wand',
          checked: request.scope.indexOf('operation_request') >= 0
        },

        {
          name: 'threshold',
          type: 'checkbox',
          label: 'Threshold',
          value: 'threshold',
          icon: 'code-working',
          checked: request.scope.indexOf('threshold') >= 0
        }
      ]

      this.responseHandler = async () => {
        const response: PermissionResponse = {
          id: request.id,
          type: MessageTypes.PermissionResponse,
          permissions: {
            pubkey: pubKey,
            networks: ['mainnet'],
            scopes: this.inputs.filter(input => input.checked).map(input => input.value)
          }
        }

        chrome.runtime.sendMessage({ method: 'toBackground', type: Methods.RESPONSE, request: response }, res => {
          console.log(res)
          setTimeout(() => {
            window.close()
          }, 1000)
        })
      }
    })
  }

  private async signRequest(request: SignPayloadRequest): Promise<void> {
    console.log('sign payload', request.payload[0])
    this.transactions = await this.protocol.getTransactionDetails({
      publicKey: '',
      transaction: { binaryTransaction: request.payload[0] as any }
    })
    console.log(this.transactions)
    this.responseHandler = async () => {
      chrome.runtime.sendMessage({ method: 'toBackground', type: Methods.RESPONSE, request }, response => {
        console.log(response)
        setTimeout(() => {
          window.close()
        }, 1000)
      })
    }
  }

  private async operationRequest(request: OperationRequest): Promise<void> {
    const operation = request.operationDetails[0] as TezosSpendOperation
    this.transactions = [
      {
        from: [operation.source],
        to: [operation.destination],
        isInbound: false,
        amount: operation.amount,
        fee: operation.fee,
        protocolIdentifier: 'xtz',
        transactionDetails: operation
      }
    ]
    console.log('transactions', this.transactions)

    this.responseHandler = async () => {
      chrome.runtime.sendMessage({ method: 'toBackground', type: Methods.RESPONSE, request }, response => {
        console.log(response)
        setTimeout(() => {
          window.close()
        }, 1000)
      })
    }
  }

  private async broadcastRequest(request: BroadcastRequest): Promise<void> {
    const signedTransaction = request.signedTransactions[0]
    console.log('signedTx', signedTransaction)
    this.transactions = await this.protocol.getTransactionDetailsFromSigned({
      accountIdentifier: '',
      transaction: (signedTransaction as any) as string
    })
    console.log(this.transactions)
    this.responseHandler = async () => {
      chrome.runtime.sendMessage({ method: 'toBackground', type: Methods.RESPONSE, request }, response => {
        console.log(response)
        setTimeout(() => {
          window.close()
        }, 1000)
      })
    }
  }
}
