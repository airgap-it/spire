import { Component } from '@angular/core'

import { SettingsService } from '../../services/settings.service'

@Component({
  selector: 'beacon-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss']
})
export class SettingsPage {
  constructor(public readonly settingsService: SettingsService) {}
}
