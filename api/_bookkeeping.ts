import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { randomUUID } from 'crypto';
import { requireStaffUser, requireSupabase } from './_auth.js';
import { enforceBrowserOrigin, enforceRateLimit } from './_security.js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' as Stripe.LatestApiVersion })
  : null;

const LEDGER_TABLE = 'business_ledger_entries';

type LedgerType = 'income' | 'expense' | 'fee' | 'refund' | 'adjustment';

interface ManualLedgerRow {
  id: string;
  source: string;
  source_id: string | null;
  type: LedgerType;
  description: string;
  amount_cents: number;
  fee_cents: number;
  net_cents: number;
  currency: string;
  occurred_at: string;
  counterparty: string | null;
  category: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

function isMissingTableError(message: string | undefined, code?: string) {
  const lower = (message || '').toLowerCase();
  return code === '42P01'
    || code === 'PGRST205'
    || lower.includes(`relation \"${LEDGER_TABLE}\" does not exist`)
    || lower.includes(`table '${LEDGER_TABLE}'`)
    || lower.includes(`table "${LEDGER_TABLE}"`)
    || lower.includes(LEDGER_TABLE);
}

function centsToDollars(cents: number) {
  return Math.round(cents) / 100;
}

function normalizeStripeType(tx: Stripe.BalanceTransaction): LedgerType {
  if (tx.type === 'refund' || tx.reporting_category === 'refund') return 'refund';
  if (tx.type === 'stripe_fee' || tx.reporting_category === 'fee') return 'fee';
  if (tx.type === 'charge' || tx.reporting_category === 'charge') return 'income';
  return tx.amount < 0 ? 'expense' : 'adjustment';
}

function stripeDescription(tx: Stripe.BalanceTransaction) {
  const source = typeof tx.source === 'object' && tx.source ? tx.source : null;
  const sourceDescription = source && 'description' in source && typeof source.description === 'string' ? source.description : '';
  return tx.description || sourceDescription || tx.reporting_category || tx.type;
}

function toStripeEntry(tx: Stripe.BalanceTransaction) {
  const type = normalizeStripeType(tx);
  return {
    id: `stripe:${tx.id}`,
    source: 'stripe',
    sourceId: tx.id,
    type,
    description: stripeDescription(tx),
    amount: centsToDollars(tx.amount),
    fee: centsToDollars(tx.fee || 0),
    net: centsToDollars(tx.net),
    currency: tx.currency.toUpperCase(),
    occurredAt: new Date(tx.created * 1000).toISOString(),
    counterparty: null as string | null,
    category: tx.reporting_category || tx.type,
    status: tx.status,
    metadata: {
      stripeType: tx.type,
      reportingCategory: tx.reporting_category,
      availableOn: tx.available_on ? new Date(tx.available_on * 1000).toISOString() : null,
    },
  };
}

function toManualEntry(row: ManualLedgerRow) {
  return {
    id: row.id,
    source: row.source,
    sourceId: row.source_id,
    type: row.type,
    description: row.description,
    amount: centsToDollars(row.amount_cents),
    fee: centsToDollars(row.fee_cents),
    net: centsToDollars(row.net_cents),
    currency: row.currency.toUpperCase(),
    occurredAt: row.occurred_at,
    counterparty: row.counterparty,
    category: row.category,
    status: 'posted',
    metadata: row.metadata || {},
  };
}

async function listManualEntries() {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from(LEDGER_TABLE)
      .select('*')
      .eq('source', 'manual')
      .order('occurred_at', { ascending: false })
      .limit(250)
      .returns<ManualLedgerRow[]>();

    if (error) {
      if (isMissingTableError(error.message, error.code)) return { entries: [], tableMissing: true };
      throw error;
    }

    return { entries: (data || []).map(toManualEntry), tableMissing: false };
  } catch (error) {
    if (error instanceof Error && /Supabase environment variables/.test(error.message)) {
      return { entries: [], tableMissing: false, supabaseMissing: true };
    }
    throw error;
  }
}

function summarize(entries: ReturnType<typeof toStripeEntry>[]) {
  const now = new Date();
  const monthKey = now.toISOString().slice(0, 7);
  const totals = {
    grossIncome: 0,
    refunds: 0,
    expenses: 0,
    stripeFees: 0,
    net: 0,
    monthGrossIncome: 0,
    monthRefunds: 0,
    monthExpenses: 0,
    monthStripeFees: 0,
    monthNet: 0,
  };

  for (const entry of entries) {
    const isMonth = entry.occurredAt.slice(0, 7) === monthKey;
    if (entry.type === 'income') totals.grossIncome += Math.max(entry.amount, 0);
    if (entry.type === 'refund') totals.refunds += Math.abs(entry.amount);
    if (entry.type === 'expense') totals.expenses += Math.abs(entry.amount);
    totals.stripeFees += Math.abs(entry.fee);
    totals.net += entry.net;

    if (isMonth) {
      if (entry.type === 'income') totals.monthGrossIncome += Math.max(entry.amount, 0);
      if (entry.type === 'refund') totals.monthRefunds += Math.abs(entry.amount);
      if (entry.type === 'expense') totals.monthExpenses += Math.abs(entry.amount);
      totals.monthStripeFees += Math.abs(entry.fee);
      totals.monthNet += entry.net;
    }
  }

  return Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, Number(value.toFixed(2))]));
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 250);
  const stripeEntries = [];
  const stripeConfigured = Boolean(stripe);
  let stripeError: string | null = null;

  if (stripe) {
    try {
      const txs = await stripe.balanceTransactions.list({
        limit,
        expand: ['data.source'],
      });
      stripeEntries.push(...txs.data.map(toStripeEntry));
    } catch (error) {
      stripeError = error instanceof Error ? error.message : 'Unable to read Stripe balance transactions';
      console.error('[bookkeeping] stripe read error', stripeError);
    }
  }

  const manual = await listManualEntries();
  const entries = [...stripeEntries, ...manual.entries].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  return res.status(200).json({
    stripeConfigured,
    stripeError,
    tableMissing: manual.tableMissing || false,
    supabaseMissing: manual.supabaseMissing || false,
    entries,
    summary: summarize(entries),
    generatedAt: new Date().toISOString(),
  });
}

function parseManualInput(body: Record<string, unknown>) {
  const { type = 'expense', description, amount, occurredAt, counterparty, category, currency = 'USD' } = body || {};

  if (!description || typeof description !== 'string') return { error: 'description is required' } as const;
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return { error: 'amount must be a positive number' } as const;
  if (!['income', 'expense', 'fee', 'refund', 'adjustment'].includes(String(type))) return { error: 'invalid type' } as const;

  const signedCents = Math.round(numericAmount * 100) * (type === 'expense' || type === 'refund' || type === 'fee' ? -1 : 1);
  return {
    value: {
      type: type as LedgerType,
      description: description.trim().slice(0, 240),
      amount_cents: signedCents,
      fee_cents: 0,
      net_cents: signedCents,
      currency: String(currency).toLowerCase().slice(0, 3) || 'usd',
      occurred_at: occurredAt ? new Date(String(occurredAt)).toISOString() : new Date().toISOString(),
      counterparty: typeof counterparty === 'string' ? counterparty.trim().slice(0, 160) : null,
      category: typeof category === 'string' ? category.trim().slice(0, 120) : null,
    },
  } as const;
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  if (!enforceBrowserOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 'bookkeeping-write', 20, 60_000)) return;

  const parsed = parseManualInput(req.body || {});
  if ('error' in parsed) return res.status(400).json({ error: parsed.error });
  const supabase = requireSupabase();
  const row = {
    id: randomUUID(),
    source: 'manual',
    source_id: null,
    ...parsed.value,
    metadata: {},
  };

  const { data, error } = await supabase.from(LEDGER_TABLE).insert(row).select('*').single<ManualLedgerRow>();
  if (error) {
    if (isMissingTableError(error.message, error.code)) {
      return res.status(503).json({ error: 'Bookkeeping table is not installed yet. Run supabase/bookkeeping.sql.' });
    }
    throw error;
  }

  return res.status(201).json({ entry: toManualEntry(data) });
}

async function handlePatch(req: VercelRequest, res: VercelResponse) {
  if (!enforceBrowserOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 'bookkeeping-write', 30, 60_000)) return;

  const id = typeof req.body?.entryId === 'string' ? req.body.entryId.trim() : '';
  if (!id) return res.status(400).json({ error: 'entryId is required' });
  const parsed = parseManualInput(req.body || {});
  if ('error' in parsed) return res.status(400).json({ error: parsed.error });

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from(LEDGER_TABLE)
    .update(parsed.value)
    .eq('id', id)
    .eq('source', 'manual')
    .select('*')
    .single<ManualLedgerRow>();

  if (error) throw error;
  return res.status(200).json({ entry: toManualEntry(data) });
}

async function handleDelete(req: VercelRequest, res: VercelResponse) {
  if (!enforceBrowserOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 'bookkeeping-write', 30, 60_000)) return;

  const id = typeof req.body?.entryId === 'string' ? req.body.entryId.trim() : '';
  if (!id) return res.status(400).json({ error: 'entryId is required' });

  const supabase = requireSupabase();
  const { error } = await supabase
    .from(LEDGER_TABLE)
    .delete()
    .eq('id', id)
    .eq('source', 'manual');

  if (error) throw error;
  return res.status(200).json({ success: true });
}

export async function handleListBookkeeping(req: VercelRequest, res: VercelResponse) {
  const user = await requireStaffUser(req, res);
  if (!user) return;

  try {
    return await handleGet(req, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown bookkeeping error';
    console.error('[bookkeeping] list error', error);
    return res.status(500).json({ error: `Unable to load bookkeeping data: ${message}` });
  }
}

export async function handleCreateManualBookkeepingEntry(req: VercelRequest, res: VercelResponse) {
  const user = await requireStaffUser(req, res);
  if (!user) return;

  try {
    return await handlePost(req, res);
  } catch (error) {
    console.error('[bookkeeping] create error', error);
    return res.status(500).json({ error: 'Unable to save bookkeeping entry' });
  }
}

export async function handleUpdateManualBookkeepingEntry(req: VercelRequest, res: VercelResponse) {
  const user = await requireStaffUser(req, res);
  if (!user) return;

  try {
    return await handlePatch(req, res);
  } catch (error) {
    console.error('[bookkeeping] update error', error);
    return res.status(500).json({ error: 'Unable to update bookkeeping entry' });
  }
}

export async function handleDeleteManualBookkeepingEntry(req: VercelRequest, res: VercelResponse) {
  const user = await requireStaffUser(req, res);
  if (!user) return;

  try {
    return await handleDelete(req, res);
  } catch (error) {
    console.error('[bookkeeping] delete error', error);
    return res.status(500).json({ error: 'Unable to delete bookkeeping entry' });
  }
}
