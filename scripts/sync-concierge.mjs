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

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Aborting.');
  process.exit(1);
}

const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const agentMail = AGENTMAIL_API_KEY ? new AgentMailClient({ apiKey: AGENTMAIL_API_KEY }) : null;

const DEFAULT_SOURCES = ['agentmail'];
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
      console.warn('Paperclip sync is not yet implemented. Configure the data source and re-run.');
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

  const metadata = mergeMetadata(existing?.metadata, {
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
    .eq('metadata->>thread_id', threadId)
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

function mergeMetadata(existing, updates) {
  const base = typeof existing === 'object' && existing !== null ? existing : {};
  const agentmailMeta = Object.assign({}, base.agentmail, updates);
  return Object.assign(Object.assign({}, base), { agentmail: agentmailMeta });
}

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}
