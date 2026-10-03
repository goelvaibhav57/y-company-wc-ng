import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { Permission, Role } from '../../../core/auth/auth.models';
import { ClaimActivity, Claim, ClaimDocument, ClaimStatus } from '../models/claim.models';
import { ClaimService } from '../services/claim.service';
import { ClaimActivityComponent } from '../components/claim-activity/claim-activity.component';
import { ClaimSummaryComponent } from '../components/claim-summary/claim-summary.component';
import { ClaimTimelineComponent } from '../components/claim-timeline/claim-timeline.component';
import { DocumentListComponent } from '../../../shared/components/document-list/document-list.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { NotificationService } from '../../../shared/services/notification.service';
import { LoadingIndicatorComponent } from '../../../shared/components/loading-indicator/loading-indicator.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { ErrorHandlingService } from '../../../core/errors/error-handling.service';

interface ClaimDetailsData {
  readonly claim: Claim;
  readonly history: readonly ClaimActivity[];
  readonly documents: readonly ClaimDocument[];
}

interface ClaimAction {
  readonly label: string;
  readonly icon: string;
  readonly route?: string;
  readonly permission: Permission;
  readonly allowedStatuses: readonly ClaimStatus[];
}

const ACTIONS_BY_ROLE: Readonly<Partial<Record<Role, readonly ClaimAction[]>>> = {
  [Role.Customer]: [{
    label: 'Add Information', icon: 'upload_file', permission: Permission.ClaimUpdate,
    allowedStatuses: [ClaimStatus.AdditionalInformationRequired]
  }],
  [Role.Surveyor]: [{
    label: 'Start Survey', icon: 'fact_check', route: 'survey', permission: Permission.ClaimSurvey,
    allowedStatuses: [ClaimStatus.SurveyAssigned, ClaimStatus.SurveyInProgress]
  }],
  [Role.Adjuster]: [{
    label: 'Review Claim', icon: 'rate_review', route: 'review', permission: Permission.ClaimReview,
    allowedStatuses: [ClaimStatus.SurveyCompleted, ClaimStatus.UnderReview, ClaimStatus.AdditionalInformationRequired]
  }],
  [Role.Workshop]: [{
    label: 'Process Repair', icon: 'handyman', route: 'workshop', permission: Permission.ClaimWorkshopUpdate,
    allowedStatuses: [ClaimStatus.Approved, ClaimStatus.WorkshopAssigned, ClaimStatus.RepairInProgress]
  }]
};

@Component({
  selector: 'app-claim-details',
  standalone: true,
  imports: [
    ClaimActivityComponent,
    ClaimSummaryComponent,
    ClaimTimelineComponent,
    CommonModule,
    DocumentListComponent,
    ErrorStateComponent,
    LoadingIndicatorComponent,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
    RouterLink
  ],
  templateUrl: './claim-details.component.html',
  styleUrls: ['./claim-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClaimDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly permissionService = inject(PermissionService);
  private readonly claimService = inject(ClaimService);
  private readonly errorHandling = inject(ErrorHandlingService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly details = signal<ClaimDetailsData | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly actions = computed(() => {
    const claim = this.details()?.claim;
    const role = this.authService.currentRole();
    if (!claim || !role) {
      return [];
    }

    return (ACTIONS_BY_ROLE[role] ?? []).filter((action) =>
      action.allowedStatuses.includes(claim.status) && this.permissionService.hasPermission(action.permission)
    );
  });
  readonly canUploadDocuments = computed(() => {
    const claim = this.details()?.claim;
    return Boolean(claim && this.authService.currentRole() === Role.Customer
      && claim.status === ClaimStatus.AdditionalInformationRequired
      && this.permissionService.hasPermission(Permission.ClaimUpdate));
  });

  constructor() {
    this.route.paramMap.pipe(
      map((params) => params.get('id')),
      distinctUntilChanged(),
      tap(() => {
        this.details.set(null);
        this.errorMessage.set(null);
        this.loading.set(true);
      }),
      switchMap((id) => {
        const user = this.authService.getCurrentUser();
        if (!id || !user) {
          return of(null);
        }

        return this.claimService.getClaimById(id, user).pipe(
          switchMap((claim) => claim
            ? forkJoin({
                claim: of(claim),
                history: this.claimService.getClaimHistory(claim),
                documents: this.claimService.getClaimDocuments(claim)
              })
            : of(null)
          ),
          catchError((error: unknown) => {
            this.errorMessage.set(this.errorHandling.messageFor(error, 'claims.details', 'We could not load this claim. Please try again.'));
            return of(null);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((details) => {
      this.details.set(details);
      if (!details && !this.errorMessage()) {
        this.errorMessage.set('This claim could not be found or is not available to your account.');
      }
      this.loading.set(false);
    });
  }

  retry(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    const id = this.route.snapshot.paramMap.get('id');
    const user = this.authService.getCurrentUser();
    if (!id || !user) {
      this.loading.set(false);
      this.errorMessage.set('Your session has expired. Sign in and try again.');
      return;
    }

    this.claimService.getClaimById(id, user).pipe(
      switchMap((claim) => claim
        ? forkJoin({
            claim: of(claim),
            history: this.claimService.getClaimHistory(claim),
            documents: this.claimService.getClaimDocuments(claim)
          })
        : of(null)
      ),
      catchError((error: unknown) => {
        this.errorMessage.set(this.errorHandling.messageFor(error, 'claims.details.retry', 'We could not load this claim. Please try again.'));
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((details) => {
      this.details.set(details);
      if (!details && !this.errorMessage()) {
        this.errorMessage.set('This claim could not be found or is not available to your account.');
      }
      this.loading.set(false);
    });
  }

  actionRoute(action: ClaimAction): string[] {
    const claim = this.details()?.claim;
    return claim && action.route ? ['/claims', claim.id, action.route] : [];
  }

  runAction(action: ClaimAction): void {
    if (action.label === 'Add Information') {
      this.notifications.info('Additional information upload will be available here.');
    }
  }

  get subtitle(): string {
    return this.details()?.claim.claimNumber ?? 'Review claim information, documents, and workflow activity.';
  }
}
