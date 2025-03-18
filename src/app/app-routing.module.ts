import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ChatLandingComponent } from './chat-landing/chat-landing.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './auth.guard';
import { VerificationComponent } from './verification/verification.component';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'verify',
    component: VerificationComponent
  },
  {
    path: 'chat',
    component: ChatLandingComponent,
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: '/chat',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/chat'
  }
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
