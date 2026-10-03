export const ClaimStatus = {
  Draft: 'DRAFT',
  Submitted: 'SUBMITTED',
  SurveyAssigned: 'SURVEY_ASSIGNED',
  SurveyInProgress: 'SURVEY_IN_PROGRESS',
  SurveyCompleted: 'SURVEY_COMPLETED',
  UnderReview: 'UNDER_REVIEW',
  AdditionalInformationRequired: 'ADDITIONAL_INFORMATION_REQUIRED',
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
  WorkshopAssigned: 'WORKSHOP_ASSIGNED',
  RepairInProgress: 'REPAIR_IN_PROGRESS',
  RepairCompleted: 'REPAIR_COMPLETED',
  Closed: 'CLOSED'
} as const;

export type ClaimStatus = typeof ClaimStatus[keyof typeof ClaimStatus];

export const ClaimType = {
  Collision: 'COLLISION',
  Theft: 'THEFT',
  Fire: 'FIRE',
  Weather: 'WEATHER',
  Glass: 'GLASS',
  ThirdParty: 'THIRD_PARTY'
} as const;

export type ClaimType = typeof ClaimType[keyof typeof ClaimType];

export interface Policy {
  readonly policyNumber: string;
  readonly policyType: 'COMPREHENSIVE' | 'THIRD_PARTY' | 'COLLISION';
  readonly startDate: string;
  readonly endDate: string;
}

export interface Vehicle {
  readonly registrationNumber: string;
  readonly make: string;
  readonly model: string;
  readonly year: number;
}

export interface ClaimCustomer {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly contactNumber: string;
}

export interface ClaimAssignment {
  readonly surveyorEmail?: string;
  readonly adjusterEmail?: string;
  readonly workshopEmail?: string;
}

export interface Claim {
  readonly id: string;
  readonly claimNumber: string;
  readonly policyNumber: string;
  readonly policy: Policy;
  readonly customer: ClaimCustomer;
  readonly vehicle: Vehicle;
  readonly claimType: ClaimType;
  readonly claimAmount: number;
  readonly incidentDate: string;
  readonly incidentLocation: string;
  readonly description: string;
  readonly status: ClaimStatus;
  readonly assignedTo: ClaimAssignment;
  readonly supportingDocuments?: readonly string[];
  readonly approvedBy?: string;
  readonly approvalDate?: string;
  readonly decisionRemarks?: string;
  readonly createdDate: string;
  readonly updatedDate: string;
}

export interface ClaimActivity {
  readonly id: string;
  readonly claimId: string;
  readonly date: string;
  readonly user: string;
  readonly action: string;
  readonly remarks?: string;
  readonly status?: ClaimStatus;
}

export { ClaimDocument, DocumentStatus, DocumentType } from '../../../shared/components/document-list/document.model';

export interface ClaimListFilters {
  readonly search: string;
  readonly status: ClaimStatus | null;
  readonly fromDate: string | null;
  readonly toDate: string | null;
}

export interface CreateClaimRequest {
  readonly customer: ClaimCustomer;
  readonly policy: Policy;
  readonly vehicle: Vehicle;
  readonly claimType: ClaimType;
  readonly claimAmount: number;
  readonly incidentDate: string;
  readonly incidentLocation: string;
  readonly description: string;
  readonly supportingDocuments: readonly string[];
}
