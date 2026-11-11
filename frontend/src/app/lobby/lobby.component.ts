import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <div class="lobby-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Join or Create a Room</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field>
            <mat-label>Your Name</mat-label>
            <input matInput [(ngModel)]="userName" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Room Name</mat-label>
            <input matInput [(ngModel)]="roomId" required />
          </mat-form-field>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="joinRoom()" [disabled]="!roomId">Enter Room</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .lobby-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    mat-card {
      width: 400px;
    }
    mat-form-field {
      width: 100%;
    }
  `]
})
export class LobbyComponent {
  userName: string = '';
  roomId: string = '';

  constructor(private router: Router) {}

  joinRoom() {
    if (!this.roomId) {
      return;
    }
    const userId = this.userName || this.generateId();
    this.router.navigate(['/room', this.roomId, userId]);
  }

  private generateId(): string {
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(36).padStart(2, '0')).join('').substring(0, 10);
  }
}
