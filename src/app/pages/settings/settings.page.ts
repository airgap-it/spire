import { Component } from '@angular/core'

import { SettingsService } from '../../services/settings.service'
import { NetworkType, Network } from '@airgap/beacon-sdk/dist/messages/Messages'

@Component({
  selector: 'beacon-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss']
})
export class SettingsPage {
  public networkType: NetworkType = NetworkType.MAIN
  public networkName: string | undefined
  public networkRpcUrl: string | undefined

  constructor(public readonly settingsService: SettingsService) {
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

  public async updateNetwork(): Promise<void> {
    return this.settingsService.setNetwork({
      type: this.networkType,
      name: this.networkName,
      rpcUrl: this.networkRpcUrl
    })
  }
}
