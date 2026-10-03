import { Injectable } from '@angular/core';
import { Observable, map, of, switchMap, throwError } from 'rxjs';
import { Role, User } from '../../../core/auth/auth.models';
import { ClaimService } from '../../claims/services/claim.service';
import { ClaimStatus } from '../../claims/models/claim.models';
import { SurveyAssessment, SurveyAssessmentInput } from '../models/survey-assessment.model';

@Injectable({ providedIn: 'root' })
export class SurveyService {
  private readonly drafts = new Map<string, SurveyAssessment>();
  private readonly submitted = new Map<string, SurveyAssessment>();

  constructor(private readonly claimService: ClaimService) {}

  getAssessment(claimId: string, user: User): Observable<SurveyAssessment | null> {
    const isSurveyor = this.claimService.isSurveyorAssigned(claimId, user);
    const isAdjuster = this.claimService.isAdjusterAssigned(claimId, user);
    if (!isSurveyor && !isAdjuster) {
      return throwError(() => new Error('You are not assigned to assess this claim.'));
    }

    const savedAssessment = this.submitted.get(claimId) ?? this.drafts.get(claimId);
    if (savedAssessment || isSurveyor) {
      return of(savedAssessment ?? null);
    }

    return this.claimService.getClaimById(claimId, user).pipe(
      map((claim) => claim && claim.status !== ClaimStatus.Submitted && claim.status !== ClaimStatus.Draft
        ? this.createMockAssessment(claim.id, user.email)
        : null
      )
    );
  }

  saveDraft(input: SurveyAssessmentInput, user: User): Observable<SurveyAssessment> {
    if (!this.claimService.canAssessClaim(input.claimId, user) || user.role !== Role.Surveyor) {
      return throwError(() => new Error('You are not assigned to assess this claim.'));
    }

    if (this.submitted.has(input.claimId)) {
      return throwError(() => new Error('This survey assessment has already been submitted.'));
    }

    const assessment: SurveyAssessment = {
      ...input,
      id: this.drafts.get(input.claimId)?.id ?? `survey-${input.claimId}`,
      status: 'DRAFT',
      submittedBy: user.email
    };
    this.drafts.set(input.claimId, assessment);
    return of(assessment);
  }

  submitAssessment(input: SurveyAssessmentInput, user: User): Observable<SurveyAssessment> {
    if (!this.claimService.canAssessClaim(input.claimId, user) || user.role !== Role.Surveyor) {
      return throwError(() => new Error('You are not assigned to assess this claim.'));
    }

    if (this.submitted.has(input.claimId)) {
      return throwError(() => new Error('This survey assessment has already been submitted.'));
    }

    const assessment: SurveyAssessment = {
      ...input,
      id: this.drafts.get(input.claimId)?.id ?? `survey-${input.claimId}`,
      status: 'SUBMITTED',
      submittedBy: user.email
    };

    return this.claimService.updateClaimStatus(
      input.claimId,
      ClaimStatus.SurveyCompleted,
      user.name,
      'Survey completed',
      'Survey assessment submitted for adjuster review.'
    ).pipe(
      switchMap((claim) => {
        if (!claim) {
          return throwError(() => new Error('The claim could not be found.'));
        }
        this.drafts.delete(input.claimId);
        this.submitted.set(input.claimId, assessment);
        return of(assessment);
      })
    );
  }

  private createMockAssessment(claimId: string, submittedBy: string): SurveyAssessment {
    return {
      id: `survey-${claimId}`,
      claimId,
      inspectionDate: '2026-09-20',
      damageDescription: 'Impact damage to the front passenger side. Windshield and front panel require inspection and repair.',
      damageSeverity: 'MODERATE',
      estimatedRepairCost: 4200,
      recommendedAction: 'Repair damaged parts',
      surveyorRemarks: 'Photos reviewed and measurements recorded during the site inspection.',
      status: 'SUBMITTED',
      submittedBy
    };
  }
}
