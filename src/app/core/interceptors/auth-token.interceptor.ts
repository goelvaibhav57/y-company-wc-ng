import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  private readonly authService = inject(AuthService);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (isLoginRequest(request.url)) {
      return next.handle(request);
    }

    const token = this.authService.getCurrentUser()?.token;
    if (!token || request.headers.has('Authorization')) {
      return next.handle(request);
    }

    return next.handle(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
}

function isLoginRequest(url: string): boolean {
  return /\/api\/auth\/login\/?(?:\?|$)/i.test(url);
}
