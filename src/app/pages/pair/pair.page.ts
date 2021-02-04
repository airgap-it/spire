import { Serializer } from '@airgap/beacon-sdk'
import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { ModalController } from '@ionic/angular'
import { ChromeMessagingService } from 'src/app/services/chrome-messaging.service'
import { SettingsService } from 'src/app/services/settings.service'
import { Action, ExtensionMessageOutputPayload } from 'src/extension/extension-client/Actions'

import { AddLedgerConnectionPage } from '../add-ledger-connection/add-ledger-connection.page'
import { AddWalletConnectionPage } from '../add-wallet-connection/add-wallet-connection.page'

@Component({
  selector: 'beacon-pair',
  templateUrl: 'pair.page.html',
  styleUrls: ['pair.page.scss']
})
export class PairPage {
  public developerModeEnabled: boolean = false
  public dismissEnabled: Promise<boolean>

  constructor(
    public readonly settingsService: SettingsService,
    private readonly modalController: ModalController,
    private readonly chromeMessagingService: ChromeMessagingService,
    private readonly router: Router
  ) {
    this.dismissEnabled = this.chromeMessagingService
      .sendChromeMessage(Action.WALLETS_GET, undefined)
      .then((response: ExtensionMessageOutputPayload<Action.WALLETS_GET>) => {
        return response.data ? response.data.wallets.length > 0 : false
      })
    this.settingsService.getDevSettingsEnabled().subscribe((enabled: boolean) => {
      this.developerModeEnabled = enabled
    })
  }

  public async pairWallet(): Promise<void> {
    const response: ExtensionMessageOutputPayload<Action.P2P_INIT> = await this.chromeMessagingService.sendChromeMessage(
      Action.P2P_INIT,
      undefined
    )
    console.log(response)

    const modal: HTMLIonModalElement = await this.modalController.create({
      component: AddWalletConnectionPage,
      componentProps: {
        handshakeData: response.data
          ? `tezos://?type=tzip10&data=${await new Serializer().serialize(response.data.qr)}`
          : JSON.stringify({})
      }
    })

    modal
      .onWillDismiss()
      .then(({ data: closeParent }) => {
        if (closeParent) {
          setTimeout(() => {
            this.dismiss()
          }, 500)
        }
      })
      .catch(error => console.error(error))

    return modal.present()
  }

  public async pairHardwareWallet(): Promise<void> {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: AddLedgerConnectionPage,
      componentProps: {
        targetMethod: Action.LEDGER_INIT
      }
    })

    modal
      .onWillDismiss()
      .then(({ data: closeParent }) => {
        if (closeParent) {
          setTimeout(() => {
            this.dismiss()
          }, 500)
        }
      })
      .catch(error => console.error(error))

    return modal.present()
  }

  public async toggleDeveloperMode(event: CustomEvent): Promise<void> {
    this.settingsService.setToggleDevSettingsEnabled(event.detail.checked)
  }

  public async pairLocalMnemonic(): Promise<void> {
    await this.dismiss()
    await this.router.navigate(['local-mnemonic'])
  }

  public async dismiss(): Promise<boolean> {
    return this.modalController.dismiss()
  }
}
