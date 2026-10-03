import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/auth/auth.service';
import { ClaimType, CreateClaimRequest } from '../models/claim.models';
import { ClaimService } from '../services/claim.service';
import {
  notFutureDateValidator,
  phoneNumberValidator,
  policyDateRangeValidator,
  validIsoDateValidator
} from '../../../shared/validators/claim-form.validators';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-create-claim',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
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
  templateUrl: './create-claim.component.html',
  styleUrls: ['./create-claim.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateClaimComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly claimService = inject(ClaimService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly claimTypes = Object.values(ClaimType) as ClaimType[];
  readonly policyTypes = ['COMPREHENSIVE', 'THIRD_PARTY', 'COLLISION'] as const;
  readonly maxVehicleYear = new Date().getFullYear() + 1;
  readonly maxDescriptionLength = 1000;
  readonly form = this.formBuilder.nonNullable.group({
    customer: this.formBuilder.nonNullable.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      contactNumber: ['', [Validators.required, phoneNumberValidator]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]]
    }),
    policy: this.formBuilder.nonNullable.group({
      policyNumber: ['', [Validators.required, Validators.maxLength(30)]],
      policyType: ['COMPREHENSIVE' as (typeof this.policyTypes)[number], Validators.required],
      startDate: ['', [Validators.required, validIsoDateValidator]],
      endDate: ['', [Validators.required, validIsoDateValidator]]
    }),
    vehicle: this.formBuilder.nonNullable.group({
      registrationNumber: ['', [Validators.required, Validators.maxLength(20)]],
      make: ['', [Validators.required, Validators.maxLength(50)]],
      model: ['', [Validators.required, Validators.maxLength(50)]],
      year: [new Date().getFullYear(), [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1)]]
    }),
    incident: this.formBuilder.nonNullable.group({
      date: ['', [Validators.required, validIsoDateValidator, notFutureDateValidator]],
      location: ['', [Validators.required, Validators.maxLength(120)]],
      type: [ClaimType.Collision as ClaimType, Validators.required],
      description: ['', [Validators.required, Validators.maxLength(this.maxDescriptionLength)]]
    }),
    claim: this.formBuilder.nonNullable.group({
      estimatedClaimAmount: [0, [Validators.required, Validators.min(0.01)]],
      supportingDocuments: this.formBuilder.nonNullable.control<File[]>([])
    })
  }, { validators: policyDateRangeValidator });

  constructor() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.form.controls.customer.patchValue({ name: user.name, email: user.email });
    }
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selectedFiles = Array.from(input.files ?? []);
    const documentsControl = this.form.controls.claim.controls.supportingDocuments;
    documentsControl.setValue([...documentsControl.value, ...selectedFiles]);
    documentsControl.markAsDirty();
    input.value = '';
  }

  removeFile(index: number): void {
    const documentsControl = this.form.controls.claim.controls.supportingDocuments;
    documentsControl.setValue(documentsControl.value.filter((_file, fileIndex) => fileIndex !== index));
    documentsControl.markAsDirty();
  }

  submit(): void {
    if (this.submitting()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set(null);
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.errorMessage.set('Your session has expired. Sign in again to submit this claim.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    const value = this.form.getRawValue();
    const request: CreateClaimRequest = {
      customer: {
        id: currentUser.id,
        name: value.customer.name.trim(),
        contactNumber: value.customer.contactNumber.trim(),
        email: value.customer.email.trim().toLowerCase()
      },
      policy: {
        policyNumber: value.policy.policyNumber.trim().toUpperCase(),
        policyType: value.policy.policyType,
        startDate: value.policy.startDate,
        endDate: value.policy.endDate
      },
      vehicle: {
        registrationNumber: value.vehicle.registrationNumber.trim().toUpperCase(),
        make: value.vehicle.make.trim(),
        model: value.vehicle.model.trim(),
        year: value.vehicle.year
      },
      claimType: value.incident.type,
      claimAmount: value.claim.estimatedClaimAmount,
      incidentDate: value.incident.date,
      incidentLocation: value.incident.location.trim(),
      description: value.incident.description.trim(),
      supportingDocuments: value.claim.supportingDocuments.map((file) => file.name)
    };

    this.claimService.createClaim(request).subscribe({
      next: (claim) => {
        this.submitting.set(false);
        this.snackBar.open(`Claim ${claim.claimNumber} created successfully.`, 'Dismiss', { duration: 4500 });
        void this.router.navigateByUrl(`/claims/${claim.id}`);
      },
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('We could not submit your claim. Please try again.');
      }
    });
  }
}
