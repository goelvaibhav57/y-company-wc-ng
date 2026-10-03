import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../../core/auth/auth.service';
import { User } from '../../../core/auth/auth.models';
import { Claim, ClaimDocument } from '../../claims/models/claim.models';
import { ClaimService } from '../../claims/services/claim.service';
import { ClaimSummaryComponent } from '../../claims/components/claim-summary/claim-summary.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { DocumentListComponent } from '../../../shared/components/document-list/document-list.component';
import { validIsoDateValidator } from '../../../shared/validators/claim-form.validators';
import { DamageSeverity, SurveyAssessment, SurveyAssessmentInput } from '../models/survey-assessment.model';
import { SurveyService } from '../services/survey.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { LoadingIndicatorComponent } from '../../../shared/components/loading-indicator/loading-indicator.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { ErrorHandlingService } from '../../../core/errors/error-handling.service';

@Component({
  selector: 'app-survey-assessment',
  standalone: true,
  imports: [
    ClaimSummaryComponent,
    CommonModule,
    DocumentListComponent,
    ErrorStateComponent,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    LoadingIndicatorComponent,
    PageHeaderComponent,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './survey-assessment.component.html',
  styleUrls: ['./survey-assessment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SurveyAssessmentComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly claimService = inject(ClaimService);
  private readonly surveyService = inject(SurveyService);
  private readonly errorHandling = inject(ErrorHandlingService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly claim = signal<Claim | null>(null);
  readonly documents = signal<readonly ClaimDocument[]>([]);
  readonly savedAssessment = signal<SurveyAssessment | null>(null);
  readonly loading = signal(true);
  readonly savingDraft = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly damageSeverityOptions = Object.values(DamageSeverity) as DamageSeverity[];
  readonly actions = [
    'Repair and replace damaged parts',
    'Repair damaged parts',
    'Replace vehicle',
    'Further investigation required',
    'No repair required'
  ];
  readonly form = this.formBuilder.nonNullable.group({
    inspectionDate: ['', [Validators.required, validIsoDateValidator]],
    damageDescription: ['', [Validators.required, Validators.maxLength(2000)]],
    damageSeverity: [DamageSeverity.Minor as DamageSeverity, Validators.required],
    estimatedRepairCost: [0, [Validators.required, Validators.min(0.01)]],
    recommendedAction: ['', [Validators.required, Validators.maxLength(300)]],
    surveyorRemarks: ['', [Validators.maxLength(1000)]]
  });

  detailRoute(): string[] {
    const claim = this.claim();
    return claim ? ['/claims', claim.id] : ['/claims'];
  }

  constructor() {
    const claimId = this.route.snapshot.paramMap.get('id');
    const user = this.authService.getCurrentUser();
    if (!claimId || !user) {
      this.loading.set(false);
      this.errorMessage.set('This claim is not available. Sign in and try again.');
      return;
    }

    this.loadClaim(claimId, user);
  }

  retry(): void {
    const claimId = this.route.snapshot.paramMap.get('id');
    const user = this.authService.getCurrentUser();
    if (!claimId || !user) {
      this.loading.set(false);
      this.errorMessage.set('This claim is not available. Sign in and try again.');
      return;
    }
    this.loadClaim(claimId, user);
  }

  private loadClaim(claimId: string, user: User): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.claim.set(null);
    this.savedAssessment.set(null);
    this.claimService.getClaimById(claimId, user).pipe(
      switchMap((claim) => {
        if (!claim || !this.claimService.isSurveyorAssigned(claimId, user)) {
          return of(null);
        }
        this.claim.set(claim);
        return forkJoin({
          claim: of(claim),
          assessment: this.surveyService.getAssessment(claimId, user),
          documents: this.claimService.getClaimDocuments(claim)
        });
      }),
      catchError((error: unknown) => {
        this.errorMessage.set(this.errorHandling.messageFor(error, 'survey.load', 'You are not assigned to assess this claim, or the claim is unavailable.'));
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((result) => {
      if (result) {
        this.claim.set(result.claim);
        this.savedAssessment.set(result.assessment);
        this.documents.set(result.documents);
        if (result.assessment) {
          this.form.patchValue({
            inspectionDate: result.assessment.inspectionDate,
            damageDescription: result.assessment.damageDescription,
            damageSeverity: result.assessment.damageSeverity,
            estimatedRepairCost: result.assessment.estimatedRepairCost,
            recommendedAction: result.assessment.recommendedAction,
            surveyorRemarks: result.assessment.surveyorRemarks
          });
        }
      }
      if (!result && !this.errorMessage()) {
        this.errorMessage.set('This claim could not be found or is not assigned to you.');
      }
      this.loading.set(false);
    });
  }

  saveDraft(): void {
    const claim = this.claim();
    const user = this.authService.getCurrentUser();
    if (!claim || !user || this.savingDraft() || this.submitting()) {
      return;
    }

    this.savingDraft.set(true);
    this.errorMessage.set(null);
    this.surveyService.saveDraft(this.createInput(claim, user.email), user).pipe(
      catchError((error: unknown) => {
        this.errorMessage.set(this.errorHandling.messageFor(error, 'survey.save-draft', 'We could not save your draft. Please try again.'));
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((assessment) => {
      this.savingDraft.set(false);
      if (assessment) {
        this.savedAssessment.set(assessment);
        this.notifications.info('Survey draft saved. The claim workflow has not been completed.');
      }
    });
  }

  requestSubmitConfirmation(): void {
    if (this.form.invalid || this.submitting() || this.savingDraft()) {
      this.form.markAllAsTouched();
      return;
    }

    const claim = this.claim();
    if (!claim) {
      return;
    }

    this.dialog.open(ConfirmationDialogComponent, {
      width: '440px',
      data: {
        title: 'Submit survey assessment?',
        message: `The assessment for ${claim.claimNumber} will be submitted to the adjuster. The claim status will change to Survey Completed.`,
        confirmLabel: 'Submit assessment',
        cancelLabel: 'Continue editing',
        icon: 'send'
      },
      ariaLabel: 'Confirm survey assessment submission'
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed: boolean | undefined) => {
      if (confirmed) {
        this.submitAssessment();
      }
    });
  }

  private submitAssessment(): void {
    const claim = this.claim();
    const user = this.authService.getCurrentUser();
    if (!claim || !user || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.surveyService.submitAssessment(this.createInput(claim, user.email), user).pipe(
      catchError((error: unknown) => {
        this.errorMessage.set(this.errorHandling.messageFor(error, 'survey.submit', 'We could not submit the assessment. Please try again.'));
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((assessment) => {
      this.submitting.set(false);
      if (assessment) {
        this.savedAssessment.set(assessment);
        this.notifications.success('Survey assessment submitted successfully.');
        void this.router.navigate(['/claims', claim.id]);
      }
    });
  }

  private createInput(claim: Claim, submittedBy: string): SurveyAssessmentInput {
    const value = this.form.getRawValue();
    return {
      claimId: claim.id,
      inspectionDate: value.inspectionDate,
      damageDescription: value.damageDescription.trim(),
      damageSeverity: value.damageSeverity,
      estimatedRepairCost: value.estimatedRepairCost,
      recommendedAction: value.recommendedAction.trim(),
      surveyorRemarks: value.surveyorRemarks.trim(),
      submittedBy
    };
  }
}
