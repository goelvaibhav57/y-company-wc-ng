import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ClaimDocument } from '../../models/claim.models';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, DatePipe, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <mat-card class="panel-card">
      <div class="panel-heading"><div><h2>Documents</h2><p>{{ documents.length }} files attached to this claim</p></div></div>
      <div *ngIf="documents.length === 0" class="empty-state"><mat-icon>folder_open</mat-icon><span>No documents have been uploaded.</span></div>
      <ul *ngIf="documents.length > 0" class="document-list">
        <li *ngFor="let document of documents">
          <span class="file-icon"><mat-icon aria-hidden="true">picture_as_pdf</mat-icon></span>
          <span class="document-copy"><strong>{{ document.fileName }}</strong><small>{{ document.documentType }} · {{ document.uploadedDate | date:'MMM d, y' }} · {{ document.uploadedBy }}</small></span>
          <button mat-icon-button type="button" [attr.aria-label]="'View or download ' + document.fileName" (click)="documentAction.emit(document)">
            <mat-icon>download</mat-icon>
          </button>
        </li>
      </ul>
    </mat-card>
  `,
  styles: [`
    .panel-card { padding: 20px 22px; border: 1px solid #edf0f5; border-radius: 12px; box-shadow: 0 3px 14px rgba(29, 50, 80, .035); }
    .panel-heading h2 { margin: 0; color: #1b2a40; font-size: 15px; font-weight: 650; }
    .panel-heading p { margin: 5px 0 0; color: #8491a3; font-size: 10px; }
    .document-list { margin: 16px 0 0; padding: 0; list-style: none; }
    .document-list li { display: flex; min-width: 0; align-items: center; gap: 10px; padding: 10px 0; border-top: 1px solid #f0f2f6; }
    .file-icon { display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center; border-radius: 8px; background: #fff0ef; color: #b44942; }
    .file-icon mat-icon { width: 18px; height: 18px; font-size: 18px; }
    .document-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 4px; }
    .document-copy strong { overflow: hidden; color: #374960; font-size: 10px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
    .document-copy small { color: #8995a5; font-size: 9px; }
    .document-list button { color: #63738a; }
    .empty-state { display: flex; align-items: center; gap: 8px; padding: 24px 0 6px; color: #8793a3; font-size: 11px; }
    .empty-state mat-icon { width: 18px; height: 18px; font-size: 18px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentListComponent {
  @Input() documents: readonly ClaimDocument[] = [];
  @Output() readonly documentAction = new EventEmitter<ClaimDocument>();
}
