import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AuthTokenInterceptor } from './auth-token.interceptor';

describe('AuthTokenInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    localStorage.removeItem('eclaims.mock-session');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: HTTP_INTERCEPTORS, useClass: AuthTokenInterceptor, multi: true }
      ]
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.removeItem('eclaims.mock-session');
    TestBed.resetTestingModule();
  });

  it('attaches a bearer token to protected API requests', async () => {
    const user = await firstValueFrom(authService.login('customer@example.com', 'Password123!'));
    http.get('/api/claims').subscribe();

    const request = httpTesting.expectOne('/api/claims');
    expect(request.request.headers.get('Authorization')).toBe(`Bearer ${user.token}`);
    request.flush([]);
  });

  it('does not attach a token to the login endpoint', async () => {
    await firstValueFrom(authService.login('customer@example.com', 'Password123!'));
    http.post('/api/auth/login', {}).subscribe();

    const request = httpTesting.expectOne('/api/auth/login');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({});
  });

  it('does not overwrite an explicitly supplied authorization header', async () => {
    await firstValueFrom(authService.login('customer@example.com', 'Password123!'));
    http.get('/api/claims', { headers: { Authorization: 'Bearer caller-token' } }).subscribe();

    const request = httpTesting.expectOne('/api/claims');
    expect(request.request.headers.get('Authorization')).toBe('Bearer caller-token');
    request.flush([]);
  });
});
