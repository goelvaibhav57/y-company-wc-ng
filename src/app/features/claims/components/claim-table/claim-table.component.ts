import { AfterViewInit, ChangeDetectionStrategy, Component, Input, ViewChild } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Claim } from '../../models/claim.models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

const ASSIGNEE_LABELS: Readonly<Record<string, string>> = {
  'surveyor@example.com': 'Survey Team',
  'adjuster@example.com': 'Claims Adjuster',
  'workshop@example.com': 'Repair Workshop'
};

@Component({
  selector: 'app-claim-table',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    RouterLink,
    StatusBadgeComponent
  ],
  templateUrl: './claim-table.component.html',
  styleUrls: ['./claim-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClaimTableComponent implements AfterViewInit {
  readonly dataSource = new MatTableDataSource<Claim>([]);
  readonly displayedColumns = [
    'claimNumber', 'policyNumber', 'customer', 'vehicle', 'claimType',
    'claimAmount', 'status', 'createdDate', 'assignedTo', 'actions'
  ];

  private paginatorRef: MatPaginator | null = null;

  @Input()
  set claims(value: readonly Claim[]) {
    this.dataSource.data = [...value];
    this.paginatorRef?.firstPage();
  }

  @ViewChild(MatPaginator)
  set paginator(paginator: MatPaginator) {
    this.paginatorRef = paginator;
    this.dataSource.paginator = paginator;
  }

  @ViewChild(MatSort)
  set sort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  constructor() {
    this.dataSource.sortingDataAccessor = (claim, property) => {
      switch (property) {
        case 'claimNumber': return claim.claimNumber;
        case 'policyNumber': return claim.policyNumber;
        case 'customer': return claim.customer.name;
        case 'vehicle': return `${claim.vehicle.year} ${claim.vehicle.make} ${claim.vehicle.model}`;
        case 'claimType': return claim.claimType;
        case 'claimAmount': return claim.claimAmount;
        case 'status': return claim.status;
        case 'createdDate': return new Date(claim.createdDate).getTime();
        case 'assignedTo': return this.assigneeLabel(claim);
        default: return '';
      }
    };
  }

  assigneeLabel(claim: Claim): string {
    const assignedEmail = claim.assignedTo.workshopEmail
      ?? claim.assignedTo.adjusterEmail
      ?? claim.assignedTo.surveyorEmail;
    return assignedEmail ? ASSIGNEE_LABELS[assignedEmail] ?? assignedEmail : 'Unassigned';
  }

  humanize(value: string): string {
    return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginatorRef;
  }
}
