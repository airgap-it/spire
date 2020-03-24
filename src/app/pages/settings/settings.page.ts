import { Network, NetworkType } from '@airgap/beacon-sdk/dist/messages/Messages'
import { Component } from '@angular/core'
import { ToastController } from '@ionic/angular'

import { SettingsService } from '../../services/settings.service'

@Component({
  selector: 'beacon-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss']
})
export class SettingsPage {
  public networkType: NetworkType = NetworkType.MAINNET
  public networkName: string | undefined
  public networkRpcUrl: string | undefined

  constructor(public readonly settingsService: SettingsService, private readonly toastController: ToastController) {
    this.settingsService
      .getNetwork()
      .then((network: Network | undefined) => {
        if (network) {
          this.networkType = network.type
          this.networkName = network.name
          this.networkRpcUrl = network.rpcUrl
        }
      })
      .catch(console.error)
  }

  public async updateNetworkType() {
    if (this.networkType === NetworkType.CUSTOM) {
      return
    } else {
      this.updateNetwork()
    }
  }

  public async updateNetwork(): Promise<void> {
    return this.settingsService
      .setNetwork({
        type: this.networkType,
        name: this.networkName,
        rpcUrl: this.networkRpcUrl
      })
      .then(async () => {
        const toast = await this.toastController.create({ message: 'Network updated', duration: 1000 })

        return toast.present()
      })
  }
}
