import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { Role, User } from '../../../core/auth/auth.models';
import { Claim, ClaimStatus, ClaimType } from '../models/claim.models';
import { ClaimService } from '../services/claim.service';
import { CreateClaimComponent } from './create-claim.component';

describe('CreateClaimComponent', () => {
  let fixture: ComponentFixture<CreateClaimComponent>;
  let component: CreateClaimComponent;
  let createClaim: jasmine.Spy;
  let navigateByUrl: jasmine.Spy;
  let snackbarOpen: jasmine.Spy;
  const user: User = {
    id: 'customer-1', name: 'Jordan Lee', email: 'customer@example.com', role: Role.Customer, token: 'mock-token'
  };
  const createdClaim: Claim = {
    id: 'claim-new-1', claimNumber: 'CLM-2026-014', policyNumber: 'POL-NEW-100',
    policy: { policyNumber: 'POL-NEW-100', policyType: 'COMPREHENSIVE', startDate: '2025-01-01', endDate: '2026-12-31' },
    customer: { id: 'customer-1', name: 'Jordan Lee', email: 'customer@example.com', contactNumber: '+1 555 123 4567' },
    vehicle: { registrationNumber: 'NEW-100', make: 'Honda', model: 'Civic', year: 2024 },
    claimType: ClaimType.Collision, claimAmount: 2500, incidentDate: '2026-09-20',
    incidentLocation: 'Metro City', description: 'Damage to the rear bumper.', status: ClaimStatus.Submitted,
    assignedTo: {}, createdDate: '2026-09-29', updatedDate: '2026-09-29'
  };

  beforeEach(() => {
    createClaim = jasmine.createSpy('createClaim').and.returnValue(of(createdClaim));
    navigateByUrl = jasmine.createSpy('navigateByUrl').and.resolveTo(true);
    snackbarOpen = jasmine.createSpy('open');

    TestBed.configureTestingModule({
      imports: [CreateClaimComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { getCurrentUser: () => user } },
        { provide: ClaimService, useValue: { createClaim } },
        { provide: MatSnackBar, useValue: { open: snackbarOpen } }
      ]
    });
    fixture = TestBed.createComponent(CreateClaimComponent);
    component = fixture.componentInstance;
  });

  it('marks required fields invalid and does not call the service', () => {
    component.submit();

    expect(component.form.invalid).toBeTrue();
    expect(component.form.controls.customer.controls.email.touched).toBeTrue();
    expect(createClaim).not.toHaveBeenCalled();
  });

  it('submits valid data, displays success feedback, and navigates to the created claim', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.callFake(navigateByUrl);
    component.form.setValue({
      customer: { name: 'Jordan Lee', contactNumber: '+1 (555) 123-4567', email: 'customer@example.com' },
      policy: {
        policyNumber: 'POL-NEW-100', policyType: 'COMPREHENSIVE',
        startDate: '2025-01-01', endDate: '2026-12-31'
      },
      vehicle: { registrationNumber: 'NEW-100', make: 'Honda', model: 'Civic', year: 2024 },
      incident: {
        date: '2026-09-20', location: 'Metro City', type: ClaimType.Collision,
        description: 'Damage to the rear bumper.'
      },
      claim: { estimatedClaimAmount: 2500, supportingDocuments: [] }
    });

    component.submit();

    expect(createClaim).toHaveBeenCalled();
    expect(component.submitting()).toBeFalse();
    expect(snackbarOpen).toHaveBeenCalledWith(
      'Claim CLM-2026-014 created successfully.', 'Dismiss', jasmine.objectContaining({ duration: 4500 })
    );
    expect(navigateByUrl).toHaveBeenCalledWith('/claims/claim-new-1');
  });

  it('shows a friendly error and re-enables submission when the service fails', () => {
    createClaim.and.returnValue(throwError(() => new Error('backend unavailable')));
    component.form.setValue({
      customer: { name: 'Jordan Lee', contactNumber: '+1 (555) 123-4567', email: 'customer@example.com' },
      policy: {
        policyNumber: 'POL-NEW-100', policyType: 'COMPREHENSIVE',
        startDate: '2025-01-01', endDate: '2026-12-31'
      },
      vehicle: { registrationNumber: 'NEW-100', make: 'Honda', model: 'Civic', year: 2024 },
      incident: {
        date: '2026-09-20', location: 'Metro City', type: ClaimType.Collision,
        description: 'Damage to the rear bumper.'
      },
      claim: { estimatedClaimAmount: 2500, supportingDocuments: [] }
    });

    component.submit();

    expect(component.submitting()).toBeFalse();
    expect(component.errorMessage()).toBe('We could not submit your claim. Please try again.');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
