import { Injectable } from '@angular/core';
import { Observable, defer, of, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { Permission, Role, User } from '../../../core/auth/auth.models';
import { Claim, ClaimStatus } from '../../claims/models/claim.models';
import { ClaimService } from '../../claims/services/claim.service';
import { ReviewDecisionRequest, ReviewDecisionResult } from '../models/review-decision.model';

const REVIEWABLE_STATUSES: readonly ClaimStatus[] = [
  ClaimStatus.SurveyCompleted,
  ClaimStatus.UnderReview,
  ClaimStatus.AdditionalInformationRequired
];

@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(
    private readonly authService: AuthService,
    private readonly permissionService: PermissionService,
    private readonly claimService: ClaimService
  ) {}

  approve(claimId: string, remarks = ''): Observable<ReviewDecisionResult> {
    return this.decide({ claimId, decision: 'APPROVE', remarks });
  }

  reject(claimId: string, remarks: string): Observable<ReviewDecisionResult> {
    return this.decide({ claimId, decision: 'REJECT', remarks });
  }

  requestAdditionalInformation(claimId: string, remarks: string): Observable<ReviewDecisionResult> {
    return this.decide({ claimId, decision: 'REQUEST_INFORMATION', remarks });
  }

  isEligibleStatus(status: ClaimStatus): boolean {
    return REVIEWABLE_STATUSES.includes(status);
  }

  private decide(request: ReviewDecisionRequest): Observable<ReviewDecisionResult> {
    return defer(() => {
      const user = this.authService.getCurrentUser();
      const permission = request.decision === 'APPROVE'
        ? Permission.ClaimApprove
        : request.decision === 'REJECT'
          ? Permission.ClaimReject
          : Permission.ClaimReview;

      if (!user || user.role !== Role.Adjuster || !this.permissionService.hasRole(Role.Adjuster)) {
        return throwError(() => new Error('You do not have permission to review claims.'));
      }
      if (request.decision !== 'APPROVE' && !request.remarks.trim()) {
        return throwError(() => new Error('Remarks are required for this decision.'));
      }
      if (!this.permissionService.hasPermission(permission)) {
        return throwError(() => new Error('You do not have permission to perform this review action.'));
      }
      if (!this.claimService.isAdjusterAssigned(request.claimId, user)) {
        return throwError(() => new Error('You are not assigned to review this claim.'));
      }

      return this.claimService.getClaimById(request.claimId, user).pipe(
        switchMap((claim) => {
          if (!claim) {
            return throwError(() => new Error('The claim could not be found.'));
          }
          if (!this.isEligibleStatus(claim.status)) {
            return throwError(() => new Error('This claim is no longer eligible for adjuster review.'));
          }

          const outcome = this.toOutcome(request, user);
          return this.claimService.updateClaimStatus(
            claim.id,
            outcome.status,
            user.name,
            outcome.action,
            outcome.remarks,
            outcome.metadata
          ).pipe(
            switchMap((updatedClaim) => updatedClaim
              ? of({
                  claimId: updatedClaim.id,
                  claimNumber: updatedClaim.claimNumber,
                  status: updatedClaim.status,
                  reviewedBy: user.name,
                  reviewedAt: updatedClaim.updatedDate,
                  remarks: outcome.remarks
                })
              : throwError(() => new Error('The claim could not be updated.'))
            )
          );
        })
      );
    });
  }

  private toOutcome(
    request: ReviewDecisionRequest,
    user: User
  ): {
    readonly status: ClaimStatus;
    readonly action: string;
    readonly remarks: string;
    readonly metadata: Partial<Pick<Claim, 'approvedBy' | 'approvalDate' | 'decisionRemarks'>>;
  } {
    const now = new Date();
    const approvalDate = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
    const remarks = request.remarks.trim();

    switch (request.decision) {
      case 'APPROVE':
        return {
          status: ClaimStatus.Approved,
          action: 'Claim approved',
          remarks: remarks || 'Claim approved for the assessed amount.',
          metadata: { approvedBy: user.name, approvalDate, decisionRemarks: remarks }
        };
      case 'REJECT':
        return {
          status: ClaimStatus.Rejected,
          action: 'Claim rejected',
          remarks,
          metadata: { decisionRemarks: remarks }
        };
      case 'REQUEST_INFORMATION':
        return {
          status: ClaimStatus.AdditionalInformationRequired,
          action: 'Additional information requested',
          remarks,
          metadata: { decisionRemarks: remarks }
        };
    }
  }
}
