import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { Role, User } from '../../core/auth/auth.models';
import { ClaimStatus } from '../claims/models/claim.models';
import { ClaimService } from '../claims/services/claim.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let dashboardService: DashboardService;
  let claimService: ClaimService;
  const user = (role: Role, email: string): User => ({ id: role, name: role, email, role, token: 'test-token' });

  beforeEach(() => {
    TestBed.configureTestingModule({});
    dashboardService = TestBed.inject(DashboardService);
    claimService = TestBed.inject(ClaimService);
  });

  it('returns customer-only claims and customer workload metrics', async () => {
    const dashboard = await firstValueFrom(dashboardService.getDashboard(user(Role.Customer, 'customer@example.com')));

    expect(dashboard.role).toBe(Role.Customer);
    expect(dashboard.summary.totalClaims).toBe(5);
    expect(dashboard.recentClaims.every((claim) => claim.customerEmail === 'customer@example.com')).toBeTrue();
    expect(dashboard.workloadMetrics.map((metric) => metric.label)).toEqual([
      'My Claims', 'Pending Claims', 'Approved Claims'
    ]);
  });

  it('returns survey assignments and inspection metrics', async () => {
    const dashboard = await firstValueFrom(dashboardService.getDashboard(user(Role.Surveyor, 'surveyor@example.com')));

    expect(dashboard.summary.totalClaims).toBe(4);
    expect(dashboard.recentClaims.every((claim) => claim.assignedSurveyorEmail === 'surveyor@example.com')).toBeTrue();
    expect(dashboard.workloadMetrics.map((metric) => metric.label)).toEqual([
      'Assigned Claims', 'Pending Inspections', 'Completed Inspections'
    ]);
  });

  it('returns adjuster review workload including additional-information claims', async () => {
    const dashboard = await firstValueFrom(dashboardService.getDashboard(user(Role.Adjuster, 'adjuster@example.com')));

    expect(dashboard.summary.totalClaims).toBe(9);
    expect(dashboard.workloadMetrics.map((metric) => metric.label)).toEqual([
      'Claims Awaiting Review', 'Approved', 'Rejected', 'Additional Information Required'
    ]);
    expect(dashboard.workloadMetrics[3].value).toBe(1);
  });

  it('returns workshop repair assignments and completion metrics', async () => {
    const dashboard = await firstValueFrom(dashboardService.getDashboard(user(Role.Workshop, 'workshop@example.com')));

    expect(dashboard.summary.totalClaims).toBe(5);
    expect(dashboard.recentClaims.every((claim) => claim.assignedWorkshopEmail === 'workshop@example.com')).toBeTrue();
    expect(dashboard.workloadMetrics.map((metric) => metric.label)).toEqual([
      'Assigned Repairs', 'Repairs In Progress', 'Completed Repairs'
    ]);
  });

  it('returns zeroed summary data for a user with no matching claims', async () => {
    const dashboard = await firstValueFrom(dashboardService.getDashboard(user(Role.Customer, 'new.user@example.com')));

    expect(dashboard.summary).toEqual({
      totalClaims: 0,
      pendingClaims: 0,
      inProgressClaims: 0,
      approvedClaims: 0,
      rejectedClaims: 0
    });
    expect(dashboard.recentClaims).toEqual([]);
  });

  it('reflects claim status changes from the shared workflow service', async () => {
    const adjuster = user(Role.Adjuster, 'adjuster@example.com');
    const before = await firstValueFrom(dashboardService.getDashboard(adjuster));
    await firstValueFrom(claimService.updateClaimStatus('claim-1001', ClaimStatus.Approved, adjuster.name));
    const after = await firstValueFrom(dashboardService.getDashboard(adjuster));

    expect(after.summary.approvedClaims).toBe(before.summary.approvedClaims + 1);
    expect(after.recentClaims.find((claim) => claim.id === 'claim-1001')?.status).toBe(ClaimStatus.Approved);
  });
});
