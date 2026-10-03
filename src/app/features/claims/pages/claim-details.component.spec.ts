import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/auth/auth.service';
import { Permission, Role, User } from '../../../core/auth/auth.models';
import { PermissionService } from '../../../core/auth/permission.service';
import { Claim, ClaimActivity, ClaimDocument, ClaimStatus, ClaimType } from '../models/claim.models';
import { ClaimService } from '../services/claim.service';
import { ClaimDetailsComponent } from './claim-details.component';

describe('ClaimDetailsComponent', () => {
  const user: User = {
    id: 'user-1', name: 'Jordan Lee', email: 'customer@example.com', role: Role.Customer, token: 'mock-token'
  };
  const claim: Claim = {
    id: 'claim-1', claimNumber: 'CLM-2026-001', policyNumber: 'POL-100',
    policy: { policyNumber: 'POL-100', policyType: 'COMPREHENSIVE', startDate: '2025-01-01', endDate: '2026-12-31' },
    customer: { id: 'user-1', name: 'Jordan Lee', email: 'customer@example.com', contactNumber: '+1 555 123 4567' },
    vehicle: { registrationNumber: 'ABC-123', make: 'Honda', model: 'Accord', year: 2022 },
    claimType: ClaimType.Collision, claimAmount: 4500, incidentDate: '2026-09-01',
    incidentLocation: 'Metro City', description: 'Vehicle damage.', status: ClaimStatus.AdditionalInformationRequired,
    assignedTo: {}, createdDate: '2026-09-02', updatedDate: '2026-09-04'
  };
  const activities: readonly ClaimActivity[] = [{
    id: 'activity-1', claimId: claim.id, date: '2026-09-02', user: user.name,
    action: 'Claim created', remarks: 'Claim submitted.', status: ClaimStatus.Submitted
  }];
  const documents: readonly ClaimDocument[] = [{
    id: 'document-1', claimId: claim.id, fileName: 'policy.pdf', documentType: 'POLICY',
    uploadedDate: '2026-09-02', uploadedBy: user.name, fileSize: 2048, status: 'UPLOADED'
  }];

  function createComponent(role: Role, status: ClaimStatus): {
    fixture: ComponentFixture<ClaimDetailsComponent>;
    component: ClaimDetailsComponent;
  } {
    const roleSignal = signal<Role | null>(role);
    const currentUser = { ...user, role };
    const selectedClaim = { ...claim, status };
    TestBed.configureTestingModule({
      imports: [ClaimDetailsComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: claim.id }),) } },
        { provide: AuthService, useValue: { currentRole: roleSignal.asReadonly(), getCurrentUser: () => currentUser } },
        {
          provide: ClaimService,
          useValue: {
            getClaimById: () => of(selectedClaim),
            getClaimHistory: () => of(activities),
            getClaimDocuments: () => of(documents)
          }
        },
        { provide: PermissionService, useValue: { hasPermission: (permission: Permission) => {
          const permissions: Readonly<Record<Role, readonly Permission[]>> = {
            [Role.Customer]: [Permission.ClaimRead, Permission.ClaimUpdate],
            [Role.Surveyor]: [Permission.ClaimRead, Permission.ClaimSurvey],
            [Role.Adjuster]: [Permission.ClaimRead, Permission.ClaimReview],
            [Role.Workshop]: [Permission.ClaimRead, Permission.ClaimWorkshopUpdate]
          };
          return permissions[role].includes(permission);
        } } },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } }
      ]
    });
    const fixture = TestBed.createComponent(ClaimDetailsComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  afterEach(() => TestBed.resetTestingModule());

  it('loads claim, history, and documents using the route ID', () => {
    const { fixture } = createComponent(Role.Customer, ClaimStatus.AdditionalInformationRequired);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('CLM-2026-001');
    expect(fixture.nativeElement.textContent).toContain('policy.pdf');
    expect(fixture.nativeElement.textContent).toContain('Claim Timeline');
    expect(fixture.nativeElement.textContent).toContain('Claim created');
  });

  it('shows the customer additional-information action only when requested', () => {
    const { fixture: requestedFixture } = createComponent(Role.Customer, ClaimStatus.AdditionalInformationRequired);
    requestedFixture.detectChanges();
    expect(requestedFixture.nativeElement.textContent).toContain('Add Information');

    TestBed.resetTestingModule();
    const { fixture: ordinaryFixture } = createComponent(Role.Customer, ClaimStatus.UnderReview);
    ordinaryFixture.detectChanges();
    expect(ordinaryFixture.nativeElement.textContent).not.toContain('Add Information');
  });

  it('shows only the status-eligible action for each operational role', () => {
    const cases: ReadonlyArray<readonly [Role, ClaimStatus, string]> = [
      [Role.Surveyor, ClaimStatus.SurveyAssigned, 'Start Survey'],
      [Role.Adjuster, ClaimStatus.SurveyCompleted, 'Review Claim'],
      [Role.Adjuster, ClaimStatus.UnderReview, 'Review Claim'],
      [Role.Workshop, ClaimStatus.WorkshopAssigned, 'Process Repair']
    ];

    for (const [role, status, expectedAction] of cases) {
      TestBed.resetTestingModule();
      const { fixture } = createComponent(role, status);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain(expectedAction);
    }
  });
});
