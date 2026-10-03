import { Injectable } from '@angular/core';
import { Observable, delay, map, of } from 'rxjs';
import { Role } from '../../core/auth/auth.models';
import { ClaimStatus, DashboardClaim, DashboardData, DashboardSummary, WorkloadMetric } from './dashboard.models';

const SURVEYOR_EMAIL = 'surveyor@example.com';
const ADJUSTER_EMAIL = 'adjuster@example.com';
const WORKSHOP_EMAIL = 'workshop@example.com';
const CUSTOMER_EMAIL = 'customer@example.com';

const MOCK_CLAIMS: readonly DashboardClaim[] = [
  {
    id: 'claim-1001', claimNumber: 'CLM-2026-001', customer: 'Jordan Lee', customerEmail: CUSTOMER_EMAIL,
    vehicle: '2022 Honda Accord', claimAmount: 4850, status: 'UNDER_REVIEW', createdDate: '2026-09-24',
    assignedSurveyorEmail: SURVEYOR_EMAIL, assignedAdjusterEmail: ADJUSTER_EMAIL
  },
  {
    id: 'claim-1002', claimNumber: 'CLM-2026-002', customer: 'Jordan Lee', customerEmail: CUSTOMER_EMAIL,
    vehicle: '2020 Nissan X-Trail', claimAmount: 7200, status: 'SURVEY_ASSIGNED', createdDate: '2026-09-22',
    assignedSurveyorEmail: SURVEYOR_EMAIL, assignedAdjusterEmail: ADJUSTER_EMAIL
  },
  {
    id: 'claim-1003', claimNumber: 'CLM-2026-003', customer: 'Jordan Lee', customerEmail: CUSTOMER_EMAIL,
    vehicle: '2023 Subaru Crosstrek', claimAmount: 3100, status: 'APPROVED', createdDate: '2026-09-20',
    assignedAdjusterEmail: ADJUSTER_EMAIL, assignedWorkshopEmail: WORKSHOP_EMAIL
  },
  {
    id: 'claim-1004', claimNumber: 'CLM-2026-004', customer: 'Jordan Lee', customerEmail: CUSTOMER_EMAIL,
    vehicle: '2021 BMW 330i', claimAmount: 9800, status: 'REJECTED', createdDate: '2026-09-18',
    assignedAdjusterEmail: ADJUSTER_EMAIL
  },
  {
    id: 'claim-1005', claimNumber: 'CLM-2026-005', customer: 'Avery Chen', customerEmail: 'avery.chen@example.com',
    vehicle: '2019 Mazda CX-5', claimAmount: 2650, status: 'SUBMITTED', createdDate: '2026-09-17',
    assignedAdjusterEmail: ADJUSTER_EMAIL
  },
  {
    id: 'claim-1006', claimNumber: 'CLM-2026-006', customer: 'Riley Morgan', customerEmail: 'riley.morgan@example.com',
    vehicle: '2024 Kia Sportage', claimAmount: 5400, status: 'SURVEY_IN_PROGRESS', createdDate: '2026-09-15',
    assignedSurveyorEmail: SURVEYOR_EMAIL, assignedAdjusterEmail: ADJUSTER_EMAIL
  },
  {
    id: 'claim-1007', claimNumber: 'CLM-2026-007', customer: 'Jamie Singh', customerEmail: 'jamie.singh@example.com',
    vehicle: '2021 Toyota Corolla', claimAmount: 1900, status: 'SURVEY_COMPLETED', createdDate: '2026-09-14',
    assignedSurveyorEmail: SURVEYOR_EMAIL, assignedAdjusterEmail: ADJUSTER_EMAIL
  },
  {
    id: 'claim-1008', claimNumber: 'CLM-2026-008', customer: 'Taylor Brooks', customerEmail: 'taylor.brooks@example.com',
    vehicle: '2022 Ford Escape', claimAmount: 6300, status: 'ADDITIONAL_INFORMATION_REQUIRED', createdDate: '2026-09-12',
    assignedAdjusterEmail: ADJUSTER_EMAIL
  },
  {
    id: 'claim-1009', claimNumber: 'CLM-2026-009', customer: 'Sam Rivera', customerEmail: 'sam.rivera@example.com',
    vehicle: '2020 Hyundai Tucson', claimAmount: 4100, status: 'WORKSHOP_ASSIGNED', createdDate: '2026-09-10',
    assignedAdjusterEmail: ADJUSTER_EMAIL, assignedWorkshopEmail: WORKSHOP_EMAIL
  },
  {
    id: 'claim-1010', claimNumber: 'CLM-2026-010', customer: 'Drew Wilson', customerEmail: 'drew.wilson@example.com',
    vehicle: '2023 Volkswagen Golf', claimAmount: 8700, status: 'REPAIR_IN_PROGRESS', createdDate: '2026-09-08',
    assignedWorkshopEmail: WORKSHOP_EMAIL
  },
  {
    id: 'claim-1011', claimNumber: 'CLM-2026-011', customer: 'Morgan Diaz', customerEmail: 'morgan.diaz@example.com',
    vehicle: '2018 Lexus RX', claimAmount: 12400, status: 'REPAIR_COMPLETED', createdDate: '2026-09-05',
    assignedWorkshopEmail: WORKSHOP_EMAIL
  },
  {
    id: 'claim-1012', claimNumber: 'CLM-2026-012', customer: 'Alex Kim', customerEmail: 'alex.kim@example.com',
    vehicle: '2022 Chevrolet Equinox', claimAmount: 3500, status: 'CLOSED', createdDate: '2026-09-02',
    assignedWorkshopEmail: WORKSHOP_EMAIL
  }
];

const PENDING_STATUSES: readonly ClaimStatus[] = [
  'DRAFT', 'SUBMITTED', 'SURVEY_ASSIGNED', 'UNDER_REVIEW',
  'ADDITIONAL_INFORMATION_REQUIRED', 'WORKSHOP_ASSIGNED'
];

const APPROVED_STATUSES: readonly ClaimStatus[] = [
  'APPROVED', 'WORKSHOP_ASSIGNED', 'REPAIR_IN_PROGRESS', 'REPAIR_COMPLETED', 'CLOSED'
];

const COMPLETED_INSPECTION_STATUSES: readonly ClaimStatus[] = [
  'SURVEY_COMPLETED', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'APPROVED',
  'REJECTED', 'WORKSHOP_ASSIGNED', 'REPAIR_IN_PROGRESS', 'REPAIR_COMPLETED', 'CLOSED'
];

@Injectable({ providedIn: 'root' })
export class DashboardService {
  getDashboard(role: Role, userEmail: string): Observable<DashboardData> {
    return of(this.getScopedClaims(role, userEmail)).pipe(
      map((claims) => this.toDashboardData(role, claims)),
      delay(180)
    );
  }

  private getScopedClaims(role: Role, userEmail: string): readonly DashboardClaim[] {
    switch (role) {
      case Role.Customer:
        return MOCK_CLAIMS.filter((claim) => claim.customerEmail === userEmail);
      case Role.Surveyor:
        return MOCK_CLAIMS.filter((claim) => claim.assignedSurveyorEmail === userEmail);
      case Role.Adjuster:
        return MOCK_CLAIMS.filter((claim) => claim.assignedAdjusterEmail === userEmail);
      case Role.Workshop:
        return MOCK_CLAIMS.filter((claim) => claim.assignedWorkshopEmail === userEmail);
    }
  }

  private toDashboardData(role: Role, claims: readonly DashboardClaim[]): DashboardData {
    const summary: DashboardSummary = {
      totalClaims: claims.length,
      pendingClaims: claims.filter((claim) => PENDING_STATUSES.includes(claim.status)).length,
      inProgressClaims: claims.filter((claim) => claim.status === 'SURVEY_IN_PROGRESS' || claim.status === 'REPAIR_IN_PROGRESS').length,
      approvedClaims: claims.filter((claim) => APPROVED_STATUSES.includes(claim.status)).length,
      rejectedClaims: claims.filter((claim) => claim.status === 'REJECTED').length
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
          { label: 'Pending Inspections', value: claims.filter((claim) => claim.status === 'SURVEY_ASSIGNED').length },
          { label: 'Completed Inspections', value: claims.filter((claim) => COMPLETED_INSPECTION_STATUSES.includes(claim.status)).length }
        ];
      case Role.Adjuster:
        return [
          { label: 'Claims Awaiting Review', value: claims.filter((claim) => claim.status === 'UNDER_REVIEW').length },
          { label: 'Approved', value: claims.filter((claim) => APPROVED_STATUSES.includes(claim.status)).length },
          { label: 'Rejected', value: claims.filter((claim) => claim.status === 'REJECTED').length },
          {
            label: 'Additional Information Required',
            value: claims.filter((claim) => claim.status === 'ADDITIONAL_INFORMATION_REQUIRED').length
          }
        ];
      case Role.Workshop:
        return [
          { label: 'Assigned Repairs', value: claims.filter((claim) => claim.status === 'WORKSHOP_ASSIGNED').length },
          { label: 'Repairs In Progress', value: claims.filter((claim) => claim.status === 'REPAIR_IN_PROGRESS').length },
          {
            label: 'Completed Repairs',
            value: claims.filter((claim) => claim.status === 'REPAIR_COMPLETED' || claim.status === 'CLOSED').length
          }
        ];
    }
  }
}
