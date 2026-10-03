import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ErrorHandlingService, USER_FACING_ERROR_MESSAGES } from '../errors/error-handling.service';
import { HttpErrorInterceptor } from './http-error.interceptor';
import { NotificationService } from '../../shared/services/notification.service';

describe('HttpErrorInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let authService: AuthService;
  let router: Router;
  let notifications: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    localStorage.removeItem('eclaims.mock-session');
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error', 'info', 'warning']);
    spyOn(console, 'error');

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true },
        { provide: NotificationService, useValue: notifications }
      ]
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.removeItem('eclaims.mock-session');
    TestBed.resetTestingModule();
  });

  it('clears the expired session and redirects to login on a protected 401', async () => {
    await firstValueFrom(authService.login('customer@example.com', 'Password123!'));
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    http.get('/api/claims').subscribe({ error: () => undefined });
    httpTesting.expectOne('/api/claims').flush({ stack: 'must not reach the user' }, { status: 401, statusText: 'Unauthorized' });

    expect(authService.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('eclaims.mock-session')).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login');
    expect(notifications.error).toHaveBeenCalledWith(USER_FACING_ERROR_MESSAGES[401]);
  });

  it('redirects forbidden requests to access denied and shows the safe message', () => {
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    http.get('/api/claims/claim-1').subscribe({ error: () => undefined });
    httpTesting.expectOne('/api/claims/claim-1').flush({}, { status: 403, statusText: 'Forbidden' });

    expect(navigate).toHaveBeenCalledWith('/access-denied');
    expect(notifications.error).toHaveBeenCalledWith(USER_FACING_ERROR_MESSAGES[403]);
  });

  for (const status of [400, 404, 409, 500]) {
    it(`shows the standard safe message for HTTP ${status}`, () => {
      http.get('/api/claims').subscribe({ error: () => undefined });
      httpTesting.expectOne('/api/claims').flush({ detail: 'private server data', stack: 'private stack trace' }, {
        status,
        statusText: 'Failure'
      });

      expect(notifications.error).toHaveBeenCalledWith(USER_FACING_ERROR_MESSAGES[status]);
      expect(notifications.error).not.toHaveBeenCalledWith(jasmine.stringMatching(/private|stack/i));
    });
  }

  it('does not expire an existing session for an invalid login response', async () => {
    await firstValueFrom(authService.login('surveyor@example.com', 'Password123!'));
    http.post('/api/auth/login', {}).subscribe({ error: () => undefined });
    httpTesting.expectOne('/api/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authService.isAuthenticated()).toBeTrue();
    expect(notifications.error).not.toHaveBeenCalled();
  });

  it('does not include response body or stack text in debug logs', () => {
    http.get('/api/claims?customerEmail=private@example.com').subscribe({ error: () => undefined });
    httpTesting.expectOne('/api/claims?customerEmail=private@example.com').flush({ stack: 'secret stack' }, {
      status: 500,
      statusText: 'Server Error'
    });

    const logEntry = (console.error as jasmine.Spy).calls.mostRecent().args[1] as Record<string, unknown>;
    expect(logEntry['path']).toBe('/api/claims');
    expect(JSON.stringify(logEntry)).not.toContain('private@example.com');
    expect(JSON.stringify(logEntry)).not.toContain('secret stack');
  });
});
