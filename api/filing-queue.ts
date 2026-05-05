import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireStaffUser } from './_auth.js';
import { enforceBrowserOrigin, enforceSensitiveApiEnabled } from './_security.js';
import type {
  FilingQueueItem,
  FilingQueueSummary,
  FilingRequestStatus,
  FilingRequestPriority,
  FilingQueueDocument,
} from '../src/types/concierge.js';
import { FILING_REQUEST_STATUS_ORDER } from '../src/types/concierge.js';

const TABLE_NAME = 'concierge_filing_requests';
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'divorceos-vault';
const SIGNED_URL_TTL_SECONDS = 60;
const MAX_LIMIT = 200;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseServerClient: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

function parseJsonBody<T>(req: VercelRequest): T | null {
  if (!req.body) return null;
  if (typeof req.body === 'object') return req.body as T;
  try {
    return JSON.parse(req.body) as T;
  } catch (error) {
    console.error('Failed to parse JSON body', error);
    return null;
  }
}

function sanitizeDocuments(docs: unknown): Record<string, unknown>[] {
  if (!Array.isArray(docs)) return [];
  return docs
    .map((doc) => {
      if (!doc || typeof doc !== 'object') return null;
      const shape = doc as Record<string, unknown>;
      const name = typeof shape.name === 'string' ? shape.name.trim() : 'Document';
      const storagePath =
        typeof shape.storagePath === 'string'
          ? shape.storagePath
          : typeof shape.storage_path === 'string'
            ? shape.storage_path
            : null;
      const uploadedAt =
        typeof shape.uploadedAt === 'string'
          ? shape.uploadedAt
          : typeof shape.uploaded_at === 'string'
            ? shape.uploaded_at
            : new Date().toISOString();
      const size = typeof shape.size === 'number' ? shape.size : null;
      return {
        name,
        storage_path: storagePath,
        uploaded_at: uploadedAt,
        size,
      };
    })
    .filter(Boolean) as Record<string, unknown>[];
}

function isValidStatus(value: string): value is FilingRequestStatus {
  return FILING_REQUEST_STATUS_ORDER.includes(value as FilingRequestStatus);
}

function isValidPriority(value: string): value is FilingRequestPriority {
  return value === 'rush' || value === 'standard';
}

function buildSummary(rows: FilingQueueItem[]): FilingQueueSummary {
  return rows.reduce<FilingQueueSummary>(
    (acc, row) => {
      acc.total += 1;
      if (row.status !== 'complete' && row.status !== 'on-hold') {
        acc.active += 1;
      }
      if (row.status === 'awaiting-client') {
        acc.awaitingClient += 1;
      }
      if (!row.claimedBy && row.status !== 'complete') {
        acc.needsClaim += 1;
      }
      if (row.priority === 'rush' && row.status !== 'complete') {
        acc.rush += 1;
      }
      const submittedToday = new Date(row.submittedAt).toDateString() === new Date().toDateString();
      if (submittedToday && row.status === 'complete') {
        acc.completedToday += 1;
      }
      return acc;
    },
    { total: 0, active: 0, completedToday: 0, rush: 0, awaitingClient: 0, needsClaim: 0 }
  );
}

function normalizeStoragePath(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes('..') || trimmed.startsWith('/')) return null;
  return trimmed;
}

function findDocumentByStoragePath(row: Record<string, any>, storagePath: string) {
  if (!Array.isArray(row.documents)) return null;
  return row.documents.find((doc: Record<string, any>) => {
    const candidate = normalizeStoragePath(doc?.storage_path ?? doc?.storagePath);
    return candidate === storagePath;
  }) ?? null;
}

async function mapRow(row: Record<string, any>): Promise<FilingQueueItem> {
  const documents = Array.isArray(row.documents)
    ? row.documents.map((doc: Record<string, any>) => ({
        name: doc.name ?? 'Document',
        storagePath: doc.storage_path ?? doc.storagePath ?? null,
        downloadUrl: doc.downloadUrl ?? null,
        uploadedAt: doc.uploaded_at ?? doc.uploadedAt ?? null,
        size: doc.size ?? null,
      }))
    : [];

  const safeDocuments = documents.map((doc) => ({ ...doc, downloadUrl: null }));

  return {
    id: row.id,
    userId: row.user_id,
    customerName: row.customer_name ?? 'Client',
    customerEmail: row.customer_email ?? null,
    plan: row.plan ?? null,
    countyId: row.county_id ?? null,
    countyName: row.county_name ?? null,
    priority: isValidPriority(row.priority ?? '') ? (row.priority as FilingRequestPriority) : 'standard',
    status: isValidStatus(row.status ?? '') ? (row.status as FilingRequestStatus) : 'new',
    requestedService: row.requested_service ?? null,
    needsEfiling: typeof row.needs_efiling === 'boolean' ? row.needs_efiling : true,
    notes: row.notes ?? null,
    internalNotes: row.internal_notes ?? null,
    submittedAt: row.submitted_at ?? row.created_at ?? new Date().toISOString(),
    lastActivityAt: row.last_activity_at ?? row.updated_at ?? null,
    nextDeadline: row.next_deadline ?? null,
    documents: safeDocuments,
    attachmentsCount: safeDocuments.length,
    claimedBy: row.claimed_by ?? null,
    claimedByEmail: row.claimed_by_email ?? null,
    claimedAt: row.claimed_at ?? null,
    source: row.source ?? null,
    paperclipIssueId: row.metadata?.paperclip?.issue_id ?? null,
    paperclipIdentifier: row.metadata?.paperclip?.identifier ?? null,
    paperclipLastSyncedAt: row.metadata?.paperclip?.last_synced_at ?? null,
  };
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  if (!supabaseServerClient) {
    return res.status(500).json({ error: 'Supabase environment variables are not configured' });
  }

  const statusParam = (req.query.status as string | undefined)?.trim();
  const countyParam = (req.query.countyId as string | undefined)?.trim();
  const priorityParam = (req.query.priority as string | undefined)?.trim();
  const limitParam = Number(req.query.limit);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), MAX_LIMIT) : 75;

  let query = supabaseServerClient
    .from(TABLE_NAME)
    .select('*')
    .order('submitted_at', { ascending: false })
    .limit(limit);

  if (statusParam && statusParam !== 'all') {
    const statuses = statusParam
      .split(',')
      .map((value) => value.trim())
      .filter(isValidStatus);

    if (statuses.length === 1) {
      query = query.eq('status', statuses[0]);
    } else if (statuses.length > 1) {
      query = query.in('status', statuses);
    }
  }

  if (countyParam) {
    query = query.eq('county_id', countyParam);
  }

  if (priorityParam && isValidPriority(priorityParam)) {
    query = query.eq('priority', priorityParam);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to load queue', error);
    return res.status(500).json({ error: 'Unable to load concierge queue' });
  }

  const requests = await Promise.all((data ?? []).map((row) => mapRow(row)));
  const summary = buildSummary(requests);

  return res.status(200).json({ requests, summary });
}

async function handleDocumentUrl(req: VercelRequest, res: VercelResponse) {
  if (!supabaseServerClient) {
    return res.status(500).json({ error: 'Supabase environment variables are not configured' });
  }

  const requestId = (req.query.id as string | undefined)?.trim();
  const storagePath = normalizeStoragePath(req.query.storagePath);

  if (!requestId || !storagePath) {
    return res.status(400).json({ error: 'id and storagePath are required' });
  }

  const { data: row, error: rowError } = await supabaseServerClient
    .from(TABLE_NAME)
    .select('id, documents')
    .eq('id', requestId)
    .maybeSingle<Record<string, any>>();

  if (rowError) {
    console.error('Failed to verify queue document access', rowError);
    return res.status(500).json({ error: 'Unable to verify document access' });
  }

  if (!row || !findDocumentByStoragePath(row, storagePath)) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const { data, error } = await supabaseServerClient.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    console.error('Failed to create filing document signed URL', error);
    return res.status(500).json({ error: 'Unable to create document link' });
  }

  return res.status(200).json({ downloadUrl: data.signedUrl, expiresIn: SIGNED_URL_TTL_SECONDS });
}

interface CreateQueuePayload {
  customerName: string;
  customerEmail?: string;
  plan?: string;
  userId?: string;
  countyId?: string;
  countyName?: string;
  priority?: FilingRequestPriority;
  status?: FilingRequestStatus;
  requestedService?: string;
  needsEfiling?: boolean;
  notes?: string;
  internalNotes?: string;
  nextDeadline?: string;
  documents?: unknown[];
  metadata?: Record<string, any>;
  source?: string;
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  if (!supabaseServerClient) {
    return res.status(500).json({ error: 'Supabase environment variables are not configured' });
  }

  const body = parseJsonBody<CreateQueuePayload>(req);
  if (!body) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (!body.customerName?.trim()) {
    return res.status(400).json({ error: 'customerName is required' });
  }

  const payload = {
    customer_name: body.customerName.trim(),
    customer_email: body.customerEmail?.trim() ?? null,
    plan: body.plan ?? null,
    user_id: body.userId ?? null,
    county_id: body.countyId ?? null,
    county_name: body.countyName ?? null,
    priority: body.priority && isValidPriority(body.priority) ? body.priority : 'standard',
    status: body.status && isValidStatus(body.status) ? body.status : 'new',
    requested_service: body.requestedService ?? null,
    needs_efiling: typeof body.needsEfiling === 'boolean' ? body.needsEfiling : true,
    notes: body.notes ?? null,
    internal_notes: body.internalNotes ?? null,
    next_deadline: body.nextDeadline ?? null,
    documents: sanitizeDocuments(body.documents ?? []),
    metadata: body.metadata ?? {},
    source: body.source ?? 'dashboard',
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseServerClient
    .from(TABLE_NAME)
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    console.error('Failed to insert queue item', error);
    return res.status(500).json({ error: 'Unable to create filing request' });
  }

  const request = await mapRow(data);
  return res.status(201).json({ request });
}

interface UpdateQueuePayload {
  id: string;
  updates: Partial<{
    status: FilingRequestStatus;
    priority: FilingRequestPriority;
    notes: string | null;
    internalNotes: string | null;
    claimedBy: string | null;
    claimedByEmail: string | null;
    needsEfiling: boolean;
    nextDeadline: string | null;
  }>;
}

async function handlePatch(req: VercelRequest, res: VercelResponse) {
  if (!supabaseServerClient) {
    return res.status(500).json({ error: 'Supabase environment variables are not configured' });
  }

  const body = parseJsonBody<UpdateQueuePayload>(req);
  if (!body?.id || !body.updates) {
    return res.status(400).json({ error: 'id and updates are required' });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.updates.status) {
    if (!isValidStatus(body.updates.status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    updates.status = body.updates.status;
  }

  if (body.updates.priority) {
    if (!isValidPriority(body.updates.priority)) {
      return res.status(400).json({ error: 'Invalid priority value' });
    }
    updates.priority = body.updates.priority;
  }

  if ('notes' in body.updates) {
    updates.notes = body.updates.notes ?? null;
  }

  if ('internalNotes' in body.updates) {
    updates.internal_notes = body.updates.internalNotes ?? null;
  }

  if ('claimedBy' in body.updates) {
    updates.claimed_by = body.updates.claimedBy ?? null;
    updates.claimed_at = body.updates.claimedBy ? new Date().toISOString() : null;
  }

  if ('claimedByEmail' in body.updates) {
    updates.claimed_by_email = body.updates.claimedByEmail ?? null;
  }

  if ('needsEfiling' in body.updates) {
    updates.needs_efiling = body.updates.needsEfiling;
  }

  if ('nextDeadline' in body.updates) {
    updates.next_deadline = body.updates.nextDeadline ?? null;
  }

  const { data, error } = await supabaseServerClient
    .from(TABLE_NAME)
    .update(updates)
    .eq('id', body.id)
    .select('*')
    .single();

  if (error) {
    console.error('Failed to update queue item', error);
    return res.status(500).json({ error: 'Unable to update filing request' });
  }

  const request = await mapRow(data);
  return res.status(200).json({ request });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!enforceSensitiveApiEnabled(res)) return;
  if (!enforceBrowserOrigin(req, res)) return;

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET,POST,PATCH,OPTIONS');
    return res.status(204).end();
  }

  const staffUser = await requireStaffUser(req, res);
  if (!staffUser) return;

  if (req.method === 'GET') {
    if (req.query.action === 'document-url') {
      return handleDocumentUrl(req, res);
    }
    return handleGet(req, res);
  }

  if (req.method === 'POST') {
    return handlePost(req, res);
  }

  if (req.method === 'PATCH') {
    return handlePatch(req, res);
  }

  res.setHeader('Allow', 'GET,POST,PATCH,OPTIONS');
  return res.status(405).json({ error: 'Method not allowed' });
}
