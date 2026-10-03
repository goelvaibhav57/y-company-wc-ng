import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { Role, User } from './auth.models';

describe('AuthService', () => {
  const sessionStorageKey = 'eclaims.mock-session';
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.removeItem(sessionStorageKey);
    TestBed.configureTestingModule({
      providers: [provideRouter([])]
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.removeItem(sessionStorageKey);
  });

  it('authenticates a demo user and persists a mock token and user', async () => {
    const user = await firstValueFrom(authService.login('customer@example.com', 'Password123!'));

    expect(user.email).toBe('customer@example.com');
    expect(user.role).toBe(Role.Customer);
    expect(user.token).toContain('mock.user-customer.');
    expect(authService.isAuthenticated()).toBeTrue();
    expect(authService.getCurrentUser()).toEqual(user);
    expect(authService.getCurrentRole()).toBe(Role.Customer);
    expect(JSON.parse(localStorage.getItem(sessionStorageKey) as string) as User).toEqual(user);
  });

  it('rejects invalid credentials without setting an authenticated user', async () => {
    await expectAsync(firstValueFrom(authService.login('customer@example.com', 'incorrect')))
      .toBeRejectedWithError('The email or password you entered is incorrect.');

    expect(authService.isAuthenticated()).toBeFalse();
    expect(authService.getCurrentUser()).toBeNull();
    expect(localStorage.getItem(sessionStorageKey)).toBeNull();
  });

  it('supports each configured demo role', async () => {
    const accounts: ReadonlyArray<readonly [string, Role]> = [
      ['customer@example.com', Role.Customer],
      ['surveyor@example.com', Role.Surveyor],
      ['adjuster@example.com', Role.Adjuster],
      ['workshop@example.com', Role.Workshop]
    ];

    for (const [email, expectedRole] of accounts) {
      const user = await firstValueFrom(authService.login(email, 'Password123!'));
      expect(user.role).toBe(expectedRole);
    }
  });

  it('restores a valid session from local storage', () => {
    const persistedUser: User = {
      id: 'user-surveyor',
      name: 'Taylor Reed',
      email: 'surveyor@example.com',
      role: Role.Surveyor,
      token: 'mock-restored-token'
    };
    localStorage.setItem(sessionStorageKey, JSON.stringify(persistedUser));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    authService = TestBed.inject(AuthService);

    expect(authService.getCurrentUser()).toEqual(persistedUser);
    expect(authService.isAuthenticated()).toBeTrue();
  });

  it('clears the session and navigates to login on logout', async () => {
    await firstValueFrom(authService.login('workshop@example.com', 'Password123!'));
    const navigation = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    authService.logout();

    expect(authService.isAuthenticated()).toBeFalse();
    expect(authService.getCurrentUser()).toBeNull();
    expect(authService.getCurrentRole()).toBeNull();
    expect(localStorage.getItem(sessionStorageKey)).toBeNull();
    expect(navigation).toHaveBeenCalledWith('/login');
  });
});
