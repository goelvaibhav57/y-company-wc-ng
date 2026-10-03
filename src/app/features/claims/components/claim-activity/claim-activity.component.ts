import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ClaimActivity } from '../../models/claim.models';

@Component({
  selector: 'app-claim-activity',
  standalone: true,
  imports: [CommonModule, DatePipe, MatCardModule, MatIconModule],
  template: `
    <mat-card class="panel-card">
      <div class="panel-heading"><div><h2>Activity</h2><p>Updates and notes recorded for this claim</p></div></div>
      <div *ngIf="activities.length === 0" class="empty-state">No claim activity yet.</div>
      <ol *ngIf="activities.length > 0" class="activity-list">
        <li *ngFor="let activity of activities">
          <span class="activity-icon"><mat-icon aria-hidden="true">{{ activityIcon(activity.action) }}</mat-icon></span>
          <div class="activity-copy">
            <div class="activity-heading"><strong>{{ activity.action }}</strong><time>{{ activity.date | date:'MMM d, y' }}</time></div>
            <span class="activity-user">{{ activity.user }}</span>
            <p *ngIf="activity.remarks">{{ activity.remarks }}</p>
          </div>
        </li>
      </ol>
    </mat-card>
  `,
  styles: [`
    .panel-card { padding: 20px 22px; border: 1px solid #edf0f5; border-radius: 12px; box-shadow: 0 3px 14px rgba(29, 50, 80, .035); }
    .panel-heading h2 { margin: 0; color: #1b2a40; font-size: 15px; font-weight: 650; }
    .panel-heading p { margin: 5px 0 0; color: #8491a3; font-size: 10px; }
    .activity-list { display: flex; flex-direction: column; gap: 0; margin: 17px 0 0; padding: 0; list-style: none; }
    .activity-list li { display: flex; gap: 10px; padding: 12px 0; border-top: 1px solid #f0f2f6; }
    .activity-icon { display: grid; width: 27px; height: 27px; flex: 0 0 27px; place-items: center; border-radius: 50%; background: #f1f5fb; color: #56759e; }
    .activity-icon mat-icon { width: 15px; height: 15px; font-size: 15px; }
    .activity-copy { min-width: 0; flex: 1; }
    .activity-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
    .activity-heading strong { color: #34465d; font-size: 10px; font-weight: 600; }
    time { flex: 0 0 auto; color: #8b97a8; font-size: 9px; }
    .activity-user { display: block; margin-top: 3px; color: #738197; font-size: 9px; }
    .activity-copy p { margin: 6px 0 0; color: #8693a5; font-size: 10px; line-height: 1.45; }
    .empty-state { padding: 22px 0 5px; color: #8793a3; font-size: 11px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClaimActivityComponent {
  @Input() activities: readonly ClaimActivity[] = [];

  activityIcon(action: string): string {
    const normalized = action.toLowerCase();
    if (normalized.includes('created')) return 'add_circle';
    if (normalized.includes('survey')) return 'fact_check';
    if (normalized.includes('approved')) return 'check_circle';
    if (normalized.includes('rejected')) return 'cancel';
    if (normalized.includes('workshop') || normalized.includes('repair')) return 'build';
    if (normalized.includes('closed')) return 'lock';
    return 'info';
  }
}
