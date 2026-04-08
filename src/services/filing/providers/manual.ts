import type {
  CreateMatterInput,
  CreateMatterResult,
  FilingProvider,
  GetFilingStatusInput,
  GetFilingStatusResult,
  GetServiceStatusInput,
  GetServiceStatusResult,
  ListFeesInput,
  ListFeesResult,
  OrderServiceInput,
  OrderServiceResult,
  SubmitFilingInput,
  SubmitFilingResult,
  UploadDocumentInput,
  UploadDocumentResult,
} from '@/types/filing';

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export class ManualFilingProvider implements FilingProvider {
  async createMatter(input: CreateMatterInput): Promise<CreateMatterResult> {
    return {
      providerMatterId: `manual_matter_${input.internalMatterId}`,
      status: 'ready_for_review',
      message: 'Matter created in manual filing mode.',
      raw: {
        provider: 'manual',
        createdAt: nowIso(),
      },
    };
  }

  async uploadDocument(_input: UploadDocumentInput): Promise<UploadDocumentResult> {
    return {
      providerDocumentId: makeId('manual_doc'),
      status: 'uploaded',
      message: 'Document registered for manual filing review.',
      raw: {
        provider: 'manual',
        uploadedAt: nowIso(),
      },
    };
  }

  async submitFiling(input: SubmitFilingInput): Promise<SubmitFilingResult> {
    return {
      providerSubmissionId: `manual_submission_${input.internalMatterId}`,
      status: 'queued',
      submittedAt: nowIso(),
      message: 'Filing queued for manual concierge handling.',
      raw: {
        provider: 'manual',
        filingType: input.filingType,
        queuedAt: nowIso(),
      },
    };
  }

  async getFilingStatus(input: GetFilingStatusInput): Promise<GetFilingStatusResult> {
    return {
      providerSubmissionId: input.providerSubmissionId,
      status: 'under_review',
      raw: {
        provider: 'manual',
        internalMatterId: input.internalMatterId,
        checkedAt: nowIso(),
      },
    };
  }

  async listFees(input: ListFeesInput): Promise<ListFeesResult> {
    return {
      estimatedCourtFees: 435,
      estimatedProviderFees: input.filingType === 'initial' ? 75 : 45,
      currency: 'USD',
      raw: {
        provider: 'manual',
        county: input.county,
      },
    };
  }

  async orderService(_input: OrderServiceInput): Promise<OrderServiceResult> {
    return {
      providerServiceId: makeId('manual_service'),
      status: 'ordered',
      message: 'Service request logged for manual coordination.',
      raw: {
        provider: 'manual',
        orderedAt: nowIso(),
      },
    };
  }

  async getServiceStatus(input: GetServiceStatusInput): Promise<GetServiceStatusResult> {
    return {
      providerServiceId: input.providerServiceId,
      status: 'ordered',
      raw: {
        provider: 'manual',
        internalMatterId: input.internalMatterId,
        checkedAt: nowIso(),
      },
    };
  }
}
