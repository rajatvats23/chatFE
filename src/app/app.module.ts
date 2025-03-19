import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ChatLandingComponent } from './chat-landing/chat-landing.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './login/login.component';
import { CommonModule } from '@angular/common';
import { AuthInterceptor } from './auth.interceptor';
import { VerificationComponent } from './verification/verification.component';

const socketConfig: SocketIoConfig = {
  url: 'http://your-socket-server-url', // Replace with your actual Socket.IO server URL
  options: {
    transports: ['websocket'],
    autoConnect: true,
    // Add any other Socket.IO options you need
  }
};


@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    ChatLandingComponent,
    LoginComponent,
    VerificationComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SocketIoModule.forRoot(socketConfig)
  ],providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }],
  bootstrap: [AppComponent]
})
export class AppModule { }
