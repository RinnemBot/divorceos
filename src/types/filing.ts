export type FilingCaseType =
  | 'divorce'
  | 'legal_separation'
  | 'parentage'
  | 'custody'
  | 'dvro';

export type FilingProviderKey = 'onelegal' | 'infotrack' | 'manual' | 'none';

export type FilingMatterStatus =
  | 'draft'
  | 'awaiting_documents'
  | 'ready_for_review'
  | 'ready_to_file'
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'served'
  | 'completed'
  | 'needs_attention';

export type FilingDocumentKind =
  | 'petition'
  | 'summons'
  | 'uva'
  | 'disclosure'
  | 'proof_of_service'
  | 'attachment'
  | 'court_form'
  | 'other';

export type FilingDocumentStatus = 'draft' | 'final';

export type FilingSubmissionStatus =
  | 'queued'
  | 'submitting'
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'needs_attention';

export type ServiceRequestStatus =
  | 'draft'
  | 'ordered'
  | 'attempted'
  | 'served'
  | 'failed'
  | 'cancelled';

export type FilingSubmissionType =
  | 'initial'
  | 'request_for_order'
  | 'proof_of_service'
  | 'judgment'
  | 'other';

export interface FilingPartyInfo {
  petitionerName: string;
  respondentName?: string;
  petitionerEmail?: string;
  respondentEmail?: string;
}

export interface FilingMatter {
  id: string;
  userId: string;
  caseType: FilingCaseType;
  county: string;
  court?: string;
  status: FilingMatterStatus;
  provider: FilingProviderKey;
  providerMatterId?: string;
  partyInfo: FilingPartyInfo;
  createdAt: string;
  updatedAt: string;
}

export interface FilingDocument {
  id: string;
  matterId: string;
  submissionId?: string;
  providerDocumentId?: string;
  kind: FilingDocumentKind;
  title: string;
  fileUrl: string;
  mimeType: string;
  status: FilingDocumentStatus;
  courtFormCode?: string;
  version: number;
  createdAt: string;
  updatedAt?: string;
}

export interface FilingStampedDocument {
  title: string;
  downloadUrl: string;
}

export interface FilingSubmission {
  id: string;
  matterId: string;
  provider: Exclude<FilingProviderKey, 'none'>;
  status: FilingSubmissionStatus;
  submissionType: FilingSubmissionType;
  providerSubmissionId?: string;
  envelopeId?: string;
  submittedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  stampedDocuments?: FilingStampedDocument[];
  rawProviderPayload?: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequest {
  id: string;
  matterId: string;
  provider: Exclude<FilingProviderKey, 'none'>;
  providerServiceId?: string;
  status: ServiceRequestStatus;
  recipientName: string;
  address: string;
  dueDate?: string;
  proofOfServiceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMatterInput {
  internalMatterId: string;
  caseType: FilingCaseType;
  county: string;
  court?: string;
  partyInfo: FilingPartyInfo;
}

export interface CreateMatterResult {
  providerMatterId: string;
  status: FilingMatterStatus;
  message?: string;
  raw?: unknown;
}

export interface UploadDocumentInput {
  internalMatterId: string;
  internalDocumentId: string;
  title: string;
  fileUrl: string;
  mimeType: string;
  courtFormCode?: string;
  kind?: FilingDocumentKind;
}

export interface UploadDocumentResult {
  providerDocumentId?: string;
  status: 'uploaded' | 'queued' | 'failed';
  message?: string;
  raw?: unknown;
}

export interface SubmitFilingInput {
  internalMatterId: string;
  filingType: FilingSubmissionType;
  documents: Array<{
    internalDocumentId: string;
    title: string;
    fileUrl: string;
    courtFormCode?: string;
  }>;
  metadata?: Record<string, unknown>;
}

export interface SubmitFilingResult {
  providerSubmissionId: string;
  status: Extract<FilingSubmissionStatus, 'queued' | 'submitted' | 'needs_attention'>;
  submittedAt?: string;
  message?: string;
  raw?: unknown;
}

export interface GetFilingStatusInput {
  internalMatterId: string;
  providerSubmissionId: string;
}

export interface GetFilingStatusResult {
  providerSubmissionId: string;
  status: FilingSubmissionStatus;
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  stampedDocuments?: FilingStampedDocument[];
  raw?: unknown;
}

export interface ListFeesInput {
  internalMatterId: string;
  county: string;
  filingType: FilingSubmissionType;
}

export interface ListFeesResult {
  estimatedCourtFees?: number;
  estimatedProviderFees?: number;
  currency?: string;
  raw?: unknown;
}

export interface OrderServiceInput {
  internalMatterId: string;
  recipientName: string;
  address: string;
  documents: Array<{
    internalDocumentId: string;
    title: string;
    fileUrl: string;
  }>;
  dueDate?: string;
}

export interface OrderServiceResult {
  providerServiceId: string;
  status: Extract<ServiceRequestStatus, 'ordered' | 'attempted' | 'served' | 'failed'>;
  message?: string;
  raw?: unknown;
}

export interface GetServiceStatusInput {
  internalMatterId: string;
  providerServiceId: string;
}

export interface GetServiceStatusResult {
  providerServiceId: string;
  status: ServiceRequestStatus;
  proofOfServiceUrl?: string;
  raw?: unknown;
}

export interface FilingProvider {
  createMatter(input: CreateMatterInput): Promise<CreateMatterResult>;
  uploadDocument(input: UploadDocumentInput): Promise<UploadDocumentResult>;
  submitFiling(input: SubmitFilingInput): Promise<SubmitFilingResult>;
  getFilingStatus(input: GetFilingStatusInput): Promise<GetFilingStatusResult>;
  listFees?(input: ListFeesInput): Promise<ListFeesResult>;
  orderService?(input: OrderServiceInput): Promise<OrderServiceResult>;
  getServiceStatus?(input: GetServiceStatusInput): Promise<GetServiceStatusResult>;
}
