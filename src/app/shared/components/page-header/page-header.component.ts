import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="page-header">
      <div class="page-heading">
        <h1>{{ title }}</h1>
        <p *ngIf="subtitle">{{ subtitle }}</p>
      </div>
      <div class="page-actions">
        <ng-content select="[page-header-actions]"></ng-content>
      </div>
    </header>
  `,
  styles: [`
    :host { display: block; }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 24px;
    }
    .page-heading h1 {
      margin: 0;
      color: #17253a;
      font-size: 25px;
      font-weight: 650;
      letter-spacing: -0.45px;
      line-height: 1.3;
    }
    .page-heading p {
      margin: 5px 0 0;
      color: #748197;
      font-size: 13px;
      line-height: 1.5;
    }
    .page-actions:empty { display: none; }
    @media (max-width: 600px) {
      .page-header { align-items: flex-start; flex-direction: column; gap: 14px; }
      .page-heading h1 { font-size: 22px; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string;
}
