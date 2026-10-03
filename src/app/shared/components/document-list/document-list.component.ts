import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ClaimDocument, DocumentType, UploadedDocument } from './document.model';
import { formatDocumentSize } from './document-validation';
import { DocumentUploadComponent } from './document-upload/document-upload.component';
import { DocumentStoreService } from './document-store.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, DatePipe, DocumentUploadComponent, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentListComponent {
  @Input() documents: readonly ClaimDocument[] = [];
  @Input() claimId = '';
  @Input() uploadedBy = '';
  @Input() uploadEnabled = false;
  @Output() readonly fileAccepted = new EventEmitter<File>();
  @Output() readonly fileUploaded = new EventEmitter<UploadedDocument>();

  constructor(private readonly notifications: NotificationService, private readonly documentStore: DocumentStoreService) {}

  get displayDocuments(): readonly ClaimDocument[] {
    return this.documentStore.merge(this.claimId, this.documents);
  }

  get countLabel(): string {
    const count = this.displayDocuments.length;
    return `${count} ${count === 1 ? 'document' : 'documents'} attached to this claim`;
  }

  typeLabel(type: DocumentType): string {
    const labels: Readonly<Record<DocumentType, string>> = {
      [DocumentType.Policy]: 'Policy Document',
      [DocumentType.VehicleRegistration]: 'Vehicle Registration',
      [DocumentType.DrivingLicense]: 'Driving License',
      [DocumentType.AccidentPhoto]: 'Accident Photo',
      [DocumentType.SurveyReport]: 'Survey Report',
      [DocumentType.RepairEstimate]: 'Repair Estimate',
      [DocumentType.Other]: 'Supporting Document'
    };
    return labels[type];
  }

  formatSize(bytes: number): string {
    return formatDocumentSize(bytes);
  }

  onUploadCompleted(upload: UploadedDocument): void {
    const document: ClaimDocument = {
      ...upload.document,
      claimId: this.claimId,
      uploadedBy: this.uploadedBy || 'Application user'
    };
    this.documentStore.add(document);
    this.fileUploaded.emit({ file: upload.file, document });
  }

  onFileAccepted(file: File): void {
    this.fileAccepted.emit(file);
  }

  openDocument(document: ClaimDocument): void {
    this.notifications.info(`${document.fileName} is available in this mock document preview.`);
  }
}