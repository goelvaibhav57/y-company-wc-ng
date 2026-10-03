export enum Role {
  Customer = 'CUSTOMER',
  Surveyor = 'SURVEYOR',
  Adjuster = 'ADJUSTER',
  Workshop = 'WORKSHOP'
}

export const Permission = {
  ClaimRead: 'CLAIM_READ',
  ClaimCreate: 'CLAIM_CREATE',
  ClaimUpdate: 'CLAIM_UPDATE',
  ClaimSurvey: 'CLAIM_SURVEY',
  ClaimReview: 'CLAIM_REVIEW',
  ClaimApprove: 'CLAIM_APPROVE',
  ClaimReject: 'CLAIM_REJECT',
  ClaimWorkshopUpdate: 'CLAIM_WORKSHOP_UPDATE'
} as const;

export type Permission = typeof Permission[keyof typeof Permission];

export interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: Role;
  readonly token: string;
}
