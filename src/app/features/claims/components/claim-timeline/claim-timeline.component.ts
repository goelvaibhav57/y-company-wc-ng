import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ClaimActivity, ClaimStatus } from '../../models/claim.models';

interface TimelineMilestone {
  readonly label: string;
  readonly statuses: readonly ClaimStatus[];
  readonly icon: string;
}

interface TimelineEntry {
  readonly label: string;
  readonly icon: string;
  readonly activity: ClaimActivity | null;
}

const MILESTONES: readonly TimelineMilestone[] = [
  { label: 'Claim Created', statuses: ['SUBMITTED', 'DRAFT'], icon: 'add_circle' },
  { label: 'Survey Assigned', statuses: ['SURVEY_ASSIGNED'], icon: 'assignment_ind' },
  { label: 'Survey Completed', statuses: ['SURVEY_COMPLETED'], icon: 'fact_check' },
  { label: 'Adjuster Review', statuses: ['UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED'], icon: 'rate_review' },
  { label: 'Approval / Rejection', statuses: ['APPROVED', 'REJECTED'], icon: 'gavel' },
  { label: 'Workshop Assignment', statuses: ['WORKSHOP_ASSIGNED'], icon: 'handyman' },
  { label: 'Repair Completed', statuses: ['REPAIR_COMPLETED'], icon: 'task_alt' },
  { label: 'Claim Closed', statuses: ['CLOSED'], icon: 'lock' }
];

@Component({
  selector: 'app-claim-timeline',
  standalone: true,
  imports: [CommonModule, DatePipe, MatCardModule, MatIconModule],
  template: `
    <mat-card class="panel-card">
      <div class="panel-heading"><div><h2>Claim Timeline</h2><p>Progress generated from claim history</p></div></div>
      <ol class="timeline" aria-label="Claim status timeline">
        <li *ngFor="let entry of entries; let last = last" class="timeline-entry" [class.complete]="entry.activity" [class.pending]="!entry.activity" [class.last-entry]="last">
          <span class="timeline-marker"><mat-icon aria-hidden="true">{{ entry.activity ? entry.icon : 'radio_button_unchecked' }}</mat-icon></span>
          <div class="timeline-copy">
            <strong>{{ entry.label }}</strong>
            <span *ngIf="entry.activity">{{ entry.activity.date | date:'MMM d, y' }} · {{ entry.activity.user }}</span>
            <span *ngIf="!entry.activity" class="awaiting">Awaiting this step</span>
          </div>
        </li>
      </ol>
    </mat-card>
  `,
  styles: [`
    .panel-card { padding: 21px 22px; border: 1px solid #edf0f5; border-radius: 12px; box-shadow: 0 3px 14px rgba(29, 50, 80, .035); }
    .panel-heading h2 { margin: 0; color: #1b2a40; font-size: 15px; font-weight: 650; }
    .panel-heading p { margin: 5px 0 0; color: #8491a3; font-size: 10px; }
    .timeline { margin: 23px 0 0; padding: 0; list-style: none; }
    .timeline-entry { position: relative; display: flex; min-height: 58px; gap: 12px; }
    .timeline-entry:not(.last-entry)::after { position: absolute; top: 25px; bottom: 0; left: 10px; width: 1px; background: #e5eaf1; content: ''; }
    .timeline-marker { z-index: 1; display: grid; width: 21px; height: 21px; flex: 0 0 21px; place-items: center; border: 1px solid #dbe3ed; border-radius: 50%; background: #fff; color: #a0acbb; }
    .timeline-marker mat-icon { width: 13px; height: 13px; font-size: 13px; }
    .complete .timeline-marker { border-color: #cce5d7; background: #eff8f2; color: #278055; }
    .timeline-copy { display: flex; flex-direction: column; gap: 4px; padding: 2px 0 15px; }
    .timeline-copy strong { color: #33445b; font-size: 11px; font-weight: 600; }
    .timeline-copy span { color: #8693a5; font-size: 10px; }
    .timeline-copy .awaiting { color: #a1abba; }
    .pending .timeline-copy strong { color: #8d99a9; font-weight: 500; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClaimTimelineComponent {
  @Input() history: readonly ClaimActivity[] = [];

  get entries(): readonly TimelineEntry[] {
    return MILESTONES.map((milestone) => ({
      label: milestone.label,
      icon: milestone.icon,
      activity: this.history.find((activity) => activity.status !== undefined && milestone.statuses.includes(activity.status)) ?? null
    }));
  }
}
