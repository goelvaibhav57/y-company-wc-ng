import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { Permission, Role } from './auth.models';
import { PermissionService } from './permission.service';

describe('PermissionService', () => {
  let authService: AuthService;
  let permissionService: PermissionService;

  beforeEach(() => {
    localStorage.removeItem('eclaims.mock-session');
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    authService = TestBed.inject(AuthService);
    permissionService = TestBed.inject(PermissionService);
  });

  afterEach(() => {
    localStorage.removeItem('eclaims.mock-session');
  });

  it('grants only the permissions mapped to the current role', async () => {
    expect(permissionService.hasPermission(Permission.ClaimRead)).toBeFalse();

    await firstValueFrom(authService.login('customer@example.com', 'Password123!'));
    expect(permissionService.hasPermission(Permission.ClaimRead)).toBeTrue();
    expect(permissionService.hasPermission(Permission.ClaimCreate)).toBeTrue();
    expect(permissionService.hasPermission(Permission.ClaimApprove)).toBeFalse();
    expect(permissionService.hasRole(Role.Customer)).toBeTrue();
    expect(permissionService.hasRole(Role.Adjuster)).toBeFalse();

    await firstValueFrom(authService.login('surveyor@example.com', 'Password123!'));
    expect(permissionService.hasPermission(Permission.ClaimSurvey)).toBeTrue();
    expect(permissionService.hasPermission(Permission.ClaimReview)).toBeFalse();

    await firstValueFrom(authService.login('adjuster@example.com', 'Password123!'));
    expect(permissionService.hasPermission(Permission.ClaimReview)).toBeTrue();
    expect(permissionService.hasPermission(Permission.ClaimApprove)).toBeTrue();
    expect(permissionService.hasPermission(Permission.ClaimReject)).toBeTrue();
    expect(permissionService.hasPermission(Permission.ClaimSurvey)).toBeFalse();

    await firstValueFrom(authService.login('workshop@example.com', 'Password123!'));
    expect(permissionService.hasPermission(Permission.ClaimWorkshopUpdate)).toBeTrue();
    expect(permissionService.hasPermission(Permission.ClaimCreate)).toBeFalse();
  });

  it('supports any/all checks, including empty permission lists', async () => {
    await firstValueFrom(authService.login('customer@example.com', 'Password123!'));

    expect(permissionService.hasAnyPermission([Permission.ClaimRead, Permission.ClaimApprove])).toBeTrue();
    expect(permissionService.hasAnyPermission([Permission.ClaimApprove, Permission.ClaimReject])).toBeFalse();
    expect(permissionService.hasAllPermissions([Permission.ClaimRead, Permission.ClaimCreate])).toBeTrue();
    expect(permissionService.hasAllPermissions([Permission.ClaimRead, Permission.ClaimApprove])).toBeFalse();
    expect(permissionService.hasAnyPermission([])).toBeFalse();
    expect(permissionService.hasAllPermissions([])).toBeTrue();
  });
});
