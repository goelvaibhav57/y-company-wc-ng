import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/auth/auth.service';
import { Claim, ClaimActivity, ClaimStatus } from '../../claims/models/claim.models';
import { ClaimService } from '../../claims/services/claim.service';
import { ClaimSummaryComponent } from '../../claims/components/claim-summary/claim-summary.component';
import { ClaimTimelineComponent } from '../../claims/components/claim-timeline/claim-timeline.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { validIsoDateValidator } from '../../../shared/validators/claim-form.validators';
import { repairDateRangeValidator } from '../../../shared/validators/workshop.validators';
import { RepairStatus, WorkshopRepair } from '../models/workshop-repair.model';
import { WorkshopService } from '../services/workshop.service';
import { ConfirmRepairCompletionDialogComponent } from '../components/confirm-repair-completion-dialog.component';

@Component({
  selector: 'app-workshop',
  standalone: true,
  imports: [
    ClaimSummaryComponent,
    ClaimTimelineComponent,
    CommonModule,
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    PageHeaderComponent,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './workshop.component.html',
  styleUrls: ['./workshop.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkshopComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly claimService = inject(ClaimService);
  private readonly workshopService = inject(WorkshopService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly claim = signal<Claim | null>(null);
  readonly repair = signal<WorkshopRepair | null>(null);
  readonly history = signal<readonly ClaimActivity[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly completed = computed(() => this.repair()?.repairStatus === RepairStatus.Completed
    || this.claim()?.status === ClaimStatus.RepairCompleted);
  readonly repairStatuses = Object.values(RepairStatus) as RepairStatus[];
  readonly form = this.formBuilder.nonNullable.group({
    repairStartDate: ['', [validIsoDateValidator]],
    estimatedCompletionDate: ['', [validIsoDateValidator]],
    actualCompletionDate: ['', [validIsoDateValidator]],
    repairStatus: [RepairStatus.Assigned as RepairStatus, Validators.required],
    repairEstimate: [0, [Validators.required, Validators.min(0)]],
    workshopRemarks: ['', [Validators.maxLength(1000)]]
  }, { validators: repairDateRangeValidator });

  claimRoute(): string[] {
    const claim = this.claim();
    return claim ? ['/claims', claim.id] : ['/claims'];
  }

  constructor() {
    this.form.controls.repairStatus.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((status) => this.setActualCompletionValidation(status));

    const claimId = this.route.snapshot.paramMap.get('id');
    const user = this.authService.getCurrentUser();
    if (!claimId || !user) {
      this.loading.set(false);
      this.errorMessage.set('This repair is not available. Sign in and try again.');
      return;
    }

    this.workshopService.getRepairForClaim(claimId, user).pipe(
      switchMap(({ claim, repair }) => forkJoin({
        claim: of(claim),
        repair: of(repair),
        history: this.claimService.getClaimHistory(claim)
      })),
      catchError(() => {
        this.errorMessage.set('You are not assigned to process this repair, or the claim is not eligible.');
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((data) => {
      if (data) {
        this.claim.set(data.claim);
        this.repair.set(data.repair);
        this.history.set(data.history);
        this.form.patchValue({
          repairStartDate: data.repair.repairStartDate,
          estimatedCompletionDate: data.repair.estimatedCompletionDate,
          actualCompletionDate: data.repair.actualCompletionDate,
          repairStatus: data.repair.repairStatus,
          repairEstimate: data.repair.repairEstimate,
          workshopRemarks: data.repair.workshopRemarks
        });
        this.setActualCompletionValidation(data.repair.repairStatus);
      } else if (!this.errorMessage()) {
        this.errorMessage.set('This claim could not be found or is not assigned to your workshop.');
      }
      this.loading.set(false);
    });
  }

  saveChanges(): void {
    if (this.form.controls.repairStatus.value === RepairStatus.Completed) {
      this.requestCompletionConfirmation();
      return;
    }
    this.persistRepair();
  }

  requestCompletionConfirmation(): void {
    this.form.controls.repairStatus.setValue(RepairStatus.Completed);
    this.setActualCompletionValidation(RepairStatus.Completed);
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const claim = this.claim();
    if (!claim) {
      return;
    }

    this.dialog.open(ConfirmRepairCompletionDialogComponent, {
      width: '440px',
      data: { claimNumber: claim.claimNumber },
      ariaLabel: 'Confirm repair completion'
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.persistRepair();
      }
    });
  }

  private persistRepair(): void {
    const claim = this.claim();
    const user = this.authService.getCurrentUser();
    if (!claim || !user || this.saving()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    const repair: WorkshopRepair = {
      id: this.repair()?.id ?? `repair-${claim.id}`,
      claimId: claim.id,
      ...this.form.getRawValue(),
      workshopRemarks: this.form.controls.workshopRemarks.value.trim()
    };

    this.workshopService.saveRepair(repair, user).pipe(
      switchMap((result) => this.claimService.getClaimById(claim.id, user).pipe(
        switchMap((updatedClaim) => updatedClaim
            ? this.claimService.getClaimHistory(updatedClaim).pipe(map((history) => ({ result, updatedClaim, history })))
          : of({ result, updatedClaim: claim, history: this.history() })
        )
      )),
      catchError(() => {
        this.errorMessage.set('We could not save repair updates. Please review the fields and try again.');
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((saved) => {
      this.saving.set(false);
      if (!saved) {
        return;
      }
      this.repair.set(saved.result.repair);
      this.claim.set(saved.updatedClaim);
      this.history.set(saved.history);
      if (saved.result.repair.repairStatus === RepairStatus.Completed) {
        this.form.disable();
      }
      this.snackBar.open(
        saved.result.claimStatus === 'REPAIR_COMPLETED' ? 'Repair marked as completed.' : 'Repair updates saved.',
        'Dismiss',
        { duration: 4000 }
      );
    });
  }

  private setActualCompletionValidation(status: RepairStatus): void {
    const control = this.form.controls.actualCompletionDate;
    if (status === RepairStatus.Completed) {
      control.addValidators(Validators.required);
    } else {
      control.removeValidators(Validators.required);
    }
    control.updateValueAndValidity({ emitEvent: false });
  }
}
