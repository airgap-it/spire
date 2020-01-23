import { Component } from '@angular/core'
import { AirGapMarketWallet } from 'airgap-coin-lib'

import { LocalWalletService } from '../../services/local-wallet.service'

@Component({
  selector: 'beacon-local-mnemonic',
  templateUrl: 'local-mnemonic.page.html',
  styleUrls: ['local-mnemonic.page.scss']
})
export class LocalMnemonicPage {
  public mnemonic: string = ''

  constructor(public readonly localWalletService: LocalWalletService) {
    this.localWalletService.mnemonic.subscribe(mnemonic => {
      this.mnemonic = mnemonic
    })
  }

  public getBalance(wallet: AirGapMarketWallet | undefined): void {
    if (wallet) {
      return wallet.currentBalance
    }
  }
}
