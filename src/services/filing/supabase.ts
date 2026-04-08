import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  FilingDocument,
  FilingDocumentKind,
  FilingDocumentStatus,
  FilingMatter,
  FilingMatterStatus,
  FilingProviderKey,
  FilingSubmission,
  FilingSubmissionStatus,
  FilingSubmissionType,
  ServiceRequest,
  ServiceRequestStatus,
} from '@/types/filing';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const MATTERS_TABLE = 'filing_matters';
const SUBMISSIONS_TABLE = 'filing_submissions';
const DOCUMENTS_TABLE = 'filing_documents';
const SERVICE_REQUESTS_TABLE = 'service_requests';
const WEBHOOK_EVENTS_TABLE = 'filing_webhook_events';

export const supabaseServerClient: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

function requireSupabase(): SupabaseClient {
  if (!supabaseServerClient) {
    throw new Error('Supabase environment variables are not configured');
  }
  return supabaseServerClient;
}

export async function ensureFilingTables(): Promise<void> {
  const supabase = requireSupabase();
  const tables = [MATTERS_TABLE, SUBMISSIONS_TABLE, DOCUMENTS_TABLE, SERVICE_REQUESTS_TABLE, WEBHOOK_EVENTS_TABLE];

  for (const table of tables) {
    const { error } = await supabase.from(table).select('*', { head: true, count: 'exact' }).limit(1);
    if (error) {
      throw new Error(
        `Filing tables are not ready in Supabase. Run supabase/filing-integration.sql first. Original error: ${error.message}`
      );
    }
  }
}

function nowIso() {
  return new Date().toISOString();
}

export async function upsertFilingMatter(matter: FilingMatter): Promise<FilingMatter> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from(MATTERS_TABLE)
    .upsert(
      {
        id: matter.id,
        user_id: matter.userId,
        case_type: matter.caseType,
        county: matter.county,
        court: matter.court ?? null,
        status: matter.status,
        provider: matter.provider,
        provider_matter_id: matter.providerMatterId ?? null,
        party_info: matter.partyInfo,
        created_at: matter.createdAt,
        updated_at: matter.updatedAt,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single();

  if (error) throw error;
  return mapMatterRow(data);
}

export async function getFilingMatter(id: string): Promise<FilingMatter | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from(MATTERS_TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapMatterRow(data) : null;
}

export async function upsertFilingSubmission(submission: FilingSubmission): Promise<FilingSubmission> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from(SUBMISSIONS_TABLE)
    .upsert(
      {
        id: submission.id,
        matter_id: submission.matterId,
        provider: submission.provider,
        status: submission.status,
        submission_type: submission.submissionType,
        provider_submission_id: submission.providerSubmissionId ?? null,
        envelope_id: submission.envelopeId ?? null,
        submitted_at: submission.submittedAt ?? null,
        accepted_at: submission.acceptedAt ?? null,
        rejected_at: submission.rejectedAt ?? null,
        rejection_reason: submission.rejectionReason ?? null,
        stamped_documents: submission.stampedDocuments ?? [],
        raw_provider_payload: submission.rawProviderPayload ?? null,
        created_at: submission.createdAt,
        updated_at: submission.updatedAt,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single();

  if (error) throw error;
  return mapSubmissionRow(data);
}

export async function getLatestSubmissionForMatter(matterId: string): Promise<FilingSubmission | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from(SUBMISSIONS_TABLE)
    .select('*')
    .eq('matter_id', matterId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? mapSubmissionRow(data) : null;
}

export async function upsertFilingDocument(document: FilingDocument): Promise<FilingDocument> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from(DOCUMENTS_TABLE)
    .upsert(
      {
        id: document.id,
        matter_id: document.matterId,
        submission_id: document.submissionId ?? null,
        provider_document_id: document.providerDocumentId ?? null,
        kind: document.kind,
        title: document.title,
        file_url: document.fileUrl,
        mime_type: document.mimeType,
        status: document.status,
        court_form_code: document.courtFormCode ?? null,
        version: document.version,
        created_at: document.createdAt,
        updated_at: document.updatedAt ?? document.createdAt,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single();

  if (error) throw error;
  return mapDocumentRow(data);
}

export async function listDocumentsForMatter(matterId: string): Promise<FilingDocument[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from(DOCUMENTS_TABLE).select('*').eq('matter_id', matterId).order('created_at');
  if (error) throw error;
  return (data ?? []).map(mapDocumentRow);
}

export async function insertWebhookEvent(params: {
  provider: string;
  eventType?: string;
  externalId?: string;
  payload: unknown;
}) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from(WEBHOOK_EVENTS_TABLE)
    .insert({
      provider: params.provider,
      event_type: params.eventType ?? null,
      external_id: params.externalId ?? null,
      payload: params.payload ?? {},
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function upsertServiceRequest(serviceRequest: ServiceRequest): Promise<ServiceRequest> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from(SERVICE_REQUESTS_TABLE)
    .upsert(
      {
        id: serviceRequest.id,
        matter_id: serviceRequest.matterId,
        provider: serviceRequest.provider,
        provider_service_id: serviceRequest.providerServiceId ?? null,
        status: serviceRequest.status,
        recipient_name: serviceRequest.recipientName,
        address: serviceRequest.address,
        due_date: serviceRequest.dueDate ?? null,
        proof_of_service_url: serviceRequest.proofOfServiceUrl ?? null,
        created_at: serviceRequest.createdAt,
        updated_at: serviceRequest.updatedAt,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single();

  if (error) throw error;
  return mapServiceRequestRow(data);
}

export async function getServiceRequest(id: string): Promise<ServiceRequest | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from(SERVICE_REQUESTS_TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapServiceRequestRow(data) : null;
}

export function buildMatter(params: {
  id: string;
  userId: string;
  caseType: FilingMatter['caseType'];
  county: string;
  court?: string;
  provider: FilingProviderKey;
  providerMatterId?: string;
  partyInfo: FilingMatter['partyInfo'];
  status?: FilingMatterStatus;
}): FilingMatter {
  const ts = nowIso();
  return {
    id: params.id,
    userId: params.userId,
    caseType: params.caseType,
    county: params.county,
    court: params.court,
    status: params.status ?? 'ready_for_review',
    provider: params.provider,
    providerMatterId: params.providerMatterId,
    partyInfo: params.partyInfo,
    createdAt: ts,
    updatedAt: ts,
  };
}

export function buildSubmission(params: {
  id: string;
  matterId: string;
  provider: Exclude<FilingProviderKey, 'none'>;
  submissionType: FilingSubmissionType;
  providerSubmissionId?: string;
  status: FilingSubmissionStatus;
  submittedAt?: string;
  rawProviderPayload?: unknown;
}): FilingSubmission {
  const ts = nowIso();
  return {
    id: params.id,
    matterId: params.matterId,
    provider: params.provider,
    status: params.status,
    submissionType: params.submissionType,
    providerSubmissionId: params.providerSubmissionId,
    submittedAt: params.submittedAt,
    rawProviderPayload: params.rawProviderPayload,
    createdAt: ts,
    updatedAt: ts,
  };
}

export function buildDocument(params: {
  id: string;
  matterId: string;
  submissionId?: string;
  providerDocumentId?: string;
  kind?: FilingDocumentKind;
  title: string;
  fileUrl: string;
  mimeType: string;
  status?: FilingDocumentStatus;
  courtFormCode?: string;
  version?: number;
}): FilingDocument {
  const ts = nowIso();
  return {
    id: params.id,
    matterId: params.matterId,
    submissionId: params.submissionId,
    providerDocumentId: params.providerDocumentId,
    kind: params.kind ?? 'court_form',
    title: params.title,
    fileUrl: params.fileUrl,
    mimeType: params.mimeType,
    status: params.status ?? 'final',
    courtFormCode: params.courtFormCode,
    version: params.version ?? 1,
    createdAt: ts,
    updatedAt: ts,
  };
}

export function buildServiceRequest(params: {
  id: string;
  matterId: string;
  provider: Exclude<FilingProviderKey, 'none'>;
  providerServiceId?: string;
  recipientName: string;
  address: string;
  status?: ServiceRequestStatus;
  dueDate?: string;
}): ServiceRequest {
  const ts = nowIso();
  return {
    id: params.id,
    matterId: params.matterId,
    provider: params.provider,
    providerServiceId: params.providerServiceId,
    recipientName: params.recipientName,
    address: params.address,
    status: params.status ?? 'ordered',
    dueDate: params.dueDate,
    createdAt: ts,
    updatedAt: ts,
  };
}

function mapMatterRow(row: Record<string, any>): FilingMatter {
  return {
    id: row.id,
    userId: row.user_id,
    caseType: row.case_type,
    county: row.county,
    court: row.court ?? undefined,
    status: row.status,
    provider: row.provider,
    providerMatterId: row.provider_matter_id ?? undefined,
    partyInfo: row.party_info ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSubmissionRow(row: Record<string, any>): FilingSubmission {
  return {
    id: row.id,
    matterId: row.matter_id,
    provider: row.provider,
    status: row.status,
    submissionType: row.submission_type,
    providerSubmissionId: row.provider_submission_id ?? undefined,
    envelopeId: row.envelope_id ?? undefined,
    submittedAt: row.submitted_at ?? undefined,
    acceptedAt: row.accepted_at ?? undefined,
    rejectedAt: row.rejected_at ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    stampedDocuments: row.stamped_documents ?? [],
    rawProviderPayload: row.raw_provider_payload ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDocumentRow(row: Record<string, any>): FilingDocument {
  return {
    id: row.id,
    matterId: row.matter_id,
    submissionId: row.submission_id ?? undefined,
    providerDocumentId: row.provider_document_id ?? undefined,
    kind: row.kind,
    title: row.title,
    fileUrl: row.file_url,
    mimeType: row.mime_type,
    status: row.status,
    courtFormCode: row.court_form_code ?? undefined,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  };
}

function mapServiceRequestRow(row: Record<string, any>): ServiceRequest {
  return {
    id: row.id,
    matterId: row.matter_id,
    provider: row.provider,
    providerServiceId: row.provider_service_id ?? undefined,
    status: row.status,
    recipientName: row.recipient_name,
    address: row.address,
    dueDate: row.due_date ?? undefined,
    proofOfServiceUrl: row.proof_of_service_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
