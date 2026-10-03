import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, Subject } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { Role, User } from '../../../core/auth/auth.models';
import { Claim, ClaimStatus, ClaimType } from '../../claims/models/claim.models';
import { ClaimService } from '../../claims/services/claim.service';
import { SurveyAssessmentComponent } from './survey-assessment.component';
import { SurveyService } from '../services/survey.service';

describe('SurveyAssessmentComponent', () => {
  let fixture: ComponentFixture<SurveyAssessmentComponent>;
  let component: SurveyAssessmentComponent;
  let saveDraft: jasmine.Spy;
  let submitAssessment: jasmine.Spy;
  let dialogOpen: jasmine.Spy;
  let confirmationResult: Subject<boolean>;
  const user: User = {
    id: 'user-surveyor', name: 'Taylor Reed', email: 'surveyor@example.com', role: Role.Surveyor, token: 'mock-token'
  };
  const claim: Claim = {
    id: 'claim-1002', claimNumber: 'CLM-2026-002', policyNumber: 'POL-AX-44820',
    policy: { policyNumber: 'POL-AX-44820', policyType: 'COMPREHENSIVE', startDate: '2025-01-01', endDate: '2026-12-31' },
    customer: { id: 'customer-1', name: 'Jordan Lee', email: 'customer@example.com', contactNumber: '+1 555 123 4567' },
    vehicle: { registrationNumber: 'ABC-214', make: 'Honda', model: 'Accord', year: 2022 },
    claimType: ClaimType.Glass, claimAmount: 720, incidentDate: '2026-09-20', incidentLocation: 'Metro City',
    description: 'Glass damage.', status: ClaimStatus.SurveyAssigned, assignedTo: { surveyorEmail: user.email },
    createdDate: '2026-09-22', updatedDate: '2026-09-22'
  };

  beforeEach(() => {
    saveDraft = jasmine.createSpy('saveDraft').and.returnValue(of({
      id: 'survey-1', claimId: claim.id, inspectionDate: '', damageDescription: '', damageSeverity: 'MINOR',
      estimatedRepairCost: 0, recommendedAction: '', surveyorRemarks: '', status: 'DRAFT', submittedBy: user.email
    }));
    submitAssessment = jasmine.createSpy('submitAssessment').and.returnValue(of({
      id: 'survey-1', claimId: claim.id, inspectionDate: '2026-10-02', damageDescription: 'Cracked windshield',
      damageSeverity: 'MODERATE', estimatedRepairCost: 1250, recommendedAction: 'Replace vehicle',
      surveyorRemarks: '', status: 'SUBMITTED', submittedBy: user.email
    }));
    confirmationResult = new Subject<boolean>();
    dialogOpen = jasmine.createSpy('open').and.returnValue({ afterClosed: () => confirmationResult.asObservable() });

    TestBed.configureTestingModule({
      imports: [SurveyAssessmentComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: claim.id }) } } },
        { provide: AuthService, useValue: { getCurrentUser: () => user } },
        {
          provide: ClaimService,
          useValue: {
            getClaimById: () => of(claim),
            isSurveyorAssigned: () => true,
            getClaimDocuments: () => of([])
          }
        },
        { provide: SurveyService, useValue: { getAssessment: () => of(null), saveDraft, submitAssessment } },
        { provide: MatDialog, useValue: { open: dialogOpen } },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } }
      ]
    });
    TestBed.overrideProvider(MatDialog, { useValue: { open: dialogOpen } });
    fixture = TestBed.createComponent(SurveyAssessmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the assigned claim summary and rejects invalid form submission', () => {
    expect(component.claim()?.claimNumber).toBe('CLM-2026-002');
    component.requestSubmitConfirmation();

    expect(component.form.invalid).toBeTrue();
    expect(component.form.controls.damageDescription.touched).toBeTrue();
    expect(dialogOpen).not.toHaveBeenCalled();
    expect(submitAssessment).not.toHaveBeenCalled();
  });

  it('saves a draft without opening submission confirmation', () => {
    component.saveDraft();

    expect(saveDraft).toHaveBeenCalled();
    expect(dialogOpen).not.toHaveBeenCalled();
    expect(component.savedAssessment()?.status).toBe('DRAFT');
  });

  it('requires confirmation before final submission', () => {
    component.form.setValue({
      inspectionDate: '2026-10-02',
      damageDescription: 'Cracked windshield and damaged trim.',
      damageSeverity: 'MODERATE',
      estimatedRepairCost: 1250,
      recommendedAction: 'Replace vehicle',
      surveyorRemarks: 'No additional damage observed.'
    });

    component.requestSubmitConfirmation();

    expect(dialogOpen).toHaveBeenCalled();
    expect(submitAssessment).not.toHaveBeenCalled();
  });

  it('submits only after the user confirms and then navigates to claim details', () => {
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);
    component.form.setValue({
      inspectionDate: '2026-10-02',
      damageDescription: 'Cracked windshield and damaged trim.',
      damageSeverity: 'MODERATE',
      estimatedRepairCost: 1250,
      recommendedAction: 'Replace vehicle',
      surveyorRemarks: 'No additional damage observed.'
    });

    component.requestSubmitConfirmation();
    expect(submitAssessment).not.toHaveBeenCalled();
    confirmationResult.next(true);

    expect(submitAssessment).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/claims', claim.id]);
  });

  it('reports an unassigned claim as unavailable', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SurveyAssessmentComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: claim.id }) } } },
        { provide: AuthService, useValue: { getCurrentUser: () => user } },
        { provide: ClaimService, useValue: {
          getClaimById: () => of(claim),
          isSurveyorAssigned: () => false,
          getClaimDocuments: () => of([])
        } },
        { provide: SurveyService, useValue: { getAssessment: () => of(null), saveDraft, submitAssessment } },
        { provide: MatDialog, useValue: { open: dialogOpen } },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } }
      ]
    });
    TestBed.overrideProvider(MatDialog, { useValue: { open: dialogOpen } });
    fixture = TestBed.createComponent(SurveyAssessmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.claim()).toBeNull();
    expect(component.errorMessage()).toContain('not assigned');
  });
});
