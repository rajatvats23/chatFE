// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface VerifyRequest {
  verifyToken: string;
  otp: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceToken: string;
  deviceType: number;
}

export interface LoginResponse {
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
  role: Role
  pharmacyId: string
  dob: string
  gender: any
  maritalStatus: any
  profilePic: string
  address: Address
  assignClientsToNurse: any[]
  documentRequiredForRenewal: any[]
  primaryLicenseInfo: PrimaryLicenseInfo
  additinalLicenceInfo: AdditinalLicenceInfo[]
  payroll: Payroll
  deviceType: string
  deviceToken: string
  isLogin: boolean
  socketId: string
  isDeleted: boolean
  isBlocked: boolean
  createdBy: string
  updatedBy: string
  uniqueId: string
  payrollHistory: any[]
  createdAt: string
  updatedAt: string
  __v: number
  schedule: Schedule
  otpExpiry: string
  verifyToken: string
}

export interface Contact {
  countryCode: string
  mobileNumber: string
}

export interface Role {
  _id: string
  name: string
  isDeleted: boolean
  isBlocked: boolean
  createdBy: string
  updatedBy: string
  uniqueId: string
  createdAt: string
  updatedAt: string
}

export interface Address {
  address: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface PrimaryLicenseInfo {
  stateLicense: string
  licenseNumber: string
}

export interface AdditinalLicenceInfo {
  stateLicense: string
  licenseNumber: string
  _id: string
}

export interface Payroll {
  incentivePay: string
  payingBy: string
  nurseVisitHourlyRate: number
  payingFrequency: string
  mileageReimbursement: string
}

export interface Schedule {
  weekDays: number[]
  isOnDuty: boolean
  startTime: string
  endTime: string
}

@Injectable({
    providedIn: 'root'
  })
export class AuthService {
  private apiUrl = 'http://dev-api.superiornursingpllc.com/api/auth';
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';
  private userKey = 'user_data';

  // BehaviorSubject to track authenticated state
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // BehaviorSubject to store current user
  private currentUserSubject = new BehaviorSubject<any>(this.getUserFromStorage());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => this.handleLoginSuccess(response)),
        catchError(error => this.handleError(error))
      );
  }

  verify(verifyData: VerifyRequest): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/verify`, verifyData)
      .pipe(
        tap(response => {
          // Handle successful verification if needed
          // You might want to update user status or store additional data
        }),
        catchError(error => this.handleError(error))
      );
  }

  logout(): void {
    // Clear local storage
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);

    // Update authentication state
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);

    // Redirect to login
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  getCurrentUser(): any {
    return this.getUserFromStorage();
  }

  private handleLoginSuccess(response: LoginResponse): void {
    // Store token and user data
    localStorage.setItem(this.tokenKey, response.response.verifyToken); // Using verifyToken for now
    
    // Create a user object to store
    const user = {
      id: response.response._id,
      name: `${response.response.firstName} ${response.response.lastName}`,
      email: response.response.email,
      role: response.response.role.name,
      profilePic: response.response.profilePic
    };
    
    localStorage.setItem(this.userKey, JSON.stringify(user));
    
    // Update authentication state
    this.isAuthenticatedSubject.next(true);
    this.currentUserSubject.next(user);
  }

  private hasValidToken(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    // In a real application, you might want to check if the token is expired
    return !!token;
  }

  private getUserFromStorage(): any {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Error Code: ${error.status}`;
    }

    return throwError(() => errorMessage);
  }
}