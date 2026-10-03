import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReviewDecisionType } from '../models/review-decision.model';

export interface ReviewDecisionDialogData {
  readonly claimNumber: string;
  readonly decision: ReviewDecisionType;
}

@Component({
  selector: 'app-review-decision-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  template: `
    <h2 mat-dialog-title>{{ title }}</h2>
    <mat-dialog-content>
      <p>{{ message }}</p>
      <mat-form-field *ngIf="requiresRemarks" appearance="outline" class="remarks-field">
        <mat-label>Remarks</mat-label>
        <textarea matInput [formControl]="remarks" rows="4" maxlength="1000"></textarea>
        <mat-hint align="end">{{ remarks.value.length }} / 1000</mat-hint>
        <mat-error *ngIf="remarks.hasError('required')">Remarks are required for this decision.</mat-error>
        <mat-error *ngIf="remarks.hasError('maxlength')">Remarks cannot exceed 1,000 characters.</mat-error>
      </mat-form-field>
      <p *ngIf="!requiresRemarks" class="note">This decision will be recorded in the claim history.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="null">Cancel</button>
      <button mat-flat-button [color]="decision === 'REJECT' ? 'warn' : 'primary'" type="button" (click)="confirm()">
        {{ confirmLabel }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    p { color: #5e6d82; font-size: 13px; line-height: 1.55; }
    .note { color: #8190a3; font-size: 11px; }
    .remarks-field { width: 100%; margin-top: 12px; }
    mat-dialog-actions button { border-radius: 8px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewDecisionDialogComponent {
  readonly remarks = new FormControl('', { nonNullable: true });
  readonly requiresRemarks: boolean;

  constructor(
    private readonly dialogRef: MatDialogRef<ReviewDecisionDialogComponent, string | null>,
    @Inject(MAT_DIALOG_DATA) readonly data: ReviewDecisionDialogData
  ) {
    this.requiresRemarks = data.decision !== 'APPROVE';
    if (this.requiresRemarks) {
      this.remarks.addValidators([Validators.required, Validators.maxLength(1000)]);
    } else {
      this.remarks.addValidators([Validators.maxLength(1000)]);
    }
  }

  get decision(): ReviewDecisionType {
    return this.data.decision;
  }

  get title(): string {
    switch (this.decision) {
      case 'APPROVE': return 'Approve claim?';
      case 'REJECT': return 'Reject claim?';
      case 'REQUEST_INFORMATION': return 'Request additional information?';
    }
  }

  get message(): string {
    switch (this.decision) {
      case 'APPROVE': return `Confirm approval of claim ${this.data.claimNumber}.`;
      case 'REJECT': return `Provide a reason before rejecting claim ${this.data.claimNumber}.`;
      case 'REQUEST_INFORMATION': return `Specify what is needed from the customer for claim ${this.data.claimNumber}.`;
    }
  }

  get confirmLabel(): string {
    switch (this.decision) {
      case 'APPROVE': return 'Confirm Approval';
      case 'REJECT': return 'Confirm Rejection';
      case 'REQUEST_INFORMATION': return 'Send Request';
    }
  }

  confirm(): void {
    if (this.remarks.invalid) {
      this.remarks.markAsTouched();
      return;
    }
    this.dialogRef.close(this.remarks.value.trim());
  }
}
