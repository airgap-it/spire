import { Network } from '@airgap/beacon-sdk/dist/messages/Messages'
import { Injectable } from '@angular/core'
import { Observable, ReplaySubject } from 'rxjs'

import { StorageKey, StorageService } from './storage.service'

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  public readonly _devSettingsEnabled: ReplaySubject<boolean> = new ReplaySubject(1)

  constructor(private readonly storageService: StorageService) {
    this.storageService
      .get(StorageKey.DEV_SETTINGS_ENABLED)
      .then((enabled: boolean) => this._devSettingsEnabled.next(enabled))
      .catch(console.error)
  }

  public async getNetwork(): Promise<Network | undefined> {
    return this.storageService.get(StorageKey.ACTIVE_NETWORK)
  }

  public async setNetwork(network: Network): Promise<void> {
    await this.storageService.set(StorageKey.ACTIVE_NETWORK, network)
  }

  public getDevSettingsEnabled(): Observable<boolean> {
    return this._devSettingsEnabled.asObservable()
  }

  public setToggleDevSettingsEnabled(value: boolean): void {
    this._devSettingsEnabled.next(value)
    this.storageService.set(StorageKey.DEV_SETTINGS_ENABLED, value).catch(console.error)
  }
}
