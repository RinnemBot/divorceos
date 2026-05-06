import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  FORM_DRAFTS_TABLE,
  requireAuthenticatedUser,
  requireSupabase,
} from './_auth.js';

function isMissingTableError(message: string | undefined, tableName: string) {
  return typeof message === 'string' && message.toLowerCase().includes(`relation \"${tableName}\" does not exist`);
}

function normalizeDraftRow(row: Record<string, any>) {
  const workspace = row.workspace && typeof row.workspace === 'object' ? row.workspace : {};
  return {
    ...workspace,
    id: row.id,
    userId: row.user_id,
    title: typeof row.title === 'string' && row.title.trim() ? row.title : workspace.title,
    status: row.status || workspace.status,
    createdAt: row.created_at || workspace.createdAt,
    updatedAt: row.updated_at || workspace.updatedAt,
  };
}

export async function handleListFormDrafts(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuthenticatedUser(req, res);
  if (!user) return;

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from(FORM_DRAFTS_TABLE)
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    if (isMissingTableError(error.message, FORM_DRAFTS_TABLE)) {
      return res.status(503).json({ error: 'Draft saving is not ready yet. Please run the latest Supabase SQL first.' });
    }
    return res.status(500).json({ error: `Unable to load form drafts: ${error.message}` });
  }

  return res.status(200).json({ drafts: (data || []).map(normalizeDraftRow) });
}

export async function handleSaveFormDraft(req: VercelRequest, res: VercelResponse, body: { workspace?: unknown }) {
  const user = await requireAuthenticatedUser(req, res);
  if (!user) return;

  if (!body.workspace || typeof body.workspace !== 'object') {
    return res.status(400).json({ error: 'workspace is required' });
  }

  const source = body.workspace as Record<string, any>;
  const id = typeof source.id === 'string' && source.id.trim() ? source.id.trim() : '';
  if (!id) {
    return res.status(400).json({ error: 'workspace.id is required' });
  }

  const now = new Date().toISOString();
  const createdAt = typeof source.createdAt === 'string' ? source.createdAt : now;
  const updatedAt = typeof source.updatedAt === 'string' ? source.updatedAt : now;
  const title = typeof source.title === 'string' && source.title.trim() ? source.title.trim().slice(0, 160) : 'Draft forms workspace';
  const status = typeof source.status === 'string' && source.status.trim() ? source.status.trim().slice(0, 40) : 'in_review';
  const workspace = {
    ...source,
    id,
    userId: user.id,
    title,
    status,
    createdAt,
    updatedAt,
  };

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from(FORM_DRAFTS_TABLE)
    .upsert(
      {
        id,
        user_id: user.id,
        title,
        status,
        workspace,
        created_at: createdAt,
        updated_at: updatedAt,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single();

  if (error) {
    if (isMissingTableError(error.message, FORM_DRAFTS_TABLE)) {
      return res.status(503).json({ error: 'Draft saving is not ready yet. Please run the latest Supabase SQL first.' });
    }
    return res.status(500).json({ error: `Unable to save form draft: ${error.message}` });
  }

  return res.status(200).json({ draft: normalizeDraftRow(data) });
}
