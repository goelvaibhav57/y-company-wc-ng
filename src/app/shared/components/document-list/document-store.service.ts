import { Injectable, signal } from '@angular/core';
import { ClaimDocument } from './document.model';

@Injectable({ providedIn: 'root' })
export class DocumentStoreService {
  private readonly uploadedByClaim = signal<ReadonlyMap<string, readonly ClaimDocument[]>>(new Map());

  merge(claimId: string, initialDocuments: readonly ClaimDocument[]): readonly ClaimDocument[] {
    const uploadedDocuments = this.uploadedByClaim().get(claimId) ?? [];
    const existingIds = new Set(initialDocuments.map((document) => document.id));
    return [...initialDocuments, ...uploadedDocuments.filter((document) => !existingIds.has(document.id))];
  }

  add(document: ClaimDocument): void {
    this.uploadedByClaim.update((documentsByClaim) => {
      const next = new Map(documentsByClaim);
      const documents = next.get(document.claimId) ?? [];
      next.set(document.claimId, [...documents, document]);
      return next;
    });
  }
}
