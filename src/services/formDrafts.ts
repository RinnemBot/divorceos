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
    separateProperty: DraftField<boolean>;
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
  filingCounty: DraftField<string>;
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
        sourceType: 'manual',
        sourceLabel: 'Default FL-100 assumption',
        confidence: 'low',
        needsReview: true,
      }),
      separateProperty: createField(false, {
        sourceType: 'manual',
        sourceLabel: 'Default FL-100 assumption',
        confidence: 'low',
        needsReview: true,
      }),
    },
    formerName: createField('', { needsReview: false }),
  };
}

function normalizeWorkspace(workspace: DraftFormsWorkspace): DraftFormsWorkspace {
  const defaultFl100 = createDefaultFl100Section();

  return {
    ...workspace,
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
        separateProperty: workspace.fl100?.propertyDeclarations?.separateProperty ?? defaultFl100.propertyDeclarations.separateProperty,
      },
      formerName: workspace.fl100?.formerName ?? defaultFl100.formerName,
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
    filingCounty: createField(user.profile?.county?.trim() || '', {
      sourceType: user.profile?.county ? 'profile' : undefined,
      sourceLabel: user.profile?.county ? 'Profile' : undefined,
      confidence: user.profile?.county ? 'medium' : undefined,
      needsReview: true,
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
  };
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

  const legalGroundLabels = [
    workspace.fl100.legalGrounds.irreconcilableDifferences.value ? 'Irreconcilable differences' : null,
    workspace.fl100.legalGrounds.permanentLegalIncapacity.value ? 'Permanent legal incapacity' : null,
  ].filter(Boolean) as string[];

  const sections: DraftPacketSection[] = [
    {
      heading: 'Case snapshot',
      body: [
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
      heading: 'FL-100 filing details',
      body: [
        `Petitioner residency in California: ${workspace.fl100.residency.petitionerCaliforniaMonths.value || 'Not provided'} month(s)`,
        `Petitioner residency in filing county: ${workspace.fl100.residency.petitionerCountyMonths.value || 'Not provided'} month(s)`,
        `Respondent residency in California: ${workspace.fl100.residency.respondentCaliforniaMonths.value || 'Not provided'} month(s)`,
        `Respondent residency in filing county: ${workspace.fl100.residency.respondentCountyMonths.value || 'Not provided'} month(s)`,
        `Legal grounds: ${legalGroundLabels.join(', ') || 'Not provided'}`,
        `Property declarations: ${propertyLabels.join(', ') || 'None selected'}`,
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
        ? workspace.children.map((child, index) => `${index + 1}. ${child.fullName.value || 'Unnamed child'} — DOB: ${child.birthDate.value || 'Not provided'}`).join('\n')
        : 'Minor children were indicated, but child details have not been entered yet.',
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
