import { Injectable } from '@angular/core'
import { Observable, ReplaySubject } from 'rxjs'
import { take } from 'rxjs/operators'

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

  public getDevSettingsEnabled(): Observable<boolean> {
    return this._devSettingsEnabled.asObservable()
  }

  public toggleDevSettingsEnabled(): void {
    this.getDevSettingsEnabled()
      .pipe(take(1))
      .subscribe(async (enabled: boolean) => {
        this._devSettingsEnabled.next(!enabled)
        await this.storageService.set(StorageKey.DEV_SETTINGS_ENABLED, !enabled)
      })
  }
}
