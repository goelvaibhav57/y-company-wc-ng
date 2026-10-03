export const DamageSeverity = {
  Minor: 'MINOR',
  Moderate: 'MODERATE',
  Major: 'MAJOR',
  TotalLoss: 'TOTAL_LOSS'
} as const;

export type DamageSeverity = typeof DamageSeverity[keyof typeof DamageSeverity];

export type SurveyAssessmentStatus = 'DRAFT' | 'SUBMITTED';

export interface SurveyAssessment {
  readonly id: string;
  readonly claimId: string;
  readonly inspectionDate: string;
  readonly damageDescription: string;
  readonly damageSeverity: DamageSeverity;
  readonly estimatedRepairCost: number;
  readonly recommendedAction: string;
  readonly surveyorRemarks: string;
  readonly status: SurveyAssessmentStatus;
  readonly submittedBy: string;
}

export interface SurveyAssessmentInput {
  readonly claimId: string;
  readonly inspectionDate: string;
  readonly damageDescription: string;
  readonly damageSeverity: DamageSeverity;
  readonly estimatedRepairCost: number;
  readonly recommendedAction: string;
  readonly surveyorRemarks: string;
  readonly submittedBy: string;
}
