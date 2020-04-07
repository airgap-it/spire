import {
  BaseMessage,
  BroadcastRequest,
  MessageType,
  OperationRequest,
  PermissionRequest,
  PermissionResponse,
  PermissionScope,
  SignPayloadRequest,
  Network
} from '@airgap/beacon-sdk/dist/types/Messages'
import { ChromeMessageTransport } from '@airgap/beacon-sdk/dist/transports/ChromeMessageTransport'
import { Transport } from '@airgap/beacon-sdk/dist/transports/Transport'
import { Component, OnInit } from '@angular/core'
import { AlertController, ModalController } from '@ionic/angular'
import { IAirGapTransaction, TezosProtocol } from 'airgap-coin-lib'
import { take } from 'rxjs/operators'
import { LocalWalletService } from 'src/app/services/local-wallet.service'
import { Action, ExtensionMessageOutputPayload } from 'src/extension/Methods'
import { SigningMethod, SigningMethodService } from 'src/app/services/signing-method.service'
import { AddLedgerConnectionPage } from '../add-ledger-connection/add-ledger-connection.page'
import { ChromeMessagingService } from 'src/app/services/chrome-messaging.service'

export function isUnknownObject(x: unknown): x is { [key in PropertyKey]: unknown } {
  return x !== null && typeof x === 'object'
}

@Component({
  selector: 'beacon-request',
  templateUrl: './beacon-request.page.html',
  styleUrls: ['./beacon-request.page.scss']
})
export class BeaconRequestPage implements OnInit {
  public title: string = ''
  public protocol: TezosProtocol = new TezosProtocol()

  public signingMethod: SigningMethod | undefined
  public request: BaseMessage | undefined
  public requesterName: string = ''
  public address: string = ''
  public requestedNetwork: Network | undefined
  public inputs?: any
  public transactions: IAirGapTransaction[] | undefined

  public responseHandler: (() => Promise<void>) | undefined

  public transport: Transport = new ChromeMessageTransport('Beacon Extension')

  public confirmButtonText: string = 'Confirm'

  constructor(
    private readonly alertController: AlertController,
    private readonly modalController: ModalController,
    private readonly localWalletService: LocalWalletService,
    private readonly signingMethodService: SigningMethodService,
    private readonly chromeMessagingService: ChromeMessagingService
  ) {
    this.localWalletService.address.pipe(take(1)).subscribe(address => {
      this.address = address
    })
    this.signingMethodService.signingMethod.pipe(take(1)).subscribe(async signingMethod => {
      if (signingMethod === SigningMethod.LEDGER) {
        this.confirmButtonText = 'Sign with Ledger'
      }
    })
  }

  public ngOnInit() {
    console.log('new request', this.request)
    if (isUnknownObject(this.request) && this.request.type === MessageType.PermissionRequest) {
      this.title = 'Permission Request'
      this.requesterName = ((this.request as any) as PermissionRequest).senderName
      this.permissionRequest((this.request as any) as PermissionRequest)
    }

    if (isUnknownObject(this.request) && this.request.type === MessageType.SignPayloadRequest) {
      this.title = 'Sign Payload Request'
      this.requesterName = 'dApp Name (placeholder)'
      this.signRequest((this.request as any) as SignPayloadRequest)
    }

    if (isUnknownObject(this.request) && this.request.type === MessageType.OperationRequest) {
      this.title = 'Operation Request'
      this.requesterName = 'dApp Name (placeholder)'
      this.operationRequest((this.request as any) as OperationRequest)
    }

    if (isUnknownObject(this.request) && this.request.type === MessageType.BroadcastRequest) {
      this.title = 'Broadcast Request'
      this.requesterName = 'dApp Name (placeholder)'
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
    // console.error('Only mainnet and babylonnet is currently supported')
    // const response: NetworkNotSupportedError = {
    //   id: request.id,
    //   senderId: 'Beacon Extension',
    //   type: MessageType.PermissionResponse,
    //   errorType: BeaconErrorType.NETWORK_NOT_SUPPORTED
    // }

    // chrome.runtime.sendMessage({ method: 'toBackground', type: Methods.RESPONSE, request: response }, res => {
    //   console.log(res)
    //   setTimeout(() => {
    //     window.close()
    //   }, 1000)
    // })

    this.requestedNetwork = request.network
    this.localWalletService.publicKey.pipe(take(1)).subscribe(pubKey => {
      this.inputs = [
        {
          name: 'read_address',
          type: 'checkbox',
          label: 'Read Address',
          value: 'read_address',
          icon: 'eye',
          checked: request.scopes.indexOf(PermissionScope.READ_ADDRESS) >= 0
        },

        {
          name: 'sign',
          type: 'checkbox',
          label: 'Sign transactions',
          value: 'sign',
          icon: 'create',
          checked: request.scopes.indexOf(PermissionScope.SIGN) >= 0
        },

        {
          name: 'operation_request',
          type: 'checkbox',
          label: 'Operation request',
          value: 'operation_request',
          icon: 'color-wand',
          checked: request.scopes.indexOf(PermissionScope.OPERATION_REQUEST) >= 0
        },

        {
          name: 'threshold',
          type: 'checkbox',
          label: 'Threshold',
          value: 'threshold',
          icon: 'code-working',
          checked: request.scopes.indexOf(PermissionScope.THRESHOLD) >= 0
        }
      ]

      this.responseHandler = async () => {
        const response: PermissionResponse = {
          id: request.id,
          senderId: 'Beacon Extension',
          type: MessageType.PermissionResponse,
          permissions: {
            accountIdentifier: `${pubKey}-${request.network.type}`,
            pubkey: pubKey,
            network: {
              ...request.network
            },
            scopes: this.inputs.filter(input => input.checked).map(input => input.value)
          }
        }

        this.sendResponse(response)
      }
    })
  }

  private async signRequest(request: SignPayloadRequest): Promise<void> {
    console.log('sign payload', request.payload[0])
    this.transactions = await this.protocol.getTransactionDetails({
      publicKey: '',
      transaction: { binaryTransaction: request.payload[0] }
    })
    console.log(this.transactions)
    this.responseHandler = async () => {
      this.signingMethodService.signingMethod.pipe(take(1)).subscribe(async signingMethod => {
        if (signingMethod === SigningMethod.LOCAL_MNEMONIC) {
          this.sendResponse(request)
        } else {
          const modal = await this.modalController.create({
            component: AddLedgerConnectionPage,
            componentProps: {
              request,
              targetMethod: Action.RESPONSE
            }
          })

          modal.onWillDismiss().then(({ data: closeParent }) => {
            if (closeParent) {
              setTimeout(() => {
                this.dismiss()
              }, 500)
            }
          })
          return modal.present()
        }
      })
    }
  }

  private async operationRequest(request: OperationRequest): Promise<void> {
    this.transactions = this.protocol.getAirGapTxFromWrappedOperations({
      branch: '',
      contents: request.operationDetails as any // TODO Fix conflicting types from coinlib and beacon-sdk
    })
    console.log('transactions', this.transactions)

    this.responseHandler = async () => {
      this.signingMethodService.signingMethod.pipe(take(1)).subscribe(async signingMethod => {
        if (signingMethod === SigningMethod.LOCAL_MNEMONIC) {
          this.sendResponse(request)
        } else {
          const modal = await this.modalController.create({
            component: AddLedgerConnectionPage,
            componentProps: {
              request,
              targetMethod: Action.RESPONSE
            }
          })

          modal.onWillDismiss().then(({ data: closeParent }) => {
            if (closeParent) {
              setTimeout(() => {
                this.dismiss()
              }, 500)
            }
          })
          return modal.present()
        }
      })
    }
  }

  private async broadcastRequest(request: BroadcastRequest): Promise<void> {
    const signedTransaction = request.signedTransactions[0]
    console.log('signedTx', signedTransaction)
    this.transactions = await this.protocol.getTransactionDetailsFromSigned({
      accountIdentifier: '',
      transaction: signedTransaction
    })
    console.log(this.transactions)
    this.responseHandler = async () => {
      this.sendResponse(request)
    }
  }

  private async sendResponse(request: any): Promise<void> {
    const response: ExtensionMessageOutputPayload<Action.RESPONSE> = await this.chromeMessagingService.sendChromeMessage(
      Action.RESPONSE,
      {
        request
      }
    )
    console.log(response)
    setTimeout(() => {
      window.close()
    }, 1000)

    await this.showSuccessAlert()
  }

  private async showSuccessAlert(buttons: { text: string; handler(): void }[] = []): Promise<void> {
    const alert: HTMLIonAlertElement = await this.alertController.create({
      header: 'Success!',
      message: 'The response has been sent back to the dApp.',
      buttons: [
        ...buttons,
        {
          text: 'Ok'
        }
      ]
    })

    await alert.present()
  }

  public openBlockexplorer(address: string, hash: string): void {
    let blockexplorer: string = this.protocol.blockExplorer

    if (hash) {
      blockexplorer = this.protocol.getBlockExplorerLinkForTxId(hash)
    } else if (address) {
      blockexplorer = this.protocol.getBlockExplorerLinkForAddress(address)
    }

    this.openUrl(blockexplorer)
  }

  private openUrl(url: string): void {
    window.open(url, '_blank')
  }
}
