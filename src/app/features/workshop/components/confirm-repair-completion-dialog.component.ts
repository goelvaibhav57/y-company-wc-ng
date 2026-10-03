import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-repair-completion-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Mark repairs complete?</h2>
    <mat-dialog-content>
      <p>Confirm the repair for <strong>{{ data.claimNumber }}</strong> is complete.</p>
      <p class="notice">This updates the claim workflow to Repair Completed.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">Continue editing</button>
      <button mat-flat-button color="primary" type="button" [mat-dialog-close]="true">
        <mat-icon>task_alt</mat-icon> Confirm completion
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    p { color: #5e6d82; font-size: 13px; line-height: 1.5; }
    .notice { color: #3568a9; }
    mat-dialog-actions button { border-radius: 8px; }
    mat-dialog-actions mat-icon { width: 17px; height: 17px; font-size: 17px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmRepairCompletionDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) readonly data: { readonly claimNumber: string }) {}
}
