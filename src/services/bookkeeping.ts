export type LedgerType = 'income' | 'expense' | 'fee' | 'refund' | 'adjustment';

export interface BookkeepingEntry {
  id: string;
  source: 'stripe' | 'manual' | string;
  sourceId?: string | null;
  type: LedgerType;
  description: string;
  amount: number;
  fee: number;
  net: number;
  currency: string;
  occurredAt: string;
  counterparty?: string | null;
  category?: string | null;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface BookkeepingSummary {
  grossIncome: number;
  refunds: number;
  expenses: number;
  stripeFees: number;
  net: number;
  monthGrossIncome: number;
  monthRefunds: number;
  monthExpenses: number;
  monthStripeFees: number;
  monthNet: number;
}

export interface BookkeepingResponse {
  stripeConfigured: boolean;
  stripeError?: string | null;
  tableMissing?: boolean;
  supabaseMissing?: boolean;
  entries: BookkeepingEntry[];
  summary: BookkeepingSummary;
  generatedAt: string;
}

export interface ManualBookkeepingInput {
  type: LedgerType;
  description: string;
  amount: number;
  occurredAt?: string;
  counterparty?: string;
  category?: string;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Bookkeeping request failed');
  }
  return payload as T;
}

export async function fetchBookkeeping(): Promise<BookkeepingResponse> {
  const response = await fetch('/api/auth', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'bookkeeping-list' }),
  });
  return parseResponse<BookkeepingResponse>(response);
}

export async function createManualBookkeepingEntry(input: ManualBookkeepingInput): Promise<BookkeepingEntry> {
  const response = await fetch('/api/auth', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'bookkeeping-create', ...input }),
  });
  const payload = await parseResponse<{ entry: BookkeepingEntry }>(response);
  return payload.entry;
}

export async function updateManualBookkeepingEntry(entryId: string, input: ManualBookkeepingInput): Promise<BookkeepingEntry> {
  const response = await fetch('/api/auth', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'bookkeeping-update', entryId, ...input }),
  });
  const payload = await parseResponse<{ entry: BookkeepingEntry }>(response);
  return payload.entry;
}

export async function deleteManualBookkeepingEntry(entryId: string): Promise<void> {
  const response = await fetch('/api/auth', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'bookkeeping-delete', entryId }),
  });
  await parseResponse<{ success: boolean }>(response);
}
