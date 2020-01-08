import { Injectable } from '@angular/core'
import { AirGapMarketWallet, TezosProtocol } from 'airgap-coin-lib'
import * as bip39 from 'bip39'
import { StorageService, SettingsKey } from './storage.service'

@Injectable({
  providedIn: 'root'
})
export class LocalWalletService {
  private readonly protocol: TezosProtocol

  public mnemonic: string = ''
  public privateKey: string = ''
  public publicKey: string = ''
  public address: string = ''

  public wallet: AirGapMarketWallet | undefined

  constructor(private readonly storageService: StorageService) {
    this.protocol = new TezosProtocol()

    this.storageService.get(SettingsKey.LOCAL_MNEMONIC).then
  }

  public async init() {
    const mnemonic = await this.storageService.get(SettingsKey.LOCAL_MNEMONIC)
    if (mnemonic && bip39.validateMnemonic(mnemonic)) {
      this.mnemonic = mnemonic
    }
  }

  public async generateMnemonic() {
    this.mnemonic = bip39.generateMnemonic()
    this.saveMnemonic(this.mnemonic)
  }

  public async saveMnemonic(mnemonic: string): Promise<void> {
    if (mnemonic && bip39.validateMnemonic(mnemonic)) {
      this.storageService.set(SettingsKey.LOCAL_MNEMONIC, mnemonic)
      const seed = await bip39.mnemonicToSeed(mnemonic)
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
