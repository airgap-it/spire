import { Component } from '@angular/core';
import { CryptoService } from '../../services/crypto.service';
import { AirGapMarketWallet } from 'airgap-coin-lib';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  constructor(public readonly cryptoService: CryptoService) {}

  getBalance(wallet: AirGapMarketWallet) {
    if (wallet) {
      return wallet.currentBalance
    }
  }
}
