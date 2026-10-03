import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { debounceTime, startWith } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../../core/auth/auth.service';
import { Permission, Role } from '../../../core/auth/auth.models';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ClaimTableComponent } from '../components/claim-table/claim-table.component';
import { ClaimService } from '../services/claim.service';
import { Claim, ClaimListFilters, ClaimStatus } from '../models/claim.models';

@Component({
  selector: 'app-claims-list',
  standalone: true,
  imports: [
    ClaimTableComponent,
    CommonModule,
    HasPermissionDirective,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    PageHeaderComponent,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './claims-list.component.html',
  styleUrls: ['./claims-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClaimsListComponent {
  private readonly authService = inject(AuthService);
  private readonly claimService = inject(ClaimService);
  private readonly destroyRef = inject(DestroyRef);

  readonly createPermission = Permission.ClaimCreate;
  readonly statusOptions = Object.values(ClaimStatus) as ClaimStatus[];
  readonly allClaims = signal<readonly Claim[]>([]);
  readonly filteredClaims = signal<readonly Claim[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly pageSubtitle = computed(() => {
    const user = this.authService.currentUser();
    if (!user) {
      return 'Search and review claims in your workspace.';
    }

    const descriptions: Readonly<Record<Role, string>> = {
      [Role.Customer]: 'View your submitted claims and track their progress.',
      [Role.Surveyor]: 'Review the claims assigned to your inspection queue.',
      [Role.Adjuster]: 'Review claims awaiting an adjuster decision.',
      [Role.Workshop]: 'Track the claims assigned to your workshop.'
    };
    return descriptions[user.role];
  });
  readonly filterForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    status: new FormControl<ClaimStatus | ''>('', { nonNullable: true }),
    fromDate: new FormControl('', { nonNullable: true }),
    toDate: new FormControl('', { nonNullable: true })
  });

  constructor() {
    this.filterForm.valueChanges
      .pipe(
        startWith(this.filterForm.getRawValue()),
        debounceTime(100),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((filters) => this.applyFilters({
        search: filters.search ?? '',
        status: filters.status ?? '',
        fromDate: filters.fromDate ?? '',
        toDate: filters.toDate ?? ''
      }));

    this.loadClaims();
  }

  loadClaims(): void {
    const user = this.authService.getCurrentUser();
    this.loading.set(true);
    this.errorMessage.set(null);

    if (!user) {
      this.allClaims.set([]);
      this.filteredClaims.set([]);
      this.errorMessage.set('Your claims are unavailable. Sign in and try again.');
      this.loading.set(false);
      return;
    }

    this.claimService.getClaimsForUser(user)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (claims) => {
          this.allClaims.set(claims);
          this.applyFilters(this.filterForm.getRawValue());
          this.loading.set(false);
        },
        error: () => {
          this.allClaims.set([]);
          this.filteredClaims.set([]);
          this.errorMessage.set('We could not load claims. Please try again.');
          this.loading.set(false);
        }
      });
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', status: '', fromDate: '', toDate: '' });
  }

  hasActiveFilters(): boolean {
    const filters = this.filterForm.getRawValue();
    return Boolean(filters.search.trim() || filters.status || filters.fromDate || filters.toDate);
  }

  statusLabel(status: ClaimStatus): string {
    return status.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private applyFilters(value: {
    readonly search: string;
    readonly status: ClaimStatus | '';
    readonly fromDate: string;
    readonly toDate: string;
  }): void {
    const filters: ClaimListFilters = {
      search: value.search,
      status: value.status || null,
      fromDate: value.fromDate || null,
      toDate: value.toDate || null
    };
    this.filteredClaims.set(this.claimService.filterClaims(this.allClaims(), filters));
  }
}
