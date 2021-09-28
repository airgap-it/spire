import { getAddressFromPublicKey } from '@airgap/beacon-sdk'
import { ChangeDetectorRef, Component, OnInit } from '@angular/core'
import { ModalController, ToastController } from '@ionic/angular'
import { ChromeMessagingService } from 'src/app/services/chrome-messaging.service'
import { WalletService } from 'src/app/services/local-wallet.service'
import { Action, ExtensionMessageOutputPayload, WalletInfo, WalletType } from 'src/extension/extension-client/Actions'

const enum DerivationPathTypes {
  DEFAULT = 'DEFAULT',
  GALLEON = 'GALLEON',
  CUSTOM = 'CUSTOM'
}

@Component({
  selector: 'app-add-ledger-connection',
  templateUrl: './add-ledger-connection.page.html',
  styleUrls: ['./add-ledger-connection.page.scss']
})
export class AddLedgerConnectionPage implements OnInit {
  public title: string = 'Pair Ledger'
  public confirmText: string = 'Confirm Public Key Hash to share your Tezos address with Spire.'

  public targetMethod: Action = Action.LEDGER_INIT
  public request: unknown | undefined

  public showDerivationPath: boolean = true

  public derivationPathType: DerivationPathTypes = DerivationPathTypes.DEFAULT

  public readonly defaultDerivationPath: string = "m/44'/1729'/0'/0'"
  public derivationPathMap = new Map<string, string>()

  public derivationPath: string | undefined = ''
  public customDerivationPath: string = ''
  public isLoading: boolean = true
  public hideCustom: boolean = false
  public success: boolean = false
  public error: string = ''

  constructor(
    private readonly modalController: ModalController,
    private readonly walletService: WalletService,
    private readonly chromeMessagingService: ChromeMessagingService,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastController: ToastController
  ) {
    this.derivationPathMap.set(DerivationPathTypes.DEFAULT, this.defaultDerivationPath)
    this.derivationPathMap.set(DerivationPathTypes.GALLEON, "m/44'/1729'/0'/0'/0'")
    this.derivationPathMap.set(DerivationPathTypes.CUSTOM, this.customDerivationPath)

    this.walletService.selectedDerivationPath$.subscribe(derivationPath => {
      if (derivationPath) {
        this.derivationPath = `m/${derivationPath}`
      }
    })
  }

  public async ngOnInit(): Promise<void> {
    this.derivationPath = this.defaultDerivationPath
    this.customDerivationPath = this.defaultDerivationPath

    if (this.targetMethod === Action.RESPONSE) {
      this.title = 'Sign Transaction'
      this.showDerivationPath = false
      this.confirmText = 'Confirm Transaction on your ledger.'
    }

    if (this.targetMethod === Action.DRY_RUN) {
      this.title = 'Simulate Operation'
      this.showDerivationPath = false
      this.confirmText = 'Confirm Simulation on your ledger.'
    }

    return this.connect()
  }

  public async connect(): Promise<void> {
    this.derivationPath = this.derivationPathMap.get(this.derivationPathType)
    await this.setDerivationPath()

    this.isLoading = true

    const response: ExtensionMessageOutputPayload<Action> = await this.chromeMessagingService.sendChromeMessage(
      this.targetMethod,
      {
        request: this.request,
        extras: undefined
      }
    )

    this.isLoading = false
    if (response && response.error) {
      console.log('received an error', response.error)
    } else {
      let dismissPromise: Promise<boolean | void> = this.dismiss(true)
      this.success = true
      if (this.targetMethod === Action.LEDGER_INIT) {
        const { data }: ExtensionMessageOutputPayload<Action.LEDGER_INIT> = response as ExtensionMessageOutputPayload<
          Action.LEDGER_INIT
        >
        if (data) {
          const walletInfo: WalletInfo<WalletType.LEDGER> = {
            address: await getAddressFromPublicKey(data.publicKey),
            publicKey: data.publicKey,
            type: WalletType.LEDGER,
            added: new Date().getTime(),
            info: undefined,
            derivationPath: this.derivationPath
          }
          await this.walletService.addAndActiveWallet(walletInfo)
        }
      } else if (this.targetMethod === Action.DRY_RUN) {
        const { data }: ExtensionMessageOutputPayload<Action.DRY_RUN> = response as ExtensionMessageOutputPayload<
          Action.DRY_RUN
        >
        dismissPromise = this.modalController.dismiss(data)
      }
      setTimeout(() => {
        return dismissPromise
      }, 2000)
    }
    this.cdr.detectChanges()
  }
  public async setDerivationPath() {
    return this.walletService
      .setDerivationPath(
        this.derivationPath!.slice(2) // we prefix the derivation path in the UI with 'm/', but the ledger expects it without said prefix
      )
      .then(async () => {
        if (this.derivationPath) {
          const toast = await this.toastController.create({
            message: `Set derivation path to ${this.derivationPath}`,
            duration: 3000
          })
          return toast.present()
        }
      })
  }

  public setCustomDerivationPath() {
    this.derivationPathMap.set(DerivationPathTypes.CUSTOM, this.customDerivationPath)
    this.connect()
  }

  public async dismiss(closeParent: boolean = false): Promise<void> {
    await this.modalController.dismiss(closeParent)
  }
}
