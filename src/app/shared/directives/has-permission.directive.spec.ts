import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { HasPermissionDirective } from './has-permission.directive';

@Component({
  standalone: true,
  imports: [HasPermissionDirective],
  template: '<button *appHasPermission="\'CLAIM_APPROVE\'">Approve</button>'
})
class PermissionDirectiveHostComponent {}

describe('HasPermissionDirective', () => {
  let fixture: ComponentFixture<PermissionDirectiveHostComponent>;
  let authService: AuthService;

  beforeEach(() => {
    localStorage.removeItem('eclaims.mock-session');
    TestBed.configureTestingModule({
      imports: [PermissionDirectiveHostComponent],
      providers: [provideRouter([])]
    });
    authService = TestBed.inject(AuthService);
    fixture = TestBed.createComponent(PermissionDirectiveHostComponent);
  });

  afterEach(() => {
    localStorage.removeItem('eclaims.mock-session');
  });

  it('hides unauthorized content and reacts when the authenticated role changes', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();

    await firstValueFrom(authService.login('customer@example.com', 'Password123!'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();

    await firstValueFrom(authService.login('adjuster@example.com', 'Password123!'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')?.textContent).toContain('Approve');
  });
});
