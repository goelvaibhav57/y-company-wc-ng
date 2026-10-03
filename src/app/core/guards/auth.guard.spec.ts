import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { authChildGuard, authGuard, guestGuard } from './auth.guard';

describe('authentication route guards', () => {
  let router: Router;
  let authService: AuthService;

  beforeEach(() => {
    localStorage.removeItem('eclaims.mock-session');
    TestBed.configureTestingModule({
      providers: [provideRouter([])]
    });
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.removeItem('eclaims.mock-session');
  });

  it('redirects unauthenticated users to login and preserves the requested URL', () => {
    const result = TestBed.runInInjectionContext(() => authGuard(
      {} as ActivatedRouteSnapshot,
      { url: '/claims/claim-42/review' } as RouterStateSnapshot
    ));

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fclaims%2Fclaim-42%2Freview');
  });

  it('allows authenticated users to activate protected routes', async () => {
    await firstValueFrom(authService.login('customer@example.com', 'Password123!'));

    const result = TestBed.runInInjectionContext(() => authGuard(
      {} as ActivatedRouteSnapshot,
      { url: '/dashboard' } as RouterStateSnapshot
    ));

    expect(result).toBeTrue();
  });

  it('protects child routes when the shell is already active', () => {
    const result = TestBed.runInInjectionContext(() => authChildGuard(
      {} as ActivatedRouteSnapshot,
      { url: '/claims/claim-42/survey' } as RouterStateSnapshot
    ));

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toContain('/login');
  });

  it('redirects authenticated users away from login', async () => {
    await firstValueFrom(authService.login('adjuster@example.com', 'Password123!'));

    const result = TestBed.runInInjectionContext(() => guestGuard(
      {} as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot
    ));

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/dashboard');
  });
});
