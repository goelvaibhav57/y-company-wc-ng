import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/auth.service';
import { Permission, Role, User } from '../../../core/auth/auth.models';
import { PermissionService } from '../../../core/auth/permission.service';
import { Claim, ClaimActivity, ClaimDocument } from '../../claims/models/claim.models';
import { ClaimService } from '../../claims/services/claim.service';
import { ClaimActivityComponent } from '../../claims/components/claim-activity/claim-activity.component';
import { ClaimSummaryComponent } from '../../claims/components/claim-summary/claim-summary.component';
import { ClaimTimelineComponent } from '../../claims/components/claim-timeline/claim-timeline.component';
import { DocumentListComponent } from '../../../shared/components/document-list/document-list.component';
import { SurveyAssessment } from '../../survey/models/survey-assessment.model';
import { SurveyService } from '../../survey/services/survey.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ReviewDecisionDialogComponent } from '../components/review-decision-dialog.component';
import { ReviewDecisionType } from '../models/review-decision.model';
import { ReviewService } from '../services/review.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { LoadingIndicatorComponent } from '../../../shared/components/loading-indicator/loading-indicator.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { ErrorHandlingService } from '../../../core/errors/error-handling.service';

interface ReviewData {
  readonly claim: Claim;
  readonly assessment: SurveyAssessment | null;
  readonly history: readonly ClaimActivity[];
  readonly documents: readonly ClaimDocument[];
}

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [
    ClaimActivityComponent,
    ClaimSummaryComponent,
    ClaimTimelineComponent,
    CommonModule,
    CurrencyPipe,
    DatePipe,
    DocumentListComponent,
    ErrorStateComponent,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    LoadingIndicatorComponent,
    PageHeaderComponent,
    RouterLink,
    StatusBadgeComponent
  ],
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly permissionService = inject(PermissionService);
  private readonly claimService = inject(ClaimService);
  private readonly surveyService = inject(SurveyService);
  private readonly reviewService = inject(ReviewService);
  private readonly errorHandling = inject(ErrorHandlingService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly reviewData = signal<ReviewData | null>(null);
  readonly loading = signal(true);
  readonly processing = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isEligible = computed(() => {
    const claim = this.reviewData()?.claim;
    const user = this.authService.getCurrentUser();
    return Boolean(claim && user
      && this.reviewService.isEligibleStatus(claim.status)
      && this.claimService.isAdjusterAssigned(claim.id, user));
  });
  readonly canApprove = computed(() => this.isEligible() && this.permissionService.hasPermission(Permission.ClaimApprove));
  readonly canReject = computed(() => this.isEligible() && this.permissionService.hasPermission(Permission.ClaimReject));
  readonly canRequestInformation = computed(() => this.isEligible() && this.permissionService.hasPermission(Permission.ClaimReview));

  humanize(value: string): string {
    return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  constructor() {
    const claimId = this.route.snapshot.paramMap.get('id');
    const user = this.authService.getCurrentUser();
    if (!claimId || !user || user.role !== Role.Adjuster) {
      this.loading.set(false);
      this.errorMessage.set('You are not assigned to review this claim.');
      return;
    }

    this.load(claimId, user);
  }

  retry(): void {
    const claimId = this.route.snapshot.paramMap.get('id');
    const user = this.authService.getCurrentUser();
    if (!claimId || !user || user.role !== Role.Adjuster) {
      this.errorMessage.set('You are not assigned to review this claim.');
      return;
    }
    this.load(claimId, user);
  }
  openDecision(decision: ReviewDecisionType): void {
    const claim = this.reviewData()?.claim;
    const allowed = decision === 'APPROVE' ? this.canApprove()
      : decision === 'REJECT' ? this.canReject()
        : this.canRequestInformation();
    if (!claim || !allowed || this.processing()) {
      return;
    }

    this.dialog.open(ReviewDecisionDialogComponent, {
      width: '480px',
      data: { claimNumber: claim.claimNumber, decision },
      ariaLabel: 'Confirm adjuster claim decision'
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((remarks: string | null) => {
      if (remarks !== null) {
        this.executeDecision(claim, decision, remarks);
      }
    });
  }

  private load(claimId: string, user: User): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.claimService.getClaimById(claimId, user).pipe(
      switchMap((claim) => {
        if (!claim || !this.claimService.isAdjusterAssigned(claim.id, user)) {
          return of(null);
        }
        return forkJoin({
          claim: of(claim),
          assessment: this.surveyService.getAssessment(claim.id, user),
          history: this.claimService.getClaimHistory(claim),
          documents: this.claimService.getClaimDocuments(claim)
        });
      }),
      catchError((error: unknown) => {
        this.errorMessage.set(this.errorHandling.messageFor(error, 'review.load', 'We could not load this claim review. Please try again.'));
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((data) => {
      this.reviewData.set(data);
      if (!data && !this.errorMessage()) {
        this.errorMessage.set('This claim could not be found or is not assigned to your review queue.');
      }
      this.loading.set(false);
    });
  }

  private executeDecision(claim: Claim, decision: ReviewDecisionType, remarks: string): void {
    const operation = decision === 'APPROVE'
      ? this.reviewService.approve(claim.id, remarks)
      : decision === 'REJECT'
        ? this.reviewService.reject(claim.id, remarks)
        : this.reviewService.requestAdditionalInformation(claim.id, remarks);

    this.processing.set(true);
    this.errorMessage.set(null);
    operation.pipe(
      catchError((error: unknown) => {
        this.errorMessage.set(this.errorHandling.messageFor(error, 'review.decision', 'The decision could not be saved. Please try again.'));
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((result) => {
      this.processing.set(false);
      if (!result) {
        return;
      }

      const successMessage = decision === 'APPROVE'
        ? 'Claim approved successfully.'
        : decision === 'REJECT'
          ? 'Claim rejected.'
          : 'Additional information requested.';
      this.notifications.success(successMessage);
      void this.router.navigate(['/claims', claim.id]);
    });
  }
}
