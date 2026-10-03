import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export const USER_FACING_ERROR_MESSAGES: Readonly<Record<number, string>> = {
  0: 'We could not connect to the service. Check your connection and try again.',
  400: 'Some submitted information is invalid. Review it and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource could not be found.',
  409: 'This action conflicts with the current claim state. Refresh and try again.',
  500: 'Something went wrong on our end. Please try again.'
};

@Injectable({ providedIn: 'root' })
export class ErrorHandlingService {
  messageFor(
    error: unknown,
    context: string,
    fallback = 'We could not complete your request. Please try again.'
  ): string {
    if (!(error instanceof HttpErrorResponse)) {
      this.report(error, context);
    }
    return this.userMessage(error, fallback);
  }

  userMessage(error: unknown, fallback = 'We could not complete your request. Please try again.'): string {
    if (error instanceof HttpErrorResponse) {
      return USER_FACING_ERROR_MESSAGES[error.status] ?? fallback;
    }
    return fallback;
  }

  report(
    error: unknown,
    context: string,
    request?: { readonly method: string; readonly path: string }
  ): void {
    const status = error instanceof HttpErrorResponse ? error.status : undefined;
    const errorType = error instanceof HttpErrorResponse
      ? 'HttpErrorResponse'
      : error instanceof Error ? error.name : 'UnknownError';
    console.error('[eClaims error]', { context, status, errorType, ...request });
  }
}
