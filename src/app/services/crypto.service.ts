import { Injectable } from '@angular/core'
import { AirGapMarketWallet, TezosProtocol } from 'airgap-coin-lib'
import * as bip39 from 'bip39'

@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  private readonly protocol: TezosProtocol

  public mnemonic: string = ''
  public privateKey: string = ''
  public publicKey: string = ''
  public address: string = ''

  public wallet: AirGapMarketWallet | undefined

  constructor() {
    this.protocol = new TezosProtocol()
    const mnemonic = localStorage.getItem('tezos-poc:mnemonic')
    if (mnemonic && bip39.validateMnemonic(mnemonic)) {
      this.mnemonic = mnemonic
    } else {
      this.mnemonic = bip39.generateMnemonic()
    }
    this.saveMnemonic()
  }

  public async saveMnemonic(): Promise<void> {
    if (this.mnemonic && bip39.validateMnemonic(this.mnemonic)) {
      localStorage.setItem('tezos-poc:mnemonic', this.mnemonic)
      const seed = await bip39.mnemonicToSeed(this.mnemonic)
      this.privateKey = this.protocol
        .getPrivateKeyFromHexSecret(seed.toString('hex'), this.protocol.standardDerivationPath)
        .toString('hex')
      this.publicKey = this.protocol.getPublicKeyFromHexSecret(
        seed.toString('hex'),
        this.protocol.standardDerivationPath
      )
      this.address = await this.protocol.getAddressFromPublicKey(this.publicKey)

      this.wallet = new AirGapMarketWallet('xtz', this.publicKey, false, this.protocol.standardDerivationPath)
      this.wallet.synchronize()
    }
  }
}
