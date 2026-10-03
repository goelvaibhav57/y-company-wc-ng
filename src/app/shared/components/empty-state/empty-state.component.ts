import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [NgIf, MatButtonModule, MatIconModule],
  template: `
    <section class="empty-state" role="status">
      <span class="empty-icon"><mat-icon aria-hidden="true">{{ icon }}</mat-icon></span>
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>
      <button *ngIf="actionLabel" mat-stroked-button type="button" (click)="actionRequested.emit()">{{ actionLabel }}</button>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .empty-state { display: flex; min-height: 170px; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; }
    .empty-icon { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 12px; background: #f0f5fb; color: #7187a2; }
    h2 { margin: 13px 0 5px; color: #31435a; font-size: 15px; }
    p { max-width: 440px; margin: 0 0 14px; color: #77869a; font-size: 13px; line-height: 1.5; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  @Input() title = 'Nothing here yet';
  @Input() message = 'Items will appear here when they are available.';
  @Input() icon = 'inbox';
  @Input() actionLabel = '';
  @Output() readonly actionRequested = new EventEmitter<void>();
}
