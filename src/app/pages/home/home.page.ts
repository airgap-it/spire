import { Network } from '@airgap/beacon-sdk/dist/types/Messages'
import { ChangeDetectorRef, Component } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { TezosProtocol } from 'airgap-coin-lib'
import { LocalWalletService } from 'src/app/services/local-wallet.service'
import { SettingsService } from 'src/app/services/settings.service'
import { StorageKey, StorageService } from 'src/app/services/storage.service'
import { getTezblockLinkForNetwork } from 'src/extension/utils'

import { WalletSelectPage } from '../wallet-select/wallet-select.page'
import { PairPage } from '../pair/pair.page'

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

  constructor(
    public readonly localWalletService: LocalWalletService,
    private readonly modalController: ModalController,
    private readonly storageService: StorageService,
    private readonly settingsService: SettingsService,
    private readonly ref: ChangeDetectorRef
  ) {
    this.settingsService.getNetwork().then(network => (this.network = network))

    this.checkOnboarding().catch(console.error)

    this.localWalletService.address.subscribe(async (address: string | null) => {
      const [balance, tezblockLink]: [string, string] = await Promise.all([
        this.getBalance(address),
        this.getBlockexplorer(address)
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
    const hasOnboarded: boolean = await this.storageService.get(StorageKey.HAS_ONBOARDED)

    if (!hasOnboarded) {
      await this.showPairPage()
      await this.storageService.set(StorageKey.HAS_ONBOARDED, true)
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
