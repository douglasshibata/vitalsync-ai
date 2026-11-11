import 'zone.js';
import 'zone.js/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { VideoChatComponent } from './video-chat.component';
import { PeerService } from '../peer.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi } from 'vitest';

class MockPeerService {
  localStream$ = new Subject<MediaStream | null>();
  remoteStream$ = new Subject<MediaStream | null>();
  isCallStarted$ = new Subject<boolean>();

  initPeer = vi.fn((id: string): Promise<string> => {
    if (id === 'testRoom') {
      return Promise.resolve(id);
    }
    return Promise.reject({ type: 'unavailable-id' });
  });
  enableCallAnswer = vi.fn();
  establishMediaCall = vi.fn();
  closeMediaCall = vi.fn();
}

class MockMediaStream {
  getTracks() {
    return [{ stop: () => {} }];
  }
  getAudioTracks() {
    return [{ enabled: true }];
  }
  getVideoTracks() {
    return [{ enabled: true }];
  }
}

describe('VideoChatComponent', () => {
  let component: VideoChatComponent;
  let fixture: ComponentFixture<VideoChatComponent>;
  let peerService: MockPeerService;
  let snackBar: MatSnackBar;

  const mockActivatedRoute = {
    snapshot: {
      paramMap: {
        get: (key: string) => {
          if (key === 'roomId') return 'testRoom';
          if (key === 'userId') return 'testUser';
          return null;
        }
      }
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ VideoChatComponent, NoopAnimationsModule ],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: PeerService, useClass: MockPeerService },
        { provide: MatSnackBar, useValue: { open: vi.fn() } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoChatComponent);
    component = fixture.componentInstance;
    peerService = TestBed.inject(PeerService) as unknown as MockPeerService;
    snackBar = TestBed.inject(MatSnackBar);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize as host', fakeAsync(() => {
    component.ngOnInit();
    tick();

    expect(peerService.initPeer).toHaveBeenCalledWith('testRoom');
    expect(component.peerId).toBe('testRoom');
    expect(peerService.enableCallAnswer).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Room created. Waiting for another user to join.', 'Close', { duration: 5000 });
  }));

  it('should initialize as guest', fakeAsync(() => {
    peerService.initPeer.mockImplementation((id: string) => {
        if (id === 'testRoom') {
            return Promise.reject({ type: 'unavailable-id' });
        }
        return Promise.resolve(id);
    });

    component.ngOnInit();
    tick();

    expect(peerService.initPeer).toHaveBeenCalledWith('testRoom');
    expect(peerService.initPeer).toHaveBeenCalledWith('testRoom-testUser');
    expect(snackBar.open).toHaveBeenCalledWith('Joining room...', 'Close', { duration: 3000 });
    expect(peerService.establishMediaCall).toHaveBeenCalledWith('testRoom');
  }));

  it('should toggle audio', () => {
    const mockStream = new MockMediaStream() as MediaStream;
    component.localVideo.nativeElement.srcObject = mockStream;
    const audioTracks = (component.localVideo.nativeElement.srcObject as MediaStream).getAudioTracks();

    component.toggleAudio();
    expect(audioTracks[0].enabled).toBe(false);
    expect(component.isMuted).toBe(true);

    component.toggleAudio();
    expect(audioTracks[0].enabled).toBe(true);
    expect(component.isMuted).toBe(false);
  });

  it('should toggle video', () => {
    const mockStream = new MockMediaStream() as MediaStream;
    component.localVideo.nativeElement.srcObject = mockStream;
    const videoTracks = (component.localVideo.nativeElement.srcObject as MediaStream).getVideoTracks();

    component.toggleVideo();
    expect(videoTracks[0].enabled).toBe(false);
    expect(component.isVideoOff).toBe(true);

    component.toggleVideo();
    expect(videoTracks[0].enabled).toBe(true);
    expect(component.isVideoOff).toBe(false);
  });

  it('should end call on destroy', () => {
    component.ngOnDestroy();
    expect(peerService.closeMediaCall).toHaveBeenCalled();
  });
});
