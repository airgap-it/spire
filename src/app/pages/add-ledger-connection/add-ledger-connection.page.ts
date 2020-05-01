import { getAddressFromPublicKey } from '@airgap/beacon-sdk/dist/utils/crypto'
import { ChangeDetectorRef, Component, OnInit } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { ChromeMessagingService } from 'src/app/services/chrome-messaging.service'
import { Action, ExtensionMessageOutputPayload, WalletInfo, WalletType } from 'src/extension/extension-client/Actions'

@Component({
  selector: 'app-add-ledger-connection',
  templateUrl: './add-ledger-connection.page.html',
  styleUrls: ['./add-ledger-connection.page.scss']
})
export class AddLedgerConnectionPage implements OnInit {
  public targetMethod: Action = Action.LEDGER_INIT
  public request: unknown | undefined

  public isLoading: boolean = true
  public success: boolean = false
  public error: string = ''

  constructor(
    private readonly modalController: ModalController,
    private readonly chromeMessagingService: ChromeMessagingService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public async ngOnInit(): Promise<void> {
    return this.connect()
  }

  public async connect(): Promise<void> {
    this.isLoading = true

    const response: ExtensionMessageOutputPayload<Action> = await this.chromeMessagingService.sendChromeMessage(
      this.targetMethod,
      {
        request: this.request,
        extras: undefined
      }
    )
    console.log('LEDGER RESPONSE', response)

    this.isLoading = false
    if (response.error) {
    } else {
      this.success = true
      if (this.targetMethod === Action.LEDGER_INIT) {
        const { data }: ExtensionMessageOutputPayload<Action.LEDGER_INIT> = response as ExtensionMessageOutputPayload<
          Action.LEDGER_INIT
        >
        if (data) {
          const walletInfo: WalletInfo<WalletType.LEDGER> = {
            address: await getAddressFromPublicKey(data.pubkey),
            pubkey: data.pubkey,
            type: WalletType.LEDGER,
            added: new Date(),
            info: undefined
          }
          await this.chromeMessagingService.sendChromeMessage(Action.WALLET_ADD, { wallet: walletInfo })
          await this.chromeMessagingService.sendChromeMessage(Action.ACTIVE_WALLET_SET, { wallet: walletInfo })
        }
      }
      setTimeout(() => {
        return this.dismiss(true)
      }, 2000)
    }
    this.cdr.detectChanges()
  }

  public async dismiss(closeParent: boolean = false): Promise<void> {
    await this.modalController.dismiss(closeParent)
  }
}
