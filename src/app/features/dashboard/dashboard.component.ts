import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../core/auth/auth.service';
import { Permission } from '../../core/auth/auth.models';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { DashboardData, DashboardSummary } from './dashboard.models';
import { DashboardService } from './dashboard.service';

interface SummaryCard {
  readonly label: string;
  readonly value: number;
  readonly icon: string;
  readonly tone: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    HasPermissionDirective,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    PageHeaderComponent,
    RouterLink,
    StatusBadgeComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);

  readonly Permission = Permission;
  readonly dashboard = signal<DashboardData | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly displayedColumns = ['claimNumber', 'customer', 'vehicle', 'claimAmount', 'status', 'createdDate', 'action'];
  readonly summaryCards = computed(() => {
    const summary = this.dashboard()?.summary;
    return summary ? this.createSummaryCards(summary) : [];
  });
  readonly pageSubtitle = computed(() => {
    const user = this.authService.currentUser();
    const role = this.dashboard()?.role;
    if (!user || !role) {
      return 'A clear view of your claims workspace.';
    }

    const descriptions = {
      CUSTOMER: 'Track your claims and stay up to date on their progress.',
      SURVEYOR: 'Monitor assigned inspections and assessment progress.',
      ADJUSTER: 'Review claims and keep decisions moving.',
      WORKSHOP: 'Stay on top of assigned repairs and completions.'
    } as const;

    return `${descriptions[role]} Welcome, ${user.name}.`;
  });

  constructor() {
    this.loadDashboard();
  }

  loadDashboard(): void {
    const user = this.authService.getCurrentUser();
    this.errorMessage.set(null);
    this.loading.set(true);

    if (!user) {
      this.dashboard.set(null);
      this.errorMessage.set('Your dashboard is not available. Sign in and try again.');
      this.loading.set(false);
      return;
    }

    this.dashboardService.getDashboard(user.role, user.email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.dashboard.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.dashboard.set(null);
          this.errorMessage.set('We could not load your dashboard. Please try again.');
          this.loading.set(false);
        }
      });
  }

  private createSummaryCards(summary: DashboardSummary): readonly SummaryCard[] {
    return [
      { label: 'Total Claims', value: summary.totalClaims, icon: 'description', tone: 'blue' },
      { label: 'Pending', value: summary.pendingClaims, icon: 'schedule', tone: 'amber' },
      { label: 'In Progress', value: summary.inProgressClaims, icon: 'autorenew', tone: 'violet' },
      { label: 'Approved', value: summary.approvedClaims, icon: 'check_circle', tone: 'green' },
      { label: 'Rejected', value: summary.rejectedClaims, icon: 'cancel', tone: 'red' }
    ];
  }
}
