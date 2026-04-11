import { TestBed } from '@angular/core/testing';
import { WebSocketService } from './websocket.service';

describe('WebSocketService', () => {
  let service: WebSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WebSocketService]
    });
    service = TestBed.inject(WebSocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should verify not connected initially', () => {
    expect(service.isConnected()).toBeFalse();
  });

  it('should handle disconnect cleanly', () => {
    // Should run without throwing errors even if client is not instantiated
    service.disconnect();
    expect(service.isConnected()).toBeFalse();
  });
});
