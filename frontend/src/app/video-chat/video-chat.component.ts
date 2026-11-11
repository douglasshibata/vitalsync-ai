import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PeerService } from '../peer.service';
import { Subscription } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-video-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './video-chat.component.html',
  styleUrls: ['./video-chat.component.scss']
})
export class VideoChatComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  roomId: string = '';
  peerId: string = '';

  private subscriptions = new Subscription();
  isCallStarted = false;
  isMuted = false;
  isVideoOff = false;

  private mediaRecorder!: MediaRecorder;
  private recordedChunks: Blob[] = [];
  isRecording = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly peerService: PeerService,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('roomId')!;
    const userId = this.route.snapshot.paramMap.get('userId')!;
    this.peerId = `${this.roomId}-${userId}`;

    this.subscriptions.add(this.peerService.localStream$.subscribe(stream => {
      if (stream && this.localVideo?.nativeElement) {
        this.localVideo.nativeElement.srcObject = stream;
      }
    }));

    this.subscriptions.add(this.peerService.remoteStream$.subscribe(stream => {
      if (stream && this.remoteVideo?.nativeElement) {
        this.remoteVideo.nativeElement.srcObject = stream;
      }
    }));

    this.subscriptions.add(this.peerService.isCallStarted$.subscribe(isStarted => {
      this.isCallStarted = isStarted;
      this.cdr.detectChanges();
    }));

    // Try to init peer as host
    this.peerService.initPeer(this.roomId).then(() => {
      this.peerId = this.roomId;
      this.peerService.enableCallAnswer();
      this.snackBar.open('Room created. Waiting for another user to join.', 'Close', { duration: 5000 });
    }).catch(err => {
      if (err.type === 'unavailable-id' || err.type === 'id-taken') {
        // ID is taken, so we are the guest.
        this.peerService.initPeer(this.peerId).then(() => {
          this.snackBar.open('Joining room...', 'Close', { duration: 3000 });
          this.peerService.establishMediaCall(this.roomId);
        }).catch(guestErr => {
          this.snackBar.open('Failed to join room.', 'Close', { duration: 3000 });
          console.error(guestErr);
        });
      } else {
        this.snackBar.open('An error occurred.', 'Close', { duration: 3000 });
        console.error(err);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.peerService.closeMediaCall();
  }

  endCall(): void {
    this.peerService.closeMediaCall();
  }

  toggleAudio(): void {
    const localStream = this.localVideo.nativeElement.srcObject as MediaStream;
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        this.isMuted = !audioTracks[0].enabled;
      }
    }
  }

  toggleVideo(): void {
    const localStream = this.localVideo.nativeElement.srcObject as MediaStream;
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled;
        this.isVideoOff = !videoTracks[0].enabled;
      }
    }
  }

  startRecording(): void {
    const remoteStream = this.remoteVideo.nativeElement.srcObject as MediaStream;
    if (!remoteStream || this.isRecording) return;

    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(remoteStream);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      this.downloadRecording();
    };

    this.mediaRecorder.start();
    this.isRecording = true;
    this.snackBar.open('Recording started.', 'Close', { duration: 3000 });
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.snackBar.open('Recording stopped and will be downloaded.', 'Close', { duration: 3000 });
    }
  }

  private downloadRecording(): void {
    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    a.download = `recording-${new Date().toISOString()}.webm`;
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
