import { ClaimStatus } from '../../claims/models/claim.models';

export const RepairStatus = {
  Assigned: 'ASSIGNED',
  InProgress: 'IN_PROGRESS',
  Completed: 'COMPLETED'
} as const;

export type RepairStatus = typeof RepairStatus[keyof typeof RepairStatus];

export interface WorkshopRepair {
  readonly id: string;
  readonly claimId: string;
  readonly repairStartDate: string;
  readonly estimatedCompletionDate: string;
  readonly actualCompletionDate: string;
  readonly repairStatus: RepairStatus;
  readonly repairEstimate: number;
  readonly workshopRemarks: string;
}

export interface WorkshopRepairResult {
  readonly repair: WorkshopRepair;
  readonly claimStatus: ClaimStatus;
}
