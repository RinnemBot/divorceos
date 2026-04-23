import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable, { type File as FormidableFile, type Files } from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { enforceBrowserOrigin, enforceRateLimit } from './_security.js';
import { requireAuthenticatedUser } from './_auth.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILES = 4;
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_TOTAL_FILE_SIZE = 16 * 1024 * 1024;
const MAX_EXCERPT_CHARS = 4_500;
const TEXT_MIME_TYPES = new Set([
  'application/json',
  'application/xml',
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/xml',
]);
const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.csv', '.json', '.xml']);
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const DOCX_EXTENSION = '.docx';
const PDF_MIME = 'application/pdf';
const PDF_EXTENSION = '.pdf';

interface AttachmentExtractionResult {
  name: string;
  mimeType: string | null;
  size: number;
  status: 'extracted' | 'unsupported' | 'empty' | 'error';
  excerpt?: string;
  truncated?: boolean;
  note?: string;
}

function normalizeFiles(files: Files): FormidableFile[] {
  const incoming = files.files;
  if (!incoming) return [];
  return Array.isArray(incoming) ? incoming : [incoming];
}

function cleanExtractedText(value: string) {
  return value
    .replace(/\u0000/g, '')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function truncateExcerpt(value: string) {
  if (value.length <= MAX_EXCERPT_CHARS) {
    return { excerpt: value, truncated: false };
  }

  return {
    excerpt: `${value.slice(0, MAX_EXCERPT_CHARS).trimEnd()}\n\n[Excerpt truncated]`,
    truncated: true,
  };
}

function isTextLikeFile(mimeType: string | null, extension: string) {
  return Boolean((mimeType && (mimeType.startsWith('text/') || TEXT_MIME_TYPES.has(mimeType))) || TEXT_EXTENSIONS.has(extension));
}

async function extractPdfText(buffer: Buffer) {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;

  try {
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .trim();

      if (pageText) {
        pages.push(pageText);
      }
    }

    return pages.join('\n\n');
  } finally {
    await loadingTask.destroy();
  }
}

async function extractDocxText(buffer: Buffer) {
  const mammothModule = await import('mammoth');
  const mammoth = (mammothModule.default ?? mammothModule) as typeof import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value ?? '';
}

async function extractAttachment(file: FormidableFile): Promise<AttachmentExtractionResult> {
  const name = file.originalFilename || 'attachment';
  const mimeType = typeof file.mimetype === 'string' ? file.mimetype.toLowerCase() : null;
  const extension = path.extname(name).toLowerCase();
  const size = typeof file.size === 'number' ? file.size : 0;

  try {
    const buffer = await fs.readFile(file.filepath);
    let extracted = '';

    if (mimeType === PDF_MIME || extension === PDF_EXTENSION) {
      extracted = await extractPdfText(buffer);
    } else if (mimeType === DOCX_MIME || extension === DOCX_EXTENSION) {
      extracted = await extractDocxText(buffer);
    } else if (isTextLikeFile(mimeType, extension)) {
      extracted = buffer.toString('utf8');
    } else {
      return {
        name,
        mimeType,
        size,
        status: 'unsupported',
        note: 'Maria can read PDFs, DOCX, TXT, CSV, JSON, and Markdown files right now.',
      };
    }

    const cleaned = cleanExtractedText(extracted);
    if (!cleaned) {
      return {
        name,
        mimeType,
        size,
        status: 'empty',
        note: 'No readable text was extracted from this file.',
      };
    }

    const { excerpt, truncated } = truncateExcerpt(cleaned);
    return {
      name,
      mimeType,
      size,
      status: 'extracted',
      excerpt,
      truncated,
    };
  } catch (error) {
    console.error('Attachment extraction failed', { name, error });
    return {
      name,
      mimeType,
      size,
      status: 'error',
      note: error instanceof Error ? error.message : 'Unable to read this file.',
    };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforceBrowserOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 'chat-attachments', 8, 60_000)) return;

  const authenticatedUser = await requireAuthenticatedUser(req, res);
  if (!authenticatedUser) return;

  const formParser = formidable({
    multiples: true,
    maxFiles: MAX_FILES,
    maxFileSize: MAX_FILE_SIZE,
    maxTotalFileSize: MAX_TOTAL_FILE_SIZE,
    keepExtensions: true,
  });

  formParser.parse(req, async (err, _fields, files) => {
    const parsedFiles = normalizeFiles(files);

    if (err) {
      console.error('Chat attachment parse error', err);
      return res.status(400).json({ error: err.message || 'Invalid file upload payload' });
    }

    if (parsedFiles.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded' });
    }

    try {
      const attachments = await Promise.all(parsedFiles.map(extractAttachment));
      return res.status(200).json({ attachments });
    } finally {
      await Promise.all(
        parsedFiles.map((file) => fs.unlink(file.filepath).catch(() => undefined))
      );
    }
  });
}
