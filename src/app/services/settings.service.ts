import { Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  public readonly devSettingsEnabled: Observable<boolean> = of(false)

  constructor() {}
}
