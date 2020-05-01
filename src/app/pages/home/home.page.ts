import { Network } from '@airgap/beacon-sdk'
import { ChangeDetectorRef, Component } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { TezosProtocol } from 'airgap-coin-lib'
import { ChromeMessagingService } from 'src/app/services/chrome-messaging.service'
import { WalletService } from 'src/app/services/local-wallet.service'
import { SettingsService } from 'src/app/services/settings.service'
import { Action, ExtensionMessageOutputPayload, WalletInfo, WalletType } from 'src/extension/extension-client/Actions'
import { getTezblockLinkForNetwork } from 'src/extension/extension-client/utils'

import { PairPage } from '../pair/pair.page'
import { WalletSelectPage } from '../wallet-select/wallet-select.page'

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
  public signingMethods: typeof SigningMethods = SigningMethods
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
    this.settingsService
      .getNetwork()
      .then((network: Network | undefined) => (this.network = network))
      .catch(console.error)

    this.checkOnboarding().catch(console.error)

    this.walletService.activeWallet$.subscribe(async (wallet: WalletInfo<WalletType>) => {
      this.address = wallet.address
      this.currentSigningMethod = wallet.type === WalletType.LEDGER ? 'Ledger' : 'Local Mnemonic'
      const [balance, tezblockLink]: [string, string] = await Promise.all([
        this.getBalance(wallet.address),
        this.getBlockexplorer(wallet.address)
      ])
      this.balance = balance
      this.tezblockLink = tezblockLink
      this.ref.detectChanges()
    })
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

    if (!hasWallet) {
      await this.showPairPage()
    }
  }

  public async openWalletSelection(): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: WalletSelectPage
    })

    return modal.present()
  }

  public async getBalance(address: string | null): Promise<string> {
    console.log('getBalance', address)
    if (!address) {
      return ''
    }
    const network: Network | undefined = await this.settingsService.getNetwork()

    if (network) {
      const protocol: TezosProtocol = await this.settingsService.getProtocolForNetwork(network)

      const amount: string = await protocol.getBalanceOfAddresses([address])
      console.log('getBalance', amount)

      return amount
    } else {
      return ''
    }
  }

  public async getBlockexplorer(address: string | null): Promise<string> {
    const link: string = await getTezblockLinkForNetwork(this.network)

    return `${link}${address}`
  }

  public async openBlockexplorer(): Promise<void> {
    window.open(this.tezblockLink)
  }
}
