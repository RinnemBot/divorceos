#!/usr/bin/env node

import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { AgentMailClient } from 'agentmail';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
loadEnv({ path: path.join(projectRoot, '.env.server') });
loadEnv({ path: path.join(projectRoot, '.env.local'), override: false });

const TABLE_NAME = 'concierge_filing_requests';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'divorceos-vault';
const AGENTMAIL_API_KEY = process.env.AGENTMAIL_API_KEY;
const AGENTMAIL_INBOX_ID = process.env.AGENTMAIL_INBOX_ID || 'divorceos@agentmail.to';
const AGENTMAIL_SYNC_LIMIT = Number.parseInt(process.env.AGENTMAIL_SYNC_LIMIT || '50', 10);
const PAPERCLIP_API_URL = (process.env.PAPERCLIP_API_URL || 'http://localhost:3100/api').replace(/\/$/, '');
const PAPERCLIP_API_KEY = process.env.PAPERCLIP_API_KEY;
const PAPERCLIP_COMPANY_ID = process.env.PAPERCLIP_COMPANY_ID;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Aborting.');
  process.exit(1);
}

const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const agentMail = AGENTMAIL_API_KEY ? new AgentMailClient({ apiKey: AGENTMAIL_API_KEY }) : null;

const DEFAULT_SOURCES = ['agentmail', 'paperclip'];
const argvSources = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const requestedSources = argvSources.length ? argvSources : DEFAULT_SOURCES;

(async () => {
  try {
    if (requestedSources.includes('agentmail')) {
      if (!agentMail) {
        console.warn('Skipping AgentMail sync (AGENTMAIL_API_KEY is not set).');
      } else {
        await syncAgentMail();
      }
    }

    if (requestedSources.includes('paperclip')) {
      if (!PAPERCLIP_API_KEY || !PAPERCLIP_COMPANY_ID) {
        console.warn('Skipping Paperclip sync (PAPERCLIP_API_KEY or PAPERCLIP_COMPANY_ID is not set).');
      } else {
        await syncPaperclip();
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
    process.exitCode = 1;
  }
})();

async function syncAgentMail() {
  console.log(`→ Syncing AgentMail inbox ${AGENTMAIL_INBOX_ID} (limit ${AGENTMAIL_SYNC_LIMIT})`);

  const threadsResponse = await agentMail.inboxes.threads.list(AGENTMAIL_INBOX_ID, {
    limit: AGENTMAIL_SYNC_LIMIT,
    includeSpam: false,
    includeTrash: false,
    includeBlocked: false,
  });

  const threads = threadsResponse.threads || [];
  if (!threads.length) {
    console.log('   No threads returned.');
    return;
  }

  await ensureQueueTable();

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const thread of threads) {
    try {
      const result = await upsertAgentMailThread(thread);
      if (result === 'inserted') inserted += 1;
      else if (result === 'updated') updated += 1;
      else skipped += 1;
    } catch (error) {
      skipped += 1;
      console.error(`   ✖ Failed to sync thread ${thread.threadId}:`, error.message || error);
    }
  }

  console.log(`   ✔ AgentMail sync complete (inserted: ${inserted}, updated: ${updated}, skipped: ${skipped})`);
}

async function upsertAgentMailThread(threadSummary) {
  const threadId = threadSummary.threadId;
  if (!threadId) {
    return 'skipped';
  }

  const threadDetail = await agentMail.inboxes.threads.get(AGENTMAIL_INBOX_ID, threadId);
  const messages = threadDetail.messages || [];
  if (!messages.length) {
    return 'skipped';
  }

  const latestMessage = messages[messages.length - 1];
  const customerMessage = findCustomerMessage(messages, AGENTMAIL_INBOX_ID) || latestMessage;
  const customerIdentity = parseAddress(customerMessage?.from);
  const subject = latestMessage?.subject || threadSummary.subject || 'AgentMail inquiry';
  const summary = buildSummary(latestMessage, threadSummary);
  const priority = determinePriority(threadSummary, latestMessage);

  const existing = await findExistingQueueRow('agentmail', threadId);
  const existingDocuments = Array.isArray(existing?.documents) ? existing.documents : [];
  const newDocuments = await collectNewAttachments(threadDetail, existingDocuments);
  const mergedDocuments = mergeDocuments(existingDocuments, newDocuments);

  const metadata = mergeMetadata(existing?.metadata, 'agentmail', {
    thread_id: threadId,
    inbox_id: AGENTMAIL_INBOX_ID,
    last_message_id: threadSummary.lastMessageId,
    labels: threadSummary.labels,
    last_synced_at: new Date().toISOString(),
  });

  const baseFields = {
    customer_name: customerIdentity?.name || customerIdentity?.email || 'AgentMail Lead',
    customer_email: customerIdentity?.email || null,
    priority,
    requested_service: subject,
    notes: summary,
    documents: mergedDocuments,
    last_activity_at: threadSummary.updatedAt || threadSummary.sentTimestamp || threadSummary.timestamp,
    metadata,
    source: 'agentmail',
    needs_efiling: true,
  };

  if (!existing) {
    const insertPayload = Object.assign(Object.assign({}, baseFields), {
      submitted_at: threadSummary.createdAt || messages[0]?.createdAt || new Date().toISOString(),
      status: 'new',
    });

    const { error } = await supabase.from(TABLE_NAME).insert(insertPayload);
    if (error) throw new Error(error.message);
    return 'inserted';
  }

  const updates = Object.assign({}, baseFields);
  const { error } = await supabase.from(TABLE_NAME).update(updates).eq('id', existing.id);
  if (error) throw new Error(error.message);
  return 'updated';
}

async function findExistingQueueRow(source, threadId) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id, documents, metadata, status, submitted_at')
    .eq('source', source)
    .eq('metadata->agentmail->>thread_id', threadId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }
  return data || null;
}

async function collectNewAttachments(threadDetail, existingDocuments) {
  const newDocs = [];
  const existingIds = new Set(
    (existingDocuments || [])
      .map((doc) => doc?.metadata?.agentmailAttachmentId)
      .filter(Boolean)
  );

  for (const message of threadDetail.messages || []) {
    for (const attachment of message.attachments || []) {
      if (existingIds.has(attachment.attachmentId)) {
        continue;
      }

      const stored = await downloadAndStoreAttachment(threadDetail.threadId, attachment);
      if (stored) {
        existingIds.add(attachment.attachmentId);
        newDocs.push(stored);
      }
    }
  }

  return newDocs;
}

async function downloadAndStoreAttachment(threadId, attachment) {
  if (!attachment?.attachmentId) return null;

  const response = await agentMail.inboxes.threads.getAttachment(
    AGENTMAIL_INBOX_ID,
    threadId,
    attachment.attachmentId
  );

  if (!response?.downloadUrl) return null;

  const download = await fetch(response.downloadUrl);
  if (!download.ok) {
    throw new Error(`Failed to download attachment ${attachment.attachmentId}`);
  }

  const arrayBuffer = await download.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const safeName = sanitizeFileName(response.filename || attachment.filename || 'attachment.bin');
  const storagePath = path.posix.join('agentmail', threadId, `${attachment.attachmentId}-${safeName}`);
  const uploadResult = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: response.contentType || attachment.contentType || 'application/octet-stream',
      upsert: false,
    });

  if (uploadResult.error && !uploadResult.error.message?.includes('already exists')) {
    throw new Error(uploadResult.error.message);
  }

  return {
    name: safeName,
    storagePath,
    size: response.size ?? buffer.byteLength,
    uploadedAt: new Date().toISOString(),
    metadata: {
      source: 'agentmail',
      agentmailAttachmentId: attachment.attachmentId,
      contentType: response.contentType || attachment.contentType || null,
    },
  };
}

function findCustomerMessage(messages, inboxEmail) {
  const normalizedInbox = (inboxEmail || '').toLowerCase();
  return messages.find((message) => {
    const addr = parseAddress(message?.from);
    return addr?.email && addr.email.toLowerCase() !== normalizedInbox;
  }) || null;
}

function parseAddress(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  const match = trimmed.match(/^(.*)<([^>]+)>$/);
  if (match) {
    const name = match[1].trim().replace(/^"|"$/g, '');
    return { name: name || null, email: match[2].trim().toLowerCase() };
  }
  return { name: null, email: trimmed.replace(/^"|"$/g, '').toLowerCase() };
}

function buildSummary(message, threadSummary) {
  return (
    message?.extractedText ||
    message?.text ||
    message?.preview ||
    threadSummary?.preview ||
    '[No message body]'
  );
}

function determinePriority(threadSummary, message) {
  const labels = (threadSummary.labels || []).map((label) => label.toLowerCase());
  const subject = (message?.subject || threadSummary?.subject || '').toLowerCase();
  if (labels.some((label) => ['rush', 'urgent', 'priority'].includes(label))) {
    return 'rush';
  }
  if (/rush|urgent|asap|priority/.test(subject)) {
    return 'rush';
  }
  return 'standard';
}

function mergeDocuments(existing = [], additions = []) {
  const map = new Map();
  for (const doc of existing) {
    if (doc?.storagePath) {
      map.set(doc.storagePath, doc);
    }
  }
  for (const doc of additions) {
    if (doc?.storagePath) {
      map.set(doc.storagePath, doc);
    }
  }
  return Array.from(map.values());
}

let tableVerified = false;
async function ensureQueueTable() {
  if (tableVerified) return;
  const { error } = await supabase.from(TABLE_NAME).select('id').limit(1);
  if (error && error.message?.includes('Could not find the table')) {
    throw new Error(
      `Supabase table ${TABLE_NAME} does not exist. Run supabase/concierge-queue.sql before syncing.`
    );
  }
  tableVerified = true;
}

async function syncPaperclip() {
  console.log('→ Syncing Paperclip issues');

  const agentDirectory = await fetchPaperclipAgents();
  const issues = await fetchPaperclipIssues();
  if (!issues.length) {
    console.log('   No Paperclip issues returned.');
    return;
  }

  await ensureQueueTable();

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const issue of issues) {
    try {
      const result = await upsertPaperclipIssue(issue, agentDirectory);
      if (result === 'inserted') inserted += 1;
      else if (result === 'updated') updated += 1;
      else skipped += 1;
    } catch (error) {
      skipped += 1;
      console.error(
        `   ✖ Failed to sync Paperclip issue ${issue?.identifier || issue?.id || 'unknown'}:`,
        error.message || error
      );
    }
  }

  console.log(`   ✔ Paperclip sync complete (inserted: ${inserted}, updated: ${updated}, skipped: ${skipped})`);
}

async function fetchPaperclipAgents() {
  const endpoint = `${PAPERCLIP_API_URL}/companies/${PAPERCLIP_COMPANY_ID}/agents`;
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${PAPERCLIP_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const message = await response.text();
    console.warn(`Skipping Paperclip agent directory lookup: ${message || response.status}`);
    return new Map();
  }

  const payload = await response.json();
  const agents = Array.isArray(payload) ? payload : [];
  return new Map(
    agents
      .filter((agent) => agent?.id)
      .map((agent) => [
        agent.id,
        {
          name: agent.name || agent.title || agent.id,
          email: agent.email || null,
        },
      ])
  );
}

async function fetchPaperclipIssues() {
  const endpoint = `${PAPERCLIP_API_URL}/companies/${PAPERCLIP_COMPANY_ID}/issues`;
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${PAPERCLIP_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Paperclip API request failed (${response.status})`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    console.warn('Paperclip response was not an array; skipping.');
    return [];
  }

  return payload;
}

const PAPERCLIP_STATUS_MAP = {
  backlog: 'new',
  todo: 'intake',
  in_progress: 'prep',
  in_review: 'qc',
  done: 'complete',
  blocked: 'on-hold',
  cancelled: 'on-hold',
};

function mapPaperclipStatus(status) {
  return PAPERCLIP_STATUS_MAP[status] || 'new';
}

function mapPaperclipPriority(priority) {
  if (priority === 'critical' || priority === 'high') {
    return 'rush';
  }
  return 'standard';
}

function buildPaperclipCustomerLabel(issue) {
  if (issue?.identifier) {
    return `Paperclip ${issue.identifier}`;
  }
  if (issue?.id) {
    return `Paperclip ${issue.id}`;
  }
  return 'Paperclip Task';
}

function buildPaperclipPlan(issue) {
  return issue?.project?.name || issue?.goal?.title || 'Paperclip';
}

function buildPaperclipNotes(issue) {
  const segments = [];
  if (issue?.title) {
    segments.push(`Task: ${cleanPaperclipTitle(issue.title)}`);
  }
  if (issue?.description) {
    segments.push(issue.description);
  }
  return segments.join('\n\n') || null;
}

function cleanPaperclipTitle(value) {
  if (!value || typeof value !== 'string') return value;
  return value.replace(/\*+/g, '').replace(/\s+/g, ' ').trim();
}

function resolvePaperclipAssignee(issue, agentDirectory) {
  if (issue?.assigneeAgentId && agentDirectory?.has(issue.assigneeAgentId)) {
    return agentDirectory.get(issue.assigneeAgentId);
  }
  if (issue?.assigneeUser?.name || issue?.assigneeUser?.email) {
    return {
      name: issue.assigneeUser.name || issue.assigneeUser.email,
      email: issue.assigneeUser.email || null,
    };
  }
  if (issue?.assigneeAgentId) {
    return {
      name: `Agent ${issue.assigneeAgentId}`,
      email: null,
    };
  }
  return null;
}

async function upsertPaperclipIssue(issue, agentDirectory) {
  if (!issue || (!issue.id && !issue.identifier)) {
    return 'skipped';
  }

  const issueId = issue.id || issue.identifier;
  const existing = await findPaperclipQueueRow(issueId);
  const assignee = resolvePaperclipAssignee(issue, agentDirectory);
  const metadata = mergeMetadata(existing?.metadata, 'paperclip', {
    issue_id: issue.id || null,
    identifier: issue.identifier || null,
    project_id: issue.projectId || null,
    goal_id: issue.goalId || null,
    status: issue.status || null,
    priority: issue.priority || null,
    company_id: issue.companyId || PAPERCLIP_COMPANY_ID,
    assignee_agent_id: issue.assigneeAgentId || null,
    assignee_user_id: issue.assigneeUserId || null,
    last_synced_at: new Date().toISOString(),
  });

  const baseFields = {
    customer_name: buildPaperclipCustomerLabel(issue),
    customer_email: null,
    plan: buildPaperclipPlan(issue),
    county_id: null,
    county_name: 'Paperclip',
    priority: mapPaperclipPriority(issue.priority),
    status: mapPaperclipStatus(issue.status),
    requested_service: cleanPaperclipTitle(issue.title) || issue.identifier || null,
    needs_efiling: !['done', 'cancelled', 'blocked'].includes(issue.status),
    notes: buildPaperclipNotes(issue),
    internal_notes: issue.identifier ? `Synced from Paperclip issue ${issue.identifier}` : 'Synced from Paperclip',
    next_deadline: issue.dueAt || null,
    documents: [],
    metadata,
    source: 'paperclip',
    last_activity_at: issue.updatedAt || issue.startedAt || null,
    claimed_by: assignee?.name || null,
    claimed_by_email: assignee?.email || null,
    claimed_at: assignee ? issue.startedAt || issue.updatedAt || new Date().toISOString() : null,
  };

  if (!existing) {
    const insertPayload = Object.assign(
      {
        submitted_at: issue.createdAt || new Date().toISOString(),
        status: baseFields.status,
      },
      baseFields
    );

    const { error } = await supabase.from(TABLE_NAME).insert(insertPayload);
    if (error) throw new Error(error.message);
    return 'inserted';
  }

  const updates = Object.assign({}, baseFields, { updated_at: new Date().toISOString() });
  const { error } = await supabase.from(TABLE_NAME).update(updates).eq('id', existing.id);
  if (error) throw new Error(error.message);
  return 'updated';
}

async function findPaperclipQueueRow(issueId) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id, documents, metadata, status, submitted_at')
    .eq('source', 'paperclip')
    .eq('metadata->paperclip->>issue_id', issueId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }
  return data || null;
}

function mergeMetadata(existing, sourceKey, updates) {
  const base = typeof existing === 'object' && existing !== null ? existing : {};
  const currentSourceMeta =
    typeof base[sourceKey] === 'object' && base[sourceKey] !== null ? base[sourceKey] : {};
  const mergedSourceMeta = Object.assign({}, currentSourceMeta, updates);
  return Object.assign({}, base, { [sourceKey]: mergedSourceMeta });
}

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}
