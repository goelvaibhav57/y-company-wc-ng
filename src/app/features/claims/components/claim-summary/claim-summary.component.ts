import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Claim } from '../../models/claim.models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-claim-summary',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, MatCardModule, StatusBadgeComponent],
  template: `
    <mat-card class="summary-card">
      <div class="summary-heading">
        <div>
          <p class="eyebrow">CLAIM SUMMARY</p>
          <h2>{{ claim.claimNumber }}</h2>
        </div>
        <app-status-badge [status]="claim.status"></app-status-badge>
      </div>

      <div class="summary-grid">
        <div class="summary-item"><span>Policy Number</span><strong>{{ claim.policyNumber }}</strong></div>
        <div class="summary-item"><span>Customer</span><strong>{{ claim.customer.name }}</strong><small>{{ claim.customer.email }}</small></div>
        <div class="summary-item"><span>Vehicle</span><strong>{{ claim.vehicle.year }} {{ claim.vehicle.make }} {{ claim.vehicle.model }}</strong><small>{{ claim.vehicle.registrationNumber }}</small></div>
        <div class="summary-item"><span>Incident Date</span><strong>{{ claim.incidentDate | date:'MMM d, y' }}</strong></div>
        <div class="summary-item"><span>Claim Type</span><strong>{{ humanize(claim.claimType) }}</strong></div>
        <div class="summary-item"><span>Claim Amount</span><strong class="amount">{{ claim.claimAmount | currency:'USD':'symbol':'1.0-0' }}</strong></div>
      </div>
    </mat-card>
  `,
  styles: [`
    .summary-card { padding: 22px 24px 24px; border: 1px solid #edf0f5; border-radius: 12px; box-shadow: 0 3px 14px rgba(29, 50, 80, .035); }
    .summary-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding-bottom: 19px; border-bottom: 1px solid #edf0f5; }
    .eyebrow { margin: 0 0 6px; color: #8a97a8; font-size: 9px; font-weight: 700; letter-spacing: 1px; }
    h2 { margin: 0; color: #192a41; font-size: 20px; font-weight: 650; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px 18px; padding-top: 21px; }
    .summary-item { display: flex; min-width: 0; flex-direction: column; gap: 5px; }
    .summary-item span { color: #8491a3; font-size: 10px; }
    .summary-item strong { overflow: hidden; color: #314158; font-size: 12px; font-weight: 600; text-overflow: ellipsis; }
    .summary-item small { color: #8a97a8; font-size: 10px; }
    .summary-item .amount { color: #1d5fb1; font-size: 15px; }
    @media (max-width: 650px) { .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .summary-card { padding: 18px 16px; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClaimSummaryComponent {
  @Input({ required: true }) claim!: Claim;

  humanize(value: string): string {
    return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}
