import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface MedicalTranscription {
  text: string;
  entities: string[];
  cidCodes: string[];
}

@Injectable({
  providedIn: 'root'
})
export class TranscriptionService {
  private transcriptionSubject = new Subject<MedicalTranscription>();
  transcription$ = this.transcriptionSubject.asObservable();

  // Simulated method to feed transcription data from the backend/AI engine
  updateTranscription(data: MedicalTranscription) {
    this.transcriptionSubject.next(data);
  }
}
