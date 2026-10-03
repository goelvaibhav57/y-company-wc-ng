import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { Role, User } from '../../../core/auth/auth.models';
import { ClaimStatus } from '../../claims/models/claim.models';
import { ClaimService } from '../../claims/services/claim.service';
import { RepairStatus, WorkshopRepair } from '../models/workshop-repair.model';
import { WorkshopService } from './workshop.service';

describe('WorkshopService', () => {
  let service: WorkshopService;
  let claimService: ClaimService;
  let authService: AuthService;
  let workshopUser: User;

  const repairInput = (overrides: Partial<WorkshopRepair> = {}): WorkshopRepair => ({
    id: 'repair-claim-1003',
    claimId: 'claim-1003',
    repairStartDate: '2026-10-02',
    estimatedCompletionDate: '2026-10-10',
    actualCompletionDate: '',
    repairStatus: RepairStatus.InProgress,
    repairEstimate: 3200,
    workshopRemarks: 'Parts ordered and repair started.',
    ...overrides
  });

  beforeEach(async () => {
    localStorage.removeItem('eclaims.mock-session');
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    authService = TestBed.inject(AuthService);
    await firstValueFrom(authService.login('workshop@example.com', 'Password123!'));
    workshopUser = authService.getCurrentUser()!;
    claimService = TestBed.inject(ClaimService);
    service = TestBed.inject(WorkshopService);
  });

  afterEach(() => localStorage.removeItem('eclaims.mock-session'));

  it('loads a workshop-assigned approved claim and a repair draft', async () => {
    const loaded = await firstValueFrom(service.getRepairForClaim('claim-1003', workshopUser));

    expect(loaded.claim.status).toBe(ClaimStatus.Approved);
    expect(loaded.repair.repairStatus).toBe(RepairStatus.Assigned);
    expect(loaded.repair.repairEstimate).toBe(loaded.claim.claimAmount);
  });

  it('saves in-progress repairs and completes the repair lifecycle with a history entry', async () => {
    await firstValueFrom(service.saveRepair(repairInput(), workshopUser));
    const inProgressClaim = await firstValueFrom(claimService.getClaimById('claim-1003', workshopUser));
    expect(inProgressClaim?.status).toBe(ClaimStatus.RepairInProgress);

    const completed = await firstValueFrom(service.saveRepair(repairInput({
      repairStatus: RepairStatus.Completed,
      actualCompletionDate: '2026-10-09',
      workshopRemarks: 'Repairs completed and quality checked.'
    }), workshopUser));
    const completedClaim = await firstValueFrom(claimService.getClaimById('claim-1003', workshopUser));
    const history = completedClaim ? await firstValueFrom(claimService.getClaimHistory(completedClaim)) : [];

    expect(completed.claimStatus).toBe(ClaimStatus.RepairCompleted);
    expect(completed.repair.repairStatus).toBe(RepairStatus.Completed);
    expect(history.some((activity) => activity.action === 'Repair completed'
      && activity.user === workshopUser.name
      && activity.remarks === 'Repairs completed and quality checked.')).toBeTrue();
  });

  it('rejects negative estimates, missing actual completion date, and dates before start', async () => {
    await expectAsync(firstValueFrom(service.saveRepair(repairInput({ repairEstimate: -1 }), workshopUser)))
      .toBeRejectedWithError('Repair estimate cannot be negative.');
    await expectAsync(firstValueFrom(service.saveRepair(repairInput({ repairStatus: RepairStatus.Completed }), workshopUser)))
      .toBeRejectedWithError('Actual completion date is required to complete repairs.');
    await expectAsync(firstValueFrom(service.saveRepair(repairInput({ estimatedCompletionDate: '2026-10-01' }), workshopUser)))
      .toBeRejectedWithError('Estimated completion cannot be before the repair start date.');
  });

  it('rejects an assigned workshop user when claim status is no longer processable', async () => {
    await firstValueFrom(claimService.updateClaimStatus('claim-1003', ClaimStatus.Closed, 'Claims Team', 'Claim closed', 'Closed'));

    await expectAsync(firstValueFrom(service.getRepairForClaim('claim-1003', workshopUser)))
      .toBeRejectedWithError('You are not assigned to process this repair.');
  });

  it('denies users without the workshop role and permission', async () => {
    await firstValueFrom(authService.login('adjuster@example.com', 'Password123!'));
    const adjuster = authService.getCurrentUser()!;

    await expectAsync(firstValueFrom(service.getRepairForClaim('claim-1003', adjuster)))
      .toBeRejectedWithError('You are not assigned to process this repair.');
  });
});
