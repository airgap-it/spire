import {
  BaseMessage,
  BroadcastRequest,
  MessageTypes,
  OperationRequest,
  PermissionRequest,
  PermissionResponse,
  SignPayloadRequest
} from '@airgap/beacon-sdk/dist/client/Messages'
import { Serializer } from '@airgap/beacon-sdk/dist/client/Serializer'
import { ChromeMessageTransport } from '@airgap/beacon-sdk/dist/client/transports/ChromeMessageTransport'
import { Transport } from '@airgap/beacon-sdk/dist/client/transports/Transport'
import { Component, OnInit } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { take } from 'rxjs/operators'
import { LocalWalletService } from 'src/app/services/local-wallet.service'


export function isUnknownObject(x: unknown): x is { [key in PropertyKey]: unknown } {
  return x !== null && typeof x === 'object'
}

@Component({
  selector: 'beacon-request',
  templateUrl: './beacon-request.page.html',
  styleUrls: ['./beacon-request.page.scss']
})
export class BeaconRequestPage implements OnInit {
  request: BaseMessage | undefined
  requesterName: string = ''
  address: string = ''
  inputs?: any

  responseHandler: (() => Promise<void>) | undefined

  transport: Transport = new ChromeMessageTransport()

  constructor(
    private readonly modalController: ModalController,
    private readonly localWalletService: LocalWalletService
  ) {
    this.localWalletService.address.pipe(take(1)).subscribe(address => {
      this.address = address
    })
  }

  ngOnInit() {
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

        const serialized = new Serializer().serialize(response)

        this.transport.send(serialized)

        setTimeout(() => {
          window.close()
        }, 1000)
      }  
    })
  }

  private async signRequest(request: SignPayloadRequest): Promise<void> {
    console.log(request)
  }

  private async operationRequest(request: OperationRequest): Promise<void> {
    console.log(request)
  }

  private async broadcastRequest(request: BroadcastRequest): Promise<void> {
    console.log(request)
  }
}
