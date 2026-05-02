import { useEffect, useMemo, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Banknote, Download, Pencil, RefreshCw, ShieldCheck, Trash2, WalletCards, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  fetchBookkeeping,
  createManualBookkeepingEntry,
  updateManualBookkeepingEntry,
  deleteManualBookkeepingEntry,
  type BookkeepingEntry,
  type BookkeepingResponse,
  type LedgerType,
} from '@/services/bookkeeping';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function money(value: number) {
  return currency.format(value || 0);
}

function entrySignClass(entry: BookkeepingEntry) {
  if (entry.net > 0) return 'text-emerald-700 dark:text-emerald-300';
  if (entry.net < 0) return 'text-rose-700 dark:text-rose-300';
  return 'text-slate-700 dark:text-slate-300';
}

function typeBadge(type: LedgerType) {
  const classes: Record<LedgerType, string> = {
    income: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200',
    expense: 'bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200',
    fee: 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200',
    refund: 'bg-orange-100 text-orange-800 dark:bg-orange-400/15 dark:text-orange-200',
    adjustment: 'bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-200',
  };
  return classes[type];
}

function SummaryCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Banknote; tone: string }) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
        </div>
        <div className={`rounded-2xl p-3 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function toCsv(entries: BookkeepingEntry[]) {
  const headers = ['Date', 'Source', 'Type', 'Description', 'Category', 'Amount', 'Fee', 'Net', 'Currency', 'Status', 'Source ID'];
  const rows = entries.map((entry) => [
    entry.occurredAt,
    entry.source,
    entry.type,
    entry.description,
    entry.category || '',
    entry.amount,
    entry.fee,
    entry.net,
    entry.currency,
    entry.status || '',
    entry.sourceId || '',
  ]);
  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

export function BookkeepingPage() {
  const [data, setData] = useState<BookkeepingResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [form, setForm] = useState({ type: 'expense' as LedgerType, description: '', amount: '', occurredAt: new Date().toISOString().slice(0, 10), counterparty: '', category: '' });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await fetchBookkeeping());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load bookkeeping');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const entries = data?.entries ?? [];
  const recentStripe = useMemo(() => entries.filter((entry) => entry.source === 'stripe').slice(0, 5), [entries]);

  const resetForm = () => {
    setEditingEntryId(null);
    setForm({ type: 'expense', description: '', amount: '', occurredAt: new Date().toISOString().slice(0, 10), counterparty: '', category: '' });
  };

  const startEdit = (entry: BookkeepingEntry) => {
    if (entry.source !== 'manual') return;
    setEditingEntryId(entry.id);
    setForm({
      type: entry.type,
      description: entry.description,
      amount: String(Math.abs(entry.amount)),
      occurredAt: entry.occurredAt.slice(0, 10),
      counterparty: entry.counterparty || '',
      category: entry.category || '',
    });
  };

  const handleDelete = async (entry: BookkeepingEntry) => {
    if (entry.source !== 'manual') return;
    if (!window.confirm(`Delete manual entry “${entry.description}”?`)) return;
    setDeletingEntryId(entry.id);
    setError('');
    try {
      await deleteManualBookkeepingEntry(entry.id);
      if (editingEntryId === entry.id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete entry');
    } finally {
      setDeletingEntryId(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        type: form.type,
        description: form.description,
        amount: Number(form.amount),
        occurredAt: form.occurredAt,
        counterparty: form.counterparty,
        category: form.category,
      };
      if (editingEntryId) {
        await updateManualBookkeepingEntry(editingEntryId, payload);
      } else {
        await createManualBookkeepingEntry(payload);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save entry');
    } finally {
      setSaving(false);
    }
  };

  const downloadCsv = () => {
    const blob = new Blob([toCsv(entries)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `divorce-agent-bookkeeping-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/60 to-white px-4 py-10 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/30 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-400/30 dark:bg-white/5 dark:text-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" /> Internal finance
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 dark:text-white">Bookkeeping</h1>
            <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
              Tracks Stripe balance transactions automatically and lets you add manual expenses while the business checking account finishes processing.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button onClick={downloadCsv} disabled={!entries.length} className="gap-2 bg-emerald-700 hover:bg-emerald-800">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-400/30 dark:bg-rose-950/30 dark:text-rose-200">{error}</div>
        )}

        {data?.tableMissing && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-100">
            Manual ledger table is not installed yet. Stripe tracking works now; run <code>supabase/bookkeeping.sql</code> to enable manual expense entries.
          </div>
        )}

        {!data?.stripeConfigured && !loading && !error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-100">
            Stripe secret key is not configured in this environment yet. Once Vercel has <code>STRIPE_SECRET_KEY</code>, transactions will appear here.
          </div>
        )}

        {data?.stripeError && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-100">
            Stripe is configured, but Stripe rejected the transaction read: <span className="font-mono">{data.stripeError}</span>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Month gross" value={money(data?.summary.monthGrossIncome ?? 0)} icon={ArrowUpCircle} tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200" />
          <SummaryCard label="Month Stripe fees" value={money(data?.summary.monthStripeFees ?? 0)} icon={WalletCards} tone="bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200" />
          <SummaryCard label="Month expenses" value={money(data?.summary.monthExpenses ?? 0)} icon={ArrowDownCircle} tone="bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200" />
          <SummaryCard label="Month net" value={money(data?.summary.monthNet ?? 0)} icon={Banknote} tone="bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="border-b border-slate-200/70 p-5 dark:border-white/10">
              <h2 className="text-lg font-semibold">Ledger</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Stripe + manual entries, newest first.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:bg-white/5 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-right">Fee</th>
                    <th className="px-5 py-3 text-right">Net</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {loading ? (
                    <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500">Loading bookkeeping…</td></tr>
                  ) : entries.length ? entries.map((entry) => (
                    <tr key={entry.id} className="align-top">
                      <td className="whitespace-nowrap px-5 py-4 text-slate-500 dark:text-slate-400">{dateFormatter.format(new Date(entry.occurredAt))}</td>
                      <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${typeBadge(entry.type)}`}>{entry.type}</span></td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900 dark:text-white">{entry.description}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{entry.source}{entry.category ? ` • ${entry.category}` : ''}{entry.status ? ` • ${entry.status}` : ''}</p>
                      </td>
                      <td className="px-5 py-4 text-right tabular-nums">{money(entry.amount)}</td>
                      <td className="px-5 py-4 text-right tabular-nums text-amber-700 dark:text-amber-300">{money(entry.fee)}</td>
                      <td className={`px-5 py-4 text-right font-semibold tabular-nums ${entrySignClass(entry)}`}>{money(entry.net)}</td>
                      <td className="px-5 py-4 text-right">
                        {entry.source === 'manual' ? (
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => startEdit(entry)} className="h-8 gap-1">
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => void handleDelete(entry)} disabled={deletingEntryId === entry.id} className="h-8 gap-1 border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-400/30 dark:text-rose-200 dark:hover:bg-rose-950/30">
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Stripe locked</span>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500">No transactions yet. Stripe entries will appear here after payments settle.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{editingEntryId ? 'Edit manual entry' : 'Add manual entry'}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use this for startup expenses, software, filing fees, reimbursements, or bank-only activity.</p>
                </div>
                {editingEntryId && (
                  <Button type="button" variant="ghost" size="sm" onClick={resetForm} className="gap-1">
                    <X className="h-4 w-4" /> Cancel
                  </Button>
                )}
              </div>
              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                <label className="block text-sm font-medium">Type
                  <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as LedgerType })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-950">
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="refund">Refund</option>
                    <option value="fee">Fee</option>
                    <option value="adjustment">Adjustment</option>
                  </select>
                </label>
                <label className="block text-sm font-medium">Description
                  <input required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-950" placeholder="California SOS filing fee" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium">Amount
                    <input required type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-950" />
                  </label>
                  <label className="block text-sm font-medium">Date
                    <input type="date" value={form.occurredAt} onChange={(event) => setForm({ ...form, occurredAt: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-950" />
                  </label>
                </div>
                <label className="block text-sm font-medium">Counterparty
                  <input value={form.counterparty} onChange={(event) => setForm({ ...form, counterparty: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-950" placeholder="Secretary of State" />
                </label>
                <label className="block text-sm font-medium">Category
                  <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-950" placeholder="Formation / software / hosting" />
                </label>
                <Button type="submit" disabled={saving || data?.tableMissing} className="w-full bg-emerald-700 hover:bg-emerald-800">{saving ? 'Saving…' : editingEntryId ? 'Update entry' : 'Save entry'}</Button>
              </form>
            </section>

            <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-lg font-semibold">Stripe status</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{data?.stripeError ? 'Stripe key is present, but it needs read access to balance transactions.' : data?.stripeConfigured ? 'Stripe is configured. New payments, fees, and refunds will appear after Stripe posts balance transactions.' : 'Waiting for Stripe secret key in this environment.'}</p>
              <div className="mt-4 space-y-3">
                {recentStripe.length ? recentStripe.map((entry) => (
                  <div key={entry.id} className="rounded-2xl bg-slate-50 p-3 text-sm dark:bg-white/5">
                    <div className="flex justify-between gap-3"><span className="font-medium">{entry.description}</span><span className={entrySignClass(entry)}>{money(entry.net)}</span></div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{dateFormatter.format(new Date(entry.occurredAt))}</p>
                  </div>
                )) : <p className="text-sm text-slate-500 dark:text-slate-400">No Stripe transactions yet.</p>}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
