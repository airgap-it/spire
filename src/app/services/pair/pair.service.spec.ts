import { TestBed } from '@angular/core/testing';

import { PairService } from './pair.service';

describe('PairService', () => {
  let service: PairService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PairService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
