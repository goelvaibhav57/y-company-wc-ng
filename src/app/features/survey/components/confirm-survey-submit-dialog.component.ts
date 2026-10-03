import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-survey-submit-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Submit survey assessment?</h2>
    <mat-dialog-content>
      <p>The assessment for <strong>{{ data.claimNumber }}</strong> will be submitted to the adjuster.</p>
      <p class="notice">After submission, the claim status changes to Survey Completed.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">Continue editing</button>
      <button mat-flat-button color="primary" type="button" [mat-dialog-close]="true">
        <mat-icon>send</mat-icon> Submit assessment
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
export class ConfirmSurveySubmitDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) readonly data: { readonly claimNumber: string }) {}
}
