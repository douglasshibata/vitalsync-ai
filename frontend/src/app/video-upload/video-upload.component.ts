import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { VideoRecordingService } from '../video-recording.service';
import { HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-video-upload',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './video-upload.component.html',
  styleUrls: ['./video-upload.scss']
})
export class VideoUploadComponent implements OnDestroy {
  isRecording = false;
  uploadProgress = 0;
  uploadMessage = '';
  private stream: MediaStream | null = null;

  constructor(private videoRecordingService: VideoRecordingService) {}

  async startRecording() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.videoRecordingService.startRecording(this.stream);
      this.isRecording = true;
      this.uploadMessage = '';
      this.uploadProgress = 0;
    } catch (err) {
      console.error('Error starting recording:', err);
      this.uploadMessage = 'Could not start recording. Please grant camera and microphone permissions.';
    }
  }

  stopRecordingAndUpload() {
    if (!this.stream) {
      return;
    }
    const videoBlob = this.videoRecordingService.stopRecording();
    this.isRecording = false;
    this.uploadMessage = 'Uploading...';

    this.videoRecordingService.uploadVideo(videoBlob).subscribe(event => {
      if (event.type === HttpEventType.UploadProgress) {
        if (event.total) {
          this.uploadProgress = Math.round(100 * (event.loaded / event.total));
        }
      } else if (event.type === HttpEventType.Response) {
        this.uploadMessage = 'Upload complete!';
      }
    }, error => {
      console.error('Upload error:', error);
      this.uploadMessage = 'Upload failed.';
    });

    // Stop the stream tracks
    this.stream.getTracks().forEach(track => track.stop());
    this.stream = null;
  }

  ngOnDestroy(): void {
    if (this.isRecording) {
      this.videoRecordingService.stopRecording();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }
}
