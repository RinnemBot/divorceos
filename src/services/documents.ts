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
    throw new Error(payload.error || 'Failed to create Maria document');
  }

  if (!payload.document) {
    throw new Error('Document payload missing from Maria document response');
  }

  return payload.document as VaultDocument;
}
