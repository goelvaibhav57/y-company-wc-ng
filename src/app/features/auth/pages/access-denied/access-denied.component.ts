import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  template: `
    <main class="denied-page">
      <mat-card class="denied-card">
        <div class="status-code" aria-label="HTTP 403 Forbidden">403</div>
        <mat-icon class="denied-icon" aria-hidden="true">gpp_maybe</mat-icon>
        <h1>Access denied</h1>
        <p>You don’t have permission to view this page or perform this action.</p>
        <a mat-flat-button color="primary" routerLink="/dashboard">
          <mat-icon>arrow_back</mat-icon>
          Back to Dashboard
        </a>
      </mat-card>
    </main>
  `,
  styles: [`
    :host { display: block; }
    .denied-page { display: grid; min-height: 58vh; place-items: center; }
    .denied-card {
      display: flex;
      width: min(100%, 480px);
      align-items: center;
      padding: 38px 32px;
      border-radius: 14px;
      text-align: center;
      box-shadow: 0 12px 36px rgba(25, 48, 82, 0.08);
    }
    .status-code { color: #d8e5f8; font-size: 54px; font-weight: 750; letter-spacing: -2px; line-height: 1; }
    .denied-icon { width: 42px; height: 42px; margin-top: 20px; color: #c47a18; font-size: 42px; }
    h1 { margin: 14px 0 8px; color: #17253a; font-size: 24px; }
    p { max-width: 340px; margin: 0 0 24px; color: #718096; font-size: 14px; line-height: 1.6; }
    a { min-height: 42px; border-radius: 8px; text-decoration: none; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccessDeniedComponent {}
