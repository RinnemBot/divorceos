export type FilingRequestStatus =
  | 'new'
  | 'intake'
  | 'prep'
  | 'awaiting-client'
  | 'efiling'
  | 'qc'
  | 'complete'
  | 'on-hold';

export type FilingRequestPriority = 'standard' | 'rush';

export interface FilingQueueDocument {
  name: string;
  storagePath?: string | null;
  downloadUrl?: string | null;
  uploadedAt?: string | null;
  size?: number | null;
  metadata?: Record<string, any> | null;
}

export interface FilingQueueItem {
  id: string;
  userId?: string | null;
  customerName: string;
  customerEmail?: string | null;
  plan?: string | null;
  countyId?: string | null;
  countyName?: string | null;
  priority: FilingRequestPriority;
  status: FilingRequestStatus;
  requestedService?: string | null;
  needsEfiling: boolean;
  notes?: string | null;
  internalNotes?: string | null;
  submittedAt: string;
  lastActivityAt?: string | null;
  nextDeadline?: string | null;
  documents?: FilingQueueDocument[];
  attachmentsCount?: number;
  claimedBy?: string | null;
  claimedByEmail?: string | null;
  claimedAt?: string | null;
}

export interface FilingQueueSummary {
  total: number;
  active: number;
  completedToday: number;
  rush: number;
  awaitingClient: number;
  needsClaim: number;
}

export const FILING_REQUEST_STATUS_ORDER: FilingRequestStatus[] = [
  'new',
  'intake',
  'prep',
  'awaiting-client',
  'efiling',
  'qc',
  'complete',
  'on-hold',
];

export const FILING_REQUEST_STATUS_LABELS: Record<FilingRequestStatus, string> = {
  new: 'New',
  intake: 'Intake',
  prep: 'Prep',
  'awaiting-client': 'Awaiting Client',
  efiling: 'E-filing',
  qc: 'QC',
  complete: 'Complete',
  'on-hold': 'On Hold',
};

export const FILING_REQUEST_STATUS_BADGE_VARIANT: Record<FilingRequestStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  new: 'default',
  intake: 'secondary',
  prep: 'secondary',
  'awaiting-client': 'outline',
  efiling: 'default',
  qc: 'secondary',
  complete: 'outline',
  'on-hold': 'destructive',
};

export const FILING_REQUEST_PRIORITY_LABELS: Record<FilingRequestPriority, string> = {
  standard: 'Standard',
  rush: 'Rush',
};
