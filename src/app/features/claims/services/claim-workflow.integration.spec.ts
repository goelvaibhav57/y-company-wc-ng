import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../core/auth/auth.models';
import { ClaimStatus, CreateClaimRequest } from '../models/claim.models';
import { ClaimService } from './claim.service';
import { SurveyService } from '../../survey/services/survey.service';
import { DamageSeverity } from '../../survey/models/survey-assessment.model';
import { ReviewService } from '../../review/services/review.service';
import { WorkshopService } from '../../workshop/services/workshop.service';
import { RepairStatus } from '../../workshop/models/workshop-repair.model';

describe('claim workflow integration', () => {
  beforeEach(() => {
    localStorage.removeItem('eclaims.mock-session');
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => {
    localStorage.removeItem('eclaims.mock-session');
    TestBed.resetTestingModule();
  });

  it('moves a new customer claim through survey, adjuster approval, and workshop completion', async () => {
    const auth = TestBed.inject(AuthService);
    const claims = TestBed.inject(ClaimService);
    const survey = TestBed.inject(SurveyService);
    const review = TestBed.inject(ReviewService);
    const workshop = TestBed.inject(WorkshopService);

    const customer = await firstValueFrom(auth.login('customer@example.com', 'Password123!'));
    const request: CreateClaimRequest = {
      customer: { id: customer.id, name: customer.name, email: customer.email, contactNumber: '+1 555 010 2020' },
      policy: { policyNumber: 'POL-FLOW-1', policyType: 'COMPREHENSIVE', startDate: '2025-01-01', endDate: '2026-12-31' },
      vehicle: { registrationNumber: 'FLOW-1', make: 'Honda', model: 'Civic', year: 2022 },
      claimType: 'COLLISION',
      claimAmount: 2800,
      incidentDate: '2026-09-20',
      incidentLocation: 'Metro City',
      description: 'Front bumper damage.',
      supportingDocuments: []
    };
    const created = await firstValueFrom(claims.createClaim(request));
    expect(created.status).toBe(ClaimStatus.SurveyAssigned);

    const surveyor = await firstValueFrom(auth.login('surveyor@example.com', 'Password123!'));
    expect(claims.canAssessClaim(created.id, surveyor)).toBeTrue();
    await firstValueFrom(survey.submitAssessment({
      claimId: created.id,
      inspectionDate: '2026-10-02',
      damageDescription: 'Front bumper and grille damaged.',
      damageSeverity: DamageSeverity.Moderate,
      estimatedRepairCost: 2800,
      recommendedAction: 'Repair damaged parts',
      surveyorRemarks: 'Damage confirmed.',
      submittedBy: surveyor.email
    }, surveyor));

    await firstValueFrom(auth.login('adjuster@example.com', 'Password123!'));
    const approved = await firstValueFrom(review.approve(created.id, 'Approved after assessment.'));
    expect(approved.status).toBe(ClaimStatus.Approved);

    const workshopUser = await firstValueFrom(auth.login('workshop@example.com', 'Password123!'));
    const initialRepair = await firstValueFrom(workshop.getRepairForClaim(created.id, workshopUser));
    expect(initialRepair.claim.status).toBe(ClaimStatus.Approved);
    const startedRepair = {
      ...initialRepair.repair,
      repairStartDate: '2026-10-03',
      estimatedCompletionDate: '2026-10-10',
      repairStatus: RepairStatus.InProgress,
      repairEstimate: 2800,
      workshopRemarks: 'Repair started.'
    };
    await firstValueFrom(workshop.saveRepair(startedRepair, workshopUser));
    expect((await firstValueFrom(claims.getClaimById(created.id, workshopUser)))?.status)
      .toBe(ClaimStatus.RepairInProgress);

    await firstValueFrom(workshop.saveRepair({
      ...startedRepair,
      repairStatus: RepairStatus.Completed,
      actualCompletionDate: '2026-10-09',
      workshopRemarks: 'Repair and quality check completed.'
    }, workshopUser));

    const finalClaim = await firstValueFrom(claims.getClaimById(created.id, workshopUser));
    expect(finalClaim?.status).toBe(ClaimStatus.RepairCompleted);
    expect(finalClaim?.assignedTo.workshopEmail).toBe(workshopUser.email);
  });
});
