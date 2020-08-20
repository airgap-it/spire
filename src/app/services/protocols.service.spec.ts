import { TestBed } from '@angular/core/testing'

import { ProtocolsService } from './protocols.service'

describe('ProtocolsService', () => {
  let service: ProtocolsService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(ProtocolsService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
