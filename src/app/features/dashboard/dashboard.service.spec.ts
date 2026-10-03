import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { Role } from '../../core/auth/auth.models';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let dashboardService: DashboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    dashboardService = TestBed.inject(DashboardService);
  });

  it('returns customer-only claims and customer workload metrics', async () => {
    const dashboard = await firstValueFrom(dashboardService.getDashboard(Role.Customer, 'customer@example.com'));

    expect(dashboard.role).toBe(Role.Customer);
    expect(dashboard.summary.totalClaims).toBe(4);
    expect(dashboard.recentClaims.every((claim) => claim.customerEmail === 'customer@example.com')).toBeTrue();
    expect(dashboard.workloadMetrics.map((metric) => metric.label)).toEqual([
      'My Claims', 'Pending Claims', 'Approved Claims'
    ]);
  });

  it('returns survey assignments and inspection metrics', async () => {
    const dashboard = await firstValueFrom(dashboardService.getDashboard(Role.Surveyor, 'surveyor@example.com'));

    expect(dashboard.summary.totalClaims).toBe(4);
    expect(dashboard.recentClaims.every((claim) => claim.assignedSurveyorEmail === 'surveyor@example.com')).toBeTrue();
    expect(dashboard.workloadMetrics.map((metric) => metric.label)).toEqual([
      'Assigned Claims', 'Pending Inspections', 'Completed Inspections'
    ]);
  });

  it('returns adjuster review workload including additional-information claims', async () => {
    const dashboard = await firstValueFrom(dashboardService.getDashboard(Role.Adjuster, 'adjuster@example.com'));

    expect(dashboard.summary.totalClaims).toBe(9);
    expect(dashboard.workloadMetrics.map((metric) => metric.label)).toEqual([
      'Claims Awaiting Review', 'Approved', 'Rejected', 'Additional Information Required'
    ]);
    expect(dashboard.workloadMetrics[3].value).toBe(1);
  });

  it('returns workshop repair assignments and completion metrics', async () => {
    const dashboard = await firstValueFrom(dashboardService.getDashboard(Role.Workshop, 'workshop@example.com'));

    expect(dashboard.summary.totalClaims).toBe(5);
    expect(dashboard.recentClaims.every((claim) => claim.assignedWorkshopEmail === 'workshop@example.com')).toBeTrue();
    expect(dashboard.workloadMetrics.map((metric) => metric.label)).toEqual([
      'Assigned Repairs', 'Repairs In Progress', 'Completed Repairs'
    ]);
  });

  it('returns zeroed summary data for a user with no matching claims', async () => {
    const dashboard = await firstValueFrom(dashboardService.getDashboard(Role.Customer, 'new.user@example.com'));

    expect(dashboard.summary).toEqual({
      totalClaims: 0,
      pendingClaims: 0,
      inProgressClaims: 0,
      approvedClaims: 0,
      rejectedClaims: 0
    });
    expect(dashboard.recentClaims).toEqual([]);
  });
});
