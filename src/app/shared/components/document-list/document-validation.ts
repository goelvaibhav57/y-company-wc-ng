export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_DOCUMENT_EXTENSIONS: readonly string[] = ['pdf', 'png', 'jpg', 'jpeg', 'webp'];

export interface DocumentValidationResult {
  readonly valid: boolean;
  readonly error: string | null;
}

export function validateDocumentFile(file: Pick<File, 'name' | 'size'>): DocumentValidationResult {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `.${extension || 'unknown'} files are not supported. Choose a PDF or image file.`
    };
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return { valid: false, error: 'Files must be 10 MB or smaller.' };
  }

  return { valid: true, error: null };
}

export function formatDocumentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
