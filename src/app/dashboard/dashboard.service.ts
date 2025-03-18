// dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, retry, map, tap } from 'rxjs/operators';

export interface DashboardItem {
  id: number;
  title: string;
  description: string;
  status: 'active' | 'inactive' | 'warning' | 'error';
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = '/api/dashboard'; // Replace with your actual API endpoint
  
  constructor(private http: HttpClient) { }
  
  getDashboardData(): Observable<DashboardItem[]> {
    return this.http.get<DashboardItem[]>(this.apiUrl)
      .pipe(
        retry(2), // Retry failed requests up to 2 times
        map(items => {
          // Convert string dates to Date objects
          return items.map(item => ({
            ...item,
            lastUpdated: new Date(item.lastUpdated)
          }));
        }),
        tap(data => console.log('Dashboard data fetched', data)),
        catchError(this.handleError)
      );
  }
  
  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      // A client-side or network error occurred
      console.error('A network error occurred:', error.error);
    } else {
      // The backend returned an unsuccessful response code
      console.error(
        `Backend returned code ${error.status}, body was:`, 
        error.error
      );
    }
    
    // Return mock data for development
    if (error.status === 404 || error.status === 0) {
      console.warn('Using mock data due to API error');
      return of(this.getMockData());
    }
    
    // Otherwise, return an observable with a user-facing error message
    return throwError(() => 
      new Error('Unable to fetch dashboard data. Please try again later.')
    );
  }
  
  private getMockData(): DashboardItem[] {
    return [
      {
        id: 1,
        title: 'System Status',
        description: 'Overall system health check',
        status: 'active',
        lastUpdated: new Date()
      },
      {
        id: 2,
        title: 'Database Connection',
        description: 'Database connectivity status',
        status: 'active',
        lastUpdated: new Date()
      },
      {
        id: 3,
        title: 'API Services',
        description: 'External API service status',
        status: 'warning',
        lastUpdated: new Date(Date.now() - 86400000) // 1 day ago
      },
      {
        id: 4,
        title: 'Storage Usage',
        description: 'Server storage capacity',
        status: 'error',
        lastUpdated: new Date(Date.now() - 172800000) // 2 days ago
      },
      {
        id: 5,
        title: 'User Activity',
        description: 'Recent user login activity',
        status: 'inactive',
        lastUpdated: new Date(Date.now() - 259200000) // 3 days ago
      }
    ];
  }
}