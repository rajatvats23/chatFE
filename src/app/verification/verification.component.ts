// verification.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService, VerifyRequest } from '../auth.service';

@Component({
  selector: 'app-verification',
  templateUrl: './verification.component.html',
  styleUrls: ['./verification.component.scss']
})
export class VerificationComponent implements OnInit {
  verifyForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  verifyToken = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Get the verify token from route params
    this.route.queryParams.subscribe(params => {
      this.verifyToken = params['token'] || '';
      if (!this.verifyToken) {
        this.router.navigate(['/login']);
      }
    });

    // Initialize the form
    this.verifyForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]]
    });
  }

  onSubmit(): void {
    if (this.verifyForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const verifyRequest: VerifyRequest = {
      verifyToken: this.verifyToken,
      otp: this.verifyForm.get('otp')?.value
    };

    this.authService.verify(verifyRequest)
      .pipe(
        finalize(() => this.isSubmitting = false)
      )
      .subscribe({
        next: () => {
          // Navigate to the protected area after successful verification
          this.router.navigate(['/chat']);
        },
        error: (error) => {
          this.errorMessage = typeof error === 'string'
            ? error
            : 'Invalid verification code. Please try again.';
        }
      });
  }

  // Form helper
  get otpControl() { return this.verifyForm.get('otp'); }

  get otpError(): string {
    const control = this.otpControl;
    if (!control || !control.errors || !control.touched) return '';
    
    if (control.errors['required']) return 'Verification code is required';
    if (control.errors['pattern']) return 'Please enter a valid 4-digit code';
    
    return 'Invalid verification code';
  }
}