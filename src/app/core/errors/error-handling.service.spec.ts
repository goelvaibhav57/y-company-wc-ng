import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandlingService, USER_FACING_ERROR_MESSAGES } from './error-handling.service';

describe('ErrorHandlingService', () => {
  let service: ErrorHandlingService;

  beforeEach(() => {
    service = new ErrorHandlingService();
    spyOn(console, 'error');
  });

  it('maps supported HTTP statuses to safe messages', () => {
    for (const status of [400, 401, 403, 404, 409, 500]) {
      const error = new HttpErrorResponse({ status, statusText: 'Failure', error: { stack: 'sensitive stack' } });
      expect(service.userMessage(error)).toBe(USER_FACING_ERROR_MESSAGES[status]);
    }
  });

  it('does not show a backend body, raw exception message, or stack trace', () => {
    const error = new HttpErrorResponse({
      status: 500,
      statusText: 'Server Error',
      error: { message: 'db password=secret', stack: 'private stack' }
    });
    expect(service.userMessage(error)).toBe('Something went wrong on our end. Please try again.');
    expect(service.userMessage(new Error('private stack'))).toBe('We could not complete your request. Please try again.');
  });

  it('logs only safe diagnostic metadata', () => {
    const error = new HttpErrorResponse({ status: 500, error: { stack: 'sensitive stack' } });
    service.report(error, 'claims.load', { method: 'GET', path: '/api/claims/:id' });

    const entry = (console.error as jasmine.Spy).calls.mostRecent().args[1] as Record<string, unknown>;
    expect(entry).toEqual({ context: 'claims.load', status: 500, errorType: 'HttpErrorResponse', method: 'GET', path: '/api/claims/:id' });
    expect(JSON.stringify(entry)).not.toContain('sensitive stack');
  });
});
