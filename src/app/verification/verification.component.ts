// verification.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService, VerifyRequest } from '../auth.service';

export interface VerificationInterface {
  message: string
  response: Response
}

export interface Response {
  _id: string
  firstName: string
  lastName: string
  email: string
  password: string
  contact: Contact
  pharmacyId: any
  dob: string
  profilePic: string
  address: Address
  deviceType: string
  deviceToken: string
  isLogin: boolean
  socketId: string
  isDeleted: boolean
  isBlocked: boolean
  createdBy: any
  updatedBy: string
  uniqueId: string
  licenseInfo: any[]
  payrollHistory: any[]
  createdAt: string
  updatedAt: string
  __v: number
  role: string
  token: string
}

export interface Contact {
  countryCode: string
  mobileNumber: string
}

export interface Address {
  address: string
  city: string
  state: string
  zipCode: string
  country: string
}


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
        next: (response: VerificationInterface) => {
          this.authService.saveTokenAfterVerify(response.response.token);
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