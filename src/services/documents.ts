export interface VaultDocument {
  id: string;
  name: string;
  uploadedAt: string;
  size: number;
  downloadUrl: string | null;
}

export interface MariaDocumentSection {
  heading?: string;
  body: string;
}

export interface CreateMariaDocumentInput {
  title: string;
  subtitle?: string;
  fileName?: string;
  sections: MariaDocumentSection[];
  footerNote?: string;
}

export class MariaDocumentError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'MariaDocumentError';
    this.status = status;
    this.code = code;
  }
}

function classifyMariaDocumentError(status: number, message: string) {
  if (status === 401) {
    return {
      code: 'AUTH_REQUIRED',
      message: 'Save failed (401): you need to sign in again before Maria can save to Saved Files.',
    };
  }

  if (status === 403) {
    return {
      code: 'FORBIDDEN',
      message: `Save failed (403): ${message || 'origin or session is not allowed for this request.'}`,
    };
  }

  if (status === 400) {
    return {
      code: 'BAD_REQUEST',
      message: `Save failed (400): ${message || 'the PDF payload was invalid.'}`,
    };
  }

  if (status === 503) {
    return {
      code: 'SERVICE_DISABLED',
      message: `Save failed (503): ${message || 'document saving is currently unavailable.'}`,
    };
  }

  if (status >= 500) {
    return {
      code: 'SERVER_ERROR',
      message: `Save failed (${status}): ${message || 'server-side document generation or upload failed.'}`,
    };
  }

  return {
    code: 'REQUEST_FAILED',
    message: `Save failed (${status || 0}): ${message || 'unexpected response from document service.'}`,
  };
}

export async function createMariaDocument(input: CreateMariaDocumentInput): Promise<VaultDocument> {
  const response = await fetch('/api/maria-documents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
    credentials: 'same-origin',
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const classified = classifyMariaDocumentError(response.status, typeof payload.error === 'string' ? payload.error : '');
    throw new MariaDocumentError(classified.message, response.status, classified.code);
  }

  if (!payload.document) {
    throw new MariaDocumentError('Save failed (200): document payload missing from Maria document response.', 200, 'MISSING_DOCUMENT');
  }

  return payload.document as VaultDocument;
}
