import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { Role, User } from '../../../../core/auth/auth.models';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let login: jasmine.Spy;
  let router: Router;
  const customer: User = {
    id: 'customer-1', name: 'Jordan Lee', email: 'customer@example.com', role: Role.Customer, token: 'mock-token'
  };

  function setup(returnUrl: string | null): void {
    login = jasmine.createSpy('login').and.returnValue(of(customer));
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ returnUrl }) } } },
        { provide: AuthService, useValue: { login } }
      ]
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    component = TestBed.createComponent(LoginComponent).componentInstance;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('redirects to the originally requested internal route after login', () => {
    setup('/claims/claim-42/review?tab=documents');
    component.form.setValue({ email: 'customer@example.com', password: 'Password123!' });
    component.submit();

    expect(login).toHaveBeenCalledWith('customer@example.com', 'Password123!');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/claims/claim-42/review?tab=documents');
    expect(component.submitting()).toBeFalse();
  });

  it('rejects external return URLs and falls back to dashboard', () => {
    setup('//external.example/path');
    component.form.setValue({ email: 'customer@example.com', password: 'Password123!' });
    component.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('offers all four demo roles without exposing or filling a password', () => {
    setup(null);
    expect(component.demoUsers.map((demoUser) => demoUser.role)).toEqual([
      'Customer', 'Surveyor', 'Adjuster', 'Workshop'
    ]);

    component.form.controls.password.setValue('previous-entry');
    component.selectDemoUser('surveyor@example.com');

    expect(component.form.controls.email.value).toBe('surveyor@example.com');
    expect(component.form.controls.password.value).toBe('');
  });

  it('shows a safe credential error and clears the pending state on failure', () => {
    setup(null);
    login.and.returnValue(throwError(() => new Error('internal authentication detail')));
    component.form.setValue({ email: 'customer@example.com', password: 'wrong' });
    component.submit();

    expect(component.authenticationError()).toBe('The email or password you entered is incorrect.');
    expect(component.submitting()).toBeFalse();
  });
});
