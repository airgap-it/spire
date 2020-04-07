import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { ModalController } from '@ionic/angular'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { SettingsService } from 'src/app/services/settings.service'
import { SigningMethod, SigningMethodService } from 'src/app/services/signing-method.service'
import { Action, ExtensionMessageOutputPayload } from 'src/extension/Methods'

import { AddLedgerConnectionPage } from '../add-ledger-connection/add-ledger-connection.page'
import { AddWalletConnectionPage } from '../add-wallet-connection/add-wallet-connection.page'
import { ChromeMessagingService } from 'src/app/services/chrome-messaging.service'

@Component({
  selector: 'beacon-pair',
  templateUrl: 'pair.page.html',
  styleUrls: ['pair.page.scss']
})
export class PairPage {
  public currentSigningMethod: Observable<string | undefined>
  public developerModeEnabled: boolean = false
  public dismissEnabled: Observable<boolean>

  constructor(
    public readonly settingsService: SettingsService,
    private readonly modalController: ModalController,
    private readonly chromeMessagingService: ChromeMessagingService,
    private readonly router: Router,
    private readonly signingMethodService: SigningMethodService
  ) {
    this.currentSigningMethod = this.signingMethodService.signingMethod.asObservable()
    this.dismissEnabled = this.signingMethodService.signingMethod
      .asObservable()
      .pipe(map(signingMethod => signingMethod !== SigningMethod.UNPAIRED))
    this.settingsService.getDevSettingsEnabled().subscribe((enabled: boolean) => {
      this.developerModeEnabled = enabled
    })
  }

  public async pairWallet() {
    this.signingMethodService.setSigningMethod(SigningMethod.WALLET)

    const response: ExtensionMessageOutputPayload<Action.P2P_INIT> = await this.chromeMessagingService.sendChromeMessage(
      Action.P2P_INIT,
      undefined
    )
    console.log(response)

    const modal = await this.modalController.create({
      component: AddWalletConnectionPage,
      componentProps: {
        handshakeData: JSON.stringify(response.data ? response.data.qr : {})
      }
    })

    return modal.present()
  }

  public async pairHardwareWallet() {
    const modal = await this.modalController.create({
      component: AddLedgerConnectionPage,
      componentProps: {
        targetMethod: Action.LEDGER_INIT
      }
    })

    modal.onWillDismiss().then(({ data: closeParent }) => {
      if (closeParent) {
        setTimeout(() => {
          this.dismiss()
        }, 500)
      }
    })
    return modal.present()
  }

  public async toggleDeveloperMode(event: CustomEvent): Promise<void> {
    this.settingsService.setToggleDevSettingsEnabled(event.detail.checked)
  }

  public async pairLocalMnemonic(): Promise<void> {
    this.router.navigate(['local-mnemonic'])
    this.signingMethodService.setSigningMethod(SigningMethod.LOCAL_MNEMONIC)
    this.dismiss()
  }

  public async dismiss(): Promise<void> {
    await this.modalController.dismiss()
  }
}
