import { Injectable, NgZone } from '@angular/core'
import { AirGapMarketWallet, TezosProtocol } from 'airgap-coin-lib'
import * as bip39 from 'bip39'
import { Observable, ReplaySubject } from 'rxjs'

import { SettingsKey, StorageService } from './storage.service'

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

  public wallet: AirGapMarketWallet | undefined

  constructor(private readonly storageService: StorageService, private readonly ngZone: NgZone) {
    this.protocol = new TezosProtocol()

    this.mnemonic.subscribe(async (mnemonic: string) => {
      console.log('SUBSCRIBE TRIGGERED')
      const seed = await bip39.mnemonicToSeed(mnemonic)
      const privateKey = this.protocol
        .getPrivateKeyFromHexSecret(seed.toString('hex'), this.protocol.standardDerivationPath)
        .toString('hex')

      const publicKey = this.protocol.getPublicKeyFromHexSecret(
        seed.toString('hex'),
        this.protocol.standardDerivationPath
      )

      const address = await this.protocol.getAddressFromPublicKey(publicKey)

      this.ngZone.run(() => {
        this._privateKey.next(privateKey)
        this._publicKey.next(publicKey)
        this._address.next(address)

        this.wallet = new AirGapMarketWallet('xtz', publicKey, false, this.protocol.standardDerivationPath)
        this.wallet.synchronize()
      })
    })

    this.init()
  }

  public async init(): Promise<void> {
    const mnemonic = await this.storageService.get(SettingsKey.LOCAL_MNEMONIC)
    if (mnemonic && bip39.validateMnemonic(mnemonic)) {
      this._mnemonic.next(mnemonic)
    }
  }

  public async generateMnemonic(): Promise<void> {
    const mnemonic = bip39.generateMnemonic()
    await this.saveMnemonic(mnemonic)
  }

  public async saveMnemonic(mnemonic: string): Promise<void> {
    if (mnemonic && bip39.validateMnemonic(mnemonic)) {
      this.storageService.set(SettingsKey.LOCAL_MNEMONIC, mnemonic)
      this._mnemonic.next(mnemonic)
    }
  }
}
