import { Injectable, NgZone } from '@angular/core'
import { AirGapMarketWallet, TezosProtocol } from 'airgap-coin-lib'
import * as bip39 from 'bip39'
import { Observable, ReplaySubject } from 'rxjs'
import { Methods } from 'src/extension/Methods'

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

  constructor(private readonly ngZone: NgZone) {
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

    this.getMnemonic()
  }

  public async getMnemonic(): Promise<void> {
    chrome.runtime.sendMessage({ method: 'toBackground', type: Methods.LOCAL_GET_MNEMONIC }, response => {
      console.log('generateMnemonic response', response)
      this._mnemonic.next(response.mnemonic)
    })
  }

  public async generateMnemonic(): Promise<void> {
    chrome.runtime.sendMessage({ method: 'toBackground', type: Methods.LOCAL_GENERATE_MNEMONIC }, response => {
      console.log('generateMnemonic response', response)
      this._mnemonic.next(response.mnemonic)
    })
  }

  public async saveMnemonic(mnemonic: string): Promise<void> {
    if (mnemonic && bip39.validateMnemonic(mnemonic)) {
      chrome.runtime.sendMessage(
        { method: 'toBackground', type: Methods.LOCAL_SAVE_MNEMONIC, payload: { params: { mnemonic } } },
        response => {
          console.log('saveMnemonic response', response)
        }
      )
      this._mnemonic.next(mnemonic)
    }
  }
}
