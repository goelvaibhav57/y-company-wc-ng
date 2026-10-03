import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { Role, User } from '../../../core/auth/auth.models';
import { ClaimService } from '../../claims/services/claim.service';
import { ClaimStatus } from '../../claims/models/claim.models';
import { DamageSeverity, SurveyAssessmentInput } from '../models/survey-assessment.model';
import { SurveyService } from './survey.service';

describe('SurveyService', () => {
  let service: SurveyService;
  let claimService: ClaimService;
  const surveyor: User = {
    id: 'user-surveyor', name: 'Taylor Reed', email: 'surveyor@example.com', role: Role.Surveyor, token: 'mock-token'
  };
  const assessment: SurveyAssessmentInput = {
    claimId: 'claim-1002',
    inspectionDate: '2026-10-02',
    damageDescription: 'Front windshield cracked and requires replacement.',
    damageSeverity: DamageSeverity.Moderate,
    estimatedRepairCost: 1250,
    recommendedAction: 'Replace vehicle',
    surveyorRemarks: 'No other damage observed.',
    submittedBy: surveyor.email
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SurveyService);
    claimService = TestBed.inject(ClaimService);
  });

  it('saves drafts without changing the claim workflow status', async () => {
    const draft = await firstValueFrom(service.saveDraft(assessment, surveyor));
    const claim = await firstValueFrom(claimService.getClaimById('claim-1002', surveyor));

    expect(draft.status).toBe('DRAFT');
    expect(draft.submittedBy).toBe(surveyor.email);
    expect(claim?.status).toBe(ClaimStatus.SurveyAssigned);
    expect(await firstValueFrom(service.getAssessment('claim-1002', surveyor))).toEqual(draft);
  });

  it('submits an assessment, marks the claim survey-completed, and appends history', async () => {
    const result = await firstValueFrom(service.submitAssessment(assessment, surveyor));
    const claim = await firstValueFrom(claimService.getClaimById('claim-1002', surveyor));
    const history = claim ? await firstValueFrom(claimService.getClaimHistory(claim)) : [];

    expect(result.status).toBe('SUBMITTED');
    expect(claim?.status).toBe(ClaimStatus.SurveyCompleted);
    expect(history.some((event) => event.action === 'Survey completed' && event.user === surveyor.name)).toBeTrue();
  });

  it('rejects users who are not assigned surveyors', async () => {
    const unassignedSurveyor: User = { ...surveyor, email: 'other.surveyor@example.com' };

    await expectAsync(firstValueFrom(service.saveDraft(assessment, unassignedSurveyor)))
      .toBeRejectedWithError('You are not assigned to assess this claim.');
    await expectAsync(firstValueFrom(service.submitAssessment(assessment, unassignedSurveyor)))
      .toBeRejectedWithError('You are not assigned to assess this claim.');
  });
});
