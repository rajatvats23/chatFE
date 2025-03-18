// login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService, LoginRequest } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  isPasswordVisible = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/chat']);
      return;
    }

    // Initialize login form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    // Prepare login request
    const loginRequest: LoginRequest = {
      email: this.loginForm.get('email')?.value,
      password: this.loginForm.get('password')?.value,
      deviceToken: this.generateDeviceToken(),
      deviceType: this.getDeviceType()
    };

    // In login.component.ts, update the onSubmit method's success handler
    this.authService.login(loginRequest)
      .pipe(
        finalize(() => this.isSubmitting = false)
      )
      .subscribe({
        next: (response) => {
          // Store remember me preference if checked
          if (this.loginForm.get('rememberMe')?.value) {
            localStorage.setItem('remember_email', loginRequest.email);
          }

          // Navigate to verification page with the necessary token
          this.router.navigate(['/verify'], {
            queryParams: {
              token: response.response.verifyToken
            }
          });
        },
        error: (error) => {
          this.errorMessage = typeof error === 'string'
            ? error
            : 'Invalid email or password. Please try again.';
        }
      });
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  // Helper methods
  private generateDeviceToken(): string {
    // In a real application, you would use a device token from a push notification service
    // For now, generate a random string as a placeholder
    return 'web_' + Math.random().toString(36).substring(2, 15);
  }

  private getDeviceType(): number {
    // 0 for Web, 1 for Android, 2 for iOS (example)
    return 0; // Web
  }

  // Form helpers
  get emailControl() { return this.loginForm.get('email'); }
  get passwordControl() { return this.loginForm.get('password'); }
  get rememberMeControl() { return this.loginForm.get('rememberMe'); }

  get emailError(): string {
    const control = this.emailControl;
    if (!control || !control.errors || !control.touched) return '';

    if (control.errors['required']) return 'Email is required';
    if (control.errors['email']) return 'Please enter a valid email address';

    return 'Invalid email';
  }

  get passwordError(): string {
    const control = this.passwordControl;
    if (!control || !control.errors || !control.touched) return '';

    if (control.errors['required']) return 'Password is required';
    if (control.errors['minlength']) return 'Password must be at least 6 characters';

    return 'Invalid password';
  }
}