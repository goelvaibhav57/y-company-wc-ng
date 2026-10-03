import { Injectable, inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ErrorHandlingService } from '../errors/error-handling.service';
import { NotificationService } from '../../shared/services/notification.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly errorHandling = inject(ErrorHandlingService);
  private readonly notifications = inject(NotificationService);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: unknown) => {
        this.errorHandling.report(error, 'http', {
          method: request.method,
          path: safeRequestPath(request.url)
        });

        if (!(error instanceof HttpErrorResponse) || isLoginRequest(request.url)) {
          return throwError(() => error);
        }

        const message = this.errorHandling.userMessage(error);
        if (error.status === 401) {
          this.notifications.error(message);
          this.authService.logout();
        } else if (error.status === 403) {
          this.notifications.error(message);
          void this.router.navigateByUrl('/access-denied');
        } else if ([0, 400, 404, 409, 500].includes(error.status)) {
          this.notifications.error(message);
        } else {
          this.notifications.error('We could not complete your request. Please try again.');
        }

        return throwError(() => error);
      })
    );
  }
}

function isLoginRequest(url: string): boolean {
  return /\/api\/auth\/login\/?(?:\?|$)/i.test(url);
}

function safeRequestPath(url: string): string {
  try {
    const pathSegments = new URL(url, 'http://localhost').pathname.split('/').filter(Boolean);
    if (pathSegments[0] === 'api') {
      return `/${pathSegments[0]}/${pathSegments[1] ?? ''}`;
    }
    return `/${pathSegments[0] ?? ''}`;
  } catch {
    return '/unknown';
  }
}
