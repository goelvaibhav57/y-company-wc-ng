import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { defer, Observable, of, throwError } from 'rxjs';
import { Role, User } from './auth.models';

const SESSION_STORAGE_KEY = 'eclaims.mock-session';
const POC_PASSWORD = 'Password123!';
const INVALID_CREDENTIALS_MESSAGE = 'The email or password you entered is incorrect.';

interface DemoAccount {
  readonly id: string;
  readonly name: string;
  readonly role: Role;
}

const DEMO_ACCOUNTS: Readonly<Record<string, DemoAccount>> = {
  'customer@example.com': { id: 'user-customer', name: 'Jordan Lee', role: Role.Customer },
  'surveyor@example.com': { id: 'user-surveyor', name: 'Taylor Reed', role: Role.Surveyor },
  'adjuster@example.com': { id: 'user-adjuster', name: 'Morgan Ellis', role: Role.Adjuster },
  'workshop@example.com': { id: 'user-workshop', name: 'Casey Patel', role: Role.Workshop }
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly userState = signal<User | null>(this.restoreSession());

  readonly currentUser: Signal<User | null> = this.userState.asReadonly();
  readonly currentRole: Signal<Role | null> = computed(() => this.userState()?.role ?? null);

  login(username: string, password: string): Observable<User> {
    return defer(() => {
      const normalizedUsername = username.trim().toLowerCase();
      const account = DEMO_ACCOUNTS[normalizedUsername];

      if (!account || password !== POC_PASSWORD) {
        return throwError(() => new Error(INVALID_CREDENTIALS_MESSAGE));
      }

      const user: User = {
        ...account,
        email: normalizedUsername,
        token: `mock.${account.id}.${Date.now().toString(36)}`
      };

      this.persistSession(user);
      this.userState.set(user);
      return of(user);
    });
  }

  logout(): void {
    this.userState.set(null);
    this.clearSession();
    void this.router.navigateByUrl('/login');
  }

  isAuthenticated(): boolean {
    return this.userState() !== null;
  }

  getCurrentUser(): User | null {
    return this.userState();
  }

  getCurrentRole(): Role | null {
    return this.currentRole();
  }

  private restoreSession(): User | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const serializedUser = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!serializedUser) {
        return null;
      }

      const user: unknown = JSON.parse(serializedUser);
      if (this.isUser(user)) {
        return user;
      }
    } catch {
      this.clearSession();
    }

    return null;
  }

  private isUser(value: unknown): value is User {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const user = value as Partial<User>;
    return typeof user.id === 'string'
      && typeof user.name === 'string'
      && typeof user.email === 'string'
      && typeof user.token === 'string'
      && Object.values(Role).includes(user.role as Role);
  }

  private persistSession(user: User): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    }
  }

  private clearSession(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }
}
