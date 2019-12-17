import { Component } from '@angular/core'
import { AirGapMarketWallet } from 'airgap-coin-lib'

import { CryptoService } from '../../services/crypto.service'

@Component({
  selector: 'beacon-local-mnemonic',
  templateUrl: 'local-mnemonic.page.html',
  styleUrls: ['local-mnemonic.page.scss']
})
export class LocalMnemonicPage {
  constructor(public readonly cryptoService: CryptoService) {}

  public getBalance(wallet: AirGapMarketWallet | undefined): void {
    if (wallet) {
      return wallet.currentBalance
    }
  }

  public test(): void {
    chrome.runtime.sendMessage('MESSAGE FROM POPUP')
    // chrome.tabs.getSelected(null, _tab => {
    //   // const code: string = 'window.location.reload()'
    //   // chrome.tabs.postMessage('asdf')
    // })
  }
}
