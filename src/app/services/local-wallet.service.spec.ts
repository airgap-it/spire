import { TestBed } from '@angular/core/testing'

import { LocalWalletService } from './local-wallet.service'

describe('LocalWalletService', () => {
  beforeEach(() => TestBed.configureTestingModule({}))

  it('should be created', () => {
    const service: LocalWalletService = TestBed.get(LocalWalletService)
    expect(service).toBeTruthy()
  })
})
