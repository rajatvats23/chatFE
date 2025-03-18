// dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, map } from 'rxjs';

interface DashboardItem {
  id: number;
  title: string;
  description: string;
  status: 'active' | 'inactive' | 'warning' | 'error';
  lastUpdated: Date;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  dashboardItems: DashboardItem[] = [];
  loading = true;
  error = false;
  
  // Stats summary
  totalItems = 0;
  activeItems = 0;
  warningItems = 0;
  errorItems = 0;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.fetchDashboardData();
  }

  fetchDashboardData(): void {
    this.getDashboardData().subscribe({
      next: (data) => {
        this.dashboardItems = data;
        this.calculateStats();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching dashboard data:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  getDashboardData(): Observable<DashboardItem[]> {
    // Replace with your actual API endpoint
    return this.http.get<DashboardItem[]>('/api/dashboard')
      .pipe(
        map(items => {
          // Convert string dates to Date objects
          return items.map(item => ({
            ...item,
            lastUpdated: new Date(item.lastUpdated)
          }));
        }),
        catchError(error => {
          // Return mock data for development or if API fails
          console.warn('Using mock data due to API error:', error);
          return of(this.getMockData());
        })
      );
  }

  calculateStats(): void {
    this.totalItems = this.dashboardItems.length;
    this.activeItems = this.dashboardItems.filter(item => item.status === 'active').length;
    this.warningItems = this.dashboardItems.filter(item => item.status === 'warning').length;
    this.errorItems = this.dashboardItems.filter(item => item.status === 'error').length;
  }

  refreshData(): void {
    this.loading = true;
    this.fetchDashboardData();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'warning': return 'status-warning';
      case 'error': return 'status-error';
      default: return '';
    }
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