import { Injectable } from '@angular/core'
import { ReplaySubject } from 'rxjs'
import { StorageKey, StorageService } from 'src/app/services/storage.service'

export enum SigningMethod {
  WALLET = 'WALLET',
  LEDGER = 'LEDGER',
  LOCAL_MNEMONIC = 'LOCAL_MNEMONIC'
}

@Injectable({
  providedIn: 'root'
})
export class SigningMethodService {
  public signingMethod: ReplaySubject<string> = new ReplaySubject(1)

  constructor(private readonly storageService: StorageService) {
    this.loadActiveSigningMethod()
  }

  public async loadActiveSigningMethod() {
    const signingMethod = await this.storageService.get(StorageKey.SIGNING_METHOD)
    if (signingMethod) {
      this.signingMethod.next(signingMethod)
    }
  }

  public async setSigningMethod(signingMethod: SigningMethod) {
    this.signingMethod.next(signingMethod)
    this.persistSigningMethod(signingMethod)
  }

  public async persistSigningMethod(signingMethod: string) {
    this.storageService.set(StorageKey.SIGNING_METHOD, signingMethod)
  }
}
