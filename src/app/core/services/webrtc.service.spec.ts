import { TestBed } from '@angular/core/testing';
import { WebRtcService } from './webrtc.service';
import { WebSocketService } from './websocket.service';

describe('WebRtcService', () => {
  let service: WebRtcService;
  let wsServiceSpy: jasmine.SpyObj<WebSocketService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('WebSocketService', ['send']);

    TestBed.configureTestingModule({
      providers: [WebRtcService, { provide: WebSocketService, useValue: spy }],
    });
    service = TestBed.inject(WebRtcService);
    wsServiceSpy = TestBed.inject(WebSocketService) as jasmine.SpyObj<WebSocketService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initLocalStream if supported', async () => {
    const mockTrack = {} as MediaStreamTrack;
    const mockStream = {
      getAudioTracks: () => [mockTrack],
      getVideoTracks: () => [mockTrack],
    } as unknown as MediaStream;

    // Using a spy on navigator.mediaDevices
    if (navigator.mediaDevices) {
      spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(Promise.resolve(mockStream));
      const stream = await service.initLocalStream();
      expect(stream).toBeDefined();
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    }
  });

  it('should toggle audio and video', () => {
    const mockTrackA = { enabled: true } as MediaStreamTrack;
    const mockTrackV = { enabled: true } as MediaStreamTrack;
    const mockStream = {
      getAudioTracks: () => [mockTrackA],
      getVideoTracks: () => [mockTrackV],
    } as unknown as MediaStream;

    (service as any).localStream = mockStream;

    service.toggleAudio(false);
    expect(mockTrackA.enabled).toBeFalse();

    service.toggleVideo(false);
    expect(mockTrackV.enabled).toBeFalse();
  });

  it('should close peer connection', () => {
    const pcSpy = jasmine.createSpyObj('RTCPeerConnection', ['close']);
    (service as any).peers.set('peer1', pcSpy);

    service.closePeer('peer1');
    expect(pcSpy.close).toHaveBeenCalled();
    expect((service as any).peers.has('peer1')).toBeFalse();
  });
});
