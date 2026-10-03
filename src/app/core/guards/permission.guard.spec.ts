import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Permission } from '../auth/auth.models';
import { permissionGuard } from './permission.guard';

describe('permissionGuard', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.removeItem('eclaims.mock-session');
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.removeItem('eclaims.mock-session');
  });

  it('allows the assigned survey, review, and workshop roles only', async () => {
    const workflowRoutes: ReadonlyArray<{
      readonly email: string;
      readonly url: string;
      readonly permission: Permission;
    }> = [
      { email: 'surveyor@example.com', url: '/claims/claim-42/survey', permission: Permission.ClaimSurvey },
      { email: 'adjuster@example.com', url: '/claims/claim-42/review', permission: Permission.ClaimReview },
      {
        email: 'workshop@example.com',
        url: '/claims/claim-42/workshop',
        permission: Permission.ClaimWorkshopUpdate
      }
    ];

    for (const workflowRoute of workflowRoutes) {
      const route = {
        data: { permission: workflowRoute.permission }
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: workflowRoute.url } as RouterStateSnapshot;

      await firstValueFrom(authService.login(workflowRoute.email, 'Password123!'));
      expect(TestBed.runInInjectionContext(() => permissionGuard(route, state))).toBeTrue();

      await firstValueFrom(authService.login('customer@example.com', 'Password123!'));
      const result = TestBed.runInInjectionContext(() => permissionGuard(route, state));
      expect(result instanceof UrlTree).toBeTrue();
      expect(router.serializeUrl(result as UrlTree)).toBe('/access-denied');
    }
  });
});
