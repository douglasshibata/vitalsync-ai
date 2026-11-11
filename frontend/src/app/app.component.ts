import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VideoUploadComponent } from './video-upload/video-upload.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, VideoUploadComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App {}
