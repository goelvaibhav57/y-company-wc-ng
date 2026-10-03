import { TestBed } from '@angular/core/testing';
import { ClaimDocument, DocumentType } from './document.model';
import { DocumentStoreService } from './document-store.service';

describe('DocumentStoreService', () => {
  let service: DocumentStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [DocumentStoreService] });
    service = TestBed.inject(DocumentStoreService);
  });

  function createDocument(id: string, claimId: string): ClaimDocument {
    return {
      id,
      claimId,
      fileName: `${id}.pdf`,
      documentType: DocumentType.Other,
      uploadedBy: 'Jordan Lee',
      uploadedDate: '2026-10-01',
      fileSize: 2048,
      status: 'UPLOADED'
    };
  }

  it('keeps uploaded documents available by claim across component instances', () => {
    const initialDocument = createDocument('seeded', 'claim-1');
    const uploadedDocument = createDocument('uploaded', 'claim-1');
    service.add(uploadedDocument);

    expect(service.merge('claim-1', [initialDocument])).toEqual([initialDocument, uploadedDocument]);
    expect(service.merge('claim-2', [])).toEqual([]);
  });

  it('avoids duplicate entries when a stored document is already in the supplied list', () => {
    const document = createDocument('document-1', 'claim-1');
    service.add(document);

    expect(service.merge('claim-1', [document])).toEqual([document]);
  });
});
