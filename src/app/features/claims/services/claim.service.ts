import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { Role, User } from '../../../core/auth/auth.models';
import {
  Claim,
  ClaimActivity,
  ClaimDocument,
  ClaimListFilters,
  ClaimStatus,
  ClaimType,
  CreateClaimRequest,
  DocumentStatus,
  DocumentType,
  Policy,
  Vehicle
} from '../models/claim.models';

const SURVEYOR_EMAIL = 'surveyor@example.com';
const ADJUSTER_EMAIL = 'adjuster@example.com';
const WORKSHOP_EMAIL = 'workshop@example.com';

function makePolicy(policyNumber: string, policyType: Policy['policyType']): Policy {
  return { policyNumber, policyType, startDate: '2025-01-01', endDate: '2026-12-31' };
}

function makeVehicle(registrationNumber: string, make: string, model: string, year: number): Vehicle {
  return { registrationNumber, make, model, year };
}

function makeClaim(
  id: string,
  claimNumber: string,
  policyNumber: string,
  customerName: string,
  customerEmail: string,
  vehicle: Vehicle,
  claimType: ClaimType,
  claimAmount: number,
  incidentDate: string,
  status: ClaimStatus,
  createdDate: string,
  assignedTo: Claim['assignedTo']
): Claim {
  return {
    id,
    claimNumber,
    policyNumber,
    policy: makePolicy(policyNumber, claimType === ClaimType.ThirdParty ? 'THIRD_PARTY' : 'COMPREHENSIVE'),
    customer: {
      id: `customer-${customerEmail.split('@')[0]}`,
      name: customerName,
      email: customerEmail,
      contactNumber: '+1 (555) 010-2020'
    },
    vehicle,
    claimType,
    claimAmount,
    incidentDate,
    incidentLocation: 'Central District, Metro City',
    description: `Vehicle damage reported after a ${claimType.toLowerCase().replace('_', ' ')} incident.`,
    status,
    assignedTo,
    createdDate,
    updatedDate: createdDate
  };
}

const MOCK_CLAIMS: readonly Claim[] = [
  makeClaim('claim-1001', 'CLM-2026-001', 'POL-AX-44820', 'Jordan Lee', 'customer@example.com', makeVehicle('ABC-214', 'Honda', 'Accord', 2022), ClaimType.Collision, 4850, '2026-09-22', ClaimStatus.UnderReview, '2026-09-24', { surveyorEmail: SURVEYOR_EMAIL, adjusterEmail: ADJUSTER_EMAIL }),
  makeClaim('claim-1002', 'CLM-2026-002', 'POL-AX-44820', 'Jordan Lee', 'customer@example.com', makeVehicle('ABC-214', 'Honda', 'Accord', 2022), ClaimType.Glass, 720, '2026-09-20', ClaimStatus.SurveyAssigned, '2026-09-22', { surveyorEmail: SURVEYOR_EMAIL, adjusterEmail: ADJUSTER_EMAIL }),
  makeClaim('claim-1003', 'CLM-2026-003', 'POL-BK-78109', 'Jordan Lee', 'customer@example.com', makeVehicle('JLK-903', 'Subaru', 'Crosstrek', 2023), ClaimType.Weather, 3100, '2026-09-17', ClaimStatus.Approved, '2026-09-20', { adjusterEmail: ADJUSTER_EMAIL, workshopEmail: WORKSHOP_EMAIL }),
  makeClaim('claim-1004', 'CLM-2026-004', 'POL-MX-11582', 'Jordan Lee', 'customer@example.com', makeVehicle('LMN-520', 'BMW', '330i', 2021), ClaimType.Theft, 9800, '2026-09-15', ClaimStatus.Rejected, '2026-09-18', { adjusterEmail: ADJUSTER_EMAIL }),
  makeClaim('claim-1005', 'CLM-2026-005', 'POL-TR-55031', 'Avery Chen', 'avery.chen@example.com', makeVehicle('QRS-117', 'Mazda', 'CX-5', 2019), ClaimType.Collision, 2650, '2026-09-14', ClaimStatus.Submitted, '2026-09-17', { adjusterEmail: ADJUSTER_EMAIL }),
  makeClaim('claim-1006', 'CLM-2026-006', 'POL-KA-24006', 'Riley Morgan', 'riley.morgan@example.com', makeVehicle('TUV-801', 'Kia', 'Sportage', 2024), ClaimType.Collision, 5400, '2026-09-12', ClaimStatus.SurveyInProgress, '2026-09-15', { surveyorEmail: SURVEYOR_EMAIL, adjusterEmail: ADJUSTER_EMAIL }),
  makeClaim('claim-1007', 'CLM-2026-007', 'POL-TY-61875', 'Jamie Singh', 'jamie.singh@example.com', makeVehicle('DEF-442', 'Toyota', 'Corolla', 2021), ClaimType.ThirdParty, 1900, '2026-09-11', ClaimStatus.SurveyCompleted, '2026-09-14', { surveyorEmail: SURVEYOR_EMAIL, adjusterEmail: ADJUSTER_EMAIL }),
  makeClaim('claim-1008', 'CLM-2026-008', 'POL-FD-30861', 'Taylor Brooks', 'taylor.brooks@example.com', makeVehicle('GHI-389', 'Ford', 'Escape', 2022), ClaimType.Fire, 6300, '2026-09-09', ClaimStatus.AdditionalInformationRequired, '2026-09-12', { adjusterEmail: ADJUSTER_EMAIL }),
  makeClaim('claim-1009', 'CLM-2026-009', 'POL-HY-91273', 'Sam Rivera', 'sam.rivera@example.com', makeVehicle('JKL-665', 'Hyundai', 'Tucson', 2020), ClaimType.Collision, 4100, '2026-09-07', ClaimStatus.WorkshopAssigned, '2026-09-10', { adjusterEmail: ADJUSTER_EMAIL, workshopEmail: WORKSHOP_EMAIL }),
  makeClaim('claim-1010', 'CLM-2026-010', 'POL-VW-10294', 'Drew Wilson', 'drew.wilson@example.com', makeVehicle('MNO-773', 'Volkswagen', 'Golf', 2023), ClaimType.Collision, 8700, '2026-09-05', ClaimStatus.RepairInProgress, '2026-09-08', { workshopEmail: WORKSHOP_EMAIL }),
  makeClaim('claim-1011', 'CLM-2026-011', 'POL-LX-79312', 'Morgan Diaz', 'morgan.diaz@example.com', makeVehicle('PQR-284', 'Lexus', 'RX', 2018), ClaimType.Weather, 12400, '2026-09-02', ClaimStatus.RepairCompleted, '2026-09-05', { workshopEmail: WORKSHOP_EMAIL }),
  makeClaim('claim-1012', 'CLM-2026-012', 'POL-CH-66534', 'Alex Kim', 'alex.kim@example.com', makeVehicle('STU-913', 'Chevrolet', 'Equinox', 2022), ClaimType.Glass, 3500, '2026-08-30', ClaimStatus.Closed, '2026-09-02', { workshopEmail: WORKSHOP_EMAIL }),
  makeClaim('claim-1013', 'CLM-2026-013', 'POL-AX-44820', 'Jordan Lee', 'customer@example.com', makeVehicle('ABC-214', 'Honda', 'Accord', 2022), ClaimType.Collision, 1250, '2026-08-27', ClaimStatus.Draft, '2026-08-28', {})
];

const REVIEW_STATUSES: readonly ClaimStatus[] = [
  ClaimStatus.SurveyCompleted,
  ClaimStatus.UnderReview,
  ClaimStatus.AdditionalInformationRequired
];
const WORKSHOP_STATUSES: readonly ClaimStatus[] = [
  ClaimStatus.Approved,
  ClaimStatus.WorkshopAssigned,
  ClaimStatus.RepairInProgress,
  ClaimStatus.RepairCompleted
];

@Injectable({ providedIn: 'root' })
export class ClaimService {
  private claims: readonly Claim[] = [...MOCK_CLAIMS];

  getClaimsForUser(user: User): Observable<readonly Claim[]> {
    return of(this.scopeClaims(user)).pipe(delay(180));
  }

  getDashboardClaimsForUser(user: User): Observable<readonly Claim[]> {
    const claims = this.claims.filter((claim) => {
      switch (user.role) {
        case Role.Customer: return claim.customer.email === user.email;
        case Role.Surveyor: return claim.assignedTo.surveyorEmail === user.email;
        case Role.Adjuster: return claim.assignedTo.adjusterEmail === user.email;
        case Role.Workshop: return claim.assignedTo.workshopEmail === user.email;
      }
    });
    return of(claims).pipe(delay(180));
  }

  getClaimById(id: string, user: User): Observable<Claim | null> {
    const claim = this.claims.find((candidate) => candidate.id === id && this.canReadClaim(candidate, user)) ?? null;
    return of(claim).pipe(delay(120));
  }

  getClaimHistory(claim: Claim): Observable<readonly ClaimActivity[]> {
    return of(this.createClaimHistory(claim)).pipe(delay(100));
  }

  getClaimDocuments(claim: Claim): Observable<readonly ClaimDocument[]> {
    return of(this.createClaimDocuments(claim)).pipe(delay(80));
  }

  isSurveyorAssigned(claimId: string, user: User): boolean {
    const claim = this.claims.find((candidate) => candidate.id === claimId);
    return user.role === Role.Surveyor && claim?.assignedTo.surveyorEmail === user.email;
  }

  isAdjusterAssigned(claimId: string, user: User): boolean {
    const claim = this.claims.find((candidate) => candidate.id === claimId);
    return user.role === Role.Adjuster && claim?.assignedTo.adjusterEmail === user.email;
  }

  isWorkshopAssigned(claimId: string, user: User): boolean {
    const claim = this.claims.find((candidate) => candidate.id === claimId);
    return user.role === Role.Workshop && claim?.assignedTo.workshopEmail === user.email;
  }

  canProcessWorkshopClaim(claimId: string, user: User): boolean {
    const claim = this.claims.find((candidate) => candidate.id === claimId);
    return this.isWorkshopAssigned(claimId, user)
      && (claim?.status === ClaimStatus.Approved
        || claim?.status === ClaimStatus.WorkshopAssigned
        || claim?.status === ClaimStatus.RepairInProgress);
  }

  canAssessClaim(claimId: string, user: User): boolean {
    const claim = this.claims.find((candidate) => candidate.id === claimId);
    return this.isSurveyorAssigned(claimId, user)
      && (claim?.status === ClaimStatus.SurveyAssigned || claim?.status === ClaimStatus.SurveyInProgress);
  }

  updateClaimStatus(
    claimId: string,
    status: ClaimStatus,
    updatedBy: string,
    activityAction = 'Claim status updated',
    remarks = '',
    metadata: Partial<Pick<Claim, 'approvedBy' | 'approvalDate' | 'decisionRemarks'>> = {}
  ): Observable<Claim | null> {
    const index = this.claims.findIndex((claim) => claim.id === claimId);
    if (index < 0) {
      return of(null);
    }

    const updatedClaim: Claim = { ...this.claims[index], ...metadata, status, updatedDate: currentDate() };
    this.claims = this.claims.map((claim, claimIndex) => claimIndex === index ? updatedClaim : claim);
    this.appendHistory(updatedClaim, updatedBy, activityAction, remarks, status);
    return of(updatedClaim).pipe(delay(160));
  }

  createClaim(request: CreateClaimRequest): Observable<Claim> {
    const now = new Date();
    const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
    const nextClaimNumber = this.claims.length + 1;
    const claim: Claim = {
      id: `claim-${Date.now()}-${this.claims.length}`,
      claimNumber: `CLM-${now.getFullYear()}-${String(nextClaimNumber).padStart(3, '0')}`,
      policyNumber: request.policy.policyNumber,
      policy: request.policy,
      customer: request.customer,
      vehicle: request.vehicle,
      claimType: request.claimType,
      claimAmount: request.claimAmount,
      incidentDate: request.incidentDate,
      incidentLocation: request.incidentLocation,
      description: request.description,
      status: ClaimStatus.SurveyAssigned,
      assignedTo: {
        surveyorEmail: SURVEYOR_EMAIL,
        adjusterEmail: ADJUSTER_EMAIL,
        workshopEmail: WORKSHOP_EMAIL
      },
      supportingDocuments: request.supportingDocuments,
      createdDate: date,
      updatedDate: date
    };

    this.claims = [...this.claims, claim];
    return of(claim).pipe(delay(250));
  }

  filterClaims(claims: readonly Claim[], filters: ClaimListFilters): Claim[] {
    const query = filters.search.trim().toLocaleLowerCase();

    return claims.filter((claim) => {
      const matchesQuery = !query
        || claim.claimNumber.toLocaleLowerCase().includes(query)
        || claim.policyNumber.toLocaleLowerCase().includes(query)
        || claim.customer.name.toLocaleLowerCase().includes(query);
      const matchesStatus = !filters.status || claim.status === filters.status;
      const matchesFromDate = !filters.fromDate || claim.createdDate >= filters.fromDate;
      const matchesToDate = !filters.toDate || claim.createdDate <= filters.toDate;

      return matchesQuery && matchesStatus && matchesFromDate && matchesToDate;
    });
  }

  private scopeClaims(user: User): readonly Claim[] {
    switch (user.role) {
      case Role.Customer:
        return this.claims.filter((claim) => claim.customer.email === user.email);
      case Role.Surveyor:
        return this.claims.filter((claim) => claim.assignedTo.surveyorEmail === user.email);
      case Role.Adjuster:
        return this.claims.filter((claim) =>
          claim.assignedTo.adjusterEmail === user.email && REVIEW_STATUSES.includes(claim.status)
        );
      case Role.Workshop:
        return this.claims.filter((claim) =>
          claim.assignedTo.workshopEmail === user.email && WORKSHOP_STATUSES.includes(claim.status)
        );
    }
  }

  private canReadClaim(claim: Claim, user: User): boolean {
    switch (user.role) {
      case Role.Customer:
        return claim.customer.email === user.email;
      case Role.Surveyor:
        return claim.assignedTo.surveyorEmail === user.email;
      case Role.Adjuster:
        return claim.assignedTo.adjusterEmail === user.email;
      case Role.Workshop:
        return claim.assignedTo.workshopEmail === user.email;
    }
  }

  private createClaimHistory(claim: Claim): readonly ClaimActivity[] {
    const history: ClaimActivity[] = [...(this.claimActivities[claim.id] ?? [])];
    const createdDate = claim.createdDate;
    const statusRank: Readonly<Record<ClaimStatus, number>> = {
      [ClaimStatus.Draft]: 0,
      [ClaimStatus.Submitted]: 1,
      [ClaimStatus.SurveyAssigned]: 2,
      [ClaimStatus.SurveyInProgress]: 3,
      [ClaimStatus.SurveyCompleted]: 4,
      [ClaimStatus.UnderReview]: 5,
      [ClaimStatus.AdditionalInformationRequired]: 5,
      [ClaimStatus.Approved]: 6,
      [ClaimStatus.Rejected]: 6,
      [ClaimStatus.WorkshopAssigned]: 7,
      [ClaimStatus.RepairInProgress]: 8,
      [ClaimStatus.RepairCompleted]: 9,
      [ClaimStatus.Closed]: 10
    };
    const rank = statusRank[claim.status];
    const addEvent = (date: string, user: string, action: string, remarks: string, status?: ClaimStatus): void => {
      if (history.some((activity) => activity.action.toLowerCase() === action.toLowerCase())) {
        return;
      }
      history.push({
        id: `${claim.id}-activity-${history.length + 1}`,
        claimId: claim.id,
        date,
        user,
        action,
        remarks,
        status
      });
    };

    addEvent(
      createdDate,
      claim.customer.name,
      'Claim created',
      claim.status === ClaimStatus.Draft ? 'Claim saved as a draft.' : 'Claim submitted for processing.',
      claim.status === ClaimStatus.Draft ? ClaimStatus.Draft : ClaimStatus.Submitted
    );
    if (rank >= 2) {
      addEvent(addDays(createdDate, 1), 'Survey Team', 'Survey assigned', 'Inspection assigned to the survey team.', ClaimStatus.SurveyAssigned);
    }
    if (rank >= 4) {
      addEvent(addDays(createdDate, 3), 'Taylor Reed', 'Survey completed', 'Inspection assessment submitted.', ClaimStatus.SurveyCompleted);
    }
    if (rank >= 5) {
      addEvent(addDays(createdDate, 4), 'Morgan Ellis', 'Adjuster review', 'Assessment received for adjuster review.', ClaimStatus.UnderReview);
    }
    if (claim.status === ClaimStatus.AdditionalInformationRequired) {
      addEvent(claim.updatedDate, 'Morgan Ellis', 'Additional information requested', 'Please provide the requested supporting information.', claim.status);
    } else if (claim.status === ClaimStatus.Approved || rank > 6) {
      addEvent(addDays(createdDate, 5), 'Morgan Ellis', 'Claim approved', 'Claim approved for the assessed repair amount.', ClaimStatus.Approved);
    } else if (claim.status === ClaimStatus.Rejected) {
      addEvent(addDays(createdDate, 5), 'Morgan Ellis', 'Claim rejected', 'Claim decision recorded following review.', ClaimStatus.Rejected);
    }
    if (rank >= 6 && claim.assignedTo.workshopEmail) {
      addEvent(addDays(createdDate, 6), 'Repair Workshop', 'Workshop assigned', 'Approved repairs assigned to the repair workshop.', ClaimStatus.WorkshopAssigned);
    }
    if (rank >= 9) {
      addEvent(addDays(createdDate, 10), 'Repair Workshop', 'Repair completed', 'Workshop marked the repair as complete.', ClaimStatus.RepairCompleted);
    }
    if (claim.status === ClaimStatus.Closed) {
      addEvent(claim.updatedDate, 'Claims Team', 'Claim closed', 'Claim processing is complete.', ClaimStatus.Closed);
    }

    return history.sort((first, second) => first.date.localeCompare(second.date));
  }

  private readonly claimActivities: Record<string, ClaimActivity[]> = {};

  private appendHistory(claim: Claim, user: string, action: string, remarks: string, status: ClaimStatus): void {
    const activities = this.claimActivities[claim.id] ?? [];
    this.claimActivities[claim.id] = [...activities, {
      id: `${claim.id}-activity-${activities.length + 1}`,
      claimId: claim.id,
      date: claim.updatedDate,
      user,
      action,
      remarks,
      status
    }];
  }

  private createClaimDocuments(claim: Claim): readonly ClaimDocument[] {
    const seededDocuments: readonly Omit<ClaimDocument, 'claimId' | 'id'>[] = [
      { fileName: 'policy-schedule.pdf', documentType: DocumentType.Policy, uploadedDate: claim.createdDate, uploadedBy: claim.customer.name, fileSize: 245_760, status: 'UPLOADED' },
      { fileName: 'vehicle-registration.pdf', documentType: DocumentType.VehicleRegistration, uploadedDate: claim.createdDate, uploadedBy: claim.customer.name, fileSize: 182_400, status: 'UPLOADED' },
      { fileName: 'accident-photos.jpg', documentType: DocumentType.AccidentPhoto, uploadedDate: addDays(claim.createdDate, 1), uploadedBy: claim.customer.name, fileSize: 1_420_000, status: 'UPLOADED' }
    ];
    const submittedFiles = claim.supportingDocuments ?? [];
    const documents: readonly Omit<ClaimDocument, 'claimId' | 'id'>[] = [
      ...seededDocuments,
      ...submittedFiles.map((fileName) => ({
        fileName,
        documentType: DocumentType.Other,
        uploadedDate: claim.createdDate,
        uploadedBy: claim.customer.name,
        fileSize: 0,
        status: 'UPLOADED' as DocumentStatus
      }))
    ];

    return documents.map((document, index) => ({
      id: `${claim.id}-document-${index + 1}`,
      claimId: claim.id,
      fileName: document.fileName,
      documentType: document.documentType,
      uploadedDate: document.uploadedDate,
      uploadedBy: document.uploadedBy,
      fileSize: document.fileSize,
      status: document.status
    }));
  }
}

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function currentDate(): string {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}
