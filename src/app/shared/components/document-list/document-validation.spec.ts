import { formatDocumentSize, MAX_DOCUMENT_SIZE_BYTES, validateDocumentFile } from './document-validation';

describe('document validation', () => {
  it('accepts supported PDF and image extensions', () => {
    expect(validateDocumentFile({ name: 'policy.PDF', size: 100 }).valid).toBeTrue();
    expect(validateDocumentFile({ name: 'damage.webp', size: 100 }).valid).toBeTrue();
  });

  it('rejects unsupported or missing extensions', () => {
    expect(validateDocumentFile({ name: 'archive.zip', size: 100 }).valid).toBeFalse();
    expect(validateDocumentFile({ name: 'no-extension', size: 100 }).valid).toBeFalse();
  });

  it('enforces the maximum size and permits the exact limit', () => {
    expect(validateDocumentFile({ name: 'large.pdf', size: MAX_DOCUMENT_SIZE_BYTES }).valid).toBeTrue();
    expect(validateDocumentFile({ name: 'large.pdf', size: MAX_DOCUMENT_SIZE_BYTES + 1 }).valid).toBeFalse();
  });

  it('formats file sizes', () => {
    expect(formatDocumentSize(400)).toBe('400 B');
    expect(formatDocumentSize(2048)).toBe('2.0 KB');
    expect(formatDocumentSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });
});
