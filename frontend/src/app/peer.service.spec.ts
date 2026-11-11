import { TestBed } from '@angular/core/testing';
import { PeerService } from './peer.service';
import { vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';

// Mock MediaStream
class MockMediaStream {
  getTracks() {
    return [{ stop: vi.fn() }];
  }
}
vi.stubGlobal('MediaStream', MockMediaStream);

// Mock PeerJS
vi.mock('peerjs', () => ({
  default: class MockPeer {
    on = vi.fn((event: string, cb: (id?: string) => void) => {
      if (event === 'open') {
        cb('test-id');
      }
    });
    call = vi.fn(() => ({
      on: vi.fn(),
      answer: vi.fn(),
      close: vi.fn(),
    }));
    destroy = vi.fn();
  }
}));


// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: () => Promise.resolve(new MediaStream()),
  },
  writable: true
});

describe('PeerService', () => {
  let service: PeerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PeerService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize peer', async () => {
    const id = await service.initPeer('test-user');
    expect(id).toBe('test-id');
  });

  it('should handle enableCallAnswer', async () => {
    await service.initPeer('test-user');
    const getUserMediaSpy = vi.spyOn(navigator.mediaDevices, 'getUserMedia');

    await service.enableCallAnswer();

    expect(getUserMediaSpy).toHaveBeenCalledWith({
      video: true,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    service.localStream$.subscribe(stream => {
      expect(stream).toBeTruthy();
    });
  });

  it('should handle establishMediaCall', async () => {
    await service.initPeer('test-user');
    const getUserMediaSpy = vi.spyOn(navigator.mediaDevices, 'getUserMedia');

    await service.establishMediaCall('remote-user');

    expect(getUserMediaSpy).toHaveBeenCalledWith({
      video: true,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    service.localStream$.subscribe(stream => {
      expect(stream).toBeTruthy();
    });
    service.isCallStarted$.subscribe(isStarted => {
      expect(isStarted).toBe(true);
    });
  });

  it('should close media call', async () => {
    await service.initPeer('test-user');
    // Manually set the localStreamBs to a mock MediaStream
    (service as any).localStreamBs = new BehaviorSubject<MediaStream | null>(new MockMediaStream() as unknown as MediaStream);
    await service.establishMediaCall('remote-user');

    const onCallCloseSpy = vi.spyOn(service as any, 'onCallClose');

    service.closeMediaCall();

    expect(onCallCloseSpy).toHaveBeenCalled();
    service.isCallStarted$.subscribe(isStarted => {
      expect(isStarted).toBe(false);
    });
  });
});
