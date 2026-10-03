import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, Subject } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { Role, User } from '../../../core/auth/auth.models';
import { Claim, ClaimStatus, ClaimType } from '../../claims/models/claim.models';
import { ClaimService } from '../../claims/services/claim.service';
import { WorkshopRepair, RepairStatus } from '../models/workshop-repair.model';
import { WorkshopService } from '../services/workshop.service';
import { WorkshopComponent } from './workshop.component';

describe('WorkshopComponent', () => {
  let fixture: ComponentFixture<WorkshopComponent>;
  let component: WorkshopComponent;
  let saveRepair: jasmine.Spy;
  let dialogResult: Subject<boolean>;
  const workshopUser: User = {
    id: 'workshop-1', name: 'Casey Patel', email: 'workshop@example.com', role: Role.Workshop, token: 'mock-token'
  };
  const claim: Claim = {
    id: 'claim-1003', claimNumber: 'CLM-2026-003', policyNumber: 'POL-BK-78109',
    policy: { policyNumber: 'POL-BK-78109', policyType: 'COMPREHENSIVE', startDate: '2025-01-01', endDate: '2026-12-31' },
    customer: { id: 'customer-1', name: 'Jordan Lee', email: 'customer@example.com', contactNumber: '+1 555 010 2020' },
    vehicle: { registrationNumber: 'JLK-903', make: 'Subaru', model: 'Crosstrek', year: 2023 },
    claimType: ClaimType.Weather, claimAmount: 3100, incidentDate: '2026-09-17', incidentLocation: 'Metro City',
    description: 'Weather damage.', status: ClaimStatus.Approved,
    assignedTo: { workshopEmail: workshopUser.email }, createdDate: '2026-09-20', updatedDate: '2026-09-20'
  };
  const repair: WorkshopRepair = {
    id: 'repair-1', claimId: claim.id, repairStartDate: '', estimatedCompletionDate: '', actualCompletionDate: '',
    repairStatus: RepairStatus.Assigned, repairEstimate: 3100, workshopRemarks: ''
  };

  beforeEach(() => {
    saveRepair = jasmine.createSpy('saveRepair').and.callFake((value: WorkshopRepair) => of({
      repair: value,
      claimStatus: value.repairStatus === RepairStatus.Completed ? ClaimStatus.RepairCompleted : ClaimStatus.RepairInProgress
    }));
    dialogResult = new Subject<boolean>();

    TestBed.configureTestingModule({
      imports: [WorkshopComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: claim.id }) } } },
        { provide: AuthService, useValue: { getCurrentUser: () => workshopUser } },
        {
          provide: ClaimService,
          useValue: {
            getClaimHistory: () => of([]),
            getClaimById: () => of(claim)
          }
        },
        { provide: WorkshopService, useValue: { getRepairForClaim: () => of({ claim, repair }), saveRepair } },
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => dialogResult.asObservable() }) } },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } }
      ]
    });
    fixture = TestBed.createComponent(WorkshopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the approved claim and repair data', () => {
    expect(component.claim()?.claimNumber).toBe('CLM-2026-003');
    expect(component.form.controls.repairEstimate.value).toBe(3100);
  });

  it('validates completion date ordering, nonnegative estimate, and actual completion requirement', () => {
    component.form.patchValue({
      repairStartDate: '2026-10-03',
      estimatedCompletionDate: '2026-10-02',
      repairEstimate: -1
    });
    expect(component.form.hasError('estimatedCompletionBeforeStart')).toBeTrue();
    expect(component.form.controls.repairEstimate.hasError('min')).toBeTrue();

    component.form.patchValue({ estimatedCompletionDate: '2026-10-10', repairEstimate: 0 });
    component.requestCompletionConfirmation();
    expect(component.form.controls.actualCompletionDate.hasError('required')).toBeTrue();
  });

  it('confirms repair completion before persisting the completed status', () => {
    component.form.setValue({
      repairStartDate: '2026-10-01',
      estimatedCompletionDate: '2026-10-10',
      actualCompletionDate: '2026-10-03',
      repairStatus: RepairStatus.Assigned,
      repairEstimate: 3200,
      workshopRemarks: 'Final checks passed.'
    });

    component.requestCompletionConfirmation();
    expect(saveRepair).not.toHaveBeenCalled();
    dialogResult.next(true);

    expect(saveRepair).toHaveBeenCalledWith(jasmine.objectContaining({
      repairStatus: RepairStatus.Completed,
      actualCompletionDate: '2026-10-03'
    }), workshopUser);
  });
});
