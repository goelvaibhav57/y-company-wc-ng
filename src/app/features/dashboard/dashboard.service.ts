import { Injectable } from '@angular/core';
import { Observable, delay, map } from 'rxjs';
import { Role, User } from '../../core/auth/auth.models';
import { Claim, ClaimStatus } from '../claims/models/claim.models';
import { ClaimService } from '../claims/services/claim.service';
import { DashboardClaim, DashboardData, DashboardSummary, WorkloadMetric } from './dashboard.models';

const PENDING_STATUSES: readonly ClaimStatus[] = [
  ClaimStatus.Draft,
  ClaimStatus.Submitted,
  ClaimStatus.SurveyAssigned,
  ClaimStatus.UnderReview,
  ClaimStatus.AdditionalInformationRequired,
  ClaimStatus.WorkshopAssigned
];

const APPROVED_STATUSES: readonly ClaimStatus[] = [
  ClaimStatus.Approved,
  ClaimStatus.WorkshopAssigned,
  ClaimStatus.RepairInProgress,
  ClaimStatus.RepairCompleted,
  ClaimStatus.Closed
];

const COMPLETED_INSPECTION_STATUSES: readonly ClaimStatus[] = [
  ClaimStatus.SurveyCompleted,
  ClaimStatus.UnderReview,
  ClaimStatus.AdditionalInformationRequired,
  ClaimStatus.Approved,
  ClaimStatus.Rejected,
  ClaimStatus.WorkshopAssigned,
  ClaimStatus.RepairInProgress,
  ClaimStatus.RepairCompleted,
  ClaimStatus.Closed
];

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly claimService: ClaimService) {}

  getDashboard(user: User): Observable<DashboardData> {
    return this.claimService.getDashboardClaimsForUser(user).pipe(
      map((claims) => this.toDashboardData(user.role, claims.map(toDashboardClaim))),
      delay(180)
    );
  }

  private toDashboardData(role: Role, claims: readonly DashboardClaim[]): DashboardData {
    const summary: DashboardSummary = {
      totalClaims: claims.length,
      pendingClaims: claims.filter((claim) => PENDING_STATUSES.includes(claim.status)).length,
      inProgressClaims: claims.filter((claim) =>
        claim.status === ClaimStatus.SurveyInProgress || claim.status === ClaimStatus.RepairInProgress
      ).length,
      approvedClaims: claims.filter((claim) => APPROVED_STATUSES.includes(claim.status)).length,
      rejectedClaims: claims.filter((claim) => claim.status === ClaimStatus.Rejected).length
    };

    return {
      role,
      summary,
      workloadMetrics: this.createWorkloadMetrics(role, claims),
      recentClaims: claims.slice(0, 6)
    };
  }

  private createWorkloadMetrics(role: Role, claims: readonly DashboardClaim[]): readonly WorkloadMetric[] {
    switch (role) {
      case Role.Customer:
        return [
          { label: 'My Claims', value: claims.length },
          { label: 'Pending Claims', value: claims.filter((claim) => PENDING_STATUSES.includes(claim.status)).length },
          { label: 'Approved Claims', value: claims.filter((claim) => APPROVED_STATUSES.includes(claim.status)).length }
        ];
      case Role.Surveyor:
        return [
          { label: 'Assigned Claims', value: claims.length },
          { label: 'Pending Inspections', value: claims.filter((claim) => claim.status === ClaimStatus.SurveyAssigned).length },
          { label: 'Completed Inspections', value: claims.filter((claim) => COMPLETED_INSPECTION_STATUSES.includes(claim.status)).length }
        ];
      case Role.Adjuster:
        return [
          {
            label: 'Claims Awaiting Review',
            value: claims.filter((claim) => claim.status === ClaimStatus.SurveyCompleted || claim.status === ClaimStatus.UnderReview).length
          },
          { label: 'Approved', value: claims.filter((claim) => APPROVED_STATUSES.includes(claim.status)).length },
          { label: 'Rejected', value: claims.filter((claim) => claim.status === ClaimStatus.Rejected).length },
          {
            label: 'Additional Information Required',
            value: claims.filter((claim) => claim.status === ClaimStatus.AdditionalInformationRequired).length
          }
        ];
      case Role.Workshop:
        return [
          {
            label: 'Assigned Repairs',
            value: claims.filter((claim) => claim.status === ClaimStatus.Approved || claim.status === ClaimStatus.WorkshopAssigned).length
          },
          { label: 'Repairs In Progress', value: claims.filter((claim) => claim.status === ClaimStatus.RepairInProgress).length },
          {
            label: 'Completed Repairs',
            value: claims.filter((claim) => claim.status === ClaimStatus.RepairCompleted || claim.status === ClaimStatus.Closed).length
          }
        ];
    }
  }
}

function toDashboardClaim(claim: Claim): DashboardClaim {
  return {
    id: claim.id,
    claimNumber: claim.claimNumber,
    customer: claim.customer.name,
    customerEmail: claim.customer.email,
    vehicle: `${claim.vehicle.year} ${claim.vehicle.make} ${claim.vehicle.model}`,
    claimAmount: claim.claimAmount,
    status: claim.status,
    createdDate: claim.createdDate,
    assignedSurveyorEmail: claim.assignedTo.surveyorEmail,
    assignedAdjusterEmail: claim.assignedTo.adjusterEmail,
    assignedWorkshopEmail: claim.assignedTo.workshopEmail
  };
}
