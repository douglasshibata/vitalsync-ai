import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { IntelligentRecordComponent } from '../intelligent-record/intelligent-record.component';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatGridListModule, MatIconModule, IntelligentRecordComponent],
  template: `
    <div class="dashboard-container">
      <mat-grid-list cols="4" rowHeight="200px" gutterSize="16px">
        <!-- Vitals Monitoring -->
        <mat-grid-tile colspan="1">
          <mat-card class="vitals-card" [class.alert]="heartRate > 100">
            <mat-card-header>
              <mat-card-title>Heart Rate</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="vital-value">{{ heartRate }} <span>BPM</span></div>
              <mat-icon color="warn">favorite</mat-icon>
            </mat-card-content>
          </mat-card>
        </mat-grid-tile>

        <mat-grid-tile colspan="1">
          <mat-card class="vitals-card" [class.alert]="spO2 < 95">
            <mat-card-header>
              <mat-card-title>SpO2</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="vital-value">{{ spO2 }} <span>%</span></div>
              <mat-icon color="primary">opacity</mat-icon>
            </mat-card-content>
          </mat-card>
        </mat-grid-tile>

        <!-- Video Stream Placeholder -->
        <mat-grid-tile colspan="2" rowspan="2">
          <mat-card class="video-card">
            <mat-card-header>
              <mat-card-title>Patient Video Feed</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="video-placeholder">
                 <mat-icon class="large-icon">videocam</mat-icon>
                 <p>Secure WebRTC Stream Active</p>
              </div>
            </mat-card-content>
          </mat-card>
        </mat-grid-tile>

        <!-- Intelligent Record -->
        <mat-grid-tile colspan="2" rowspan="2">
          <app-intelligent-record></app-intelligent-record>
        </mat-grid-tile>
      </mat-grid-list>
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 20px; background-color: #f5f5f5; height: 100vh; }
    .vitals-card { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: background 0.3s; }
    .vitals-card.alert { background-color: #ffebee; border: 2px solid #f44336; }
    .vital-value { font-size: 3rem; font-weight: bold; }
    .vital-value span { font-size: 1rem; color: #666; }
    .video-card { width: 100%; height: 100%; background: #000; color: #fff; }
    .video-placeholder { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .large-icon { font-size: 64px; width: 64px; height: 64px; margin-bottom: 10px; }
  `]
})
export class DoctorDashboardComponent implements OnInit {
  heartRate = 75;
  spO2 = 98;

  ngOnInit() {
    this.simulateVitals();
  }

  simulateVitals() {
    setInterval(() => {
      this.heartRate = Math.floor(Math.random() * (110 - 70 + 1)) + 70;
      this.spO2 = Math.floor(Math.random() * (100 - 92 + 1)) + 92;
    }, 3000);
  }
}
