import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, provideRouter, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Role, User } from '../../../core/auth/auth.models';
import { ClaimService } from '../../claims/services/claim.service';
import { surveyAssignmentGuard } from './survey-assignment.guard';

describe('surveyAssignmentGuard', () => {
  const assignedUser: User = {
    id: 'surveyor-1', name: 'Taylor Reed', email: 'surveyor@example.com', role: Role.Surveyor, token: 'token'
  };
  let assigned: boolean;
  let currentUser: User;
  let router: Router;

  beforeEach(() => {
    assigned = true;
    currentUser = assignedUser;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { getCurrentUser: () => currentUser } },
        { provide: ClaimService, useValue: { isSurveyorAssigned: () => assigned } }
      ]
    });
    router = TestBed.inject(Router);
  });

  it('allows the assigned surveyor', () => {
    const result = TestBed.runInInjectionContext(() => surveyAssignmentGuard(
      { paramMap: convertToParamMap({ id: 'claim-1002' }) } as unknown as ActivatedRouteSnapshot,
      {} as never
    ));

    expect(result).toBeTrue();
  });

  it('redirects a non-assigned user to access denied', () => {
    assigned = false;
    const result = TestBed.runInInjectionContext(() => surveyAssignmentGuard(
      { paramMap: convertToParamMap({ id: 'claim-1002' }) } as unknown as ActivatedRouteSnapshot,
      {} as never
    ));

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/access-denied');
  });

  it('denies users who are not surveyors', () => {
    currentUser = { ...assignedUser, role: Role.Customer };
    const result = TestBed.runInInjectionContext(() => surveyAssignmentGuard(
      { paramMap: convertToParamMap({ id: 'claim-1002' }) } as unknown as ActivatedRouteSnapshot,
      {} as never
    ));

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/access-denied');
  });
});
