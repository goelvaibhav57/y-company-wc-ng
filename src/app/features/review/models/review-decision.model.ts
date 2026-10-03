import { ClaimStatus } from '../../claims/models/claim.models';

export type ReviewDecisionType = 'APPROVE' | 'REJECT' | 'REQUEST_INFORMATION';

export interface ReviewDecisionRequest {
  readonly claimId: string;
  readonly decision: ReviewDecisionType;
  readonly remarks: string;
}

export interface ReviewDecisionResult {
  readonly claimId: string;
  readonly claimNumber: string;
  readonly status: ClaimStatus;
  readonly reviewedBy: string;
  readonly reviewedAt: string;
  readonly remarks: string;
}
