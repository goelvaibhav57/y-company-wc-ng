import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { Role } from '../../../core/auth/auth.models';
import { ClaimService } from '../../claims/services/claim.service';
import { ClaimStatus } from '../../claims/models/claim.models';
import { ReviewService } from './review.service';

describe('ReviewService', () => {
  let reviewService: ReviewService;
  let claimService: ClaimService;
  let permissionAllowed: boolean;
  let authService: AuthService;

  beforeEach(async () => {
    localStorage.removeItem('eclaims.mock-session');
    permissionAllowed = true;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PermissionService, useValue: {
          hasRole: (role: Role) => role === Role.Adjuster,
          hasPermission: () => permissionAllowed
        } }
      ]
    });
    authService = TestBed.inject(AuthService);
    await firstValueFrom(authService.login('adjuster@example.com', 'Password123!'));
    claimService = TestBed.inject(ClaimService);
    reviewService = TestBed.inject(ReviewService);
  });

  afterEach(() => localStorage.removeItem('eclaims.mock-session'));

  it('approves an eligible claim and records adjuster and approval date', async () => {
    const result = await firstValueFrom(reviewService.approve('claim-1001', 'Approved at assessed amount.'));
    const claim = await firstValueFrom(claimService.getClaimById('claim-1001', authService.getCurrentUser()!));
    const history = claim ? await firstValueFrom(claimService.getClaimHistory(claim)) : [];

    expect(result.status).toBe(ClaimStatus.Approved);
    expect(claim?.approvedBy).toBe('Morgan Ellis');
    expect(claim?.approvalDate).toBeTruthy();
    expect(claim?.decisionRemarks).toBe('Approved at assessed amount.');
    expect(history.some((activity) => activity.action === 'Claim approved' && activity.user === 'Morgan Ellis')).toBeTrue();
  });

  it('rejects an eligible claim with required remarks and records history', async () => {
    const result = await firstValueFrom(reviewService.reject('claim-1007', 'Damage is outside policy coverage.'));
    const claim = await firstValueFrom(claimService.getClaimById('claim-1007', authService.getCurrentUser()!));
    const history = claim ? await firstValueFrom(claimService.getClaimHistory(claim)) : [];

    expect(result.status).toBe(ClaimStatus.Rejected);
    expect(claim?.decisionRemarks).toBe('Damage is outside policy coverage.');
    expect(history.some((activity) => activity.action === 'Claim rejected')).toBeTrue();
  });

  it('requests additional information with required remarks and records history', async () => {
    const result = await firstValueFrom(reviewService.requestAdditionalInformation('claim-1007', 'Please provide a repair estimate.'));
    const claim = await firstValueFrom(claimService.getClaimById('claim-1007', authService.getCurrentUser()!));
    const history = claim ? await firstValueFrom(claimService.getClaimHistory(claim)) : [];

    expect(result.status).toBe(ClaimStatus.AdditionalInformationRequired);
    expect(claim?.decisionRemarks).toBe('Please provide a repair estimate.');
    expect(history.some((activity) => activity.action === 'Additional information requested')).toBeTrue();
  });

  it('rejects invalid statuses and missing remarks', async () => {
    await expectAsync(firstValueFrom(reviewService.approve('claim-1005')))
      .toBeRejectedWithError('This claim is no longer eligible for adjuster review.');
    await expectAsync(firstValueFrom(reviewService.reject('claim-1007', '   ')))
      .toBeRejectedWithError('Remarks are required for this decision.');
    await expectAsync(firstValueFrom(reviewService.requestAdditionalInformation('claim-1007', '')))
      .toBeRejectedWithError('Remarks are required for this decision.');
  });

  it('enforces decision permissions and adjuster role', async () => {
    permissionAllowed = false;
    await expectAsync(firstValueFrom(reviewService.approve('claim-1001')))
      .toBeRejectedWithError('You do not have permission to perform this review action.');

    await firstValueFrom(authService.login('customer@example.com', 'Password123!'));
    await expectAsync(firstValueFrom(reviewService.approve('claim-1001')))
      .toBeRejectedWithError('You do not have permission to review claims.');
  });
});
