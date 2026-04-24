import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage, User } from '@/services/auth';

const FORM_DRAFTS_KEY = 'divorceos_form_drafts';

export type DraftFieldSourceType = 'chat' | 'upload' | 'profile' | 'manual';
export type DraftFieldConfidence = 'high' | 'medium' | 'low';
export type DraftWorkspaceStatus = 'not_started' | 'in_review' | 'ready';

export interface DraftField<T> {
  value: T;
  sourceType?: DraftFieldSourceType;
  sourceLabel?: string;
  confidence?: DraftFieldConfidence;
  needsReview?: boolean;
}

export interface DraftChild {
  id: string;
  fullName: DraftField<string>;
  birthDate: DraftField<string>;
  placeOfBirth: DraftField<string>;
}

export interface DraftFl105ResidenceHistoryEntry {
  id: string;
  fromDate: DraftField<string>;
  toDate: DraftField<string>;
  residence: DraftField<string>;
  personAndAddress: DraftField<string>;
  relationship: DraftField<string>;
}

export interface DraftFl105OtherProceeding {
  id: string;
  proceedingType: DraftField<string>;
  caseNumber: DraftField<string>;
  court: DraftField<string>;
  orderDate: DraftField<string>;
  childNames: DraftField<string>;
  connection: DraftField<string>;
  status: DraftField<string>;
}

export interface DraftFl105RestrainingOrder {
  id: string;
  orderType: DraftField<string>;
  county: DraftField<string>;
  stateOrTribe: DraftField<string>;
  caseNumber: DraftField<string>;
  expirationDate: DraftField<string>;
}

export interface DraftFl105OtherClaimant {
  id: string;
  nameAndAddress: DraftField<string>;
  childNames: DraftField<string>;
  hasPhysicalCustody: DraftField<boolean>;
  claimsCustodyRights: DraftField<boolean>;
  claimsVisitationRights: DraftField<boolean>;
}

export interface DraftFl105Section {
  childrenLivedTogetherPastFiveYears: DraftField<boolean>;
  residenceHistory: DraftFl105ResidenceHistoryEntry[];
  otherProceedingsKnown: DraftField<boolean>;
  otherProceedings: DraftFl105OtherProceeding[];
  domesticViolenceOrdersExist: DraftField<boolean>;
  domesticViolenceOrders: DraftFl105RestrainingOrder[];
  otherClaimantsKnown: DraftField<boolean>;
  otherClaimants: DraftFl105OtherClaimant[];
  declarantName: DraftField<string>;
}

export interface DraftFl100Section {
  relationshipType: DraftField<'marriage' | 'domestic_partnership' | 'both'>;
  residency: {
    petitionerCaliforniaMonths: DraftField<string>;
    petitionerCountyMonths: DraftField<string>;
    respondentCaliforniaMonths: DraftField<string>;
    respondentCountyMonths: DraftField<string>;
  };
  legalGrounds: {
    irreconcilableDifferences: DraftField<boolean>;
    permanentLegalIncapacity: DraftField<boolean>;
  };
  propertyDeclarations: {
    communityAndQuasiCommunity: DraftField<boolean>;
    communityAndQuasiCommunityDetails: DraftField<string>;
    separateProperty: DraftField<boolean>;
    separatePropertyDetails: DraftField<string>;
    separatePropertyAwardedTo: DraftField<string>;
  };
  spousalSupport: {
    supportOrderDirection: DraftField<'none' | 'petitioner_to_respondent' | 'respondent_to_petitioner'>;
    reserveJurisdictionFor: DraftField<'none' | 'petitioner' | 'respondent' | 'both'>;
    details: DraftField<string>;
    voluntaryDeclarationOfParentageSigned: DraftField<boolean>;
  };
  formerName: DraftField<string>;
}

export interface DraftFormsWorkspace {
  id: string;
  userId: string;
  title: string;
  packetType: 'starter_packet_v1';
  status: DraftWorkspaceStatus;
  createdAt: string;
  updatedAt: string;
  sourceSessionId?: string;
  sourceAssistantMessageId?: string;
  intake: {
    userRequest?: string;
    mariaSummary?: string;
    attachmentNames: string[];
  };
  caseNumber: DraftField<string>;
  filingCounty: DraftField<string>;
  courtStreet: DraftField<string>;
  courtMailingAddress: DraftField<string>;
  courtCityZip: DraftField<string>;
  courtBranch: DraftField<string>;
  petitionerName: DraftField<string>;
  petitionerAddress: DraftField<string>;
  petitionerPhone: DraftField<string>;
  petitionerEmail: DraftField<string>;
  respondentName: DraftField<string>;
  marriageDate: DraftField<string>;
  separationDate: DraftField<string>;
  hasMinorChildren: DraftField<boolean>;
  children: DraftChild[];
  fl100: DraftFl100Section;
  fl105: DraftFl105Section;
  requests: {
    childCustody: DraftField<boolean>;
    visitation: DraftField<boolean>;
    childSupport: DraftField<boolean>;
    spousalSupport: DraftField<boolean>;
    propertyRightsDetermination: DraftField<boolean>;
    restoreFormerName: DraftField<boolean>;
  };
}

export interface DraftPacketSection {
  heading?: string;
  body: string;
}

export const FL105_FORM_CAPACITY = Object.freeze({
  childrenRows: 4,
  residenceHistoryRows: 5,
  otherProceedingsRows: 5,
  restrainingOrdersRows: 4,
  otherClaimantsRows: 3,
});

function getStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function readWorkspaces(): DraftFormsWorkspace[] {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(FORM_DRAFTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((workspace) => normalizeWorkspace(workspace)) : [];
  } catch {
    return [];
  }
}

function writeWorkspaces(workspaces: DraftFormsWorkspace[]) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(FORM_DRAFTS_KEY, JSON.stringify(workspaces));
}

function createField<T>(value: T, config?: Omit<DraftField<T>, 'value'>): DraftField<T> {
  return {
    value,
    sourceType: config?.sourceType,
    sourceLabel: config?.sourceLabel,
    confidence: config?.confidence,
    needsReview: config?.needsReview ?? false,
  };
}

function createDefaultFl100Section(): DraftFl100Section {
  const assumptionFieldConfig = {
    sourceType: 'manual' as const,
    sourceLabel: 'Default FL-100 assumption',
    confidence: 'low' as const,
    needsReview: true,
  };

  return {
    relationshipType: createField('marriage', {
      sourceType: 'manual',
      sourceLabel: 'Default starter packet assumption',
      confidence: 'medium',
      needsReview: true,
    }),
    residency: {
      petitionerCaliforniaMonths: createField('', { needsReview: true }),
      petitionerCountyMonths: createField('', { needsReview: true }),
      respondentCaliforniaMonths: createField('', { needsReview: true }),
      respondentCountyMonths: createField('', { needsReview: true }),
    },
    legalGrounds: {
      irreconcilableDifferences: createField(true, {
        sourceType: 'manual',
        sourceLabel: 'Default FL-100 assumption',
        confidence: 'medium',
        needsReview: true,
      }),
      permanentLegalIncapacity: createField(false, {
        sourceType: 'manual',
        sourceLabel: 'Default FL-100 assumption',
        confidence: 'medium',
        needsReview: true,
      }),
    },
    propertyDeclarations: {
      communityAndQuasiCommunity: createField(true, {
        ...assumptionFieldConfig,
      }),
      communityAndQuasiCommunityDetails: createField('', { needsReview: true }),
      separateProperty: createField(false, {
        ...assumptionFieldConfig,
      }),
      separatePropertyDetails: createField('', { needsReview: true }),
      separatePropertyAwardedTo: createField('', { needsReview: true }),
    },
    spousalSupport: {
      supportOrderDirection: createField('none', {
        ...assumptionFieldConfig,
      }),
      reserveJurisdictionFor: createField('none', {
        ...assumptionFieldConfig,
      }),
      details: createField('', { needsReview: true }),
      voluntaryDeclarationOfParentageSigned: createField(false, {
        ...assumptionFieldConfig,
      }),
    },
    formerName: createField('', { needsReview: false }),
  };
}

function createBlankResidenceHistoryEntry(): DraftFl105ResidenceHistoryEntry {
  return {
    id: uuidv4(),
    fromDate: createField('', { needsReview: true }),
    toDate: createField('', { needsReview: false }),
    residence: createField('', { needsReview: true }),
    personAndAddress: createField('', { needsReview: true }),
    relationship: createField('', { needsReview: true }),
  };
}

function createBlankOtherProceeding(): DraftFl105OtherProceeding {
  return {
    id: uuidv4(),
    proceedingType: createField('', { needsReview: true }),
    caseNumber: createField('', { needsReview: false }),
    court: createField('', { needsReview: true }),
    orderDate: createField('', { needsReview: false }),
    childNames: createField('', { needsReview: true }),
    connection: createField('', { needsReview: true }),
    status: createField('', { needsReview: true }),
  };
}

function createBlankRestrainingOrder(): DraftFl105RestrainingOrder {
  return {
    id: uuidv4(),
    orderType: createField('', { needsReview: true }),
    county: createField('', { needsReview: true }),
    stateOrTribe: createField('', { needsReview: true }),
    caseNumber: createField('', { needsReview: false }),
    expirationDate: createField('', { needsReview: false }),
  };
}

function createBlankOtherClaimant(): DraftFl105OtherClaimant {
  return {
    id: uuidv4(),
    nameAndAddress: createField('', { needsReview: true }),
    childNames: createField('', { needsReview: true }),
    hasPhysicalCustody: createField(false, { needsReview: true }),
    claimsCustodyRights: createField(false, { needsReview: true }),
    claimsVisitationRights: createField(false, { needsReview: true }),
  };
}

function createDefaultFl105Section(petitionerName = ''): DraftFl105Section {
  return {
    childrenLivedTogetherPastFiveYears: createField(true, {
      sourceType: 'manual',
      sourceLabel: 'Default FL-105 assumption',
      confidence: 'low',
      needsReview: true,
    }),
    residenceHistory: [createBlankResidenceHistoryEntry()],
    otherProceedingsKnown: createField(false, {
      sourceType: 'manual',
      sourceLabel: 'Default FL-105 assumption',
      confidence: 'low',
      needsReview: true,
    }),
    otherProceedings: [],
    domesticViolenceOrdersExist: createField(false, {
      sourceType: 'manual',
      sourceLabel: 'Default FL-105 assumption',
      confidence: 'low',
      needsReview: true,
    }),
    domesticViolenceOrders: [],
    otherClaimantsKnown: createField(false, {
      sourceType: 'manual',
      sourceLabel: 'Default FL-105 assumption',
      confidence: 'low',
      needsReview: true,
    }),
    otherClaimants: [],
    declarantName: createField(petitionerName, {
      sourceType: petitionerName ? 'profile' : undefined,
      sourceLabel: petitionerName ? 'Account profile' : undefined,
      confidence: petitionerName ? 'high' : undefined,
      needsReview: petitionerName.length === 0,
    }),
  };
}

function normalizeWorkspace(workspace: DraftFormsWorkspace): DraftFormsWorkspace {
  const defaultFl100 = createDefaultFl100Section();
  const petitionerName = workspace.petitionerName?.value ?? '';
  const defaultFl105 = createDefaultFl105Section(petitionerName);

  return {
    ...workspace,
    caseNumber: workspace.caseNumber ?? createField('', { needsReview: false }),
    filingCounty: workspace.filingCounty ?? createField('', { needsReview: true }),
    courtStreet: workspace.courtStreet ?? createField('', { needsReview: false }),
    courtMailingAddress: workspace.courtMailingAddress ?? createField('', { needsReview: false }),
    courtCityZip: workspace.courtCityZip ?? createField('', { needsReview: false }),
    courtBranch: workspace.courtBranch ?? createField('', { needsReview: false }),
    petitionerName: workspace.petitionerName ?? createField('', { needsReview: true }),
    petitionerAddress: workspace.petitionerAddress ?? createField('', { needsReview: true }),
    petitionerPhone: workspace.petitionerPhone ?? createField('', { needsReview: true }),
    petitionerEmail: workspace.petitionerEmail ?? createField('', { needsReview: false }),
    respondentName: workspace.respondentName ?? createField('', { needsReview: true }),
    marriageDate: workspace.marriageDate ?? createField('', { needsReview: true }),
    separationDate: workspace.separationDate ?? createField('', { needsReview: true }),
    hasMinorChildren: workspace.hasMinorChildren ?? createField(false, { needsReview: true }),
    children: Array.isArray(workspace.children)
      ? workspace.children.map((child) => ({
        id: child.id ?? uuidv4(),
        fullName: child.fullName ?? createField('', { needsReview: true }),
        birthDate: child.birthDate ?? createField('', { needsReview: true }),
        placeOfBirth: child.placeOfBirth ?? createField('', { needsReview: true }),
      }))
      : [],
    fl100: {
      relationshipType: workspace.fl100?.relationshipType ?? defaultFl100.relationshipType,
      residency: {
        petitionerCaliforniaMonths: workspace.fl100?.residency?.petitionerCaliforniaMonths ?? defaultFl100.residency.petitionerCaliforniaMonths,
        petitionerCountyMonths: workspace.fl100?.residency?.petitionerCountyMonths ?? defaultFl100.residency.petitionerCountyMonths,
        respondentCaliforniaMonths: workspace.fl100?.residency?.respondentCaliforniaMonths ?? defaultFl100.residency.respondentCaliforniaMonths,
        respondentCountyMonths: workspace.fl100?.residency?.respondentCountyMonths ?? defaultFl100.residency.respondentCountyMonths,
      },
      legalGrounds: {
        irreconcilableDifferences: workspace.fl100?.legalGrounds?.irreconcilableDifferences ?? defaultFl100.legalGrounds.irreconcilableDifferences,
        permanentLegalIncapacity: workspace.fl100?.legalGrounds?.permanentLegalIncapacity ?? defaultFl100.legalGrounds.permanentLegalIncapacity,
      },
      propertyDeclarations: {
        communityAndQuasiCommunity: workspace.fl100?.propertyDeclarations?.communityAndQuasiCommunity ?? defaultFl100.propertyDeclarations.communityAndQuasiCommunity,
        communityAndQuasiCommunityDetails: workspace.fl100?.propertyDeclarations?.communityAndQuasiCommunityDetails ?? defaultFl100.propertyDeclarations.communityAndQuasiCommunityDetails,
        separateProperty: workspace.fl100?.propertyDeclarations?.separateProperty ?? defaultFl100.propertyDeclarations.separateProperty,
        separatePropertyDetails: workspace.fl100?.propertyDeclarations?.separatePropertyDetails ?? defaultFl100.propertyDeclarations.separatePropertyDetails,
        separatePropertyAwardedTo: workspace.fl100?.propertyDeclarations?.separatePropertyAwardedTo ?? defaultFl100.propertyDeclarations.separatePropertyAwardedTo,
      },
      spousalSupport: {
        supportOrderDirection: workspace.fl100?.spousalSupport?.supportOrderDirection ?? defaultFl100.spousalSupport.supportOrderDirection,
        reserveJurisdictionFor: workspace.fl100?.spousalSupport?.reserveJurisdictionFor ?? defaultFl100.spousalSupport.reserveJurisdictionFor,
        details: workspace.fl100?.spousalSupport?.details ?? defaultFl100.spousalSupport.details,
        voluntaryDeclarationOfParentageSigned: workspace.fl100?.spousalSupport?.voluntaryDeclarationOfParentageSigned ?? defaultFl100.spousalSupport.voluntaryDeclarationOfParentageSigned,
      },
      formerName: workspace.fl100?.formerName ?? defaultFl100.formerName,
    },
    fl105: {
      childrenLivedTogetherPastFiveYears: workspace.fl105?.childrenLivedTogetherPastFiveYears ?? defaultFl105.childrenLivedTogetherPastFiveYears,
      residenceHistory: Array.isArray(workspace.fl105?.residenceHistory) && workspace.fl105?.residenceHistory.length > 0
        ? workspace.fl105.residenceHistory.map((entry) => ({
          id: entry.id ?? uuidv4(),
          fromDate: entry.fromDate ?? createField('', { needsReview: true }),
          toDate: entry.toDate ?? createField('', { needsReview: false }),
          residence: entry.residence ?? createField('', { needsReview: true }),
          personAndAddress: entry.personAndAddress ?? createField('', { needsReview: true }),
          relationship: entry.relationship ?? createField('', { needsReview: true }),
        }))
        : defaultFl105.residenceHistory,
      otherProceedingsKnown: workspace.fl105?.otherProceedingsKnown ?? defaultFl105.otherProceedingsKnown,
      otherProceedings: Array.isArray(workspace.fl105?.otherProceedings)
        ? workspace.fl105.otherProceedings.map((entry) => ({
          id: entry.id ?? uuidv4(),
          proceedingType: entry.proceedingType ?? createField('', { needsReview: true }),
          caseNumber: entry.caseNumber ?? createField('', { needsReview: false }),
          court: entry.court ?? createField('', { needsReview: true }),
          orderDate: entry.orderDate ?? createField('', { needsReview: false }),
          childNames: entry.childNames ?? createField('', { needsReview: true }),
          connection: entry.connection ?? createField('', { needsReview: true }),
          status: entry.status ?? createField('', { needsReview: true }),
        }))
        : defaultFl105.otherProceedings,
      domesticViolenceOrdersExist: workspace.fl105?.domesticViolenceOrdersExist ?? defaultFl105.domesticViolenceOrdersExist,
      domesticViolenceOrders: Array.isArray(workspace.fl105?.domesticViolenceOrders)
        ? workspace.fl105.domesticViolenceOrders.map((entry) => ({
          id: entry.id ?? uuidv4(),
          orderType: entry.orderType ?? createField('', { needsReview: true }),
          county: entry.county ?? createField('', { needsReview: true }),
          stateOrTribe: entry.stateOrTribe ?? createField('', { needsReview: true }),
          caseNumber: entry.caseNumber ?? createField('', { needsReview: false }),
          expirationDate: entry.expirationDate ?? createField('', { needsReview: false }),
        }))
        : defaultFl105.domesticViolenceOrders,
      otherClaimantsKnown: workspace.fl105?.otherClaimantsKnown ?? defaultFl105.otherClaimantsKnown,
      otherClaimants: Array.isArray(workspace.fl105?.otherClaimants)
        ? workspace.fl105.otherClaimants.map((entry) => ({
          id: entry.id ?? uuidv4(),
          nameAndAddress: entry.nameAndAddress ?? createField('', { needsReview: true }),
          childNames: entry.childNames ?? createField('', { needsReview: true }),
          hasPhysicalCustody: entry.hasPhysicalCustody ?? createField(false, { needsReview: true }),
          claimsCustodyRights: entry.claimsCustodyRights ?? createField(false, { needsReview: true }),
          claimsVisitationRights: entry.claimsVisitationRights ?? createField(false, { needsReview: true }),
        }))
        : defaultFl105.otherClaimants,
      declarantName: workspace.fl105?.declarantName ?? defaultFl105.declarantName,
    },
  };
}

function getPetitionerName(user: User) {
  const first = user.profile?.firstName?.trim();
  const last = user.profile?.lastName?.trim();
  const combined = [first, last].filter(Boolean).join(' ').trim();
  return combined || user.name?.trim() || '';
}

function getSourceMessages(messages: ChatMessage[] = [], sourceAssistantMessageId?: string) {
  const assistantIndex = messages.findIndex((message) => message.id === sourceAssistantMessageId);
  const resolvedAssistantIndex = assistantIndex >= 0
    ? assistantIndex
    : [...messages].reverse().findIndex((message) => message.role === 'assistant');

  const actualAssistantIndex = assistantIndex >= 0
    ? assistantIndex
    : resolvedAssistantIndex >= 0
      ? messages.length - 1 - resolvedAssistantIndex
      : -1;

  const assistantMessage = actualAssistantIndex >= 0 ? messages[actualAssistantIndex] : undefined;
  const userMessage = actualAssistantIndex >= 0
    ? [...messages.slice(0, actualAssistantIndex)].reverse().find((message) => message.role === 'user')
    : [...messages].reverse().find((message) => message.role === 'user');

  const attachmentNames = [...messages]
    .filter((message) => message.role === 'user')
    .flatMap((message) => message.attachments ?? [])
    .map((attachment) => attachment.name)
    .filter(Boolean);

  return { assistantMessage, userMessage, attachmentNames: Array.from(new Set(attachmentNames)) };
}

function inferBoolean(text: string, expressions: RegExp[]) {
  return expressions.some((expression) => expression.test(text));
}

function inferRequests(user: User, userRequest?: string, mariaSummary?: string) {
  const combined = [
    ...(user.profile?.primaryGoals ?? []),
    userRequest ?? '',
    mariaSummary ?? '',
  ].join(' ');

  return {
    childCustody: createField(inferBoolean(combined, [/custody/i, /parenting/i]), {
      sourceType: combined ? 'chat' : undefined,
      sourceLabel: combined ? 'Goals or chat context' : undefined,
      confidence: combined ? 'low' : undefined,
      needsReview: true,
    }),
    visitation: createField(inferBoolean(combined, [/visitation/i, /timeshare/i, /parenting time/i]), {
      sourceType: combined ? 'chat' : undefined,
      sourceLabel: combined ? 'Goals or chat context' : undefined,
      confidence: combined ? 'low' : undefined,
      needsReview: true,
    }),
    childSupport: createField(inferBoolean(combined, [/child support/i, /support for children/i]), {
      sourceType: combined ? 'chat' : undefined,
      sourceLabel: combined ? 'Goals or chat context' : undefined,
      confidence: combined ? 'low' : undefined,
      needsReview: true,
    }),
    spousalSupport: createField(inferBoolean(combined, [/spousal support/i, /alimony/i]), {
      sourceType: combined ? 'chat' : undefined,
      sourceLabel: combined ? 'Goals or chat context' : undefined,
      confidence: combined ? 'low' : undefined,
      needsReview: true,
    }),
    propertyRightsDetermination: createField(inferBoolean(combined, [/property/i, /house/i, /assets/i, /debts/i]), {
      sourceType: combined ? 'chat' : undefined,
      sourceLabel: combined ? 'Goals or chat context' : undefined,
      confidence: combined ? 'low' : undefined,
      needsReview: true,
    }),
    restoreFormerName: createField(inferBoolean(combined, [/former name/i, /maiden name/i, /restore name/i]), {
      sourceType: combined ? 'chat' : undefined,
      sourceLabel: combined ? 'Goals or chat context' : undefined,
      confidence: combined ? 'low' : undefined,
      needsReview: true,
    }),
  };
}

export function createStarterPacketWorkspace(options: {
  user: User;
  messages?: ChatMessage[];
  sourceSessionId?: string;
  sourceAssistantMessageId?: string;
}) {
  const { user, messages = [], sourceSessionId, sourceAssistantMessageId } = options;
  const now = new Date().toISOString();
  const { assistantMessage, userMessage, attachmentNames } = getSourceMessages(messages, sourceAssistantMessageId);
  const petitionerName = getPetitionerName(user);
  const titleBase = petitionerName || user.email || 'Draft starter packet';

  const workspace: DraftFormsWorkspace = {
    id: uuidv4(),
    userId: user.id,
    title: `${titleBase} — starter packet`,
    packetType: 'starter_packet_v1',
    status: 'in_review',
    createdAt: now,
    updatedAt: now,
    sourceSessionId,
    sourceAssistantMessageId,
    intake: {
      userRequest: userMessage?.content?.trim() || undefined,
      mariaSummary: assistantMessage?.content?.trim() || undefined,
      attachmentNames,
    },
    caseNumber: createField('', {
      needsReview: false,
    }),
    filingCounty: createField(user.profile?.county?.trim() || '', {
      sourceType: user.profile?.county ? 'profile' : undefined,
      sourceLabel: user.profile?.county ? 'Profile' : undefined,
      confidence: user.profile?.county ? 'medium' : undefined,
      needsReview: true,
    }),
    courtStreet: createField('', {
      needsReview: false,
    }),
    courtMailingAddress: createField('', {
      needsReview: false,
    }),
    courtCityZip: createField('', {
      needsReview: false,
    }),
    courtBranch: createField('', {
      needsReview: false,
    }),
    petitionerName: createField(petitionerName, {
      sourceType: petitionerName ? 'profile' : undefined,
      sourceLabel: petitionerName ? 'Account profile' : undefined,
      confidence: petitionerName ? 'high' : undefined,
      needsReview: petitionerName.length === 0,
    }),
    petitionerAddress: createField('', {
      needsReview: true,
    }),
    petitionerPhone: createField('', {
      needsReview: true,
    }),
    petitionerEmail: createField(user.email || '', {
      sourceType: user.email ? 'profile' : undefined,
      sourceLabel: user.email ? 'Account email' : undefined,
      confidence: user.email ? 'high' : undefined,
      needsReview: false,
    }),
    respondentName: createField('', {
      needsReview: true,
    }),
    marriageDate: createField(user.profile?.marriageDate || '', {
      sourceType: user.profile?.marriageDate ? 'profile' : undefined,
      sourceLabel: user.profile?.marriageDate ? 'Profile' : undefined,
      confidence: user.profile?.marriageDate ? 'medium' : undefined,
      needsReview: true,
    }),
    separationDate: createField(user.profile?.separationDate || '', {
      sourceType: user.profile?.separationDate ? 'profile' : undefined,
      sourceLabel: user.profile?.separationDate ? 'Profile' : undefined,
      confidence: user.profile?.separationDate ? 'medium' : undefined,
      needsReview: true,
    }),
    hasMinorChildren: createField(Boolean(user.profile?.hasChildren), {
      sourceType: typeof user.profile?.hasChildren === 'boolean' ? 'profile' : undefined,
      sourceLabel: typeof user.profile?.hasChildren === 'boolean' ? 'Profile' : undefined,
      confidence: typeof user.profile?.hasChildren === 'boolean' ? 'medium' : undefined,
      needsReview: true,
    }),
    children: [],
    fl100: createDefaultFl100Section(),
    fl105: createDefaultFl105Section(petitionerName),
    requests: inferRequests(user, userMessage?.content, assistantMessage?.content),
  };

  saveDraftWorkspace(workspace);
  return workspace;
}

export function listDraftWorkspaces(userId?: string) {
  const workspaces = readWorkspaces();
  return workspaces
    .filter((workspace) => (userId ? workspace.userId === userId : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getDraftWorkspace(workspaceId: string) {
  return readWorkspaces().find((workspace) => workspace.id === workspaceId) ?? null;
}

export function saveDraftWorkspace(workspace: DraftFormsWorkspace) {
  const workspaces = readWorkspaces();
  const nextWorkspace = {
    ...workspace,
    updatedAt: new Date().toISOString(),
  };
  const next = workspaces.filter((entry) => entry.id !== nextWorkspace.id);
  next.unshift(nextWorkspace);
  writeWorkspaces(next);
  return nextWorkspace;
}

export function setDraftFieldValue<T>(field: DraftField<T>, value: T): DraftField<T> {
  return {
    ...field,
    value,
    sourceType: 'manual',
    sourceLabel: 'Edited in Draft Forms',
    confidence: 'high',
    needsReview: false,
  };
}

export function createBlankChild(): DraftChild {
  return {
    id: uuidv4(),
    fullName: createField('', { needsReview: true }),
    birthDate: createField('', { needsReview: true }),
    placeOfBirth: createField('', { needsReview: true }),
  };
}

export function createBlankFl105ResidenceHistoryEntry() {
  return createBlankResidenceHistoryEntry();
}

export function createBlankFl105OtherProceeding() {
  return createBlankOtherProceeding();
}

export function createBlankFl105RestrainingOrder() {
  return createBlankRestrainingOrder();
}

export function createBlankFl105OtherClaimant() {
  return createBlankOtherClaimant();
}

export function buildDraftStarterPacketDocument(workspace: DraftFormsWorkspace): {
  title: string;
  subtitle: string;
  fileName: string;
  sections: DraftPacketSection[];
  footerNote: string;
} {
  const petitionerName = workspace.petitionerName.value.trim() || 'Petitioner';
  const respondentName = workspace.respondentName.value.trim() || 'Respondent';
  const relationshipLabel = workspace.fl100.relationshipType.value === 'domestic_partnership'
    ? 'Domestic partnership'
    : workspace.fl100.relationshipType.value === 'both'
      ? 'Marriage and domestic partnership'
      : 'Marriage';

  const requestLabels = [
    workspace.requests.childCustody.value ? 'Child custody' : null,
    workspace.requests.visitation.value ? 'Visitation / parenting time' : null,
    workspace.requests.childSupport.value ? 'Child support' : null,
    workspace.requests.spousalSupport.value ? 'Spousal support' : null,
    workspace.requests.propertyRightsDetermination.value ? 'Property rights determination' : null,
    workspace.requests.restoreFormerName.value ? 'Restore former name' : null,
  ].filter(Boolean) as string[];

  const propertyLabels = [
    workspace.fl100.propertyDeclarations.communityAndQuasiCommunity.value ? 'Community / quasi-community property' : null,
    workspace.fl100.propertyDeclarations.separateProperty.value ? 'Separate property' : null,
  ].filter(Boolean) as string[];

  const spousalSupportDirectionLabel = workspace.fl100.spousalSupport.supportOrderDirection.value === 'petitioner_to_respondent'
    ? 'Petitioner pays support to respondent'
    : workspace.fl100.spousalSupport.supportOrderDirection.value === 'respondent_to_petitioner'
      ? 'Respondent pays support to petitioner'
      : 'No immediate support order selected';

  const spousalSupportReserveLabel = workspace.fl100.spousalSupport.reserveJurisdictionFor.value === 'petitioner'
    ? 'Reserve jurisdiction for petitioner'
    : workspace.fl100.spousalSupport.reserveJurisdictionFor.value === 'respondent'
      ? 'Reserve jurisdiction for respondent'
      : workspace.fl100.spousalSupport.reserveJurisdictionFor.value === 'both'
        ? 'Reserve jurisdiction for both parties'
        : 'No reserve jurisdiction selected';

  const legalGroundLabels = [
    workspace.fl100.legalGrounds.irreconcilableDifferences.value ? 'Irreconcilable differences' : null,
    workspace.fl100.legalGrounds.permanentLegalIncapacity.value ? 'Permanent legal incapacity' : null,
  ].filter(Boolean) as string[];

  const sections: DraftPacketSection[] = [
    {
      heading: 'Case snapshot',
      body: [
        `Case number: ${workspace.caseNumber.value || 'Not provided'}`,
        `Filing county: ${workspace.filingCounty.value || 'Not provided'}`,
        `Petitioner: ${petitionerName}`,
        `Respondent: ${respondentName}`,
        `Relationship type: ${relationshipLabel}`,
        `Date of marriage: ${workspace.marriageDate.value || 'Not provided'}`,
        `Date of separation: ${workspace.separationDate.value || 'Not provided'}`,
      ].join('\n'),
    },
    {
      heading: 'Petitioner contact',
      body: [
        `Email: ${workspace.petitionerEmail.value || 'Not provided'}`,
        `Phone: ${workspace.petitionerPhone.value || 'Not provided'}`,
        `Mailing address: ${workspace.petitionerAddress.value || 'Not provided'}`,
      ].join('\n'),
    },
    {
      heading: 'Court caption details',
      body: [
        `Court street: ${workspace.courtStreet.value || 'Not provided'}`,
        `Court mailing address: ${workspace.courtMailingAddress.value || 'Not provided'}`,
        `Court city/zip: ${workspace.courtCityZip.value || 'Not provided'}`,
        `Court branch: ${workspace.courtBranch.value || 'Not provided'}`,
      ].join('\n'),
    },
    {
      heading: 'FL-100 filing details',
      body: [
        `Petitioner residency in California: ${workspace.fl100.residency.petitionerCaliforniaMonths.value || 'Not provided'} month(s)`,
        `Petitioner residency in filing county: ${workspace.fl100.residency.petitionerCountyMonths.value || 'Not provided'} month(s)`,
        `Respondent residency in California: ${workspace.fl100.residency.respondentCaliforniaMonths.value || 'Not provided'} month(s)`,
        `Respondent residency in filing county: ${workspace.fl100.residency.respondentCountyMonths.value || 'Not provided'} month(s)`,
        `Legal grounds: ${legalGroundLabels.join(', ') || 'Not provided'}`,
        `Property declarations: ${propertyLabels.join(', ') || 'None selected'}`,
        `Community/quasi-community details: ${workspace.fl100.propertyDeclarations.communityAndQuasiCommunityDetails.value || 'Not provided'}`,
        `Separate property details: ${workspace.fl100.propertyDeclarations.separatePropertyDetails.value || 'Not provided'}`,
        `Separate property confirmed to: ${workspace.fl100.propertyDeclarations.separatePropertyAwardedTo.value || 'Not provided'}`,
        `Spousal support direction: ${spousalSupportDirectionLabel}`,
        `Spousal support reserve jurisdiction: ${spousalSupportReserveLabel}`,
        `Spousal support details: ${workspace.fl100.spousalSupport.details.value || 'Not provided'}`,
        `Voluntary declaration of parentage signed: ${workspace.fl100.spousalSupport.voluntaryDeclarationOfParentageSigned.value ? 'Yes' : 'No'}`,
        `Former name to restore: ${workspace.fl100.formerName.value || 'Not requested'}`,
      ].join('\n'),
    },
    {
      heading: 'Requested relief',
      body: requestLabels.length > 0 ? requestLabels.map((label) => `• ${label}`).join('\n') : 'No requested relief has been selected yet.',
    },
  ];

  if (workspace.hasMinorChildren.value) {
    sections.push({
      heading: 'Children of the relationship',
      body: workspace.children.length > 0
        ? workspace.children.map((child, index) => `${index + 1}. ${child.fullName.value || 'Unnamed child'} — DOB: ${child.birthDate.value || 'Not provided'} — Place of birth: ${child.placeOfBirth.value || 'Not provided'}`).join('\n')
        : 'Minor children were indicated, but child details have not been entered yet.',
    });

    sections.push({
      heading: 'FL-105 / GC-120 details',
      body: [
        `Children lived together for past five years: ${workspace.fl105.childrenLivedTogetherPastFiveYears.value ? 'Yes' : 'No / attachment needed'}`,
        workspace.fl105.residenceHistory.length > 0
          ? `Residence history:\n${workspace.fl105.residenceHistory.map((entry, index) => `${index + 1}. From ${entry.fromDate.value || 'Not provided'}${entry.toDate.value ? ` to ${entry.toDate.value}` : ''} — ${entry.residence.value || 'Residence missing'} — Lived with ${entry.personAndAddress.value || 'Not provided'} (${entry.relationship.value || 'Relationship missing'})`).join('\n')}`
          : 'Residence history not entered yet.',
        `Other custody proceedings known: ${workspace.fl105.otherProceedingsKnown.value ? 'Yes' : 'No'}`,
        `Protective/restraining orders known: ${workspace.fl105.domesticViolenceOrdersExist.value ? 'Yes' : 'No'}`,
        `Other custody/visitation claimants known: ${workspace.fl105.otherClaimantsKnown.value ? 'Yes' : 'No'}`,
      ].join('\n\n'),
    });
  }

  if (workspace.intake.userRequest || workspace.intake.mariaSummary || workspace.intake.attachmentNames.length > 0) {
    sections.push({
      heading: 'Maria intake context',
      body: [
        workspace.intake.userRequest ? `User request:\n${workspace.intake.userRequest}` : null,
        workspace.intake.mariaSummary ? `Maria summary:\n${workspace.intake.mariaSummary}` : null,
        workspace.intake.attachmentNames.length > 0 ? `Uploaded files: ${workspace.intake.attachmentNames.join(', ')}` : null,
      ].filter(Boolean).join('\n\n'),
    });
  }

  const safeBaseName = `${petitionerName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'starter-packet'}-draft-summary.pdf`;

  return {
    title: `${petitionerName} starter packet draft`,
    subtitle: `Structured Divorce Agent draft workspace for ${respondentName}`,
    fileName: safeBaseName,
    sections,
    footerNote: 'This is a structured draft packet summary generated from Draft Forms. It is not yet an official court-filed packet.',
  };
}
