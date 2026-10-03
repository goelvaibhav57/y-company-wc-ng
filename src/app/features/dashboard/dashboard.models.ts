import { Role } from '../../core/auth/auth.models';
import type { ClaimStatus } from '../claims/models/claim.models';

export type { ClaimStatus } from '../claims/models/claim.models';

export interface DashboardSummary {
  readonly totalClaims: number;
  readonly pendingClaims: number;
  readonly inProgressClaims: number;
  readonly approvedClaims: number;
  readonly rejectedClaims: number;
}

export interface DashboardClaim {
  readonly id: string;
  readonly claimNumber: string;
  readonly customer: string;
  readonly customerEmail: string;
  readonly vehicle: string;
  readonly claimAmount: number;
  readonly status: ClaimStatus;
  readonly createdDate: string;
  readonly assignedSurveyorEmail?: string;
  readonly assignedAdjusterEmail?: string;
  readonly assignedWorkshopEmail?: string;
}

export interface WorkloadMetric {
  readonly label: string;
  readonly value: number;
}

export interface DashboardData {
  readonly role: Role;
  readonly summary: DashboardSummary;
  readonly workloadMetrics: readonly WorkloadMetric[];
  readonly recentClaims: readonly DashboardClaim[];
}
