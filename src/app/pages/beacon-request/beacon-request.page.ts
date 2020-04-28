import {
  BeaconMessageType,
  BroadcastRequestOutput,
  ChromeMessageTransport,
  Network,
  OperationRequestOutput,
  PermissionRequestOutput,
  PermissionScope,
  SignPayloadRequestOutput,
  Transport
} from '@airgap/beacon-sdk'
import { Component, OnInit } from '@angular/core'
import { AlertController, ModalController } from '@ionic/angular'
import { IAirGapTransaction, TezosProtocol } from 'airgap-coin-lib'
import { take } from 'rxjs/operators'
import { ChromeMessagingService } from 'src/app/services/chrome-messaging.service'
import { LocalWalletService } from 'src/app/services/local-wallet.service'
import { Action, ExtensionMessageOutputPayload, WalletType } from 'src/extension/extension-client/Methods'

import { AddLedgerConnectionPage } from '../add-ledger-connection/add-ledger-connection.page'

@Component({
  selector: 'beacon-request',
  templateUrl: './beacon-request.page.html',
  styleUrls: ['./beacon-request.page.scss']
})
export class BeaconRequestPage implements OnInit {
  public title: string = ''
  public protocol: TezosProtocol = new TezosProtocol()

  public walletType: WalletType | undefined
  public request:
    | PermissionRequestOutput
    | OperationRequestOutput
    | SignPayloadRequestOutput
    | BroadcastRequestOutput
    | undefined
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
    private readonly chromeMessagingService: ChromeMessagingService
  ) {
    this.localWalletService.address.pipe(take(1)).subscribe((address: string) => {
      this.address = address
    })
    if (this.walletType === WalletType.LEDGER) {
      this.confirmButtonText = 'Sign with Ledger'
    }
  }

  public async ngOnInit(): Promise<void> {
    console.log('new request', this.request)
    if (this.request && this.request.type === BeaconMessageType.PermissionRequest) {
      this.title = 'Permission Request'
      this.requesterName = this.request.appMetadata.name
      await this.permissionRequest(this.request)
    }

    if (this.request && this.request.type === BeaconMessageType.SignPayloadRequest) {
      this.title = 'Sign Payload Request'
      this.requesterName = 'placeholder' // this.request.appMetadata.name
      await this.signRequest(this.request)
    }

    if (this.request && this.request.type === BeaconMessageType.OperationRequest) {
      this.title = 'Operation Request'
      this.requesterName = 'placeholder' // this.request.appMetadata.name
      await this.operationRequest(this.request)
    }

    if (this.request && this.request.type === BeaconMessageType.BroadcastRequest) {
      this.title = 'Broadcast Request'
      this.requesterName = 'placeholder' // this.request.appMetadata.name
      await this.broadcastRequest(this.request)
    }
  }

  public async dismiss(): Promise<void> {
    this.modalController.dismiss().catch(console.error)
  }

  public async done(): Promise<void> {
    if (this.responseHandler) {
      await this.responseHandler()
    }
    await this.dismiss()
  }

  private async permissionRequest(request: PermissionRequestOutput): Promise<void> {
    // console.error('Only mainnet and babylonnet is currently supported')
    // const response: NetworkNotSupportedError = {
    //   id: request.id,
    //   senderId: 'Beacon Extension',
    //   type: BeaconMessageType.PermissionResponse,
    //   errorType: BeaconErrorType.NETWORK_NOT_SUPPORTED
    // }

    // chrome.runtime.sendMessage({ method: 'toBackground', type: Methods.RESPONSE, request: response }, res => {
    //   console.log(res)
    //   setTimeout(() => {
    //     window.close()
    //   }, 1000)
    // })

    this.requestedNetwork = request.network
    this.localWalletService.publicKey.pipe(take(1)).subscribe((pubKey: string) => {
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

      this.responseHandler = async (): Promise<void> => {
        await this.sendResponse(request, {
          pubkey: pubKey,
          accountIdentifier: `${pubKey}-${request.network.type}`,
          scopes: this.inputs.filter(input => input.checked).map(input => input.value)
        })
      }
    })
  }

  private async signRequest(request: SignPayloadRequestOutput): Promise<void> {
    console.log('sign payload', request.payload[0])
    this.transactions = await this.protocol.getTransactionDetails({
      publicKey: '',
      transaction: { binaryTransaction: request.payload[0] }
    })
    console.log(this.transactions)
    this.responseHandler = async (): Promise<void> => {
      if (this.walletType === WalletType.LOCAL_MNEMONIC) {
        await this.sendResponse(request, {})
      } else {
        const modal = await this.modalController.create({
          component: AddLedgerConnectionPage,
          componentProps: {
            request,
            targetMethod: Action.RESPONSE
          }
        })

        modal
          .onWillDismiss()
          .then(({ data: closeParent }) => {
            if (closeParent) {
              setTimeout(() => {
                this.dismiss()
              }, 500)
            }
          })
          .catch(error => console.error(error))

        return modal.present()
      }
    }
  }

  private async operationRequest(request: OperationRequestOutput): Promise<void> {
    this.transactions = this.protocol.getAirGapTxFromWrappedOperations({
      branch: '',
      contents: request.operationDetails as any // TODO Fix conflicting types from coinlib and beacon-sdk
    })
    console.log('transactions', this.transactions)

    this.responseHandler = async (): Promise<void> => {
      if (this.walletType === WalletType.LOCAL_MNEMONIC) {
        this.sendResponse(request, {})
      } else {
        const modal = await this.modalController.create({
          component: AddLedgerConnectionPage,
          componentProps: {
            request,
            targetMethod: Action.RESPONSE
          }
        })

        modal
          .onWillDismiss()
          .then(({ data: closeParent }) => {
            if (closeParent) {
              setTimeout(() => {
                this.dismiss()
              }, 500)
            }
          })
          .catch(error => console.error(error))

        return modal.present()
      }
    }
  }

  private async broadcastRequest(request: BroadcastRequestOutput): Promise<void> {
    console.log('signedTx', request.signedTransaction)
    this.transactions = await this.protocol.getTransactionDetailsFromSigned({
      accountIdentifier: '',
      transaction: request.signedTransaction
    })
    console.log(this.transactions)
    this.responseHandler = async (): Promise<void> => {
      await this.sendResponse(request, {})
    }
  }

  private async sendResponse(
    request: PermissionRequestOutput | OperationRequestOutput | SignPayloadRequestOutput | BroadcastRequestOutput,
    extras: unknown
  ): Promise<void> {
    const response: ExtensionMessageOutputPayload<Action.RESPONSE> = await this.chromeMessagingService.sendChromeMessage(
      Action.RESPONSE,
      {
        request,
        extras
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
