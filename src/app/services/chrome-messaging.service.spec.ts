import { TestBed } from '@angular/core/testing';

import { ChromeMessagingService } from './chrome-messaging.service';

describe('ChromeMessagingService', () => {
  let service: ChromeMessagingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChromeMessagingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
