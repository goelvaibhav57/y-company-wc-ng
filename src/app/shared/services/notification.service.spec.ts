import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let open: jasmine.Spy;

  beforeEach(() => {
    open = jasmine.createSpy('open');
    TestBed.configureTestingModule({ providers: [NotificationService, { provide: MatSnackBar, useValue: { open } }] });
    service = TestBed.inject(NotificationService);
  });

  it('uses consistent success and error toast styles and durations', () => {
    service.success('Saved.');
    service.error('Failed.');

    expect(open.calls.argsFor(0)).toEqual(['Saved.', 'Dismiss', jasmine.objectContaining({
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['eclaims-toast-success']
    })]);
    expect(open.calls.argsFor(1)).toEqual(['Failed.', 'Dismiss', jasmine.objectContaining({
      duration: 6000,
      panelClass: ['eclaims-toast-error']
    })]);
  });
});
