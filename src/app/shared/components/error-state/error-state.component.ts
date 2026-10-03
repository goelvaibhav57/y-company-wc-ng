import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [NgIf, MatButtonModule, MatIconModule],
  template: `
    <section class="error-state" role="alert" aria-live="assertive">
      <mat-icon aria-hidden="true">cloud_off</mat-icon>
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>
      <button *ngIf="retryLabel" mat-stroked-button type="button" (click)="retryRequested.emit()">{{ retryLabel }}</button>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .error-state { display: flex; min-height: 170px; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; }
    mat-icon { width: 32px; height: 32px; color: #b94d4d; font-size: 32px; }
    h2 { margin: 12px 0 5px; color: #35465c; font-size: 16px; }
    p { max-width: 480px; margin: 0 0 14px; color: #718096; font-size: 13px; line-height: 1.5; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorStateComponent {
  @Input() title = 'Something went wrong';
  @Input() message = 'We could not complete your request. Please try again.';
  @Input() retryLabel = 'Try again';
  @Output() readonly retryRequested = new EventEmitter<void>();
}
