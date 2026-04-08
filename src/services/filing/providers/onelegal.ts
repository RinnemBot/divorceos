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

const ONELEGAL_API_BASE_URL = process.env.ONELEGAL_API_BASE_URL || '';
const ONELEGAL_API_KEY = process.env.ONELEGAL_API_KEY || '';

function requireConfig() {
  if (!ONELEGAL_API_BASE_URL || !ONELEGAL_API_KEY) {
    throw new Error('One Legal adapter is not configured. Set ONELEGAL_API_BASE_URL and ONELEGAL_API_KEY.');
  }
}

export class OneLegalFilingProvider implements FilingProvider {
  async createMatter(input: CreateMatterInput): Promise<CreateMatterResult> {
    requireConfig();

    return {
      providerMatterId: `onelegal_pending_${input.internalMatterId}`,
      status: 'ready_for_review',
      message: 'One Legal adapter scaffold only. Replace with real API call once credentials/docs arrive.',
      raw: {
        provider: 'onelegal',
        configuredBaseUrl: ONELEGAL_API_BASE_URL,
      },
    };
  }

  async uploadDocument(_input: UploadDocumentInput): Promise<UploadDocumentResult> {
    requireConfig();

    return {
      providerDocumentId: `onelegal_doc_pending_${Date.now()}`,
      status: 'queued',
      message: 'One Legal document upload scaffold only.',
    };
  }

  async submitFiling(input: SubmitFilingInput): Promise<SubmitFilingResult> {
    requireConfig();

    return {
      providerSubmissionId: `onelegal_submission_pending_${input.internalMatterId}`,
      status: 'needs_attention',
      message: 'One Legal submit scaffold only. Real envelope submission not implemented yet.',
      raw: {
        provider: 'onelegal',
        filingType: input.filingType,
      },
    };
  }

  async getFilingStatus(input: GetFilingStatusInput): Promise<GetFilingStatusResult> {
    requireConfig();

    return {
      providerSubmissionId: input.providerSubmissionId,
      status: 'needs_attention',
      raw: {
        provider: 'onelegal',
        note: 'Status lookup scaffold only.',
      },
    };
  }

  async listFees(_input: ListFeesInput): Promise<ListFeesResult> {
    requireConfig();

    return {
      currency: 'USD',
      raw: {
        provider: 'onelegal',
        note: 'Fee lookup scaffold only.',
      },
    };
  }

  async orderService(_input: OrderServiceInput): Promise<OrderServiceResult> {
    requireConfig();

    return {
      providerServiceId: `onelegal_service_pending_${Date.now()}`,
      status: 'ordered',
      message: 'One Legal service scaffold only.',
      raw: {
        provider: 'onelegal',
      },
    };
  }

  async getServiceStatus(input: GetServiceStatusInput): Promise<GetServiceStatusResult> {
    requireConfig();

    return {
      providerServiceId: input.providerServiceId,
      status: 'ordered',
      raw: {
        provider: 'onelegal',
        note: 'Service status scaffold only.',
      },
    };
  }
}
