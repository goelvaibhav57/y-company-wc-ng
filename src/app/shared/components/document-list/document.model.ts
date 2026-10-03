export const DocumentType = {
  Policy: 'POLICY',
  VehicleRegistration: 'VEHICLE_REGISTRATION',
  DrivingLicense: 'DRIVING_LICENSE',
  AccidentPhoto: 'ACCIDENT_PHOTO',
  SurveyReport: 'SURVEY_REPORT',
  RepairEstimate: 'REPAIR_ESTIMATE',
  Other: 'OTHER'
} as const;

export type DocumentType = typeof DocumentType[keyof typeof DocumentType];

export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'FAILED';

export interface ClaimDocument {
  readonly id: string;
  readonly claimId: string;
  readonly fileName: string;
  readonly documentType: DocumentType;
  readonly uploadedBy: string;
  readonly uploadedDate: string;
  readonly fileSize: number;
  readonly status: DocumentStatus;
}

export interface UploadedDocument {
  readonly document: ClaimDocument;
  readonly file: File;
}
