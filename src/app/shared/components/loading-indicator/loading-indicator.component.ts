import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-indicator',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <section class="loading-state" role="status" aria-live="polite">
      <mat-spinner [diameter]="diameter" [attr.aria-label]="message"></mat-spinner>
      <span>{{ message }}</span>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .loading-state { display: flex; min-height: 120px; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #718096; font-size: 13px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingIndicatorComponent {
  @Input() message = 'Loading…';
  @Input() diameter = 36;
}
