import { Injectable } from '@angular/core'
import { TezosProtocol } from 'airgap-coin-lib'
import * as bip39 from 'bip39'
import { Observable, ReplaySubject } from 'rxjs'
import { Action, ExtensionMessageOutputPayload, WalletInfo, WalletType } from 'src/extension/extension-client/Actions'

import { ChromeMessagingService } from './chrome-messaging.service'

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private readonly _wallets: ReplaySubject<WalletInfo<WalletType>[]> = new ReplaySubject(1)
  private readonly _activeWallet: ReplaySubject<WalletInfo<WalletType>> = new ReplaySubject(1)

  private readonly protocol: TezosProtocol

  public readonly wallets$: Observable<WalletInfo<WalletType>[]> = this._wallets.asObservable()
  public readonly activeWallet$: Observable<WalletInfo<WalletType>> = this._activeWallet.asObservable()

  constructor(private readonly chromeMessagingService: ChromeMessagingService) {
    this.protocol = new TezosProtocol() // This protocol is only used to calculate addresses, so it is not different on testnets
    this.getWallets().catch(console.error)
    this.getActiveWallet().catch(console.error)
  }

  public async mnemonicToAddress(
    mnemonic: string
  ): Promise<{
    privateKey: string
    publicKey: string
    address: string
  }> {
    const privateKey: string = (
      await this.protocol.getPrivateKeyFromMnemonic(mnemonic, this.protocol.standardDerivationPath)
    ).toString('hex')

    const publicKey: string = await this.protocol.getPublicKeyFromMnemonic(
      mnemonic,
      this.protocol.standardDerivationPath
    )

    const address: string = await this.protocol.getAddressFromPublicKey(publicKey)

    return {
      privateKey,
      publicKey,
      address
    }
  }

  public async getWallets(): Promise<void> {
    this.chromeMessagingService
      .sendChromeMessage(Action.WALLETS_GET, undefined)
      .then((response: ExtensionMessageOutputPayload<Action.WALLETS_GET>) => {
        if (response.data) {
          this._wallets.next(response.data.wallets)
        }
      })
      .catch(console.error)
  }

  public async getActiveWallet(): Promise<void> {
    this.chromeMessagingService
      .sendChromeMessage(Action.ACTIVE_WALLET_GET, undefined)
      .then((response: ExtensionMessageOutputPayload<Action.ACTIVE_WALLET_GET>) => {
        if (response.data && response.data.wallet) {
          this._activeWallet.next(response.data.wallet)
        }
      })
      .catch(console.error)
  }

  public async saveMnemonic(mnemonic: string): Promise<void> {
    if (mnemonic && bip39.validateMnemonic(mnemonic)) {
      const {
        publicKey,
        address
      }: {
        privateKey: string
        publicKey: string
        address: string
      } = await this.mnemonicToAddress(mnemonic)
      const walletInfo: WalletInfo<WalletType.LOCAL_MNEMONIC> = {
        address,
        pubkey: publicKey,
        type: WalletType.LOCAL_MNEMONIC,
        added: new Date(),
        info: {
          mnemonic
        }
      }

      await this.addAndActiveWallet(walletInfo)
    }
  }

  public async addAndActiveWallet(walletInfo: WalletInfo<WalletType>): Promise<void> {
    await this.chromeMessagingService.sendChromeMessage(Action.WALLET_ADD, { wallet: walletInfo })
    await this.chromeMessagingService.sendChromeMessage(Action.ACTIVE_WALLET_SET, { wallet: walletInfo })

    await this.getWallets()
  }
}
