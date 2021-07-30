import { Network } from '@airgap/beacon-sdk'
import { ChangeDetectorRef, Component } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { TezosProtocol } from '@airgap/coinlib-core'
import { MainProtocolSymbols } from '@airgap/coinlib-core/utils/ProtocolSymbols'
import { ChromeMessagingService } from 'src/app/services/chrome-messaging.service'
import { WalletService } from 'src/app/services/local-wallet.service'
import { SettingsService } from 'src/app/services/settings.service'
import { Action, ExtensionMessageOutputPayload, WalletInfo, WalletType } from 'src/extension/extension-client/Actions'
import { getTezblockLinkForNetwork } from 'src/extension/extension-client/utils'

import { PairPage } from '../pair/pair.page'
import { WalletSelectPage } from '../wallet-select/wallet-select.page'
import { AddLedgerConnectionPage } from '../add-ledger-connection/add-ledger-connection.page'

enum SigningMethods {
  WALLET = 'WALLET',
  LEDGER = 'LEDGER',
  LOCAL_MNEMONIC = 'LOCAL_MNEMONIC'
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage {
  public protocolIndentifiers: typeof MainProtocolSymbols = MainProtocolSymbols
  public signingMethods: typeof SigningMethods = SigningMethods
  public walletTypes: typeof WalletType = WalletType
  public walletType: WalletType | undefined
  public currentSigningMethod: string = 'Unpaired'
  public balance: string = ''
  public tezblockLink: string = ''
  public network: Network | undefined
  public address: string = ''

  constructor(
    public readonly walletService: WalletService,
    private readonly modalController: ModalController,
    private readonly settingsService: SettingsService,
    private readonly chromeMessagingService: ChromeMessagingService,
    private readonly ref: ChangeDetectorRef
  ) {
    this.walletService.activeNetwork$.subscribe(async (network: Network) => {
      this.network = network
      await this.updateBalanceAndLink()
    })

    this.checkOnboarding().catch(console.error)

    this.walletService.activeWallet$.subscribe(async (wallet: WalletInfo) => {
      this.address = wallet.address
      this.walletType = wallet.type

      this.currentSigningMethod =
        wallet.type === WalletType.LOCAL_MNEMONIC
          ? 'Local Mnemonic'
          : wallet.type === WalletType.LEDGER
          ? 'Ledger'
          : 'Beacon P2P'

      if (wallet.type !== WalletType.P2P) {
        await this.updateBalanceAndLink()
      }
    })

    if (location.href.includes('pair-ledger')) {
      this.openLedger()
    }
  }

  public async updateBalanceAndLink(): Promise<void> {
    if (!this.network) {
      return
    }

    const [balance, tezblockLink]: [string, string] = await Promise.all([
      this.getBalance(this.address, this.network),
      this.getBlockexplorer(this.address, this.network)
    ])

    this.balance = balance
    this.tezblockLink = tezblockLink

    this.ref.detectChanges()
  }

  public async showPairPage(): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: PairPage
    })

    return modal.present()
  }

  public async checkOnboarding(): Promise<void> {
    const hasWallet: boolean = await this.chromeMessagingService
      .sendChromeMessage(Action.WALLETS_GET, undefined)
      .then((response: ExtensionMessageOutputPayload<Action.WALLETS_GET>) => {
        return response.data ? response.data.wallets.length > 0 : false
      })

    if (!hasWallet && !location.href.includes('pair-ledger')) {
      await this.showPairPage()
    }
  }

  public async openWalletSelection(): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: WalletSelectPage
    })

    modal.onDidDismiss().then(() => {})

    return modal.present()
  }

  public async getBalance(address: string | null, network: Network): Promise<string> {
    console.log('getBalance', address)
    if (!address) {
      return ''
    }

    const protocol: TezosProtocol = await this.settingsService.getProtocolForNetwork(network)

    const amount: string = await protocol.getBalanceOfAddresses([address])
    console.log('getBalance', amount)

    return amount
  }

  public async getBlockexplorer(address: string | null, network: Network): Promise<string> {
    const link: string = await getTezblockLinkForNetwork(network)

    return `${link}${address}`
  }

  public async openBlockexplorer(): Promise<void> {
    window.open(this.tezblockLink)
  }

  public async openLedger() {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: AddLedgerConnectionPage,
      componentProps: {
        targetMethod: Action.LEDGER_INIT
      }
    })

    modal
      .onWillDismiss()
      .then(() => {})
      .catch(error => console.error(error))

    return modal.present()
  }
}
