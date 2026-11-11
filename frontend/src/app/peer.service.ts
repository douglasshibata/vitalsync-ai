import { Injectable } from '@angular/core';
import Peer, { MediaConnection } from 'peerjs';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PeerService {
  private peer: Peer | null = null;
  private mediaCall: MediaConnection | null | undefined = null;

  private localStreamBs = new BehaviorSubject<MediaStream | null>(null);
  public localStream$ = this.localStreamBs.asObservable();
  private remoteStreamBs = new BehaviorSubject<MediaStream | null>(null);
  public remoteStream$ = this.remoteStreamBs.asObservable();

  private isCallStartedBs = new Subject<boolean>();
  public isCallStarted$ = this.isCallStartedBs.asObservable();

  public initPeer(userId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        this.peer = new Peer(userId);
        this.peer.on('open', (id) => {
          console.log('My peer ID is: ' + id);
          resolve(id);
        });
        this.peer.on('error', (err) => {
          console.error(err);
          reject(err);
        });
      } catch (err) {
        console.error(err);
        reject(err);
      }
    });
  }

  public async enableCallAnswer() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      this.localStreamBs.next(stream);
      this.peer?.on('call', async (call) => {
        this.mediaCall = call;
        this.isCallStartedBs.next(true);
        this.mediaCall.answer(stream);
        this.mediaCall.on('stream', (remoteStream) => {
          this.remoteStreamBs.next(remoteStream);
        });
        this.mediaCall.on('close', () => this.onCallClose());
      });
    } catch (err) {
      console.error(err);
    }
  }

  public async establishMediaCall(remotePeerId: string) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      this.localStreamBs.next(stream);
      const call = this.peer?.call(remotePeerId, stream);
      this.mediaCall = call;
      this.isCallStartedBs.next(true);
      this.mediaCall?.on('stream', (remoteStream) => {
        this.remoteStreamBs.next(remoteStream);
      });
      this.mediaCall?.on('close', () => this.onCallClose());
    } catch (err) {
      console.error(err);
    }
  }

  public closeMediaCall() {
    this.mediaCall?.close();
    this.onCallClose();
  }

  private onCallClose() {
    this.remoteStreamBs?.value?.getTracks().forEach(track => track.stop());
    this.localStreamBs?.value?.getTracks().forEach(track => track.stop());
    this.isCallStartedBs.next(false);
  }
}
