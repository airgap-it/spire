import { Component } from '@angular/core'
import { AirGapMarketWallet } from 'airgap-coin-lib'

import { LocalWalletService } from '../../services/local-wallet.service'

@Component({
  selector: 'beacon-local-mnemonic',
  templateUrl: 'local-mnemonic.page.html',
  styleUrls: ['local-mnemonic.page.scss']
})
export class LocalMnemonicPage {
  constructor(public readonly localWalletService: LocalWalletService) { }

  public getBalance(wallet: AirGapMarketWallet | undefined): void {
    if (wallet) {
      return wallet.currentBalance
    }
  }
}
