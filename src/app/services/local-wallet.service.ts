import { Injectable, NgZone } from '@angular/core'
import { TezosProtocol } from 'airgap-coin-lib'
import * as bip39 from 'bip39'
import { Observable, ReplaySubject } from 'rxjs'
import { Action, ExtensionMessageOutputPayload, WalletInfo, WalletType } from 'src/extension/extension-client/Methods'

import { ChromeMessagingService } from './chrome-messaging.service'

@Injectable({
  providedIn: 'root'
})
export class LocalWalletService {
  private readonly protocol: TezosProtocol

  private readonly _mnemonic: ReplaySubject<string> = new ReplaySubject(1)
  private readonly _privateKey: ReplaySubject<string> = new ReplaySubject(1)
  private readonly _publicKey: ReplaySubject<string> = new ReplaySubject(1)
  private readonly _address: ReplaySubject<string> = new ReplaySubject(1)

  public mnemonic: Observable<string> = this._mnemonic.asObservable()
  public privateKey: Observable<string> = this._privateKey.asObservable()
  public publicKey: Observable<string> = this._publicKey.asObservable()
  public address: Observable<string> = this._address.asObservable()

  constructor(private readonly ngZone: NgZone, private readonly chromeMessagingService: ChromeMessagingService) {
    this.protocol = new TezosProtocol() // This protocol is only used to calculate addresses, so it is not different on testnets

    this.mnemonic.subscribe(async (mnemonic: string) => {
      console.log('SUBSCRIBE TRIGGERED')
      const {
        privateKey,
        publicKey,
        address
      }: {
        privateKey: string
        publicKey: string
        address: string
      } = await this.mnemonicToAddress(mnemonic)

      this.ngZone.run(() => {
        this._privateKey.next(privateKey)
        this._publicKey.next(publicKey)
        this._address.next(address)
      })
    })

    this.getMnemonic()
  }

  public async mnemonicToAddress(
    mnemonic: string
  ): Promise<{
    privateKey: string
    publicKey: string
    address: string
  }> {
    const seed: Buffer = await bip39.mnemonicToSeed(mnemonic)
    const privateKey: string = this.protocol
      .getPrivateKeyFromHexSecret(seed.toString('hex'), this.protocol.standardDerivationPath)
      .toString('hex')

    const publicKey: string = this.protocol.getPublicKeyFromHexSecret(
      seed.toString('hex'),
      this.protocol.standardDerivationPath
    )

    const address: string = await this.protocol.getAddressFromPublicKey(publicKey)

    return {
      privateKey,
      publicKey,
      address
    }
  }

  public async getMnemonic(): Promise<void> {
    const response: ExtensionMessageOutputPayload<Action.MNEMONIC_GET> = await this.chromeMessagingService.sendChromeMessage(
      Action.MNEMONIC_GET,
      undefined
    )
    console.log('generateMnemonic response', response)
    if (response.data) {
      this._mnemonic.next(response.data.mnemonic)
    }
  }

  public async generateMnemonic(): Promise<void> {
    const response: ExtensionMessageOutputPayload<Action.MNEMONIC_GENERATE> = await this.chromeMessagingService.sendChromeMessage(
      Action.MNEMONIC_GENERATE,
      undefined
    )
    console.log('generateMnemonic response', response)
    if (response.data) {
      this._mnemonic.next(response.data.mnemonic)
      await this.addAndActiveWallet(response.data.mnemonic)
    }
  }

  public async saveMnemonic(mnemonic: string): Promise<void> {
    if (mnemonic && bip39.validateMnemonic(mnemonic)) {
      const response: ExtensionMessageOutputPayload<Action.MNEMONIC_SAVE> = await this.chromeMessagingService.sendChromeMessage(
        Action.MNEMONIC_SAVE,
        { mnemonic }
      )

      console.log('saveMnemonic response', response)

      this._mnemonic.next(mnemonic)
      await this.addAndActiveWallet(mnemonic)
    }
  }

  public async addAndActiveWallet(mnemonic: string): Promise<void> {
    const {
      publicKey
    }: {
      privateKey: string
      publicKey: string
      address: string
    } = await this.mnemonicToAddress(mnemonic)

    const walletInfo: WalletInfo = {
      pubkey: publicKey,
      type: WalletType.LOCAL_MNEMONIC,
      added: new Date(),
      senderId: ''
    }
    await this.chromeMessagingService.sendChromeMessage(Action.WALLET_ADD, { wallet: walletInfo })
    await this.chromeMessagingService.sendChromeMessage(Action.ACTIVE_WALLET_SET, { wallet: walletInfo })
  }
}
