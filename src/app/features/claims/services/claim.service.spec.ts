import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { Role, User } from '../../../core/auth/auth.models';
import { ClaimListFilters, ClaimStatus, ClaimType, CreateClaimRequest } from '../models/claim.models';
import { ClaimService } from './claim.service';

describe('ClaimService', () => {
  let claimService: ClaimService;
  const noFilters: ClaimListFilters = { search: '', status: null, fromDate: null, toDate: null };

  const demoUser = (email: string, role: Role): User => ({
    id: `test-${role.toLowerCase()}`,
    name: role,
    email,
    role,
    token: 'test-token'
  });

  beforeEach(() => {
    TestBed.configureTestingModule({});
    claimService = TestBed.inject(ClaimService);
  });

  it('provides realistic claims across customer and survey workflow states', async () => {
    const customerClaims = await firstValueFrom(
      claimService.getClaimsForUser(demoUser('customer@example.com', Role.Customer))
    );
    const allStatuses = new Set(customerClaims.map((claim) => claim.status));
    const surveyorClaims = await firstValueFrom(
      claimService.getClaimsForUser(demoUser('surveyor@example.com', Role.Surveyor))
    );

    expect(surveyorClaims.length).toBeGreaterThanOrEqual(4);
    expect(allStatuses.has(ClaimStatus.Draft)).toBeTrue();
    expect(surveyorClaims.some((claim) => claim.status === ClaimStatus.SurveyAssigned)).toBeTrue();
  });

  it('limits claims to each signed-in role’s work scope', async () => {
    const customerClaims = await firstValueFrom(
      claimService.getClaimsForUser(demoUser('customer@example.com', Role.Customer))
    );
    const surveyorClaims = await firstValueFrom(
      claimService.getClaimsForUser(demoUser('surveyor@example.com', Role.Surveyor))
    );
    const adjusterClaims = await firstValueFrom(
      claimService.getClaimsForUser(demoUser('adjuster@example.com', Role.Adjuster))
    );
    const workshopClaims = await firstValueFrom(
      claimService.getClaimsForUser(demoUser('workshop@example.com', Role.Workshop))
    );

    expect(customerClaims.length).toBe(5);
    expect(customerClaims.every((claim) => claim.customer.email === 'customer@example.com')).toBeTrue();
    expect(surveyorClaims.length).toBe(4);
    expect(surveyorClaims.every((claim) => claim.assignedTo.surveyorEmail === 'surveyor@example.com')).toBeTrue();
    expect(adjusterClaims.length).toBe(3);
    expect(adjusterClaims.every((claim) =>
      claim.status === ClaimStatus.SurveyCompleted
        || claim.status === ClaimStatus.UnderReview
        || claim.status === ClaimStatus.AdditionalInformationRequired
    )).toBeTrue();
    expect(workshopClaims.length).toBe(4);
    expect(workshopClaims.every((claim) => claim.assignedTo.workshopEmail === 'workshop@example.com')).toBeTrue();
    expect(workshopClaims.some((claim) => claim.status === ClaimStatus.Approved)).toBeTrue();
  });

  it('searches claim number, policy number, and customer name case-insensitively', async () => {
    const customerClaims = await firstValueFrom(
      claimService.getClaimsForUser(demoUser('customer@example.com', Role.Customer))
    );

    expect(claimService.filterClaims(customerClaims, { ...noFilters, search: 'clm-2026-002' })[0].id)
      .toBe('claim-1002');
    expect(claimService.filterClaims(customerClaims, { ...noFilters, search: 'pol-ax-44820' }).length)
      .toBe(3);
    expect(claimService.filterClaims(customerClaims, { ...noFilters, search: 'jOrDaN' }).length)
      .toBe(5);
  });

  it('applies status and inclusive created-date range filters together', async () => {
    const customerClaims = await firstValueFrom(
      claimService.getClaimsForUser(demoUser('customer@example.com', Role.Customer))
    );
    const filtered = claimService.filterClaims(customerClaims, {
      search: '',
      status: ClaimStatus.Draft,
      fromDate: '2026-08-28',
      toDate: '2026-08-28'
    });
    const dateRange = claimService.filterClaims(customerClaims, {
      ...noFilters,
      fromDate: '2026-09-20',
      toDate: '2026-09-24'
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].claimNumber).toBe('CLM-2026-013');
    expect(dateRange.length).toBe(3);
  });

  it('creates and retains a submitted claim for the owning customer', async () => {
    const request: CreateClaimRequest = {
      customer: {
        id: 'test-customer', name: 'Jordan Lee', email: 'customer@example.com', contactNumber: '+1 555 123 4567'
      },
      policy: {
        policyNumber: 'POL-NEW-100', policyType: 'COMPREHENSIVE',
        startDate: '2025-01-01', endDate: '2026-12-31'
      },
      vehicle: { registrationNumber: 'NEW-100', make: 'Honda', model: 'Civic', year: 2024 },
      claimType: ClaimType.Collision,
      claimAmount: 2500,
      incidentDate: '2026-09-20',
      incidentLocation: 'Metro City',
      description: 'Damage to the rear bumper.',
      supportingDocuments: ['accident-photo.jpg']
    };

    const createdClaim = await firstValueFrom(claimService.createClaim(request));
    const customerClaims = await firstValueFrom(
      claimService.getClaimsForUser(demoUser('customer@example.com', Role.Customer))
    );

    expect(createdClaim.status).toBe(ClaimStatus.SurveyAssigned);
    expect(createdClaim.policyNumber).toBe(request.policy.policyNumber);
    expect(createdClaim.supportingDocuments).toEqual(['accident-photo.jpg']);
    expect(customerClaims.some((claim) => claim.id === createdClaim.id)).toBeTrue();
    expect(claimService.isSurveyorAssigned(createdClaim.id, demoUser('surveyor@example.com', Role.Surveyor))).toBeTrue();
    expect(claimService.canAssessClaim(createdClaim.id, demoUser('surveyor@example.com', Role.Surveyor))).toBeTrue();
  });

  it('returns details only to roles within their claim scope and builds history/documents', async () => {
    const adjuster = demoUser('adjuster@example.com', Role.Adjuster);
    const customer = demoUser('customer@example.com', Role.Customer);
    const adjusterClaim = await firstValueFrom(claimService.getClaimById('claim-1001', adjuster));
    const deniedClaim = await firstValueFrom(claimService.getClaimById('claim-1001', demoUser('workshop@example.com', Role.Workshop)));

    expect(adjusterClaim?.claimNumber).toBe('CLM-2026-001');
    expect(deniedClaim).toBeNull();

    const customerClaim = await firstValueFrom(claimService.getClaimById('claim-1001', customer));
    const history = await firstValueFrom(claimService.getClaimHistory(customerClaim!));
    const documents = await firstValueFrom(claimService.getClaimDocuments(customerClaim!));
    expect(history.map((activity) => activity.action)).toContain('Adjuster review');
    expect(history.find((activity) => activity.action === 'Claim created')?.status).toBe(ClaimStatus.Submitted);
    expect(documents.map((document) => document.documentType)).toContain('VEHICLE_REGISTRATION');
    expect(documents.every((document) => document.claimId === customerClaim?.id)).toBeTrue();
  });
});
