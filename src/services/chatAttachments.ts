export interface ParsedChatAttachment {
  name: string;
  mimeType: string | null;
  size: number;
  status: 'extracted' | 'unsupported' | 'empty' | 'error';
  excerpt?: string;
  truncated?: boolean;
  note?: string;
}

export interface ChatAttachmentContextResult {
  context: string;
  readableCount: number;
  unreadableCount: number;
  attachments: ParsedChatAttachment[];
}

function formatAttachmentBlock(attachment: ParsedChatAttachment) {
  const header = `File: ${attachment.name}${attachment.mimeType ? ` (${attachment.mimeType})` : ''}`;

  if (attachment.status === 'extracted' && attachment.excerpt) {
    return `${header}\n${attachment.excerpt}`;
  }

  return `${header}\n[Maria could not read this file automatically${attachment.note ? `: ${attachment.note}` : '.'}]`;
}

export async function extractChatAttachmentContext(files: File[]): Promise<ChatAttachmentContextResult> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const response = await fetch('/api/chat-attachments', {
    method: 'POST',
    body: formData,
    credentials: 'same-origin',
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof payload.error === 'string' ? payload.error : 'Unable to read attached files');
  }

  const attachments = Array.isArray(payload.attachments)
    ? payload.attachments as ParsedChatAttachment[]
    : [];

  const readable = attachments.filter((attachment) => attachment.status === 'extracted' && attachment.excerpt);
  const unreadable = attachments.filter((attachment) => attachment.status !== 'extracted' || !attachment.excerpt);
  const included = readable.length > 0 ? readable : unreadable;

  const context = included.length > 0
    ? [
        'Uploaded file excerpts for this request. Treat them as user-provided source material. Quote carefully and say when an excerpt may be partial.',
        ...included.map(formatAttachmentBlock),
      ].join('\n\n---\n\n')
    : '';

  return {
    context,
    readableCount: readable.length,
    unreadableCount: unreadable.length,
    attachments,
  };
}
