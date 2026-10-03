import { ChangeDetectionStrategy, Component, EventEmitter, inject, OnDestroy, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { UploadedDocument } from '../document.model';
import { formatDocumentSize, validateDocumentFile } from '../document-validation';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  template: `
    <section class="upload-panel" aria-label="Upload claim documents">
      <input #fileInput class="file-input" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,image/*,application/pdf"
        (change)="selectFiles($event)" aria-label="Choose claim documents">
      <button mat-stroked-button type="button" (click)="fileInput.click()" [disabled]="uploading()">
        <mat-icon aria-hidden="true">attach_file</mat-icon> Choose documents
      </button>
      <span class="upload-hint">PDF, PNG, JPG or WEBP · Up to 10 MB per file</span>
      <div *ngIf="uploading()" class="upload-progress" aria-live="polite">
        <span>Uploading {{ currentFileName() }} · {{ progress() }}%</span>
        <mat-progress-bar mode="determinate" [value]="progress()"></mat-progress-bar>
      </div>
    </section>
  `,
  styles: [`
    .upload-panel { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; padding: 16px; border: 1px dashed #cbd5e1; border-radius: 12px; background: #f8fafc; }
    .file-input { display: none; }
    .upload-hint { color: #64748b; font-size: 12px; }
    .upload-progress { flex: 1 1 100%; display: grid; gap: 8px; color: #475569; font-size: 13px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentUploadComponent implements OnDestroy {
  @Output() readonly fileAccepted = new EventEmitter<File>();
  @Output() readonly uploaded = new EventEmitter<UploadedDocument>();

  readonly uploading = signal(false);
  readonly progress = signal(0);
  readonly currentFileName = signal('');

  private readonly notifications = inject(NotificationService);
  private readonly queue: File[] = [];
  private uploadTimer: ReturnType<typeof setInterval> | undefined;

  selectFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';

    for (const file of files) {
      const validation = validateDocumentFile(file);
      if (!validation.valid) {
        this.notifications.error(`${file.name}: ${validation.error}`);
        continue;
      }
      this.fileAccepted.emit(file);
      this.queue.push(file);
    }
    this.processNext();
  }

  private processNext(): void {
    const file = this.queue.shift();
    if (!file) return;
    this.currentFileName.set(file.name);
    this.progress.set(0);
    this.uploading.set(true);
    this.uploadTimer = setInterval(() => {
      const nextProgress = Math.min(this.progress() + 20, 100);
      this.progress.set(nextProgress);
      if (nextProgress === 100) {
        if (this.uploadTimer) clearInterval(this.uploadTimer);
        this.uploaded.emit({
          file,
          document: {
            id: `document-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            claimId: '',
            fileName: file.name,
            documentType: 'OTHER',
            uploadedBy: '',
            uploadedDate: new Date().toISOString().slice(0, 10),
            fileSize: file.size,
            status: 'UPLOADED'
          }
        });
        this.notifications.success(`${file.name} uploaded (${formatDocumentSize(file.size)}).`);
        if (this.queue.length) {
          this.processNext();
        } else {
          this.uploading.set(false);
        }
      }
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.uploadTimer) clearInterval(this.uploadTimer);
  }
}
