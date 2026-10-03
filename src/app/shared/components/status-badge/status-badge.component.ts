import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface StatusPresentation {
  readonly label: string;
  readonly icon: string;
  readonly tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger';
}

const STATUS_PRESENTATION: Readonly<Record<string, StatusPresentation>> = {
  DRAFT: { label: 'Draft', icon: 'edit_note', tone: 'neutral' },
  SUBMITTED: { label: 'Submitted', icon: 'send', tone: 'info' },
  SURVEY_ASSIGNED: { label: 'Survey Assigned', icon: 'assignment_ind', tone: 'info' },
  SURVEY_IN_PROGRESS: { label: 'Survey In Progress', icon: 'fact_check', tone: 'warning' },
  SURVEY_COMPLETED: { label: 'Survey Completed', icon: 'task_alt', tone: 'success' },
  UNDER_REVIEW: { label: 'Under Review', icon: 'rate_review', tone: 'warning' },
  ADDITIONAL_INFORMATION_REQUIRED: { label: 'Additional Information', icon: 'info', tone: 'warning' },
  APPROVED: { label: 'Approved', icon: 'check_circle', tone: 'success' },
  REJECTED: { label: 'Rejected', icon: 'cancel', tone: 'danger' },
  WORKSHOP_ASSIGNED: { label: 'Workshop Assigned', icon: 'handyman', tone: 'info' },
  REPAIR_IN_PROGRESS: { label: 'Repair In Progress', icon: 'build_circle', tone: 'warning' },
  REPAIR_COMPLETED: { label: 'Repair Completed', icon: 'task_alt', tone: 'success' },
  CLOSED: { label: 'Closed', icon: 'lock', tone: 'neutral' }
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <span class="status-badge" [ngClass]="'tone-' + presentation.tone" [attr.aria-label]="'Status: ' + presentation.label">
      <mat-icon aria-hidden="true">{{ presentation.icon }}</mat-icon>
      <span>{{ presentation.label }}</span>
    </span>
  `,
  styleUrls: ['./status-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadgeComponent {
  @Input({ required: true }) status = '';

  get presentation(): StatusPresentation {
    return STATUS_PRESENTATION[this.status] ?? {
      label: this.status.replace(/_/g, ' ').toLowerCase(),
      icon: 'help_outline',
      tone: 'neutral'
    };
  }
}
