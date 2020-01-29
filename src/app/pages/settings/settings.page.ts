import { Component } from '@angular/core'
import { SettingsKey, StorageService } from 'src/app/services/storage.service'

import { SettingsService } from '../../services/settings.service'

@Component({
  selector: 'beacon-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss']
})
export class SettingsPage {
  constructor(public readonly settingsService: SettingsService, private readonly storageService: StorageService) {}

  public async resetPairedDevices() {
    this.storageService.delete(SettingsKey.COMMUNICATION_WALLET_PUBKEYS)
  }
}
