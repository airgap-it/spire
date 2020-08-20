import { Component } from '@angular/core'

import { ProtocolsService } from './services/protocols.service'
import { SettingsService } from './services/settings.service'

export function isUnknownObject(x: unknown): x is { [key in PropertyKey]: unknown } {
  return x !== null && typeof x === 'object'
}

interface MenuItem {
  title: string
  url: string
  icon: string
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  public appPages: MenuItem[] = []

  constructor(private readonly settingsService: SettingsService, private readonly protocolsService: ProtocolsService) {
    this.initializeApp()
  }

  public initializeApp(): void {
    const menu: MenuItem[] = [
      {
        title: 'Overview',
        url: '/home',
        icon: 'layers-outline'
      },
      {
        title: 'Permissions',
        url: '/permission-list',
        icon: 'options-outline'
      },
      {
        title: 'Settings',
        url: '/settings',
        icon: 'settings-outline'
      }
    ]

    this.settingsService.getDevSettingsEnabled().subscribe((enabled: boolean) => {
      this.appPages = [...menu]

      if (enabled) {
        this.appPages.push({
          title: 'Local Secret',
          url: '/local-mnemonic',
          icon: 'key-outline'
        })
      }
    })

    this.protocolsService.init()
  }
}
