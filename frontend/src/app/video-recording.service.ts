import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VideoRecordingService {

  private mediaRecorder: MediaRecorder | null = null;
  private recordedBlobs: Blob[] = [];
  private readonly uploadUrl = environment.apiUrl + '/upload';

  constructor(private http: HttpClient) { }

  startRecording(stream: MediaStream) {
    this.recordedBlobs = [];
    this.mediaRecorder = new MediaRecorder(stream);
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedBlobs.push(event.data);
      }
    };
    this.mediaRecorder.start();
  }

  stopRecording(): Blob {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      const blob = new Blob(this.recordedBlobs, { type: 'video/webm' });
      return blob;
    }
    throw new Error('MediaRecorder not initialized');
  }

  uploadVideo(file: Blob): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, 'recorded-video.webm');

    const req = new HttpRequest('POST', this.uploadUrl, formData, {
      reportProgress: true
    });

    return this.http.request(req);
  }
}
