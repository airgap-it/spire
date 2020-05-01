import { TestBed } from '@angular/core/testing'

import { WalletService } from './local-wallet.service'

describe('LocalWalletService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: WalletService = TestBed.get(WalletService)
    expect(service).toBeTruthy()
  })
})
