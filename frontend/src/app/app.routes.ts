import { Routes } from '@angular/router';
import { LobbyComponent } from './lobby/lobby.component';
import { VideoChatComponent } from './video-chat/video-chat.component';
import { DoctorDashboardComponent } from './doctor-dashboard/doctor-dashboard.component';

export const routes: Routes = [
  { path: '', component: LobbyComponent },
  { path: 'room/:roomId/:userId', component: VideoChatComponent },
  { path: 'doctor-dashboard', component: DoctorDashboardComponent }
];
