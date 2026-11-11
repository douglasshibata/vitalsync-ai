import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { TranscriptionService, MedicalTranscription } from '../transcription.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-intelligent-record',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatChipsModule, MatDividerModule, MatIconModule],
  template: `
    <mat-card class="record-card">
      <mat-card-header>
        <mat-card-title>Intelligent Medical Record</mat-card-title>
        <mat-card-subtitle>AI Copilot Active</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="section">
          <h3><mat-icon>chat</mat-icon> Live Transcription</h3>
          <p class="transcription-text">{{ transcription }}</p>
        </div>
        <mat-divider></mat-divider>
        <div class="section">
          <h3><mat-icon>assignment</mat-icon> Extracted Entities</h3>
          <mat-chip-set>
            <mat-chip *ngFor="let entity of entities" color="primary" selected>{{ entity }}</mat-chip>
          </mat-chip-set>
        </div>
        <mat-divider></mat-divider>
        <div class="section">
          <h3><mat-icon>local_hospital</mat-icon> CID-10 Mapping</h3>
          <div class="cid-codes">
            <span *ngFor="let code of cidCodes" class="cid-badge">{{ code }}</span>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .record-card { width: 100%; height: 100%; overflow-y: auto; }
    .section { padding: 10px 0; }
    h3 { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; color: #3f51b5; }
    .transcription-text { font-style: italic; color: #555; background: #fffde7; padding: 10px; border-radius: 4px; }
    .cid-badge { background: #e8f5e9; color: #2e7d32; padding: 4px 8px; border-radius: 12px; font-weight: bold; margin-right: 5px; }
  `]
})
export class IntelligentRecordComponent implements OnInit, OnDestroy {
  transcription = "Waiting for transcription...";
  entities: string[] = [];
  cidCodes: string[] = [];
  private subscription!: Subscription;

  constructor(private transcriptionService: TranscriptionService) {}

  ngOnInit() {
    this.subscription = this.transcriptionService.transcription$.subscribe(data => {
      this.transcription = data.text;
      this.entities = data.entities;
      this.cidCodes = data.cidCodes;
    });

    // Simulated initial data feed after 2 seconds
    setTimeout(() => {
        this.transcriptionService.updateTranscription({
            text: "Patient reports persistent fever and cough for 3 days. Also mentioned occasional headache.",
            entities: ["Fever", "Cough", "Headache"],
            cidCodes: ["R50.9 (Fever)", "R05 (Cough)", "R51 (Headache)"]
        });
    }, 2000);
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
