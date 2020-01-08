import { Component } from '@angular/core'

import { SettingsService } from '../../services/settings.service'
import { StorageService, SettingsKey } from 'src/app/services/storage.service'

@Component({
  selector: 'beacon-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss']
})
export class SettingsPage {
  constructor(public readonly settingsService: SettingsService, private readonly storageService: StorageService) { }

  public async resetPairedDevices() {
    this.storageService.delete(SettingsKey.COMMUNICATION_WALLET_PUBKEYS)
  }
}
