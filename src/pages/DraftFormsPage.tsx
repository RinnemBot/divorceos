import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, FileText, Loader2, MessageSquareText, PencilLine, Save, Sparkles, Wand2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { authService, type ChatSession, type User } from '@/services/auth';
import { getSupportScenarios } from '@/services/savedFiles';
import { MariaDocumentError, createOfficialStarterPacketDocument } from '@/services/documents';
import {
  createBlankChild,
  createBlankFl105OtherClaimant,
  createBlankFl105OtherProceeding,
  createBlankFl105ResidenceHistoryEntry,
  createBlankFl105RestrainingOrder,
  DRAFT_PACKET_PRESET_LABELS,
  FL105_FORM_CAPACITY,
  applyDraftPacketPreset,
  createStarterPacketWorkspace,
  getDraftWorkspace,
  getLatestDraftFormsChatHandoff,
  hydrateDraftWorkspaceFromChatContext,
  hydrateDraftWorkspaceFromSupportScenario,
  listDraftWorkspaces,
  replaceDraftWorkspaceChatHandoff,
  saveDraftWorkspace,
  saveDraftWorkspaceToServer,
  setDraftFieldValue,
  syncDraftWorkspacesFromServer,
  type DraftField,
  type DraftFormsWorkspace,
  type DraftPacketPresetId,
  type DraftIntakeFact,
} from '@/services/formDrafts';
import { toast } from 'sonner';

function parseMonths(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function qualifiesForResidency(californiaMonths: string, countyMonths: string) {
  const california = parseMonths(californiaMonths);
  const county = parseMonths(countyMonths);
  return california !== null && county !== null && california >= 6 && county >= 3;
}

function splitNonEmptyLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeFl105ProceedingType(value: string) {
  const raw = value.trim().toLowerCase();
  if (!raw) return '';
  if (raw === 'family' || /(family|dissolution|custody|divorce)/.test(raw)) return 'family';
  if (raw === 'guardianship' || /(guardian|probate|minor guardianship)/.test(raw)) return 'guardianship';
  if (raw === 'juvenile' || /(juvenile|dependency|delinquency)/.test(raw)) return 'juvenile';
  if (raw === 'adoption' || /(adoption|adopt)/.test(raw)) return 'adoption';
  if (raw === 'other' || /(other|tribal|out[- ]?of[- ]?state)/.test(raw)) return 'other';
  return '';
}

function normalizeFl105OrderType(value: string) {
  const raw = value.trim().toLowerCase();
  if (!raw) return '';
  if (raw === 'criminal' || /(criminal|police|penal)/.test(raw)) return 'criminal';
  if (raw === 'family' || /(family|dvro|domestic)/.test(raw)) return 'family';
  if (raw === 'juvenile' || /(juvenile|dependency|child welfare)/.test(raw)) return 'juvenile';
  if (raw === 'other' || /(other|civil|tribal)/.test(raw)) return 'other';
  return '';
}

function isFl105StateOnlyAddress(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return !/[0-9]/.test(trimmed) && !/,/.test(trimmed);
}

function hasFl105ProceedingData(entry: DraftFormsWorkspace['fl105']['otherProceedings'][number]) {
  return [
    entry.proceedingType.value,
    entry.caseNumber.value,
    entry.court.value,
    entry.orderDate.value,
    entry.childNames.value,
    entry.connection.value,
    entry.status.value,
  ].some((value) => value.trim().length > 0);
}

function hasFl105ResidenceHistoryData(entry: DraftFormsWorkspace['fl105']['residenceHistory'][number]) {
  return [
    entry.fromDate.value,
    entry.toDate.value,
    entry.residence.value,
    entry.personAndAddress.value,
    entry.relationship.value,
  ].some((value) => value.trim().length > 0);
}

function hasFl105OrderData(entry: DraftFormsWorkspace['fl105']['domesticViolenceOrders'][number]) {
  return [
    entry.orderType.value,
    entry.county.value,
    entry.stateOrTribe.value,
    entry.caseNumber.value,
    entry.expirationDate.value,
  ].some((value) => value.trim().length > 0);
}

function hasFl105ClaimantData(entry: DraftFormsWorkspace['fl105']['otherClaimants'][number]) {
  return Boolean(
    entry.nameAndAddress.value.trim()
    || entry.childNames.value.trim()
    || entry.hasPhysicalCustody.value
    || entry.claimsCustodyRights.value
    || entry.claimsVisitationRights.value,
  );
}

function getFl105OtherProceedingOverflowCount(entries: DraftFormsWorkspace['fl105']['otherProceedings']) {
  const usedTypes = new Set<string>();
  let overflowCount = 0;

  entries.forEach((entry) => {
    if (!hasFl105ProceedingData(entry)) return;
    const type = normalizeFl105ProceedingType(entry.proceedingType.value);
    if (type && !usedTypes.has(type)) {
      usedTypes.add(type);
      return;
    }
    overflowCount += 1;
  });

  return overflowCount;
}

function getFl105OrderOverflowCount(entries: DraftFormsWorkspace['fl105']['domesticViolenceOrders']) {
  const usedTypes = new Set<string>();
  let overflowCount = 0;

  entries.forEach((entry) => {
    if (!hasFl105OrderData(entry)) return;
    const type = normalizeFl105OrderType(entry.orderType.value);
    if (type && !usedTypes.has(type)) {
      usedTypes.add(type);
      return;
    }
    overflowCount += 1;
  });

  return overflowCount;
}

function getFl105ClaimantOverflowCount(entries: DraftFormsWorkspace['fl105']['otherClaimants']) {
  return Math.max(entries.filter(hasFl105ClaimantData).length - FL105_FORM_CAPACITY.otherClaimantsRows, 0);
}

function getFl105ResidenceHistoryOverflowCount(entries: DraftFormsWorkspace['fl105']['residenceHistory']) {
  return Math.max(entries.filter(hasFl105ResidenceHistoryData).length - FL105_FORM_CAPACITY.residenceHistoryRows, 0);
}

function getFl105AdditionalChildSectionCount(entries: DraftFormsWorkspace['fl105']['additionalChildrenAttachments']) {
  return entries.reduce((count, entry) => {
    if (entry.sameResidenceAsChildA.value) {
      return count + 1;
    }

    const historyRows = entry.residenceHistory.filter(hasFl105ResidenceHistoryData).length;
    return count + Math.max(Math.ceil(historyRows / FL105_FORM_CAPACITY.residenceHistoryRows), 1);
  }, 0);
}

function getFl105AdditionalChildAttachmentPageCount(entries: DraftFormsWorkspace['fl105']['additionalChildrenAttachments']) {
  const sectionCount = getFl105AdditionalChildSectionCount(entries);
  return sectionCount > 0 ? Math.ceil(sectionCount / 2) : 0;
}

const FL100_SEPARATE_PROPERTY_VISIBLE_ROWS = 5;
const GENERATED_CHILD_ATTACHMENT_ENTRIES_PER_PAGE = 6;

type RemainingFlFormKey = 'fl165' | 'fl182' | 'fl191' | 'fl195' | 'fl272' | 'fl342a' | 'fl346' | 'fl347' | 'fl435' | 'fl460' | 'fl830' | 'fw001' | 'fw003' | 'fw010';
type DvFormKey = 'dv100' | 'dv101' | 'dv105' | 'dv108' | 'dv109' | 'dv110' | 'dv120' | 'dv130' | 'dv140' | 'dv200';

const remainingFlFormOptions: Array<{ key: RemainingFlFormKey; formNumber: string; title: string; note: string }> = [
  { key: 'fl165', formNumber: 'FL-165', title: 'Request to Enter Default', note: 'Core default request fields, selected options, and signature.' },
  { key: 'fl182', formNumber: 'FL-182', title: 'Judgment Checklist', note: 'Core checklist attachment option and notes.' },
  { key: 'fl191', formNumber: 'FL-191', title: 'Child Support Case Registry', note: 'Basic support case registry/caption fields and order amount.' },
  { key: 'fl195', formNumber: 'FL-195', title: 'Income Withholding for Support', note: 'Basic withholding amount/date, employee/obligee names, and children.' },
  { key: 'fl272', formNumber: 'FL-272', title: 'Notice of Rights and Responsibilities', note: 'Core hearing/service dates and party selection.' },
  { key: 'fl342a', formNumber: 'FL-342(A)', title: 'Non-Guideline Child Support Findings', note: 'Basic attachment selection, amount, date, and findings text.' },
  { key: 'fl346', formNumber: 'FL-346', title: 'Attorney Fees and Costs Order', note: 'Core amount/date/order summary.' },
  { key: 'fl347', formNumber: 'FL-347', title: 'Bifurcation of Status Attachment', note: 'Basic bifurcation order options and date.' },
  { key: 'fl435', formNumber: 'FL-435', title: 'Earnings Assignment Order', note: 'Basic assignment amount/date and party names.' },
  { key: 'fl460', formNumber: 'FL-460', title: 'Qualified Domestic Relations Order', note: 'Basic retirement/order details.' },
  { key: 'fl830', formNumber: 'FL-830', title: 'Joint Petition service/mailing form', note: 'Core mailing date/place and caption.' },
  { key: 'fw001', formNumber: 'FW-001', title: 'Request to Waive Court Fees', note: 'Fee waiver request; add income/benefits/household details before filing.' },
  { key: 'fw003', formNumber: 'FW-003', title: 'Order on Court Fee Waiver', note: 'Proposed/order form usually completed by the court, included for complete packet review.' },
  { key: 'fw010', formNumber: 'FW-010', title: 'Notice of Improved Financial Situation', note: 'Post-waiver notice for improved finances or settlement recovery.' },
];

const dvFormOptions: Array<{ key: DvFormKey; formNumber: string; title: string; note: string }> = [
  { key: 'dv100', formNumber: 'DV-100', title: 'Request for Domestic Violence Restraining Order', note: 'Core protected/restrained parties, relationship, and requested relief text.' },
  { key: 'dv101', formNumber: 'DV-101', title: 'Description of Abuse', note: 'Core incident/request summary only; not a full abuse narrative automation.' },
  { key: 'dv105', formNumber: 'DV-105', title: 'Request for Child Custody and Visitation Orders', note: 'Core child names and custody/visitation request text.' },
  { key: 'dv108', formNumber: 'DV-108', title: 'Request for Order: No Travel With Children', note: 'Core child/travel restriction request text.' },
  { key: 'dv109', formNumber: 'DV-109', title: 'Notice of Court Hearing', note: 'Core hearing date/time/department/room and service notes.' },
  { key: 'dv110', formNumber: 'DV-110', title: 'Temporary Restraining Order', note: 'Core temporary order fields and hearing information.' },
  { key: 'dv120', formNumber: 'DV-120', title: 'Response to Request for DVRO', note: 'Core response text and signature fields.' },
  { key: 'dv130', formNumber: 'DV-130', title: 'Restraining Order After Hearing', note: 'Core final order text, protected people, and expiration/hearing fields.' },
  { key: 'dv140', formNumber: 'DV-140', title: 'Child Custody and Visitation Order', note: 'Core child custody/visitation order text.' },
  { key: 'dv200', formNumber: 'DV-200', title: 'Proof of Personal Service', note: 'Core service date/time/server and served forms notes.' },
];

const packetPresetOptions: Array<{ id: DraftPacketPresetId; description: string; forms: string }> = [
  { id: 'start_divorce', description: 'Initial petition/summons packet; keeps service and later-stage forms off.', forms: 'FL-100, FL-110, FL-105 if children' },
  { id: 'respond_divorce', description: 'Respondent-side response packet with response fields enabled.', forms: 'FL-120 plus shared caption/family facts' },
  { id: 'default_uncontested_judgment', description: 'Core judgment packet for default or uncontested workflows.', forms: 'FL-165, FL-170, FL-180, FL-190, FL-130/144/345' },
  { id: 'rfo_support_fees', description: 'Request for temporary support and attorney-fee/cost orders.', forms: 'FL-300, FL-150, FL-319, FL-342/343' },
  { id: 'dvro', description: 'Domestic violence restraining order request packet.', forms: 'DV-100/101/109/110/200, child DV forms if children' },
];

function getRemainingFlReadinessIssues(section: DraftFormsWorkspace[RemainingFlFormKey], formNumber: string) {
  const issues: string[] = [];
  if (!section.includeForm.value) return issues;
  if (!section.details.value.trim() && !section.amount.value.trim() && !section.date.value.trim()) {
    issues.push(`${formNumber}: add at least one amount, date, or details entry before generating`);
  }
  if (!section.printedName.value.trim() && !section.signatureDate.value.trim()) {
    issues.push(`${formNumber}: printed name/signature date not set; generated signature block may be blank`);
  }
  return issues;
}

function getDvReadinessIssues(section: DraftFormsWorkspace[DvFormKey], formNumber: string) {
  const issues: string[] = [];
  if (!section.includeForm.value) return issues;
  if (!section.protectedPartyName.value.trim()) issues.push(`${formNumber}: protected party name is required`);
  if (!section.restrainedPartyName.value.trim()) issues.push(`${formNumber}: restrained party name is required`);
  if (['DV-109', 'DV-110', 'DV-130'].includes(formNumber) && !section.hearingDate.value.trim()) issues.push(`${formNumber}: hearing/order date is required for this core draft`);
  if (formNumber === 'DV-200' && !section.serviceDate.value.trim()) issues.push('DV-200: service date is required');
  if (!section.requestSummary.value.trim() && !section.orderSummary.value.trim() && !section.responseSummary.value.trim() && !section.serviceDate.value.trim()) {
    issues.push(`${formNumber}: add request/order/response/service details before generating`);
  }
  return issues;
}

function getGeneratedChildAttachmentPageCount(extraChildrenCount: number) {
  if (extraChildrenCount <= 0) return 0;
  return Math.ceil(extraChildrenCount / GENERATED_CHILD_ATTACHMENT_ENTRIES_PER_PAGE);
}

function FieldSourceBadge({ field }: { field: DraftField<unknown> }) {
  if (!field.sourceType) {
    return <Badge variant="secondary">Needs source</Badge>;
  }

  const confidenceTone = field.confidence === 'high'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200'
    : field.confidence === 'medium'
      ? 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200'
      : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200';

  return (
    <Badge className={`border ${confidenceTone}`} variant="outline">
      {field.sourceType} · {field.confidence ?? 'review'}
    </Badge>
  );
}

function FieldHeader({ label, field }: { label: string; field: DraftField<unknown> }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <Label className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</Label>
      <FieldSourceBadge field={field} />
      {field.needsReview && (
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
          Needs review
        </Badge>
      )}
    </div>
  );
}

function CompactFact({
  label,
  value,
  field,
  inputType = 'text',
  placeholder,
  options,
  readOnly = false,
  onChange,
}: {
  label: string;
  value: string;
  field?: DraftField<unknown>;
  inputType?: 'text' | 'date' | 'select';
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
        {field && <FieldSourceBadge field={field} />}
      </div>
      {readOnly || !onChange ? (
        <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">{value || 'Missing'}</p>
      ) : inputType === 'select' ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 ring-offset-background focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
        >
          {options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : (
        <Input
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder ?? 'Missing'}
          className="mt-2 bg-white text-sm font-medium dark:bg-slate-950"
        />
      )}
    </div>
  );
}

interface IntakeReviewFact {
  path: string[];
  label: string;
  value: string;
  field: DraftField<unknown>;
}

function isDraftField(value: unknown): value is DraftField<unknown> {
  return Boolean(value && typeof value === 'object' && 'value' in value);
}

function humanizePathPart(part: string) {
  return part
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/fl(\d+)/gi, 'FL-$1')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatIntakeValue(value: unknown) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '';
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function shouldShowIntakeReviewFact(field: DraftField<unknown>) {
  const displayValue = formatIntakeValue(field.value);
  const sourceLabel = field.sourceLabel ?? '';
  const isSystemScaffold = /^(Default|Preset|Cleared in Intake Review)/i.test(sourceLabel);
  const isImportedSource = field.sourceType === 'chat'
    || field.sourceType === 'upload'
    || field.sourceType === 'profile'
    || field.sourceType === 'support-snapshot';

  if (!displayValue) return false;
  if (isImportedSource) return true;
  if (field.sourceType === 'manual' && !isSystemScaffold && field.needsReview) return true;
  return false;
}

function collectIntakeReviewFacts(value: unknown, path: string[] = []): IntakeReviewFact[] {
  if (isDraftField(value)) {
    if (!shouldShowIntakeReviewFact(value)) return [];
    const displayValue = formatIntakeValue(value.value);
    return [{
      path,
      label: path.map(humanizePathPart).join(' › '),
      value: displayValue,
      field: value,
    }];
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];

  return Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !['id', 'userId', 'createdAt', 'updatedAt', 'status', 'packetType'].includes(key))
    .flatMap(([key, child]) => collectIntakeReviewFacts(child, [...path, key]));
}

function isPathActiveForIntakeReview(path: string[], workspace: DraftFormsWorkspace) {
  const section = path[0];
  if (!section) return true;

  const includedSectionMap: Partial<Record<keyof DraftFormsWorkspace, boolean>> = {
    fl100: workspace.fl100.includeForm.value,
    fl300: workspace.fl300.includeForm.value,
    fl150: workspace.fl150.includeForm.value,
    fl140: workspace.fl140.includeForm.value,
    fl141: workspace.fl141.includeForm.value,
    fl142: workspace.fl142.includeForm.value,
    fl115: workspace.fl115.includeForm.value,
    fl117: workspace.fl117.includeForm.value,
    fl120: workspace.fl120.includeForm.value,
    fl160: workspace.fl160.includeForm.value,
    fl342: workspace.fl342.includeForm.value,
    fl343: workspace.fl343.includeForm.value,
    fl130: workspace.fl130.includeForm.value,
    fl144: workspace.fl144.includeForm.value,
    fl170: workspace.fl170.includeForm.value,
    fl180: workspace.fl180.includeForm.value,
    fl190: workspace.fl190.includeForm.value,
    fl345: workspace.fl345.includeForm.value,
    fl348: workspace.fl348.includeForm.value,
    fl165: workspace.fl165.includeForm.value,
    fl182: workspace.fl182.includeForm.value,
    fl191: workspace.fl191.includeForm.value,
    fl195: workspace.fl195.includeForm.value,
    fl272: workspace.fl272.includeForm.value,
    fl342a: workspace.fl342a.includeForm.value,
    fl346: workspace.fl346.includeForm.value,
    fl347: workspace.fl347.includeForm.value,
    fl435: workspace.fl435.includeForm.value,
    fl460: workspace.fl460.includeForm.value,
    fl830: workspace.fl830.includeForm.value,
    fw001: workspace.fw001.includeForm.value,
    fw003: workspace.fw003.includeForm.value,
    fw010: workspace.fw010.includeForm.value,
    dv100: workspace.dv100.includeForm.value,
    dv101: workspace.dv101.includeForm.value,
    dv105: workspace.dv105.includeForm.value,
    dv108: workspace.dv108.includeForm.value,
    dv109: workspace.dv109.includeForm.value,
    dv110: workspace.dv110.includeForm.value,
    dv120: workspace.dv120.includeForm.value,
    dv130: workspace.dv130.includeForm.value,
    dv140: workspace.dv140.includeForm.value,
    dv200: workspace.dv200.includeForm.value,
  };

  if (section === 'fl105') return workspace.hasMinorChildren.value;
  if (section === 'children') {
    return workspace.hasMinorChildren.value
      || workspace.dv105.includeForm.value
      || workspace.dv108.includeForm.value
      || workspace.dv140.includeForm.value;
  }

  if (section in includedSectionMap) return Boolean(includedSectionMap[section as keyof DraftFormsWorkspace]);
  return true;
}

function updateFieldAtPath(workspace: DraftFormsWorkspace, path: string[], updater: (field: DraftField<unknown>) => DraftField<unknown>) {
  const next = structuredClone(workspace) as DraftFormsWorkspace;
  let cursor: Record<string, unknown> = next as unknown as Record<string, unknown>;
  for (const part of path.slice(0, -1)) {
    const child = cursor[part];
    if (!child || typeof child !== 'object') return workspace;
    cursor = child as Record<string, unknown>;
  }
  const key = path[path.length - 1];
  const field = cursor[key];
  if (!isDraftField(field)) return workspace;
  cursor[key] = updater(field);
  return next;
}

function applyStagedIntakeFact(workspace: DraftFormsWorkspace, fact: DraftIntakeFact) {
  const next = updateFieldAtPath(workspace, fact.path, (field) => ({
    ...field,
    value: fact.value,
    sourceType: fact.sourceType,
    sourceLabel: fact.sourceLabel,
    confidence: fact.confidence,
    needsReview: true,
  })) as DraftFormsWorkspace;

  return {
    ...next,
    intake: {
      ...next.intake,
      extractedFacts: (next.intake.extractedFacts ?? []).map((candidate) => (
        candidate.id === fact.id ? { ...candidate, status: 'applied' as const } : candidate
      )),
    },
  };
}

function dismissStagedIntakeFact(workspace: DraftFormsWorkspace, factId: string) {
  return {
    ...workspace,
    intake: {
      ...workspace.intake,
      extractedFacts: (workspace.intake.extractedFacts ?? []).map((candidate) => (
        candidate.id === factId ? { ...candidate, status: 'dismissed' as const } : candidate
      )),
    },
  };
}

function clearDraftFieldValue(field: DraftField<unknown>): DraftField<unknown> {
  const value = field.value;
  return {
    ...field,
    value: typeof value === 'boolean' ? false : Array.isArray(value) ? [] : '',
    sourceType: 'manual',
    sourceLabel: 'Cleared in Intake Review',
    confidence: 'high',
    needsReview: false,
  };
}

function FormStatusBadge({ status }: { status: 'Ready' | 'Needs review' | 'Not selected' | 'Optional' }) {
  const className = status === 'Ready'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200'
    : status === 'Needs review'
      ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200'
      : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300';

  return <Badge variant="outline" className={cn('rounded-full border', className)}>{status}</Badge>;
}

function ScopeToggle({
  title,
  description,
  checked,
  field,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  field?: DraftField<unknown>;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className={cn(
      'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition',
      checked
        ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-400/10'
        : 'border-slate-200/80 bg-white/70 hover:border-emerald-200 dark:border-white/10 dark:bg-white/5',
    )}>
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {title}
          {field && <FieldSourceBadge field={field} />}
        </span>
        <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</span>
      </span>
    </label>
  );
}

export function DraftFormsPage() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<DraftFormsWorkspace | null>(null);
  const [isGeneratingPacket, setIsGeneratingPacket] = useState(false);
  const [generatedPacketName, setGeneratedPacketName] = useState<string | null>(null);
  const [packetError, setPacketError] = useState<string | null>(null);
  const [packetReadinessOverride, setPacketReadinessOverride] = useState(false);
  const [formMode, setFormMode] = useState<'simple' | 'advanced'>('simple');
  const [simplePanelsOpen, setSimplePanelsOpen] = useState({ handoff: false, fl300: false, fl150: false });
  const [chatPickerOpen, setChatPickerOpen] = useState(false);
  const [chatPickerLoading, setChatPickerLoading] = useState(false);
  const [chatPickerSessions, setChatPickerSessions] = useState<ChatSession[]>([]);
  const [selectedChatMessageIds, setSelectedChatMessageIds] = useState<Set<string>>(new Set());
  const [editingIntakeFactKey, setEditingIntakeFactKey] = useState<string | null>(null);
  const [editingIntakeFactValue, setEditingIntakeFactValue] = useState('');
  const [editingPendingFactId, setEditingPendingFactId] = useState<string | null>(null);
  const [editingPendingFactValue, setEditingPendingFactValue] = useState('');
  const [requiresAuth, setRequiresAuth] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      const user = authService.getCurrentUser();
      if (cancelled) return;
      setCurrentUser(user);

      if (!user) {
        setRequiresAuth(true);
        return;
      }

      setRequiresAuth(false);

      await syncDraftWorkspacesFromServer(user.id).catch((error) => {
        console.error('Failed to sync Draft Forms workspaces from server.', error);
      });

      const getLatestHandoff = async () => {
        const cached = getLatestDraftFormsChatHandoff(user.id);
        if (cached) {
          return { id: cached.sessionId, messages: cached.messages };
        }

        try {
          const sessions = await authService.getChatSessions(user.id);
          const latest = sessions[0] ?? null;
          return latest ? { id: latest.id, messages: latest.messages } : null;
        } catch (error) {
          console.error('Failed to load latest Maria chat for Draft Forms handoff.', error);
          return null;
        }
      };

      const getLatestSupportScenario = async () => {
        try {
          const scenarios = await getSupportScenarios(user.id);
          return scenarios[0] ?? null;
        } catch (error) {
          console.error('Failed to load support estimator snapshots for Draft Forms handoff.', error);
          return null;
        }
      };

      if (workspaceId) {
        const existing = getDraftWorkspace(workspaceId);
        if (existing?.userId === user.id) {
          const latestSupportScenario = await getLatestSupportScenario();
          const withSupportSnapshot = latestSupportScenario
            ? hydrateDraftWorkspaceFromSupportScenario(existing, latestSupportScenario)
            : existing;
          const hasCapturedIntake = Boolean(withSupportSnapshot.intake.userRequest?.trim() || withSupportSnapshot.intake.mariaSummary?.trim());
          if (!hasCapturedIntake) {
            const latestSession = await getLatestHandoff();
            if (latestSession) {
              const hydrated = saveDraftWorkspace(hydrateDraftWorkspaceFromChatContext(withSupportSnapshot, latestSession.messages, latestSession.id));
              if (!cancelled) setWorkspace(hydrated);
              return;
            }
          }

          const saved = latestSupportScenario ? saveDraftWorkspace(withSupportSnapshot) : withSupportSnapshot;
          if (!cancelled) setWorkspace(saved);
          return;
        }
      }

      if (initializedRef.current) return;
      initializedRef.current = true;

      const latestSavedDraft = listDraftWorkspaces(user.id)[0] ?? null;
      if (latestSavedDraft) {
        navigate(`/draft-forms/${latestSavedDraft.id}`, { replace: true });
        return;
      }

      const latestSession = await getLatestHandoff();
      const latestSupportScenario = await getLatestSupportScenario();
      const createdBase = createStarterPacketWorkspace({
        user,
        messages: latestSession?.messages ?? [],
        sourceSessionId: latestSession?.id,
      });
      const created = latestSupportScenario
        ? saveDraftWorkspace(hydrateDraftWorkspaceFromSupportScenario(createdBase, latestSupportScenario))
        : createdBase;
      if (cancelled) return;
      setWorkspace(created);
      navigate(`/draft-forms/${created.id}`, { replace: true });
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, navigate]);

  const commitWorkspace = (updater: (current: DraftFormsWorkspace) => DraftFormsWorkspace) => {
    setWorkspace((current) => {
      if (!current) return current;
      return saveDraftWorkspace(updater(current));
    });
  };

  const updateFl105 = (updater: (fl105: DraftFormsWorkspace['fl105']) => DraftFormsWorkspace['fl105']) => {
    commitWorkspace((current) => ({ ...current, fl105: updater(current.fl105) }));
  };

  const updateFl110 = (updater: (fl110: DraftFormsWorkspace['fl110']) => DraftFormsWorkspace['fl110']) => {
    commitWorkspace((current) => ({ ...current, fl110: updater(current.fl110) }));
  };

  const updateFl300 = (updater: (fl300: DraftFormsWorkspace['fl300']) => DraftFormsWorkspace['fl300']) => {
    commitWorkspace((current) => ({ ...current, fl300: updater(current.fl300) }));
  };

  const updateFl140 = (updater: (fl140: DraftFormsWorkspace['fl140']) => DraftFormsWorkspace['fl140']) => {
    commitWorkspace((current) => ({ ...current, fl140: updater(current.fl140) }));
  };

  const updateFl141 = (updater: (fl141: DraftFormsWorkspace['fl141']) => DraftFormsWorkspace['fl141']) => {
    commitWorkspace((current) => ({ ...current, fl141: updater(current.fl141) }));
  };

  const updateFl142 = (updater: (fl142: DraftFormsWorkspace['fl142']) => DraftFormsWorkspace['fl142']) => {
    commitWorkspace((current) => ({ ...current, fl142: updater(current.fl142) }));
  };

  const updateFl115 = (updater: (fl115: DraftFormsWorkspace['fl115']) => DraftFormsWorkspace['fl115']) => {
    commitWorkspace((current) => ({ ...current, fl115: updater(current.fl115) }));
  };

  const updateFl117 = (updater: (fl117: DraftFormsWorkspace['fl117']) => DraftFormsWorkspace['fl117']) => {
    commitWorkspace((current) => ({ ...current, fl117: updater(current.fl117) }));
  };

  const updateFl120 = (updater: (fl120: DraftFormsWorkspace['fl120']) => DraftFormsWorkspace['fl120']) => {
    commitWorkspace((current) => ({ ...current, fl120: updater(current.fl120) }));
  };

  const updateFl160 = (updater: (fl160: DraftFormsWorkspace['fl160']) => DraftFormsWorkspace['fl160']) => {
    commitWorkspace((current) => ({ ...current, fl160: updater(current.fl160) }));
  };

  const updateFl342 = (updater: (fl342: DraftFormsWorkspace['fl342']) => DraftFormsWorkspace['fl342']) => {
    commitWorkspace((current) => ({ ...current, fl342: updater(current.fl342) }));
  };

  const updateFl343 = (updater: (fl343: DraftFormsWorkspace['fl343']) => DraftFormsWorkspace['fl343']) => {
    commitWorkspace((current) => ({ ...current, fl343: updater(current.fl343) }));
  };

  const updateFl130 = (updater: (fl130: DraftFormsWorkspace['fl130']) => DraftFormsWorkspace['fl130']) => {
    commitWorkspace((current) => ({ ...current, fl130: updater(current.fl130) }));
  };

  const updateFl144 = (updater: (fl144: DraftFormsWorkspace['fl144']) => DraftFormsWorkspace['fl144']) => {
    commitWorkspace((current) => ({ ...current, fl144: updater(current.fl144) }));
  };

  const updateFl170 = (updater: (fl170: DraftFormsWorkspace['fl170']) => DraftFormsWorkspace['fl170']) => {
    commitWorkspace((current) => ({ ...current, fl170: updater(current.fl170) }));
  };

  const updateFl180 = (updater: (fl180: DraftFormsWorkspace['fl180']) => DraftFormsWorkspace['fl180']) => {
    commitWorkspace((current) => ({ ...current, fl180: updater(current.fl180) }));
  };

  const updateFl190 = (updater: (fl190: DraftFormsWorkspace['fl190']) => DraftFormsWorkspace['fl190']) => {
    commitWorkspace((current) => ({ ...current, fl190: updater(current.fl190) }));
  };

  const updateFl345 = (updater: (fl345: DraftFormsWorkspace['fl345']) => DraftFormsWorkspace['fl345']) => {
    commitWorkspace((current) => ({ ...current, fl345: updater(current.fl345) }));
  };

  const updateFl348 = (updater: (fl348: DraftFormsWorkspace['fl348']) => DraftFormsWorkspace['fl348']) => {
    commitWorkspace((current) => ({ ...current, fl348: updater(current.fl348) }));
  };

  const updateRemainingFlForm = (key: RemainingFlFormKey, updater: (section: DraftFormsWorkspace[RemainingFlFormKey]) => DraftFormsWorkspace[RemainingFlFormKey]) => {
    commitWorkspace((current) => ({ ...current, [key]: updater(current[key]) } as DraftFormsWorkspace));
  };

  const updateDvForm = (key: DvFormKey, updater: (section: DraftFormsWorkspace[DvFormKey]) => DraftFormsWorkspace[DvFormKey]) => {
    commitWorkspace((current) => ({ ...current, [key]: updater(current[key]) } as DraftFormsWorkspace));
  };

  const updateFl150 = (updater: (fl150: DraftFormsWorkspace['fl150']) => DraftFormsWorkspace['fl150']) => {
    commitWorkspace((current) => ({ ...current, fl150: updater(current.fl150) }));
  };

  const updateFl100 = (updater: (fl100: DraftFormsWorkspace['fl100']) => DraftFormsWorkspace['fl100']) => {
    commitWorkspace((current) => ({ ...current, fl100: updater(current.fl100) }));
  };

  const selectedChatMessages = useMemo(() => {
    const selected = chatPickerSessions.flatMap((session) => session.messages.filter((message) => selectedChatMessageIds.has(message.id)));
    return selected.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [chatPickerSessions, selectedChatMessageIds]);

  const loadMariaChatPicker = async () => {
    if (!currentUser) return;
    setChatPickerOpen(true);
    if (chatPickerSessions.length > 0) return;

    setChatPickerLoading(true);
    try {
      const sessions = await authService.getChatSessions(currentUser.id);
      setChatPickerSessions(sessions);
      const currentSourceIds = new Set((workspace?.sourceSessionId ? sessions.find((session) => session.id === workspace.sourceSessionId)?.messages : sessions[0]?.messages ?? [])?.map((message) => message.id) ?? []);
      setSelectedChatMessageIds(currentSourceIds);
    } catch (error) {
      console.error('Failed to load Maria chats for Draft Forms picker.', error);
      toast.error('Unable to load Maria chats for editing.');
    } finally {
      setChatPickerLoading(false);
    }
  };

  const toggleChatMessageSelection = (messageId: string) => {
    setSelectedChatMessageIds((current) => {
      const next = new Set(current);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  const applySelectedChatHandoff = () => {
    if (!workspace) return;
    if (selectedChatMessages.length === 0) {
      toast.message('Pick at least one Maria chat message first.');
      return;
    }

    const sourceSessionIds = new Set(chatPickerSessions
      .filter((session) => session.messages.some((message) => selectedChatMessageIds.has(message.id)))
      .map((session) => session.id));
    const sourceSessionId = sourceSessionIds.size === 1 ? Array.from(sourceSessionIds)[0] : undefined;
    const saved = saveDraftWorkspace(replaceDraftWorkspaceChatHandoff(workspace, selectedChatMessages, sourceSessionId));
    setWorkspace(saved);
    setChatPickerOpen(false);
    setSimplePanelsOpen((current) => ({ ...current, handoff: true }));
    toast.success(`Updated Draft Forms from ${selectedChatMessages.length} selected Maria message${selectedChatMessages.length === 1 ? '' : 's'}.`);
  };

  const updateFl341B = (updater: (fl341b: DraftFormsWorkspace['fl100']['childCustodyVisitation']['fl341']['fl341b']) => DraftFormsWorkspace['fl100']['childCustodyVisitation']['fl341']['fl341b']) => {
    updateFl100((fl100) => ({
      ...fl100,
      childCustodyVisitation: {
        ...fl100.childCustodyVisitation,
        fl341: {
          ...fl100.childCustodyVisitation.fl341,
          fl341b: updater(fl100.childCustodyVisitation.fl341.fl341b),
        },
      },
    }));
  };

  const missingItems = useMemo(() => {
    if (!workspace) return [] as string[];
    const missing: string[] = [];
    const fl100Included = workspace.fl100.includeForm.value;
    const proceedingType = workspace.fl100.proceedingType.value;
    const isDissolutionProceeding = proceedingType === 'dissolution';
    const isNullityProceeding = proceedingType === 'nullity';
    const isMarriageRelationship = workspace.fl100.relationshipType.value === 'marriage'
      || workspace.fl100.relationshipType.value === 'both';
    const isDomesticPartnershipRelationship = workspace.fl100.relationshipType.value === 'domestic_partnership'
      || workspace.fl100.relationshipType.value === 'both';
    const petitionerCaliforniaMonths = workspace.fl100.residency.petitionerCaliforniaMonths.value;
    const petitionerCountyMonths = workspace.fl100.residency.petitionerCountyMonths.value;
    const respondentCaliforniaMonths = workspace.fl100.residency.respondentCaliforniaMonths.value;
    const respondentCountyMonths = workspace.fl100.residency.respondentCountyMonths.value;
    const petitionerResidenceLocation = workspace.fl100.residency.petitionerResidenceLocation.value.trim();
    const respondentResidenceLocation = workspace.fl100.residency.respondentResidenceLocation.value.trim();
    const petitionerCaliforniaProvided = petitionerCaliforniaMonths.trim().length > 0;
    const petitionerCountyProvided = petitionerCountyMonths.trim().length > 0;
    const respondentCaliforniaProvided = respondentCaliforniaMonths.trim().length > 0;
    const respondentCountyProvided = respondentCountyMonths.trim().length > 0;
    const petitionerPairProvided = petitionerCaliforniaProvided && petitionerCountyProvided;
    const respondentPairProvided = respondentCaliforniaProvided && respondentCountyProvided;
    const petitionerQualifies = qualifiesForResidency(petitionerCaliforniaMonths, petitionerCountyMonths);
    const respondentQualifies = qualifiesForResidency(respondentCaliforniaMonths, respondentCountyMonths);
    const domesticPartnershipRegistrationDate = workspace.fl100.domesticPartnership.registrationDate.value.trim();
    const domesticPartnershipSeparationDate = workspace.fl100.domesticPartnership.partnerSeparationDate.value.trim();
    const hasDomesticPartnershipResidencyException = isDomesticPartnershipRelationship
      && workspace.fl100.domesticPartnership.establishment.value === 'not_established_in_california'
      && workspace.fl100.domesticPartnership.californiaResidencyException.value;
    const hasSameSexMarriageJurisdictionException = isMarriageRelationship
      && workspace.fl100.domesticPartnership.sameSexMarriageJurisdictionException.value;
    const hasJurisdictionException = hasDomesticPartnershipResidencyException || hasSameSexMarriageJurisdictionException;
    const hasNullityBasis = [
      workspace.fl100.nullity.basedOnIncest.value,
      workspace.fl100.nullity.basedOnBigamy.value,
      workspace.fl100.nullity.basedOnAge.value,
      workspace.fl100.nullity.basedOnPriorExistingMarriageOrPartnership.value,
      workspace.fl100.nullity.basedOnUnsoundMind.value,
      workspace.fl100.nullity.basedOnFraud.value,
      workspace.fl100.nullity.basedOnForce.value,
      workspace.fl100.nullity.basedOnPhysicalIncapacity.value,
    ].some(Boolean);

    if (!workspace.filingCounty.value.trim()) missing.push('Filing county');
    if (!workspace.petitionerName.value.trim()) missing.push('Petitioner name');
    if (!workspace.respondentName.value.trim()) missing.push('Respondent name');
    if (fl100Included && isMarriageRelationship && !workspace.marriageDate.value.trim()) missing.push('Date of marriage');
    if (fl100Included && isDissolutionProceeding) {
      if (petitionerCaliforniaProvided !== petitionerCountyProvided) {
        missing.push('Complete petitioner residency pair (California + filing county months)');
      }
      if (petitionerPairProvided && !petitionerResidenceLocation) {
        missing.push('Petitioner residence location for FL-100 item 2');
      }
      if (respondentCaliforniaProvided !== respondentCountyProvided) {
        missing.push('Complete respondent residency pair (California + filing county months)');
      }
      if (respondentPairProvided && !respondentResidenceLocation) {
        missing.push('Respondent residence location for FL-100 item 2');
      }

      if (!petitionerPairProvided && !respondentPairProvided && !hasJurisdictionException) {
        missing.push('Dissolution residency path (qualifying spouse months or jurisdiction exception)');
      } else if (!petitionerQualifies && !respondentQualifies && !hasJurisdictionException) {
        missing.push('Dissolution residency qualification (6 months CA + 3 months county for either spouse)');
      }
    }
    if (fl100Included && !isNullityProceeding && !workspace.fl100.legalGrounds.irreconcilableDifferences.value && !workspace.fl100.legalGrounds.permanentLegalIncapacity.value) {
      missing.push('At least one legal ground for FL-100');
    }
    if (fl100Included && isNullityProceeding && !hasNullityBasis) {
      missing.push('At least one nullity basis');
    }
    if (fl100Included && isDomesticPartnershipRelationship && workspace.fl100.domesticPartnership.establishment.value === 'unspecified') {
      missing.push('Domestic partnership establishment in California');
    }
    if (fl100Included && isDomesticPartnershipRelationship && !domesticPartnershipRegistrationDate) {
      missing.push('Domestic partnership registration date');
    }
    if (fl100Included && isDomesticPartnershipRelationship && !domesticPartnershipSeparationDate) {
      missing.push('Domestic partnership date of separation');
    }
    if (fl100Included && workspace.requests.restoreFormerName.value && !workspace.fl100.formerName.value.trim()) {
      missing.push('Former name to restore');
    }
    const communityWhereListed = workspace.fl100.propertyDeclarations.communityAndQuasiCommunityWhereListed.value;
    const separateWhereListed = workspace.fl100.propertyDeclarations.separatePropertyWhereListed.value;
    const communityPropertyDetails = workspace.fl100.propertyDeclarations.communityAndQuasiCommunityDetails.value.trim();
    const separatePropertyDetails = workspace.fl100.propertyDeclarations.separatePropertyDetails.value.trim();
    const separatePropertyAwardedTo = workspace.fl100.propertyDeclarations.separatePropertyAwardedTo.value.trim();
    const separateInlineEntries = splitNonEmptyLines(workspace.fl100.propertyDeclarations.separatePropertyDetails.value);
    if (fl100Included && workspace.fl100.propertyDeclarations.communityAndQuasiCommunity.value) {
      if (communityWhereListed === 'unspecified') {
        missing.push('Community/quasi-community property list location');
      }
      if (communityWhereListed === 'inline_list' && !workspace.fl100.propertyDeclarations.communityAndQuasiCommunityDetails.value.trim()) {
        missing.push('Community / quasi-community inline property list');
      }
      if (communityWhereListed === 'attachment' && !communityPropertyDetails) {
        missing.push('Community / quasi-community attachment 10b details');
      }
    }
    if (fl100Included && workspace.fl100.propertyDeclarations.separateProperty.value) {
      if (separateWhereListed === 'unspecified') {
        missing.push('Separate property list location');
      }
      if (separateWhereListed === 'attachment' && !separatePropertyDetails) {
        missing.push('Separate property attachment 9b details');
      }
      if (separateWhereListed === 'attachment' && !separatePropertyAwardedTo) {
        missing.push('Who separate property should be confirmed to (attachment 9b)');
      }
      if (separateWhereListed === 'inline_list' && separateInlineEntries.length === 0) {
        missing.push('Separate property inline list entries');
      }
      if (
        separateWhereListed === 'inline_list'
        && separateInlineEntries.length > FL100_SEPARATE_PROPERTY_VISIBLE_ROWS
      ) {
        missing.push(
          `Separate property inline rows exceed FL-100 capacity (${separateInlineEntries.length} entered, ${FL100_SEPARATE_PROPERTY_VISIBLE_ROWS} visible). Use FL-160 or attachment 9b.`,
        );
      }
      if (
        separateWhereListed === 'inline_list'
        && !workspace.fl100.propertyDeclarations.separatePropertyAwardedTo.value.trim()
      ) {
        missing.push('Who separate property should be confirmed to (inline list)');
      }
    }

    const spousalSupportDirection = workspace.fl100.spousalSupport.supportOrderDirection.value;
    const spousalSupportReserve = workspace.fl100.spousalSupport.reserveJurisdictionFor.value;
    const spousalSupportDetails = workspace.fl100.spousalSupport.details.value.trim();
    if (
      fl100Included
      && workspace.requests.spousalSupport.value
      && spousalSupportDirection === 'none'
      && spousalSupportReserve === 'none'
      && !spousalSupportDetails
    ) {
      missing.push('Spousal support direction or details');
    }
    if (fl100Included && workspace.fl100.childSupport.requestAdditionalOrders.value && !workspace.fl100.childSupport.additionalOrdersDetails.value.trim()) {
      missing.push('Additional child support order details');
    }
    if (
      fl100Included
      && workspace.requests.childCustody.value
      && workspace.fl100.childCustodyVisitation.legalCustodyTo.value === 'none'
      && workspace.fl100.childCustodyVisitation.physicalCustodyTo.value === 'none'
    ) {
      missing.push('Legal or physical custody direction');
    }
    if (fl100Included && workspace.requests.visitation.value && workspace.fl100.childCustodyVisitation.visitationTo.value === 'none') {
      missing.push('Visitation direction');
    }
    const fl311RelevantRequest = workspace.fl100.childCustodyVisitation.attachments.formFl311.value && (
      workspace.requests.childCustody.value
      || workspace.requests.visitation.value
      || workspace.fl100.childCustodyVisitation.legalCustodyTo.value !== 'none'
      || workspace.fl100.childCustodyVisitation.physicalCustodyTo.value !== 'none'
      || workspace.fl100.childCustodyVisitation.visitationTo.value !== 'none'
    );
    if (fl100Included && fl311RelevantRequest) {
      if (!workspace.hasMinorChildren.value) {
        missing.push('Enable minor children before generating FL-311');
      }
      if (workspace.children.length > FL105_FORM_CAPACITY.childrenRows) {
        missing.push(`FL-311 v1 currently supports only ${FL105_FORM_CAPACITY.childrenRows} child rows`);
      }
      if (workspace.fl100.childCustodyVisitation.visitationTo.value !== 'none') {
        if (workspace.fl100.childCustodyVisitation.fl311.visitationPlanMode.value === 'unspecified') {
          missing.push('Choose FL-311 visitation plan mode');
        }
        if (
          workspace.fl100.childCustodyVisitation.fl311.visitationPlanMode.value === 'attachment_on_file'
          && !workspace.fl100.childCustodyVisitation.fl311.visitationAttachmentPageCount.value.trim()
        ) {
          missing.push('FL-311 attached visitation-plan page count');
        }
        if (
          workspace.fl100.childCustodyVisitation.fl311.visitationPlanMode.value === 'attachment_on_file'
          && !workspace.fl100.childCustodyVisitation.fl311.visitationAttachmentDate.value.trim()
        ) {
          missing.push('FL-311 attached visitation-plan date');
        }
      }
    }
    const fl312RelevantRequest = workspace.fl100.childCustodyVisitation.attachments.formFl312.value && (
      workspace.requests.childCustody.value
      || workspace.requests.visitation.value
      || workspace.fl100.childCustodyVisitation.legalCustodyTo.value !== 'none'
      || workspace.fl100.childCustodyVisitation.physicalCustodyTo.value !== 'none'
      || workspace.fl100.childCustodyVisitation.visitationTo.value !== 'none'
    );
    if (fl100Included && fl312RelevantRequest) {
      const fl312 = workspace.fl100.childCustodyVisitation.fl312;
      const hasAbductionBy = fl312.abductionBy.petitioner.value || fl312.abductionBy.respondent.value || fl312.abductionBy.otherParentParty.value;
      const hasRiskInItem3 = fl312.riskDestinations.anotherCaliforniaCounty.value || fl312.riskDestinations.anotherState.value || fl312.riskDestinations.foreignCountry.value;
      const hasRiskInItem4 = fl312.riskFactors.custodyOrderViolationThreat.value
        || fl312.riskFactors.weakCaliforniaTies.value
        || fl312.riskFactors.recentAbductionPlanningActions.value
        || fl312.riskFactors.historyOfRiskBehaviors.value
        || fl312.riskFactors.criminalRecord.value;
      const hasOrdersAgainst = fl312.requestedOrdersAgainst.petitioner.value
        || fl312.requestedOrdersAgainst.respondent.value
        || fl312.requestedOrdersAgainst.otherParentParty.value;
      const hasRequestedOrder = fl312.requestedOrders.supervisedVisitation.value
        || fl312.requestedOrders.postBond.value
        || fl312.requestedOrders.noMoveWithoutWrittenPermissionOrCourtOrder.value
        || fl312.requestedOrders.noTravelWithoutWrittenPermissionOrCourtOrder.value
        || fl312.requestedOrders.registerOrderInOtherState.value
        || fl312.requestedOrders.turnInPassportsAndTravelDocuments.value
        || fl312.requestedOrders.doNotApplyForNewPassportsOrDocuments.value
        || fl312.requestedOrders.provideTravelItinerary.value
        || fl312.requestedOrders.provideRoundTripAirlineTickets.value
        || fl312.requestedOrders.provideAddressesAndTelephone.value
        || fl312.requestedOrders.provideOpenReturnTicketForRequestingParty.value
        || fl312.requestedOrders.provideOtherTravelDocuments.value
        || fl312.requestedOrders.notifyForeignEmbassyOrConsulate.value
        || fl312.requestedOrders.obtainForeignCustodyAndVisitationOrderBeforeTravel.value
        || fl312.requestedOrders.otherOrdersRequested.value;

      if (!workspace.hasMinorChildren.value) missing.push('Enable minor children before generating FL-312');
      if (!fl312.requestingPartyName.value.trim()) missing.push('FL-312 item 1 requesting party name');
      if (!hasAbductionBy) missing.push('FL-312 item 2 restrained party (petitioner/respondent/other)');
      if (!hasRiskInItem3 && !hasRiskInItem4) missing.push('FL-312 risk basis in item 3 or item 4');
      if (fl312.riskDestinations.anotherCaliforniaCounty.value && !fl312.riskDestinations.anotherCaliforniaCountyName.value.trim()) missing.push('FL-312 item 3a county');
      if (fl312.riskDestinations.anotherState.value && !fl312.riskDestinations.anotherStateName.value.trim()) missing.push('FL-312 item 3b state');
      if (fl312.riskDestinations.foreignCountry.value && !fl312.riskDestinations.foreignCountryName.value.trim()) missing.push('FL-312 item 3c foreign country');
      if (fl312.riskDestinations.foreignCountryHasTies.value && !fl312.riskDestinations.foreignCountryTiesDetails.value.trim()) missing.push('FL-312 item 3c(2) ties explanation');
      if (fl312.riskFactors.custodyOrderViolationThreat.value && !fl312.riskFactors.custodyOrderViolationThreatDetails.value.trim()) missing.push('FL-312 item 4a explanation');
      if (fl312.riskFactors.weakCaliforniaTies.value && !fl312.riskFactors.weakCaliforniaTiesDetails.value.trim()) missing.push('FL-312 item 4b explanation');
      if (fl312.riskFactors.recentActionOther.value && !fl312.riskFactors.recentActionOtherDetails.value.trim()) missing.push('FL-312 item 4c other details');
      if (fl312.riskFactors.historyOfRiskBehaviors.value && !fl312.riskFactors.historyDetails.value.trim()) missing.push('FL-312 item 4d explanation');
      if (fl312.riskFactors.criminalRecord.value && !fl312.riskFactors.criminalRecordDetails.value.trim()) missing.push('FL-312 item 4e explanation');
      if (!hasOrdersAgainst) missing.push('FL-312 page 2 orders-against party');
      if (!hasRequestedOrder) missing.push('FL-312 at least one requested order (items 5-14)');
      if (fl312.requestedOrders.supervisedVisitation.value && fl312.requestedOrders.supervisedVisitationTermsMode.value === 'unspecified') {
        missing.push('FL-312 item 5 supervised-visitation terms mode');
      }
      if (fl312.requestedOrders.supervisedVisitation.value && fl312.requestedOrders.supervisedVisitationTermsMode.value === 'fl311'
        && !workspace.fl100.childCustodyVisitation.attachments.formFl311.value) {
        missing.push('FL-312 item 5 set to FL-311 terms but FL-311 is not selected');
      }
      if (fl312.requestedOrders.supervisedVisitation.value && fl312.requestedOrders.supervisedVisitationTermsMode.value === 'as_follows'
        && !fl312.requestedOrders.supervisedVisitationTermsDetails.value.trim()) {
        missing.push('FL-312 item 5 as-follows details');
      }
      if (fl312.requestedOrders.postBond.value && !fl312.requestedOrders.postBondAmount.value.trim()) missing.push('FL-312 item 6 bond amount');
      if (
        fl312.requestedOrders.noTravelWithoutWrittenPermissionOrCourtOrder.value
        && !fl312.requestedOrders.travelRestrictionThisCounty.value
        && !fl312.requestedOrders.travelRestrictionCalifornia.value
        && !fl312.requestedOrders.travelRestrictionUnitedStates.value
        && !fl312.requestedOrders.travelRestrictionOther.value
      ) missing.push('FL-312 item 8 at least one travel restriction');
      if (fl312.requestedOrders.travelRestrictionOther.value && !fl312.requestedOrders.travelRestrictionOtherDetails.value.trim()) missing.push('FL-312 item 8 other travel restriction details');
      if (fl312.requestedOrders.registerOrderInOtherState.value && !fl312.requestedOrders.registerOrderStateName.value.trim()) missing.push('FL-312 item 9 state for registration');
      if (fl312.requestedOrders.provideOtherTravelDocuments.value && !fl312.requestedOrders.provideOtherTravelDocumentsDetails.value.trim()) missing.push('FL-312 item 11 other travel documents');
      if (fl312.requestedOrders.notifyForeignEmbassyOrConsulate.value && !fl312.requestedOrders.embassyOrConsulateCountry.value.trim()) missing.push('FL-312 item 12 embassy/consulate country');
      if (fl312.requestedOrders.notifyForeignEmbassyOrConsulate.value && !fl312.requestedOrders.embassyNotificationWithinDays.value.trim()) missing.push('FL-312 item 12 notification days');
      if (fl312.requestedOrders.otherOrdersRequested.value && !fl312.requestedOrders.otherOrdersDetails.value.trim()) missing.push('FL-312 item 14 other orders details');
      if (!fl312.signatureDate.value.trim()) missing.push('FL-312 signature date');
    }
    const fl341RelevantRequest = (
      workspace.fl100.childCustodyVisitation.attachments.formFl341a.value
      || workspace.fl100.childCustodyVisitation.attachments.formFl341b.value
      || workspace.fl100.childCustodyVisitation.attachments.formFl341c.value
      || workspace.fl100.childCustodyVisitation.attachments.formFl341d.value
      || workspace.fl100.childCustodyVisitation.attachments.formFl341e.value
    ) && (
      workspace.requests.childCustody.value
      || workspace.requests.visitation.value
      || workspace.fl100.childCustodyVisitation.legalCustodyTo.value !== 'none'
      || workspace.fl100.childCustodyVisitation.physicalCustodyTo.value !== 'none'
      || workspace.fl100.childCustodyVisitation.visitationTo.value !== 'none'
    );
    if (fl100Included && fl341RelevantRequest) {
      const fl341 = workspace.fl100.childCustodyVisitation.fl341;
      const fl341a = fl341.fl341a;
      const fl341b = fl341.fl341b;
      const fl341c = fl341.fl341c;
      const fl341d = fl341.fl341d;
      const fl341e = fl341.fl341e;
      const fl341aSupervisedPartySelected = fl341a.supervisedParty.petitioner.value
        || fl341a.supervisedParty.respondent.value
        || fl341a.supervisedParty.otherParentParty.value;
      const fl341aHasAnyDetail = fl341aSupervisedPartySelected
        || fl341a.supervisor.type.value !== 'unspecified'
        || fl341a.supervisor.name.value.trim().length > 0
        || fl341a.supervisor.contact.value.trim().length > 0
        || fl341a.supervisor.feesPaidBy.value !== 'unspecified'
        || fl341a.schedule.mode.value !== 'unspecified'
        || fl341a.schedule.attachmentPageCount.value.trim().length > 0
        || fl341a.schedule.text.value.trim().length > 0
        || fl341a.restrictions.value.trim().length > 0
        || fl341a.otherTerms.value.trim().length > 0;
      const fl341bHasRisk = fl341b.risk.violatedPastOrders.value
        || fl341b.risk.noStrongCaliforniaTies.value
        || fl341b.risk.preparationActions.selected.value
        || fl341b.risk.history.selected.value
        || fl341b.risk.criminalRecord.value
        || fl341b.risk.tiesToOtherJurisdiction.value;
      const fl341bHasPreparationDetail = fl341b.risk.preparationActions.quitJob.value
        || fl341b.risk.preparationActions.soldHome.value
        || fl341b.risk.preparationActions.closedBankAccount.value
        || fl341b.risk.preparationActions.endedLease.value
        || fl341b.risk.preparationActions.soldAssets.value
        || fl341b.risk.preparationActions.hiddenOrDestroyedDocuments.value
        || fl341b.risk.preparationActions.appliedForPassport.value
        || fl341b.risk.preparationActions.other.value;
      const fl341bHasHistoryDetail = fl341b.risk.history.domesticViolence.value
        || fl341b.risk.history.childAbuse.value
        || fl341b.risk.history.nonCooperation.value;
      const fl341bHasOrder = fl341b.orders.supervisedVisitation.value
        || fl341b.orders.postBond.value
        || fl341b.orders.noMoveWithoutPermission.value
        || fl341b.orders.noTravelWithoutPermission.value
        || fl341b.orders.registerInOtherState.value
        || fl341b.orders.noPassportApplications.value
        || fl341b.orders.turnInPassportsAndVitalDocs.value
        || fl341b.orders.provideTravelInfo.value
        || fl341b.orders.notifyEmbassyOrConsulate.value
        || fl341b.orders.obtainForeignOrderBeforeTravel.value
        || fl341b.orders.enforceOrder.value
        || fl341b.orders.other.value;
      const fl341cRows = [
        { label: "FL-341(C) New Year's Day", row: fl341c.holidayRows.newYearsDay },
        { label: 'FL-341(C) Spring Break', row: fl341c.holidayRows.springBreak },
        { label: 'FL-341(C) Thanksgiving Day', row: fl341c.holidayRows.thanksgivingDay },
        { label: 'FL-341(C) Winter Break', row: fl341c.holidayRows.winterBreak },
        { label: "FL-341(C) Child's birthday", row: fl341c.holidayRows.childBirthday },
      ];
      const fl341cEnabledRows = fl341cRows.filter(({ row }) => row.enabled.value);
      const fl341cHasAnyDetail = fl341cEnabledRows.length > 0
        || fl341c.additionalHolidayNotes.value.trim().length > 0
        || fl341c.vacation.assignedTo.value !== 'unspecified'
        || fl341c.vacation.maxDuration.value.trim().length > 0
        || fl341c.vacation.timesPerYear.value.trim().length > 0
        || fl341c.vacation.noticeDays.value.trim().length > 0
        || fl341c.vacation.responseDays.value.trim().length > 0
        || fl341c.vacation.allowOutsideCalifornia.value
        || fl341c.vacation.allowOutsideUnitedStates.value
        || fl341c.vacation.otherTerms.value.trim().length > 0;
      const fl341dProvisions = [
        { label: 'FL-341(D) exchange schedule', provision: fl341d.provisions.exchangeSchedule },
        { label: 'FL-341(D) transportation', provision: fl341d.provisions.transportation },
        { label: 'FL-341(D) make-up parenting time', provision: fl341d.provisions.makeupTime },
        { label: 'FL-341(D) communication', provision: fl341d.provisions.communication },
        { label: 'FL-341(D) right of first refusal', provision: fl341d.provisions.rightOfFirstRefusal },
        { label: 'FL-341(D) temporary changes by agreement', provision: fl341d.provisions.temporaryChangesByAgreement },
        { label: 'FL-341(D) other', provision: fl341d.provisions.other },
      ];
      const fl341dSelected = fl341dProvisions.filter(({ provision }) => provision.selected.value).length;
      const fl341eAnyTerm = fl341e.terms.recordsAccess.value
        || fl341e.terms.emergencyNotice.value
        || fl341e.terms.portalAccess.value
        || fl341e.terms.contactUpdates.value;
      const fl341eAnyDisputePath = fl341e.disputeResolution.meetAndConfer.value
        || fl341e.disputeResolution.mediation.value
        || fl341e.disputeResolution.court.value
        || fl341e.disputeResolution.other.value;
      if (!workspace.hasMinorChildren.value) missing.push('Enable minor children before generating FL-341');
      if (workspace.children.length === 0) missing.push('At least one child row is required for FL-341');
      if (workspace.children.length > FL105_FORM_CAPACITY.childrenRows) {
        missing.push(`FL-341 v1 currently supports only ${FL105_FORM_CAPACITY.childrenRows} child rows`);
      }
      if (fl341.sourceOrder.value === 'unspecified') missing.push('FL-341 source order form (FL-340/FL-180/FL-250/FL-355/other)');
      if (fl341.sourceOrder.value === 'other' && !fl341.sourceOrderOtherText.value.trim()) missing.push('FL-341 source order "other" details');
      if (workspace.fl100.childCustodyVisitation.attachments.formFl341a.value) {
        if (!fl341aHasAnyDetail) missing.push('FL-341(A) requires explicit supervised-visitation details');
        if (!fl341aSupervisedPartySelected) missing.push('FL-341(A) select at least one supervised party');
        if (fl341a.supervisor.type.value === 'unspecified') missing.push('FL-341(A) supervisor type');
        if (fl341a.supervisor.type.value === 'other' && !fl341a.supervisor.otherTypeText.value.trim()) missing.push('FL-341(A) supervisor type "other" details');
        if (!fl341a.supervisor.name.value.trim()) missing.push('FL-341(A) supervisor name');
        if (!fl341a.supervisor.contact.value.trim()) missing.push('FL-341(A) supervisor contact');
        if (fl341a.supervisor.feesPaidBy.value === 'unspecified') missing.push('FL-341(A) supervisor fee payer');
        if (fl341a.supervisor.feesPaidBy.value === 'other' && !fl341a.supervisor.feesOtherText.value.trim()) missing.push('FL-341(A) supervisor fee payer "other" details');
        if (fl341a.schedule.mode.value === 'unspecified') missing.push('FL-341(A) schedule mode');
        if (fl341a.schedule.mode.value === 'fl311' && !workspace.fl100.childCustodyVisitation.attachments.formFl311.value) missing.push('FL-341(A) FL-311 schedule mode requires FL-311 selected');
        if (fl341a.schedule.mode.value === 'attachment' && !fl341a.schedule.attachmentPageCount.value.trim()) missing.push('FL-341(A) attached schedule page count');
        if (fl341a.schedule.mode.value === 'text' && !fl341a.schedule.text.value.trim()) missing.push('FL-341(A) as-follows schedule details');
      }
      if (workspace.fl100.childCustodyVisitation.attachments.formFl341b.value) {
        if (!fl341b.restrainedPartyName.value.trim()) missing.push('FL-341(B) restrained party name');
        if (!fl341bHasRisk) missing.push('FL-341(B) at least one child-abduction risk factor');
        if (fl341b.risk.preparationActions.selected.value && !fl341bHasPreparationDetail) missing.push('FL-341(B) preparation-actions risk detail');
        if (fl341b.risk.preparationActions.other.value && !fl341b.risk.preparationActions.otherDetails.value.trim()) missing.push('FL-341(B) other preparation-action details');
        if (fl341b.risk.history.selected.value && !fl341bHasHistoryDetail) missing.push('FL-341(B) history-risk detail');
        if (!fl341bHasOrder) missing.push('FL-341(B) at least one abduction-prevention order');
        if (fl341b.orders.supervisedVisitation.value && fl341b.orders.supervisedVisitationTermsMode.value === 'unspecified') missing.push('FL-341(B) supervised-visitation terms mode');
        if (fl341b.orders.supervisedVisitation.value && fl341b.orders.supervisedVisitationTermsMode.value === 'fl341a' && !workspace.fl100.childCustodyVisitation.attachments.formFl341a.value) missing.push('FL-341(B) supervised visitation references FL-341(A), but FL-341(A) is not selected');
        if (fl341b.orders.supervisedVisitation.value && fl341b.orders.supervisedVisitationTermsMode.value === 'as_follows' && !fl341b.orders.supervisedVisitationTermsDetails.value.trim()) missing.push('FL-341(B) supervised-visitation as-follows details');
        if (fl341b.orders.postBond.value && !fl341b.orders.postBondAmount.value.trim()) missing.push('FL-341(B) bond amount');
        if (fl341b.orders.noMoveWithoutPermission.value && !fl341b.orders.noMoveCurrentResidence.value && !fl341b.orders.noMoveCurrentSchoolDistrict.value && !fl341b.orders.noMoveOtherPlace.value) missing.push('FL-341(B) no-move place restriction');
        if (fl341b.orders.noMoveOtherPlace.value && !fl341b.orders.noMoveOtherPlaceDetails.value.trim()) missing.push('FL-341(B) no-move other place details');
        if (fl341b.orders.noTravelWithoutPermission.value && !fl341b.orders.travelRestrictionThisCounty.value && !fl341b.orders.travelRestrictionCalifornia.value && !fl341b.orders.travelRestrictionUnitedStates.value && !fl341b.orders.travelRestrictionOther.value) missing.push('FL-341(B) no-travel restriction');
        if (fl341b.orders.travelRestrictionOther.value && !fl341b.orders.travelRestrictionOtherDetails.value.trim()) missing.push('FL-341(B) other travel restriction details');
        if (fl341b.orders.registerInOtherState.value && !fl341b.orders.registerInOtherStateName.value.trim()) missing.push('FL-341(B) registration state');
        if (fl341b.orders.provideOtherTravelInfo.value && !fl341b.orders.provideOtherTravelInfoDetails.value.trim()) missing.push('FL-341(B) other travel information details');
        if (fl341b.orders.notifyEmbassyOrConsulate.value && !fl341b.orders.notifyEmbassyCountry.value.trim()) missing.push('FL-341(B) embassy/consulate country');
        if (fl341b.orders.notifyEmbassyOrConsulate.value && !fl341b.orders.notifyEmbassyWithinDays.value.trim()) missing.push('FL-341(B) embassy/consulate notification days');
        if (fl341b.orders.enforceOrder.value && !fl341b.orders.enforceOrderContactInfo.value.trim()) missing.push('FL-341(B) enforcement contact information');
        if (fl341b.orders.other.value && !fl341b.orders.otherDetails.value.trim()) missing.push('FL-341(B) other order details');
      }
      if (workspace.fl100.childCustodyVisitation.attachments.formFl341c.value) {
        if (!fl341cHasAnyDetail) missing.push('FL-341(C) requires at least one explicit holiday or vacation term');
        fl341cEnabledRows.forEach(({ label, row }) => {
          if (row.yearPattern.value === 'unspecified') missing.push(`${label}: choose every/even/odd years`);
          if (row.assignedTo.value === 'unspecified') missing.push(`${label}: choose petitioner/respondent/other parent-party`);
        });
        if (fl341c.vacation.maxDuration.value.trim() && fl341c.vacation.maxDurationUnit.value === 'unspecified') {
          missing.push('FL-341(C) vacation duration unit (days/weeks)');
        }
        if (fl341c.vacation.allowOutsideUnitedStates.value && !fl341c.vacation.allowOutsideCalifornia.value) {
          missing.push('FL-341(C) outside-U.S. travel also requires outside-California travel to be selected');
        }
      }
      if (workspace.fl100.childCustodyVisitation.attachments.formFl341d.value) {
        if (fl341dSelected === 0) missing.push('FL-341(D) select at least one additional physical-custody provision');
        fl341dProvisions.forEach(({ label, provision }) => {
          if (provision.selected.value && !provision.details.value.trim()) {
            missing.push(`${label} details`);
          }
        });
      }
      if (workspace.fl100.childCustodyVisitation.attachments.formFl341e.value) {
        if (!fl341e.orderJointLegalCustody.value) missing.push('FL-341(E) confirm joint legal custody order');
        if (fl341e.decisionMaking.education.value === 'unspecified') missing.push('FL-341(E) education decision-maker');
        if (fl341e.decisionMaking.nonEmergencyHealthcare.value === 'unspecified') missing.push('FL-341(E) non-emergency healthcare decision-maker');
        if (fl341e.decisionMaking.mentalHealth.value === 'unspecified') missing.push('FL-341(E) mental-health decision-maker');
        if (fl341e.decisionMaking.extracurricular.value === 'unspecified') missing.push('FL-341(E) extracurricular decision-maker');
        if (!fl341eAnyTerm && !fl341eAnyDisputePath && !fl341e.additionalTerms.value.trim()) {
          missing.push('FL-341(E) add at least one operating term, dispute path, or additional term');
        }
        if (fl341e.disputeResolution.other.value && !fl341e.disputeResolution.otherText.value.trim()) {
          missing.push('FL-341(E) dispute-resolution "other" details');
        }
      }
    }
    if (fl100Included && workspace.fl100.attorneyFeesAndCosts.requestAward.value && workspace.fl100.attorneyFeesAndCosts.payableBy.value === 'none') {
      missing.push('Who should pay attorney fees and costs');
    }
    if (fl100Included && workspace.fl100.otherRequests.requestOtherRelief.value && !workspace.fl100.otherRequests.details.value.trim()) {
      missing.push('Other FL-100 request details');
    }
    if (fl100Included && workspace.fl100.otherRequests.continuedOnAttachment.value && !workspace.fl100.otherRequests.requestOtherRelief.value) {
      missing.push('Enable FL-100 other relief before continuing it on attachment');
    }
    if (fl100Included && workspace.fl100.otherRequests.continuedOnAttachment.value && !workspace.fl100.otherRequests.details.value.trim()) {
      missing.push('FL-100 attachment 11c details');
    }

    if (workspace.fl300.includeForm.value) {
      const fl300 = workspace.fl300;
      const hasFl300RequestType = fl300.requestTypes.childCustody.value
        || fl300.requestTypes.visitation.value
        || fl300.requestTypes.childSupport.value
        || fl300.requestTypes.spousalSupport.value
        || fl300.requestTypes.propertyControl.value
        || fl300.requestTypes.attorneyFeesCosts.value
        || fl300.requestTypes.other.value
        || fl300.requestTypes.changeModify.value
        || fl300.requestTypes.temporaryEmergencyOrders.value;
      const hasFl300ServedParty = fl300.requestedAgainst.petitioner.value
        || fl300.requestedAgainst.respondent.value
        || fl300.requestedAgainst.otherParentParty.value
        || fl300.requestedAgainst.other.value;
      if (!hasFl300RequestType) missing.push('FL-300 at least one request type');
      if (!hasFl300ServedParty) missing.push('FL-300 TO/served party selection');
      if (fl300.requestedAgainst.other.value && !fl300.requestedAgainst.otherName.value.trim()) missing.push('FL-300 other served party name');
      if (fl300.hearing.locationMode.value === 'other' && !fl300.hearing.otherLocation.value.trim()) missing.push('FL-300 other hearing location');
      if (fl300.custodyMediation.required.value && !fl300.custodyMediation.details.value.trim()) missing.push('FL-300 custody mediation/counseling details');
      if (fl300.requestTypes.temporaryEmergencyOrders.value && !fl300.temporaryEmergencyFl305Applies.value && !fl300.service.orderShorterServiceReason.value.trim()) missing.push('FL-300 temporary emergency orders: confirm FL-305 applies or give reason');
      if ((fl300.requestTypes.childCustody.value || fl300.requestTypes.visitation.value)
        && !fl300.custodyRequests.useChildRows.value
        && !fl300.custodyRequests.useCustodyAttachments.value
        && !fl300.custodyRequests.asFollowsText.value.trim()) missing.push('FL-300 custody/visitation order source');
      if (fl300.custodyRequests.useChildRows.value && workspace.children.length > FL105_FORM_CAPACITY.childrenRows) missing.push(`FL-300 child rows v1 supports only ${FL105_FORM_CAPACITY.childrenRows} children`);
      if (fl300.requestTypes.childCustody.value && fl300.custodyRequests.useChildRows.value && !fl300.custodyRequests.legalCustodyToText.value.trim() && workspace.fl100.childCustodyVisitation.legalCustodyTo.value === 'none') missing.push('FL-300 legal custody text or FL-100 legal custody direction');
      if (fl300.requestTypes.childCustody.value && fl300.custodyRequests.useChildRows.value && !fl300.custodyRequests.physicalCustodyToText.value.trim() && workspace.fl100.childCustodyVisitation.physicalCustodyTo.value === 'none') missing.push('FL-300 physical custody text or FL-100 physical custody direction');
      if (fl300.requestTypes.childSupport.value && !fl300.supportRequests.childSupportGuideline.value && !fl300.supportRequests.childSupportMonthlyAmountText.value.trim() && !fl300.supportRequests.childSupportChangeReasons.value.trim()) missing.push('FL-300 child support guideline, amount, or reasons');
      if (fl300.requestTypes.spousalSupport.value && !fl300.supportRequests.spousalSupportAmount.value.trim() && !fl300.supportRequests.changeSpousalSupport.value && !fl300.supportRequests.endSpousalSupport.value && !fl300.supportRequests.spousalSupportChangeReasons.value.trim()) missing.push('FL-300 spousal/partner support amount, change/end, or reasons');
      if (fl300.requestTypes.propertyControl.value && !fl300.propertyControl.propertyDescription.value.trim() && !fl300.propertyControl.debtPayTo.value.trim()) missing.push('FL-300 property-control property or debt details');
      if (fl300.requestTypes.attorneyFeesCosts.value && !fl300.attorneyFees.amount.value.trim()) missing.push('FL-300 attorney fees/costs amount');
      if (fl300.attorneyFees.includeFl319.value) {
        if (!fl300.requestTypes.attorneyFeesCosts.value) missing.push('Select FL-300 attorney fees/costs before generating FL-319');
        if (!fl300.attorneyFees.feesRequestedAmount.value.trim() && !fl300.attorneyFees.costsRequestedAmount.value.trim()) missing.push('FL-319 requested fees or costs amount');
        if (fl300.attorneyFees.paymentRequestedFrom.value === 'unspecified') missing.push('FL-319 party who should pay fees/costs');
        if (fl300.attorneyFees.paymentRequestedFrom.value === 'other' && !fl300.attorneyFees.paymentRequestedFromOtherName.value.trim()) missing.push('FL-319 other paying party name');
        if (fl300.attorneyFees.priorFeeOrderExists.value === 'unspecified') missing.push('FL-319 prior fee order yes/no');
        if (fl300.attorneyFees.priorFeeOrderExists.value === 'yes' && fl300.attorneyFees.priorFeeOrderPayor.value === 'unspecified') missing.push('FL-319 prior order paying party');
        if (fl300.attorneyFees.priorFeeOrderExists.value === 'yes' && !fl300.attorneyFees.priorFeeOrderAmount.value.trim()) missing.push('FL-319 prior order amount');
        if (fl300.attorneyFees.priorPaymentsStatus.value === 'unspecified') missing.push('FL-319 prior payments status');
        if (!fl300.signatureDate.value.trim()) missing.push('FL-319 signature date');
        if (!fl300.typePrintName.value.trim()) missing.push('FL-319 type/print name');
      }
      if (fl300.requestTypes.other.value && !fl300.otherOrdersRequested.value.trim()) missing.push('FL-300 other orders text');
      if (!fl300.facts.value.trim()) missing.push('FL-300 facts supporting requested orders');
      if (!fl300.signatureDate.value.trim()) missing.push('FL-300 signature date');
    }

    if (workspace.fl150.includeForm.value) {
      const fl150 = workspace.fl150;
      const hasIncome = [
        fl150.income.salaryWages.lastMonth.value,
        fl150.income.salaryWages.averageMonthly.value,
        fl150.income.overtime.averageMonthly.value,
        fl150.income.commissionsBonuses.averageMonthly.value,
        fl150.income.publicAssistance.averageMonthly.value,
        fl150.income.spousalSupport.averageMonthly.value,
        fl150.income.partnerSupport.averageMonthly.value,
        fl150.income.pensionRetirement.averageMonthly.value,
        fl150.income.socialSecurityDisability.averageMonthly.value,
        fl150.income.unemploymentWorkersComp.averageMonthly.value,
        fl150.income.otherIncome.averageMonthly.value,
      ].some((value) => value.trim().length > 0);
      const hasExpense = [
        fl150.expenses.rentOrMortgage.value,
        fl150.expenses.propertyTax.value,
        fl150.expenses.insurance.value,
        fl150.expenses.groceriesHousehold.value,
        fl150.expenses.utilities.value,
        fl150.expenses.phone.value,
        fl150.expenses.auto.value,
        fl150.expenses.monthlyDebtPayments.value,
        fl150.expenses.totalExpenses.value,
      ].some((value) => value.trim().length > 0);
      if (!hasIncome) missing.push('FL-150 at least one explicit income amount');
      if (!hasExpense) missing.push('FL-150 at least one explicit monthly expense amount');
      if (fl150.employment.payAmount.value.trim() && fl150.employment.payPeriod.value === 'unspecified') missing.push('FL-150 pay period for entered pay amount');
      if (fl150.taxes.filingStatus.value === 'married_joint' && !fl150.taxes.jointFilerName.value.trim()) missing.push('FL-150 joint filer name');
      if (fl150.taxes.taxState.value === 'other' && !fl150.taxes.otherState.value.trim()) missing.push('FL-150 other tax state');
      if (fl150.childrenSupport.hasChildrenHealthInsurance.value === 'yes' && !fl150.childrenSupport.insuranceCompanyName.value.trim()) missing.push('FL-150 children health-insurance company');
      if (!fl150.signatureDate.value.trim()) missing.push('FL-150 signature date');
      if (!fl150.typePrintName.value.trim()) missing.push('FL-150 typed/printed name');
    }

    if (workspace.fl140.includeForm.value) {
      const fl140 = workspace.fl140;
      if (fl140.servedTaxReturns.value && fl140.noTaxReturnsFiled.value) missing.push('FL-140 choose either served tax returns or no tax returns filed, not both');
      if (!fl140.servedTaxReturns.value && !fl140.noTaxReturnsFiled.value) missing.push('FL-140 tax return service status');
      if (fl140.servedObligationsStatement.value && !fl140.obligationsStatement.value.trim()) missing.push('FL-140 obligations statement details');
      if (fl140.servedInvestmentOpportunityStatement.value && !fl140.investmentOpportunityStatement.value.trim()) missing.push('FL-140 investment opportunity statement details');
      if (!fl140.signatureDate.value.trim()) missing.push('FL-140 signature date');
      if (!fl140.typePrintName.value.trim()) missing.push('FL-140 typed/printed name');
    }

    if (workspace.fl141.includeForm.value) {
      const fl141 = workspace.fl141;
      if (!fl141.serviceDate.value.trim()) missing.push('FL-141 disclosure service date');
      if (!fl141.signatureDate.value.trim()) missing.push('FL-141 signature date');
      if (!fl141.typePrintName.value.trim()) missing.push('FL-141 typed/printed name');
    }

    if (workspace.fl142.includeForm.value) {
      const hasAssetOrDebt = Object.values(workspace.fl142.assets).some((row) => row.description.value.trim() || row.grossValue.value.trim() || row.amountOwed.value.trim())
        || Object.values(workspace.fl142.debts).some((row) => row.description.value.trim() || row.totalOwing.value.trim());
      if (!hasAssetOrDebt) missing.push('FL-142 at least one asset or debt entry');
      if (!workspace.fl142.signatureDate.value.trim()) missing.push('FL-142 signature date');
      if (!workspace.fl142.typePrintName.value.trim()) missing.push('FL-142 typed/printed name');
    }

    if (workspace.fl115.includeForm.value) {
      if (!workspace.fl115.addressWhereServed.value.trim()) missing.push('FL-115 address where served');
      if (workspace.fl115.serviceMethod.value === 'personal' && !workspace.fl115.serviceDate.value.trim()) missing.push('FL-115 personal service date');
      if (workspace.fl115.serviceMethod.value === 'mail_acknowledgment' && !workspace.fl115.dateMailed.value.trim()) missing.push('FL-115 date mailed');
      if (!workspace.fl115.serverName.value.trim()) missing.push('FL-115 server name');
      if (!workspace.fl115.serverAddress.value.trim()) missing.push('FL-115 server address');
      if (!workspace.fl115.signatureDate.value.trim()) missing.push('FL-115 server signature date');
    }

    if (workspace.fl117.includeForm.value) {
      if (!workspace.fl117.personServedName.value.trim()) missing.push('FL-117 person being served');
      if (!workspace.fl117.dateMailed.value.trim()) missing.push('FL-117 date mailed');
      if (!workspace.fl117.petitionerPrintedName.value.trim()) missing.push('FL-117 petitioner printed name');
    }

    if (workspace.fl120.includeForm.value) {
      if (!workspace.fl120.respondentPrintedName.value.trim()) missing.push('FL-120 respondent printed name');
      if (!workspace.fl120.signatureDate.value.trim()) missing.push('FL-120 signature date');
    }

    if (workspace.fl160.includeForm.value) {
      if (!workspace.fl160.itemDescription.value.trim()) missing.push('FL-160 property description');
      if (!workspace.fl160.grossFairMarketValue.value.trim()) missing.push('FL-160 gross fair market value');
      if (!workspace.fl160.signatureDate.value.trim()) missing.push('FL-160 signature date');
      if (!workspace.fl160.typePrintName.value.trim()) missing.push('FL-160 typed/printed name');
    }

    if (workspace.fl342.includeForm.value) {
      if (!workspace.fl342.baseMonthlyChildSupport.value.trim()) missing.push('FL-342 base monthly child support amount');
      if (!workspace.fl342.paymentStartDate.value.trim()) missing.push('FL-342 payment start date');
      if (!workspace.fl342.payableTo.value.trim()) missing.push('FL-342 payable to');
      if (workspace.fl342.attachTo.value === 'other' && !workspace.fl342.attachToOther.value.trim()) missing.push('FL-342 attachment-to description');
    }

    if (workspace.fl343.includeForm.value) {
      if (!workspace.fl343.monthlyAmount.value.trim()) missing.push('FL-343 support amount');
      if (!workspace.fl343.paymentStartDate.value.trim()) missing.push('FL-343 payment start date');
      if (workspace.fl343.paymentFrequency.value === 'other' && !workspace.fl343.frequencyOther.value.trim()) missing.push('FL-343 payment frequency details');
    }

    if (workspace.hasMinorChildren.value) {
      const hasResidenceHistoryDetails = workspace.fl105.residenceHistory.some((entry) => [
        entry.fromDate.value,
        entry.toDate.value,
        entry.residence.value,
        entry.personAndAddress.value,
        entry.relationship.value,
      ].some((value) => value.trim().length > 0));
      const fl105ResidenceHistoryOverflowCount = getFl105ResidenceHistoryOverflowCount(workspace.fl105.residenceHistory);
      const fl105ProceedingOverflowCount = getFl105OtherProceedingOverflowCount(workspace.fl105.otherProceedings);
      const fl105OrderOverflowCount = getFl105OrderOverflowCount(workspace.fl105.domesticViolenceOrders);
      const fl105ClaimantOverflowCount = getFl105ClaimantOverflowCount(workspace.fl105.otherClaimants);
      if (workspace.children.length === 0 && !workspace.fl100.minorChildren.hasUnbornChild.value) {
        missing.push('At least one child entry or unborn child selection');
      }
      if (
        workspace.fl105.representationRole.value === 'authorized_representative'
        && !workspace.fl105.authorizedRepresentativeAgencyName.value.trim()
      ) {
        missing.push('FL-105 authorized representative agency name');
      }
      if (!workspace.fl105.signatureDate.value.trim()) {
        missing.push('FL-105 declarant signature date');
      }
      if (!workspace.fl105.childrenResidenceAssertionReviewed.value) {
        missing.push('Review FL-105 item 3 children residence-history assertion');
      }
      if (!workspace.fl105.otherProceedingsAssertionReviewed.value) {
        missing.push('Review FL-105 item 4 other-proceedings assertion');
      }
      if (!workspace.fl105.domesticViolenceOrdersAssertionReviewed.value) {
        missing.push('Review FL-105 item 5 protective-order assertion');
      }
      if (!workspace.fl105.otherClaimantsAssertionReviewed.value) {
        missing.push('Review FL-105 item 6 other-claimants assertion');
      }
      if (!workspace.fl105.childrenLivedTogetherPastFiveYears.value && workspace.children.length > 1) {
        workspace.fl105.additionalChildrenAttachments.forEach((entry, index) => {
          const child = workspace.children.find((candidate) => candidate.id === entry.childId);
          const childLabel = child?.fullName.value.trim() || `Additional child ${index + 2}`;
          const hasChildSpecificHistory = entry.residenceHistory.some((candidate) => [
            candidate.fromDate.value,
            candidate.toDate.value,
            candidate.residence.value,
            candidate.personAndAddress.value,
            candidate.relationship.value,
          ].some((value) => value.trim().length > 0));

          if (!entry.sameResidenceAsChildA.value && !hasChildSpecificHistory) {
            missing.push(`FL-105(A)/GC-120(A) residence history for ${childLabel}`);
          }
          if (entry.sameResidenceAsChildA.value && !entry.sameResidenceReviewed.value) {
            missing.push(`Review FL-105(A) same-residence assertion for ${childLabel}`);
          }

          if (entry.residenceAddressConfidentialStateOnly.value) {
            const hasNonStateOnlyResidenceAddress = entry.residenceHistory.some((candidate) => !isFl105StateOnlyAddress(candidate.residence.value));
            if (hasNonStateOnlyResidenceAddress) {
              missing.push(`FL-105(A) ${childLabel} residence confidentiality requires state-only residence entries`);
            }
          }

          if (entry.personAddressConfidentialStateOnly.value) {
            const hasNonStateOnlyPersonAddress = entry.residenceHistory.some((candidate) => !isFl105StateOnlyAddress(candidate.personAndAddress.value));
            if (hasNonStateOnlyPersonAddress) {
              missing.push(`FL-105(A) ${childLabel} person/address confidentiality requires state-only person/address entries`);
            }
          }
        });
      }
      if (workspace.fl105.additionalResidenceAddressesOnAttachment3a.value && !hasResidenceHistoryDetails) {
        missing.push('FL-105 attachment 3a residence-history details');
      }
      if (workspace.fl105.residenceAddressConfidentialStateOnly.value) {
        const hasNonStateOnlyResidenceAddress = workspace.fl105.residenceHistory.some((entry) => !isFl105StateOnlyAddress(entry.residence.value));
        if (hasNonStateOnlyResidenceAddress) {
          missing.push('FL-105 item 3a residence confidentiality is selected, so residence entries must be state-only (no street details)');
        }
      }
      if (workspace.fl105.personAddressConfidentialStateOnly.value) {
        const hasNonStateOnlyPersonAddress = workspace.fl105.residenceHistory.some((entry) => !isFl105StateOnlyAddress(entry.personAndAddress.value));
        if (hasNonStateOnlyPersonAddress) {
          missing.push('FL-105 item 3a person/address confidentiality is selected, so person/address entries must be state-only (no street details)');
        }
      }
      if (
        workspace.fl105.attachmentsIncluded.value
        && !workspace.fl105.attachmentPageCount.value.trim()
        && workspace.children.length <= FL105_FORM_CAPACITY.childrenRows
        && !workspace.fl105.additionalResidenceAddressesOnAttachment3a.value
        && fl105ResidenceHistoryOverflowCount === 0
        && fl105ProceedingOverflowCount === 0
        && fl105OrderOverflowCount === 0
        && fl105ClaimantOverflowCount === 0
      ) {
        missing.push('FL-105 attachment page count');
      }
      workspace.fl105.otherProceedings.forEach((entry, index) => {
        const hasProceedingData = [
          entry.proceedingType.value,
          entry.caseNumber.value,
          entry.court.value,
          entry.orderDate.value,
          entry.childNames.value,
          entry.connection.value,
          entry.status.value,
        ].some((value) => value.trim().length > 0);

        if (hasProceedingData && !normalizeFl105ProceedingType(entry.proceedingType.value)) {
          missing.push(`FL-105 other proceeding ${index + 1} type`);
        }
      });
      workspace.fl105.domesticViolenceOrders.forEach((entry, index) => {
        const hasOrderData = [
          entry.orderType.value,
          entry.county.value,
          entry.stateOrTribe.value,
          entry.caseNumber.value,
          entry.expirationDate.value,
        ].some((value) => value.trim().length > 0);

        if (hasOrderData && !normalizeFl105OrderType(entry.orderType.value)) {
          missing.push(`FL-105 restraining/protective order ${index + 1} type`);
        }
      });
      workspace.children.forEach((child, index) => {
        if (!child.fullName.value.trim()) missing.push(`Child ${index + 1} full name`);
        if (!child.birthDate.value.trim()) missing.push(`Child ${index + 1} birth date`);
        if (!child.placeOfBirth.value.trim()) missing.push(`Child ${index + 1} place of birth`);
      });
      if (
        workspace.children.length > FL105_FORM_CAPACITY.childrenRows
        && !workspace.fl100.minorChildren.detailsOnAttachment4b.value
      ) {
        missing.push('FL-100 attachment 4b selection for children beyond visible rows');
      }
    } else {
      if (workspace.fl100.minorChildren.hasUnbornChild.value) {
        missing.push('Enable minor children before selecting unborn child in FL-100 item 4');
      }
      if (workspace.fl100.minorChildren.detailsOnAttachment4b.value) {
        missing.push('Enable minor children before using FL-100 attachment 4b');
      }
    }

    return missing;
  }, [workspace]);

  const progressValue = useMemo(() => {
    if (!workspace) return 0;
    const checklistSize = Math.max(missingItems.length + 5, 5);
    return Math.max(8, Math.round(((checklistSize - missingItems.length) / checklistSize) * 100));
  }, [workspace, missingItems.length]);

  const handleGeneratePacket = async () => {
    if (!workspace) return;
    if (missingItems.length > 0 && !packetReadinessOverride) {
      toast.message('Finish the required Draft Forms fields or enable the manual override before generating the packet.');
      return;
    }

    setIsGeneratingPacket(true);
    setPacketError(null);

    try {
      const document = await createOfficialStarterPacketDocument(workspace, { manualReadinessOverride: packetReadinessOverride && missingItems.length > 0 });
      setGeneratedPacketName(document.name);
      toast.success(packetReadinessOverride && missingItems.length > 0
        ? 'Official packet PDF saved with manual readiness override.'
        : 'Official starter packet PDF saved to Saved Files.');
    } catch (error) {
      const message = error instanceof MariaDocumentError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Unable to generate the official starter packet PDF right now.';
      setPacketError(message);
      toast.error(message);
    } finally {
      setIsGeneratingPacket(false);
    }
  };

  if (requiresAuth) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,rgba(16,185,129,0.16),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#ecfdf5_100%)] py-16 dark:bg-[radial-gradient(circle_at_10%_0%,rgba(16,185,129,0.18),transparent_22%),linear-gradient(180deg,#020617_0%,#03111f_100%)]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Card className="rounded-[2rem] border-white/70 bg-white/85 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
            <CardContent className="space-y-5 p-8 text-center sm:p-12">
              <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                Draft Forms workspace
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Sign in to open Draft Forms</h1>
              <p className="mx-auto max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
                Draft Forms saves intake facts, Maria handoffs, support scenarios, and generated packets to your case workspace. Sign in first so your draft does not disappear.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  type="button"
                  className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800"
                  onClick={() => window.dispatchEvent(new CustomEvent('divorceos:auth-required'))}
                >
                  Sign in to continue
                </Button>
                <Button asChild type="button" variant="outline" className="rounded-full">
                  <Link to="/forms">Browse blank court forms</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!currentUser || !workspace) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,rgba(16,185,129,0.16),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#ecfdf5_100%)] py-16 dark:bg-[radial-gradient(circle_at_10%_0%,rgba(16,185,129,0.18),transparent_22%),linear-gradient(180deg,#020617_0%,#03111f_100%)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="rounded-[2rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
            <CardContent className="flex min-h-[280px] items-center justify-center">
              <div className="text-center text-slate-500 dark:text-slate-300">Loading Draft Forms…</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const hasDraftFormsAccess = ['essential', 'plus', 'done-for-you'].includes(currentUser.subscription);

  if (!hasDraftFormsAccess) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,rgba(16,185,129,0.16),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#ecfdf5_100%)] py-16 dark:bg-[radial-gradient(circle_at_10%_0%,rgba(16,185,129,0.18),transparent_22%),linear-gradient(180deg,#020617_0%,#03111f_100%)]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Card className="rounded-[2rem] border-white/70 bg-white/85 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
            <CardContent className="space-y-6 p-8 text-center sm:p-12">
              <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                Essential+ feature
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Draft Forms unlocks on Essential</h1>
              <p className="mx-auto max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
                Free and Basic users can browse blank official forms and Maria guidance. Essential, Plus, and Done-For-You unlock the Draft Forms workspace for saved intake facts, starter packet prep, and Maria handoffs.
              </p>
              <div className="grid gap-3 text-left sm:grid-cols-3">
                {[
                  'Preview the forms you may need',
                  'Save intake facts to your case',
                  'Generate cleaner starter packet drafts',
                ].map((item) => (
                  <div key={item} className="rounded-3xl border border-white/80 bg-white/70 p-4 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800">
                  <Link to="/pricing">Upgrade to Essential</Link>
                </Button>
                <Button asChild type="button" variant="outline" className="rounded-full">
                  <Link to="/forms">Browse blank court forms</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const shouldIncludeFl341 = (
    workspace.fl100.childCustodyVisitation.attachments.formFl341a.value
    || workspace.fl100.childCustodyVisitation.attachments.formFl341b.value
    || workspace.fl100.childCustodyVisitation.attachments.formFl341c.value
    || workspace.fl100.childCustodyVisitation.attachments.formFl341d.value
    || workspace.fl100.childCustodyVisitation.attachments.formFl341e.value
  ) && (
    workspace.requests.childCustody.value
    || workspace.requests.visitation.value
    || workspace.fl100.childCustodyVisitation.legalCustodyTo.value !== 'none'
    || workspace.fl100.childCustodyVisitation.physicalCustodyTo.value !== 'none'
    || workspace.fl100.childCustodyVisitation.visitationTo.value !== 'none'
  );
  const includedForms = workspace.hasMinorChildren.value
    ? [
      ...(workspace.fl100.includeForm.value ? ['FL-100'] : []),
      ...(workspace.fl300.includeForm.value ? ['FL-300'] : []),
      ...(workspace.fl140.includeForm.value ? ['FL-140'] : []),
      ...(workspace.fl141.includeForm.value ? ['FL-141'] : []),
      ...(workspace.fl142.includeForm.value ? ['FL-142'] : []),
      ...(workspace.fl160.includeForm.value ? ['FL-160'] : []),
      ...(workspace.fl150.includeForm.value ? ['FL-150'] : []),
      ...(workspace.fl110.includeForm.value ? ['FL-110'] : []),
      ...(workspace.fl115.includeForm.value ? ['FL-115'] : []),
      ...(workspace.fl117.includeForm.value ? ['FL-117'] : []),
      ...(workspace.fl120.includeForm.value ? ['FL-120'] : []),
      ...(workspace.fl342.includeForm.value ? ['FL-342'] : []),
      ...(workspace.fl343.includeForm.value ? ['FL-343'] : []),
      ...(workspace.fl130.includeForm.value ? ['FL-130'] : []),
      ...(workspace.fl144.includeForm.value ? ['FL-144'] : []),
      ...(workspace.fl170.includeForm.value ? ['FL-170'] : []),
      ...(workspace.fl180.includeForm.value ? ['FL-180'] : []),
      ...(workspace.fl190.includeForm.value ? ['FL-190'] : []),
      ...(workspace.fl345.includeForm.value ? ['FL-345'] : []),
      ...(workspace.fl348.includeForm.value ? ['FL-348'] : []),
      ...remainingFlFormOptions.filter((form) => workspace[form.key].includeForm.value).map((form) => form.formNumber),
      ...dvFormOptions.filter((form) => workspace[form.key].includeForm.value).map((form) => form.formNumber),
      'FL-105/GC-120',
      ...(shouldIncludeFl341
        ? [
          'FL-341',
          ...(workspace.fl100.childCustodyVisitation.attachments.formFl341a.value ? ['FL-341(A)'] : []),
          ...(workspace.fl100.childCustodyVisitation.attachments.formFl341b.value ? ['FL-341(B)'] : []),
          ...(workspace.fl100.childCustodyVisitation.attachments.formFl341c.value ? ['FL-341(C)'] : []),
          ...(workspace.fl100.childCustodyVisitation.attachments.formFl341d.value ? ['FL-341(D)'] : []),
          ...(workspace.fl100.childCustodyVisitation.attachments.formFl341e.value ? ['FL-341(E)'] : []),
        ]
        : []),
    ]
    : [
      ...(workspace.fl100.includeForm.value ? ['FL-100'] : []),
      ...(workspace.fl300.includeForm.value ? ['FL-300'] : []),
      ...(workspace.fl140.includeForm.value ? ['FL-140'] : []),
      ...(workspace.fl141.includeForm.value ? ['FL-141'] : []),
      ...(workspace.fl142.includeForm.value ? ['FL-142'] : []),
      ...(workspace.fl160.includeForm.value ? ['FL-160'] : []),
      ...(workspace.fl150.includeForm.value ? ['FL-150'] : []),
      ...(workspace.fl110.includeForm.value ? ['FL-110'] : []),
      ...(workspace.fl115.includeForm.value ? ['FL-115'] : []),
      ...(workspace.fl117.includeForm.value ? ['FL-117'] : []),
      ...(workspace.fl120.includeForm.value ? ['FL-120'] : []),
      ...(workspace.fl342.includeForm.value ? ['FL-342'] : []),
      ...(workspace.fl343.includeForm.value ? ['FL-343'] : []),
      ...(workspace.fl130.includeForm.value ? ['FL-130'] : []),
      ...(workspace.fl144.includeForm.value ? ['FL-144'] : []),
      ...(workspace.fl170.includeForm.value ? ['FL-170'] : []),
      ...(workspace.fl180.includeForm.value ? ['FL-180'] : []),
      ...(workspace.fl190.includeForm.value ? ['FL-190'] : []),
      ...(workspace.fl345.includeForm.value ? ['FL-345'] : []),
      ...(workspace.fl348.includeForm.value ? ['FL-348'] : []),
      ...remainingFlFormOptions.filter((form) => workspace[form.key].includeForm.value).map((form) => form.formNumber),
      ...dvFormOptions.filter((form) => workspace[form.key].includeForm.value).map((form) => form.formNumber),
      ...(shouldIncludeFl341
        ? [
          'FL-341',
          ...(workspace.fl100.childCustodyVisitation.attachments.formFl341a.value ? ['FL-341(A)'] : []),
          ...(workspace.fl100.childCustodyVisitation.attachments.formFl341b.value ? ['FL-341(B)'] : []),
          ...(workspace.fl100.childCustodyVisitation.attachments.formFl341c.value ? ['FL-341(C)'] : []),
          ...(workspace.fl100.childCustodyVisitation.attachments.formFl341d.value ? ['FL-341(D)'] : []),
          ...(workspace.fl100.childCustodyVisitation.attachments.formFl341e.value ? ['FL-341(E)'] : []),
        ]
        : []),
    ];
  const isDissolutionProceeding = workspace.fl100.proceedingType.value === 'dissolution';
  const isMarriageRelationship = workspace.fl100.relationshipType.value === 'marriage'
    || workspace.fl100.relationshipType.value === 'both';
  const isDomesticPartnershipRelationship = workspace.fl100.relationshipType.value === 'domestic_partnership'
    || workspace.fl100.relationshipType.value === 'both';
  const isNullityProceeding = workspace.fl100.proceedingType.value === 'nullity';
  const petitionerQualifiesResidencyByMonths = qualifiesForResidency(
    workspace.fl100.residency.petitionerCaliforniaMonths.value,
    workspace.fl100.residency.petitionerCountyMonths.value,
  );
  const respondentQualifiesResidencyByMonths = qualifiesForResidency(
    workspace.fl100.residency.respondentCaliforniaMonths.value,
    workspace.fl100.residency.respondentCountyMonths.value,
  );
  const hasDomesticPartnershipResidencyException = isDomesticPartnershipRelationship
    && workspace.fl100.domesticPartnership.establishment.value === 'not_established_in_california'
    && workspace.fl100.domesticPartnership.californiaResidencyException.value;
  const hasSameSexMarriageJurisdictionException = isMarriageRelationship
    && workspace.fl100.domesticPartnership.sameSexMarriageJurisdictionException.value;
  const hasJurisdictionException = hasDomesticPartnershipResidencyException || hasSameSexMarriageJurisdictionException;
  const hasOverflowMinorChildren = workspace.children.length > FL105_FORM_CAPACITY.childrenRows;
  const overflowMinorChildrenCount = Math.max(workspace.children.length - FL105_FORM_CAPACITY.childrenRows, 0);
  const generatedChildAttachmentPageCount = getGeneratedChildAttachmentPageCount(overflowMinorChildrenCount);
  const fl105ResidenceHistoryRowCount = workspace.fl105.residenceHistory.filter(hasFl105ResidenceHistoryData).length;
  const fl105ResidenceHistoryOverflowCount = getFl105ResidenceHistoryOverflowCount(workspace.fl105.residenceHistory);
  const fl105AdditionalChildrenRequired = !workspace.fl105.childrenLivedTogetherPastFiveYears.value && workspace.children.length > 1;
  const fl105AdditionalChildSectionCount = fl105AdditionalChildrenRequired
    ? getFl105AdditionalChildSectionCount(workspace.fl105.additionalChildrenAttachments)
    : 0;
  const fl105AdditionalChildAttachmentPageCount = fl105AdditionalChildrenRequired
    ? getFl105AdditionalChildAttachmentPageCount(workspace.fl105.additionalChildrenAttachments)
    : 0;
  const fl105ProceedingOverflowCount = getFl105OtherProceedingOverflowCount(workspace.fl105.otherProceedings);
  const fl105OrderOverflowCount = getFl105OrderOverflowCount(workspace.fl105.domesticViolenceOrders);
  const fl105ClaimantOverflowCount = getFl105ClaimantOverflowCount(workspace.fl105.otherClaimants);
  const hasAutoGeneratedFl105Attachments = generatedChildAttachmentPageCount > 0
    || fl105AdditionalChildAttachmentPageCount > 0
    || ((workspace.fl105.additionalResidenceAddressesOnAttachment3a.value || fl105ResidenceHistoryOverflowCount > 0) && fl105ResidenceHistoryRowCount > 0)
    || fl105ProceedingOverflowCount > 0
    || fl105OrderOverflowCount > 0
    || fl105ClaimantOverflowCount > 0;

  const missingForForm = (prefixes: string[]) => missingItems.filter((item) => prefixes.some((prefix) => item.startsWith(prefix)));
  const getMissingItemTargetId = (item: string) => {
    if (item.startsWith('Dissolution residency')) return 'draft-field-residency-path';
    if (item === 'FL-300 TO/served party selection') return 'draft-field-fl300-served-party';
    if (item === 'FL-300 signature date') return 'draft-field-fl300-signature-date';
    if (item === 'FL-300 facts supporting requested orders') return 'draft-field-fl300-facts';
    if (item.startsWith('FL-300')) return 'draft-section-fl300';
    if (item.startsWith('FL-150')) return 'draft-section-fl150';
    return null;
  };
  const jumpToMissingItem = (item: string) => {
    try {
      const targetId = getMissingItemTargetId(item);
      if (!targetId) {
        toast.message('That item is not mapped to a field yet.');
        return;
      }
      if (item.startsWith('FL-300') || targetId.startsWith('draft-field-fl300')) {
        setSimplePanelsOpen((current) => ({ ...current, fl300: true }));
      }
      if (targetId === 'draft-section-fl150') {
        setSimplePanelsOpen((current) => ({ ...current, fl150: true }));
      }
      window.setTimeout(() => {
        try {
          const target = document.getElementById(targetId);
          if (!target) {
            toast.message('That field is not visible on this page yet.');
            return;
          }
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch {
          toast.message('Could not jump to that field, but you are still on this page.');
        }
      }, 150);
    } catch {
      toast.message('Could not jump to that field, but you are still on this page.');
    }
  };
  const fl100Missing = workspace.fl100.includeForm.value ? missingItems.filter((item) => !item.startsWith('FL-105') && !item.startsWith('FL-115') && !item.startsWith('FL-117') && !item.startsWith('FL-120') && !item.startsWith('FL-160') && !item.startsWith('FL-342') && !item.startsWith('FL-343') && !item.startsWith('FL-300') && !item.startsWith('FL-165') && !item.startsWith('FL-182') && !item.startsWith('FL-191') && !item.startsWith('FL-195') && !item.startsWith('FL-272') && !item.startsWith('FL-342(A)') && !item.startsWith('FL-346') && !item.startsWith('FL-347') && !item.startsWith('FL-435') && !item.startsWith('FL-460') && !item.startsWith('FL-830') && !item.startsWith('FW-001') && !item.startsWith('FW-003') && !item.startsWith('FW-010') && !item.startsWith('FL-140') && !item.startsWith('FL-141') && !item.startsWith('FL-142') && !item.startsWith('FL-150') && !item.startsWith('FL-341') && !item.startsWith('FL-311') && !item.startsWith('FL-312') && !item.startsWith('Child ')) : [];
  const fl110Missing: string[] = [];
  const fl115Missing = workspace.fl115.includeForm.value ? missingForForm(['FL-115']) : [];
  const fl117Missing = workspace.fl117.includeForm.value ? missingForForm(['FL-117']) : [];
  const fl120Missing = workspace.fl120.includeForm.value ? missingForForm(['FL-120']) : [];
  const fl160Missing = workspace.fl160.includeForm.value ? missingForForm(['FL-160']) : [];
  const fl342Missing = workspace.fl342.includeForm.value ? missingForForm(['FL-342']) : [];
  const fl343Missing = workspace.fl343.includeForm.value ? missingForForm(['FL-343']) : [];
  const fl130Missing = workspace.fl130.includeForm.value ? missingForForm(['FL-130']) : [];
  const fl144Missing = workspace.fl144.includeForm.value ? missingForForm(['FL-144']) : [];
  const fl170Missing = workspace.fl170.includeForm.value ? missingForForm(['FL-170']) : [];
  const fl180Missing = workspace.fl180.includeForm.value ? missingForForm(['FL-180']) : [];
  const fl190Missing = workspace.fl190.includeForm.value ? missingForForm(['FL-190']) : [];
  const fl345Missing = workspace.fl345.includeForm.value ? missingForForm(['FL-345']) : [];
  const fl348Missing = workspace.fl348.includeForm.value ? missingForForm(['FL-348']) : [];
  const fl105Missing = workspace.hasMinorChildren.value ? [...missingForForm(['FL-105', 'Child ']), ...(missingItems.includes('At least one child entry or unborn child selection') ? ['At least one child entry or unborn child selection'] : [])] : [];
  const fl300Missing = workspace.fl300.includeForm.value ? missingForForm(['FL-300']) : [];
  const fl140Missing = workspace.fl140.includeForm.value ? missingForForm(['FL-140']) : [];
  const fl141Missing = workspace.fl141.includeForm.value ? missingForForm(['FL-141']) : [];
  const fl142Missing = workspace.fl142.includeForm.value ? missingForForm(['FL-142']) : [];
  const fl150Missing = workspace.fl150.includeForm.value ? missingForForm(['FL-150']) : [];
  const fl341Missing = shouldIncludeFl341 ? missingForForm(['FL-341', 'FL-311', 'FL-312']) : [];
  const formOverview = [
    { form: 'FL-100', title: 'Petition', status: workspace.fl100.includeForm.value ? (fl100Missing.length ? 'Needs review' : 'Ready') : 'Optional', note: workspace.fl100.includeForm.value ? (fl100Missing[0] ?? 'Core petition facts are ready.') : 'Use for petitioner-side divorce starts.' },
    { form: 'FL-110', title: 'Summons', status: workspace.fl110.includeForm.value ? (fl110Missing.length ? 'Needs review' : 'Ready') : 'Optional', note: workspace.fl110.includeForm.value ? 'Uses the same caption and party information.' : 'Use with FL-100 when starting divorce.' },
    { form: 'FL-115', title: 'Proof of Service of Summons', status: workspace.fl115.includeForm.value ? (fl115Missing.length ? 'Needs review' : 'Ready') : 'Optional', note: workspace.fl115.includeForm.value ? (fl115Missing[0] ?? 'Proof of service form is ready.') : 'Use after summons/petition service is completed.' },
    { form: 'FL-117', title: 'Notice and Acknowledgment of Receipt', status: workspace.fl117.includeForm.value ? (fl117Missing.length ? 'Needs review' : 'Ready') : 'Optional', note: workspace.fl117.includeForm.value ? (fl117Missing[0] ?? 'Acknowledgment service form is ready.') : 'Use when respondent signs acknowledgment of service.' },
    { form: 'FL-120', title: 'Response', status: workspace.fl120.includeForm.value ? (fl120Missing.length ? 'Needs review' : 'Ready') : 'Optional', note: workspace.fl120.includeForm.value ? (fl120Missing[0] ?? 'Response form is ready.') : 'Use for respondent-side filing flow.' },
    { form: 'FL-160', title: 'Property Declaration', status: workspace.fl160.includeForm.value ? (fl160Missing.length ? 'Needs review' : 'Ready') : 'Optional', note: workspace.fl160.includeForm.value ? (fl160Missing[0] ?? 'Property declaration is ready.') : 'Use for property items listed on FL-160.' },
    { form: 'FL-342', title: 'Child Support Order Attachment', status: workspace.fl342.includeForm.value ? (fl342Missing.length ? 'Needs review' : 'Ready') : 'Optional', note: workspace.fl342.includeForm.value ? (fl342Missing[0] ?? 'Child support attachment is ready.') : 'Use for child support orders.' },
    { form: 'FL-343', title: 'Support Order Attachment', status: workspace.fl343.includeForm.value ? (fl343Missing.length ? 'Needs review' : 'Ready') : 'Optional', note: workspace.fl343.includeForm.value ? (fl343Missing[0] ?? 'Support attachment is ready.') : 'Use for spousal/partner/family support orders.' },
    { form: 'FL-130', title: 'Appearance/Stipulations/Waivers', status: workspace.fl130.includeForm.value ? (fl130Missing.length ? 'Needs review' : 'Ready') : 'Optional', note: workspace.fl130.includeForm.value ? (fl130Missing[0] ?? 'FL-130 core fields are ready.') : 'Use for respondent appearance and judgment stipulations.' },
    { form: 'FL-144', title: 'Stipulation to Waive Final Disclosure', status: workspace.fl144.includeForm.value ? (fl144Missing.length ? 'Needs review' : 'Ready') : 'Optional', note: workspace.fl144.includeForm.value ? (fl144Missing[0] ?? 'FL-144 core fields are ready.') : 'Use when parties agree to waive final declarations.' },
    { form: 'FL-170', title: 'Declaration for Default or Uncontested Judgment', status: workspace.fl170.includeForm.value ? (fl170Missing.length ? 'Needs review' : 'Ready') : 'Optional', note: workspace.fl170.includeForm.value ? (fl170Missing[0] ?? 'FL-170 core fields are ready.') : 'Use for default/uncontested judgment declarations.' },
    { form: 'FL-180', title: 'Judgment', status: workspace.fl180.includeForm.value ? (fl180Missing.length ? 'Needs review' : 'Ready') : 'Optional', note: workspace.fl180.includeForm.value ? (fl180Missing[0] ?? 'FL-180 core fields are ready.') : 'Core judgment page with dates and summary orders.' },
    { form: 'FL-190', title: 'Notice of Entry of Judgment', status: workspace.fl190.includeForm.value ? (fl190Missing.length ? 'Needs review' : 'Ready') : 'Optional', note: workspace.fl190.includeForm.value ? (fl190Missing[0] ?? 'FL-190 core fields are ready.') : 'Notice after judgment entry.' },
    { form: 'FL-345', title: 'Property Order Attachment', status: workspace.fl345.includeForm.value ? (fl345Missing.length ? 'Needs review' : 'Ready') : 'Optional', note: workspace.fl345.includeForm.value ? (fl345Missing[0] ?? 'FL-345 core fields are ready.') : 'Use for practical property/debt summaries.' },
    { form: 'FL-348', title: 'Pension Benefits Attachment', status: workspace.fl348.includeForm.value ? (fl348Missing.length ? 'Needs review' : 'Ready') : 'Optional', note: workspace.fl348.includeForm.value ? (fl348Missing[0] ?? 'FL-348 core fields are ready.') : 'Use only when retirement/pension division applies.' },
    ...remainingFlFormOptions.map((form) => {
      const issues = getRemainingFlReadinessIssues(workspace[form.key], form.formNumber);
      const status = (workspace[form.key].includeForm.value ? (issues.length ? 'Needs review' : 'Ready') : 'Optional') as 'Needs review' | 'Ready' | 'Optional';
      return { form: form.formNumber, title: form.title, status, note: workspace[form.key].includeForm.value ? (issues[0] ?? `${form.formNumber} core fields are ready.`) : form.note };
    }),
    ...dvFormOptions.map((form) => {
      const issues = getDvReadinessIssues(workspace[form.key], form.formNumber);
      const status = (workspace[form.key].includeForm.value ? (issues.length ? 'Needs review' : 'Ready') : 'Optional') as 'Needs review' | 'Ready' | 'Optional';
      return { form: form.formNumber, title: form.title, status, note: workspace[form.key].includeForm.value ? (issues[0] ?? `${form.formNumber} core fields are ready.`) : form.note };
    }),
    { form: 'FL-105', title: 'UCCJEA child custody declaration', status: workspace.hasMinorChildren.value ? (fl105Missing.length ? 'Needs review' : 'Ready') : 'Not selected', note: workspace.hasMinorChildren.value ? (fl105Missing[0] ?? 'Child declaration is ready.') : 'Only included when minor children are enabled.' },
    { form: 'FL-300', title: 'Request for Order', status: workspace.fl300.includeForm.value ? (fl300Missing.length ? 'Needs review' : 'Ready') : 'Optional', note: workspace.fl300.includeForm.value ? (fl300Missing[0] ?? 'Optional RFO is ready.') : 'Leave off unless filing a request for orders now.' },
    { form: 'FL-140', title: 'Declaration of Disclosure', status: workspace.fl140.includeForm.value ? (fl140Missing.length ? 'Needs review' : 'Ready') : 'Optional', note: workspace.fl140.includeForm.value ? (fl140Missing[0] ?? 'Disclosure declaration is ready.') : 'Use when preparing preliminary/final financial disclosures.' },
    { form: 'FL-141', title: 'Declaration re Service of Disclosure', status: workspace.fl141.includeForm.value ? (fl141Missing.length ? 'Needs review' : 'Ready') : 'Optional', note: workspace.fl141.includeForm.value ? (fl141Missing[0] ?? 'Disclosure service declaration is ready.') : 'Use after disclosure documents are served.' },
    { form: 'FL-142', title: 'Schedule of Assets and Debts', status: workspace.fl142.includeForm.value ? (fl142Missing.length ? 'Needs review' : 'Ready') : 'Optional', note: workspace.fl142.includeForm.value ? (fl142Missing[0] ?? 'Assets/debts schedule is ready.') : 'Use with FL-140 financial disclosures.' },
    { form: 'FL-150', title: 'Income and Expense Declaration', status: workspace.fl150.includeForm.value ? (fl150Missing.length ? 'Needs review' : 'Ready') : 'Optional', note: workspace.fl150.includeForm.value ? (fl150Missing[0] ?? 'Financial declaration is ready.') : 'Recommended for support or fee requests.' },
    { form: 'FL-341', title: 'Custody/visitation attachments', status: shouldIncludeFl341 ? (fl341Missing.length ? 'Needs review' : 'Ready') : 'Optional', note: shouldIncludeFl341 ? (fl341Missing[0] ?? 'Selected custody attachments are ready.') : 'Only included when custody attachment boxes are selected.' },
  ] as const;
  const activeFormOverview = formOverview.filter((item) => item.status !== 'Optional' && item.status !== 'Not selected');
  const fl142AssetLabels = [
    ['realEstate', 'Real estate'], ['household', 'Household furniture/furnishings'], ['jewelryArt', 'Jewelry, art, collections'], ['vehicles', 'Vehicles/boats/trailers'],
    ['savings', 'Savings accounts'], ['checking', 'Checking accounts'], ['creditUnion', 'Credit union/deposit accounts'], ['cash', 'Cash'], ['taxRefund', 'Tax refund'],
    ['lifeInsurance', 'Life insurance cash value'], ['stocksBonds', 'Stocks/bonds/mutual funds'], ['retirement', 'Retirement and pensions'], ['profitSharingIra', 'Profit sharing/annuities/IRAs'],
    ['accountsReceivable', 'Accounts receivable/notes'], ['businessInterests', 'Business interests'], ['otherAssets', 'Other assets'],
  ] as const;
  const fl142DebtLabels = [
    ['studentLoans', 'Student loans'], ['taxes', 'Taxes'], ['supportArrearages', 'Support arrearages'], ['unsecuredLoans', 'Unsecured loans'], ['creditCards', 'Credit cards'], ['otherDebts', 'Other debts'],
  ] as const;
  const supportSnapshotAvailable = workspace.fl150.includeForm.value
    || workspace.fl300.requestTypes.childSupport.value
    || workspace.fl300.requestTypes.spousalSupport.value
    || workspace.fl300.requestTypes.attorneyFeesCosts.value;
  const lastAutosavedLabel = workspace.updatedAt
    ? new Date(workspace.updatedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;
  const intakeReviewFacts = collectIntakeReviewFacts(workspace)
    .filter((fact) => isPathActiveForIntakeReview(fact.path, workspace));
  const pendingStagedFacts = (workspace.intake.extractedFacts ?? []).filter((fact) => fact.status === 'pending');
  const intakeNeedsReviewCount = intakeReviewFacts.filter((fact) => fact.field.needsReview).length;
  const approveIntakeFact = (path: string[]) => commitWorkspace((current) => updateFieldAtPath(current, path, (field) => ({ ...field, needsReview: false })));
  const getIntakeFactKey = (path: string[]) => path.join('.');
  const parseIntakeFactEditValue = (rawValue: string, originalValue: unknown) => {
    const trimmedValue = rawValue.trim();
    if (typeof originalValue === 'boolean') {
      const normalized = trimmedValue.toLowerCase();
      if (['yes', 'true', '1', 'y'].includes(normalized)) return true;
      if (['no', 'false', '0', 'n'].includes(normalized)) return false;
      throw new Error('For yes/no fields, enter yes or no.');
    }
    if (Array.isArray(originalValue)) {
      return trimmedValue.split(',').map((part) => part.trim()).filter(Boolean);
    }
    return trimmedValue;
  };
  const beginEditIntakeFact = (fact: IntakeReviewFact) => {
    setEditingIntakeFactKey(getIntakeFactKey(fact.path));
    setEditingIntakeFactValue(formatIntakeValue(fact.field.value));
  };
  const cancelEditIntakeFact = () => {
    setEditingIntakeFactKey(null);
    setEditingIntakeFactValue('');
  };
  const saveEditedIntakeFact = (fact: IntakeReviewFact) => {
    let nextValue: unknown;
    try {
      nextValue = parseIntakeFactEditValue(editingIntakeFactValue, fact.field.value);
    } catch (error) {
      toast.message(error instanceof Error ? error.message : 'Could not save that value.');
      return;
    }
    commitWorkspace((current) => updateFieldAtPath(current, fact.path, (field) => ({
      ...field,
      value: nextValue,
      sourceType: 'manual',
      sourceLabel: 'Edited in Intake Review',
      confidence: 'high',
      needsReview: false,
      updatedAt: new Date().toISOString(),
    } as DraftField<unknown>)));
    cancelEditIntakeFact();
    toast.success('Edited and approved intake fact.');
  };
  const beginEditPendingFact = (fact: DraftIntakeFact) => {
    setEditingPendingFactId(fact.id);
    setEditingPendingFactValue(formatIntakeValue(fact.value));
  };
  const cancelEditPendingFact = () => {
    setEditingPendingFactId(null);
    setEditingPendingFactValue('');
  };
  const saveEditedPendingFact = (fact: DraftIntakeFact) => {
    let nextValue: string | boolean;
    try {
      nextValue = parseIntakeFactEditValue(editingPendingFactValue, fact.value) as string | boolean;
    } catch (error) {
      toast.message(error instanceof Error ? error.message : 'Could not save that value.');
      return;
    }

    commitWorkspace((current) => ({
      ...current,
      intake: {
        ...current.intake,
        extractedFacts: (current.intake.extractedFacts ?? []).map((candidate) => (
          candidate.id === fact.id
            ? {
              ...candidate,
              value: nextValue,
              sourceType: 'manual' as const,
              sourceLabel: 'Edited in Intake Review',
              confidence: 'high' as const,
            }
            : candidate
        )),
      },
    }));
    cancelEditPendingFact();
    toast.success('Edited pending fact.');
  };
  const clearIntakeFact = (path: string[]) => commitWorkspace((current) => updateFieldAtPath(current, path, clearDraftFieldValue));
  const applyPendingFact = (fact: DraftIntakeFact) => commitWorkspace((current) => applyStagedIntakeFact(current, fact));
  const dismissPendingFact = (factId: string) => commitWorkspace((current) => dismissStagedIntakeFact(current, factId));
  const applyAllPendingFacts = () => commitWorkspace((current) => pendingStagedFacts.reduce((next, fact) => applyStagedIntakeFact(next, fact), current));
  const applyPacketPreset = (presetId: DraftPacketPresetId) => {
    commitWorkspace((current) => applyDraftPacketPreset(current, presetId));
    toast.success(`${DRAFT_PACKET_PRESET_LABELS[presetId]} preset applied`, {
      description: 'Relevant forms were selected and blank defaults were filled without replacing existing text fields.',
    });
  };
  const approveAllIntakeFacts = () => commitWorkspace((current) => {
    let next = current;
    collectIntakeReviewFacts(current)
      .filter((fact) => isPathActiveForIntakeReview(fact.path, current))
      .filter((fact) => fact.field.needsReview)
      .forEach((fact) => {
        next = updateFieldAtPath(next, fact.path, (field) => ({ ...field, needsReview: false }));
      });
    return next;
  });

  const jumpToDraftSection = (sectionId: string) => {
    window.setTimeout(() => {
      const target = document.getElementById(sectionId);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const unifiedIntakeStages = [
    {
      label: 'Choose packet',
      status: includedForms.length > 0 ? `${includedForms.length} form${includedForms.length === 1 ? '' : 's'} selected` : 'Pick a workflow',
      state: includedForms.length > 0 ? 'done' : 'attention',
      actionLabel: 'Open packet builder',
      onClick: () => jumpToDraftSection('draft-section-packet-presets'),
    },
    {
      label: 'Review intake facts',
      status: pendingStagedFacts.length > 0
        ? `${pendingStagedFacts.length} pending fact${pendingStagedFacts.length === 1 ? '' : 's'}`
        : intakeNeedsReviewCount > 0
          ? `${intakeNeedsReviewCount} fact${intakeNeedsReviewCount === 1 ? '' : 's'} need approval`
          : 'Facts reviewed',
      state: pendingStagedFacts.length > 0 || intakeNeedsReviewCount > 0 ? 'attention' : 'done',
      actionLabel: 'Open intake review',
      onClick: () => jumpToDraftSection('draft-section-intake-review'),
    },
    {
      label: 'Complete form answers',
      status: missingItems.length > 0
        ? `${missingItems.length} missing item${missingItems.length === 1 ? '' : 's'}`
        : 'Required answers complete',
      state: missingItems.length > 0 ? 'attention' : 'done',
      actionLabel: missingItems.length > 0 ? 'Show first missing' : 'Review fields',
      onClick: () => missingItems[0] ? jumpToMissingItem(missingItems[0]) : jumpToDraftSection('draft-section-form-fields'),
    },
    {
      label: 'Generate draft packet',
      status: generatedPacketName ? 'PDF saved' : missingItems.length > 0 ? 'Waiting on intake' : 'Ready to generate',
      state: generatedPacketName || missingItems.length === 0 ? 'done' : 'locked',
      actionLabel: 'Open generate panel',
      onClick: () => jumpToDraftSection('draft-section-generate'),
    },
  ] as const;

  const handleSaveDraftForLater = async () => {
    const saved = saveDraftWorkspace({
      ...workspace,
      status: missingItems.length === 0 ? 'ready' : 'in_review',
    });
    setWorkspace(saved);
    try {
      await saveDraftWorkspaceToServer(saved);
      toast.success('Draft saved for later.', {
        description: missingItems.length === 0
          ? 'This draft is marked ready and can still be edited.'
          : `${missingItems.length} item${missingItems.length === 1 ? '' : 's'} still need review before generating.`,
      });
    } catch (error) {
      console.error('Draft saved locally but failed to sync to server.', error);
      toast.warning('Draft saved locally; cloud sync failed.', {
        description: error instanceof Error ? error.message : 'You can keep working in this browser. Server sync needs attention.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_14%_0%,rgba(16,185,129,0.16),transparent_24%),radial-gradient(circle_at_86%_8%,rgba(59,130,246,0.12),transparent_20%),linear-gradient(180deg,#f8fafc_0%,#ecfdf5_45%,#f8fafc_100%)] py-12 dark:bg-[radial-gradient(circle_at_16%_0%,rgba(16,185,129,0.16),transparent_24%),radial-gradient(circle_at_84%_8%,rgba(59,130,246,0.14),transparent_20%),linear-gradient(180deg,#020617_0%,#03111f_50%,#020617_100%)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge className="mb-3 border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
              Unified Draft Intake
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">One intake → one draft packet</h1>
            <div className="mt-4 max-w-xl">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400" htmlFor="draft-workspace-title">Draft name</label>
              <Input
                id="draft-workspace-title"
                className="mt-2 bg-white/80 text-base font-semibold text-slate-950 dark:bg-white/10 dark:text-white"
                value={workspace.title}
                placeholder="Name this draft workspace"
                onChange={(event) => commitWorkspace((current) => ({ ...current, title: event.target.value }))}
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">This is the saved workspace name. Generated packets still get their own PDF filename.</p>
            </div>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
              The wizard, intake review, form fields, and PDF generation now live as one draft setup flow instead of separate tools. Structured form data stays the source of truth.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/70 px-3 py-1 dark:border-white/10 dark:bg-white/5">
                <Clock3 className="h-3.5 w-3.5" />
                {lastAutosavedLabel ? `Autosaved locally ${lastAutosavedLabel}` : 'Not autosaved yet'}
              </span>
              <span className="text-xs">Edits autosave in this browser. Use “Save draft for later” to sync the workspace record.</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" className="rounded-full" onClick={handleSaveDraftForLater}>
              <Save className="mr-2 h-4 w-4" />
              Save draft for later
            </Button>
            <div className="flex rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm dark:border-white/10 dark:bg-white/5" aria-label="Draft Forms mode">
              <Button
                type="button"
                variant={formMode === 'simple' ? 'default' : 'ghost'}
                size="sm"
                className={cn('rounded-full', formMode === 'simple' && 'bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-600')}
                onClick={() => setFormMode('simple')}
              >
                Simple mode
              </Button>
              <Button
                type="button"
                variant={formMode === 'advanced' ? 'default' : 'ghost'}
                size="sm"
                className={cn('rounded-full', formMode === 'advanced' && 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950')}
                onClick={() => setFormMode('advanced')}
              >
                Advanced field editor
              </Button>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/forms">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to forms
              </Link>
            </Button>
            <Button asChild className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500">
              <Link to="/">Back to Maria chat</Link>
            </Button>
          </div>
        </div>

        <Card className="mb-6 overflow-hidden rounded-[2rem] border-emerald-200/70 bg-white/90 shadow-xl backdrop-blur dark:border-emerald-400/20 dark:bg-white/5">
          <CardHeader className="border-b border-emerald-100/80 bg-emerald-50/70 dark:border-emerald-400/10 dark:bg-emerald-400/10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-950 dark:text-white">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  Intake-to-draft builder
                </CardTitle>
                <CardDescription className="mt-2 max-w-3xl">
                  Start with the case story, choose the packet, approve the facts Maria found, fill only the gaps, then generate. No separate wizard handoff.
                </CardDescription>
              </div>
              <Badge variant="outline" className="rounded-full border-emerald-200 bg-white/80 text-emerald-800 dark:border-emerald-400/20 dark:bg-white/10 dark:text-emerald-100">
                {progressValue}% complete
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
            {unifiedIntakeStages.map((stage, index) => (
              <button
                key={stage.label}
                type="button"
                onClick={stage.onClick}
                className={cn(
                  'group rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                  stage.state === 'done' && 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-400/10',
                  stage.state === 'attention' && 'border-amber-200 bg-amber-50/80 dark:border-amber-400/20 dark:bg-amber-400/10',
                  stage.state === 'locked' && 'border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-white/5',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100">{index + 1}</span>
                  {stage.state === 'done' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Clock3 className="h-5 w-5 text-amber-600" />}
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-950 dark:text-white">{stage.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{stage.status}</p>
                <p className="mt-3 text-xs font-semibold text-emerald-700 group-hover:text-emerald-800 dark:text-emerald-200">{stage.actionLabel} →</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <div id="draft-section-form-fields" className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-6">
            {formMode === 'simple' && (
              <>
              <Card id="draft-section-packet-presets" className="scroll-mt-28 rounded-[1.75rem] border-white/70 bg-white/85 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-950 dark:text-white">
                    <Wand2 className="h-5 w-5 text-emerald-600" />
                    Packet presets
                  </CardTitle>
                  <CardDescription>
                    Choose a common workflow to turn on the right forms. Presets fill only blank helper defaults and will not replace names, dates, amounts, or text you already entered.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
                      Selected: {DRAFT_PACKET_PRESET_LABELS[workspace.selectedPreset.value] ?? 'Custom packet'}
                    </Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Current forms: {includedForms.join(', ')}</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {packetPresetOptions.map((preset) => (
                      <div key={preset.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950 dark:text-white">{DRAFT_PACKET_PRESET_LABELS[preset.id]}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{preset.description}</p>
                          </div>
                          {workspace.selectedPreset.value === preset.id && <Badge className="bg-emerald-700 text-white">Active</Badge>}
                        </div>
                        <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">{preset.forms}</p>
                        <Button type="button" size="sm" variant="outline" className="mt-4 rounded-full" onClick={() => applyPacketPreset(preset.id)}>
                          Apply preset
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-950 dark:text-white">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    Court-form checklist
                  </CardTitle>
                  <CardDescription>
                    Start with what is on the forms, what Maria already filled, what is missing, then generate.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {activeFormOverview.map((item) => (
                      <div key={item.form} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950 dark:text-white">{item.form}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.title}</p>
                          </div>
                          <FormStatusBadge status={item.status} />
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-200">{item.note}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-200">Forms in scope</p>
                        <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
                          Add or remove optional forms here. Required starter-packet forms stay on unless their facts make them inapplicable.
                        </p>
                      </div>
                      <Badge variant="outline" className="rounded-full border-emerald-200 bg-white/70 text-emerald-800 dark:border-emerald-400/20 dark:bg-white/10 dark:text-emerald-100">
                        {includedForms.length} included
                      </Badge>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <ScopeToggle
                        title="FL-100 Petition"
                        description="Petitioner-side form to start divorce/legal separation/nullity. Turn off for response, RFO, judgment-only, or DV packets."
                        checked={workspace.fl100.includeForm.value}
                        field={workspace.fl100.includeForm}
                        onCheckedChange={(checked) => updateFl100((fl100) => ({ ...fl100, includeForm: setDraftFieldValue(fl100.includeForm, checked) }))}
                      />
                      <ScopeToggle
                        title="FL-110 Summons"
                        description="Summons used with FL-100 starter packets. Turn off when it is not part of this packet."
                        checked={workspace.fl110.includeForm.value}
                        field={workspace.fl110.includeForm}
                        onCheckedChange={(checked) => updateFl110((fl110) => ({ ...fl110, includeForm: setDraftFieldValue(fl110.includeForm, checked) }))}
                      />
                      <ScopeToggle
                        title="FL-105 / GC-120"
                        description="Included when minor children are part of the case. Turning this off also removes the UCCJEA declaration."
                        checked={workspace.hasMinorChildren.value}
                        field={workspace.hasMinorChildren}
                        onCheckedChange={(checked) => commitWorkspace((current) => ({
                          ...current,
                          hasMinorChildren: setDraftFieldValue(current.hasMinorChildren, checked),
                        }))}
                      />
                      <ScopeToggle
                        title="FL-300 Request for Order"
                        description="Use when asking the court for temporary/new/changed orders now."
                        checked={workspace.fl300.includeForm.value}
                        field={workspace.fl300.includeForm}
                        onCheckedChange={(checked) => updateFl300((fl300) => ({ ...fl300, includeForm: setDraftFieldValue(fl300.includeForm, checked) }))}
                      />
                      <ScopeToggle
                        title="FL-150 Income & Expense"
                        description="Recommended for child support, spousal support, or fee requests."
                        checked={workspace.fl150.includeForm.value}
                        field={workspace.fl150.includeForm}
                        onCheckedChange={(checked) => updateFl150((fl150) => ({ ...fl150, includeForm: setDraftFieldValue(fl150.includeForm, checked) }))}
                      />
                      <ScopeToggle
                        title="FL-140 Declaration of Disclosure"
                        description="For preliminary/final financial disclosure packets."
                        checked={workspace.fl140.includeForm.value}
                        field={workspace.fl140.includeForm}
                        onCheckedChange={(checked) => updateFl140((fl140) => ({ ...fl140, includeForm: setDraftFieldValue(fl140.includeForm, checked) }))}
                      />
                      <ScopeToggle
                        title="FL-141 Disclosure Service"
                        description="Proof that preliminary/final disclosures were served."
                        checked={workspace.fl141.includeForm.value}
                        field={workspace.fl141.includeForm}
                        onCheckedChange={(checked) => updateFl141((fl141) => ({ ...fl141, includeForm: setDraftFieldValue(fl141.includeForm, checked) }))}
                      />
                      <ScopeToggle
                        title="FL-142 Assets & Debts"
                        description="Schedule of property, accounts, assets, and debts."
                        checked={workspace.fl142.includeForm.value}
                        field={workspace.fl142.includeForm}
                        onCheckedChange={(checked) => updateFl142((fl142) => ({ ...fl142, includeForm: setDraftFieldValue(fl142.includeForm, checked) }))}
                      />
                      <ScopeToggle
                        title="FL-160 Property Declaration"
                        description="Property declaration attachment for FL-100/financial disclosure property lists."
                        checked={workspace.fl160.includeForm.value}
                        field={workspace.fl160.includeForm}
                        onCheckedChange={(checked) => updateFl160((fl160) => ({ ...fl160, includeForm: setDraftFieldValue(fl160.includeForm, checked) }))}
                      />
                      <ScopeToggle
                        title="FL-115 Proof of Service"
                        description="Use after FL-100/FL-110 service is completed."
                        checked={workspace.fl115.includeForm.value}
                        field={workspace.fl115.includeForm}
                        onCheckedChange={(checked) => updateFl115((fl115) => ({ ...fl115, includeForm: setDraftFieldValue(fl115.includeForm, checked) }))}
                      />
                      <ScopeToggle
                        title="FL-120 Response"
                        description="Respondent-side response to the divorce petition."
                        checked={workspace.fl120.includeForm.value}
                        field={workspace.fl120.includeForm}
                        onCheckedChange={(checked) => updateFl120((fl120) => ({ ...fl120, includeForm: setDraftFieldValue(fl120.includeForm, checked) }))}
                      />
                      <ScopeToggle
                        title="FL-117 Acknowledgment Service"
                        description="Notice and acknowledgment of receipt for service by mail."
                        checked={workspace.fl117.includeForm.value}
                        field={workspace.fl117.includeForm}
                        onCheckedChange={(checked) => updateFl117((fl117) => ({ ...fl117, includeForm: setDraftFieldValue(fl117.includeForm, checked) }))}
                      />
                      <ScopeToggle
                        title="FL-342 Child Support"
                        description="Child support information and order attachment."
                        checked={workspace.fl342.includeForm.value}
                        field={workspace.fl342.includeForm}
                        onCheckedChange={(checked) => updateFl342((fl342) => ({ ...fl342, includeForm: setDraftFieldValue(fl342.includeForm, checked) }))}
                      />
                      <ScopeToggle
                        title="FL-343 Support Order"
                        description="Spousal, domestic partner, or family support order attachment."
                        checked={workspace.fl343.includeForm.value}
                        field={workspace.fl343.includeForm}
                        onCheckedChange={(checked) => updateFl343((fl343) => ({ ...fl343, includeForm: setDraftFieldValue(fl343.includeForm, checked) }))}
                      />
                      <ScopeToggle
                        title="FL-130 Appearance/Stipulations"
                        description="Respondent appearance, stipulations, and waivers for judgment packets."
                        checked={workspace.fl130.includeForm.value}
                        field={workspace.fl130.includeForm}
                        onCheckedChange={(checked) => updateFl130((fl130) => ({ ...fl130, includeForm: setDraftFieldValue(fl130.includeForm, checked) }))}
                      />
                      <ScopeToggle
                        title="FL-144 Waive Final Disclosure"
                        description="Use when parties stipulate to waive final disclosure declarations."
                        checked={workspace.fl144.includeForm.value}
                        field={workspace.fl144.includeForm}
                        onCheckedChange={(checked) => updateFl144((fl144) => ({ ...fl144, includeForm: setDraftFieldValue(fl144.includeForm, checked) }))}
                      />
                      <ScopeToggle
                        title="FL-170 Default/Uncontested"
                        description="Declaration for default or uncontested judgment."
                        checked={workspace.fl170.includeForm.value}
                        field={workspace.fl170.includeForm}
                        onCheckedChange={(checked) => updateFl170((fl170) => ({ ...fl170, includeForm: setDraftFieldValue(fl170.includeForm, checked) }))}
                      />
                      <ScopeToggle
                        title="FL-180 Judgment"
                        description="Core judgment form with key dates and order summaries."
                        checked={workspace.fl180.includeForm.value}
                        field={workspace.fl180.includeForm}
                        onCheckedChange={(checked) => updateFl180((fl180) => ({ ...fl180, includeForm: setDraftFieldValue(fl180.includeForm, checked) }))}
                      />
                      <ScopeToggle
                        title="FL-190 Entry Notice"
                        description="Notice of entry of judgment."
                        checked={workspace.fl190.includeForm.value}
                        field={workspace.fl190.includeForm}
                        onCheckedChange={(checked) => updateFl190((fl190) => ({ ...fl190, includeForm: setDraftFieldValue(fl190.includeForm, checked) }))}
                      />
                      <ScopeToggle
                        title="FL-345 Property Order"
                        description="Property/debt order attachment with practical summaries."
                        checked={workspace.fl345.includeForm.value}
                        field={workspace.fl345.includeForm}
                        onCheckedChange={(checked) => updateFl345((fl345) => ({ ...fl345, includeForm: setDraftFieldValue(fl345.includeForm, checked) }))}
                      />
                      <ScopeToggle
                        title="FL-348 Pension Benefits"
                        description="Retirement/pension benefits attachment when applicable."
                        checked={workspace.fl348.includeForm.value}
                        field={workspace.fl348.includeForm}
                        onCheckedChange={(checked) => updateFl348((fl348) => ({ ...fl348, includeForm: setDraftFieldValue(fl348.includeForm, checked) }))}
                      />
                      <ScopeToggle
                        title="FL-311 Custody/Visitation"
                        description="Add custody and parenting-time request details."
                        checked={workspace.fl100.childCustodyVisitation.attachments.formFl311.value}
                        field={workspace.fl100.childCustodyVisitation.attachments.formFl311}
                        onCheckedChange={(checked) => updateFl100((fl100) => ({
                          ...fl100,
                          childCustodyVisitation: {
                            ...fl100.childCustodyVisitation,
                            attachments: {
                              ...fl100.childCustodyVisitation.attachments,
                              formFl311: setDraftFieldValue(fl100.childCustodyVisitation.attachments.formFl311, checked),
                            },
                          },
                        }))}
                      />
                      <ScopeToggle
                        title="FL-312 Abduction Prevention"
                        description="Use only when there are specific child-abduction prevention concerns."
                        checked={workspace.fl100.childCustodyVisitation.attachments.formFl312.value}
                        field={workspace.fl100.childCustodyVisitation.attachments.formFl312}
                        onCheckedChange={(checked) => updateFl100((fl100) => ({
                          ...fl100,
                          childCustodyVisitation: {
                            ...fl100.childCustodyVisitation,
                            attachments: {
                              ...fl100.childCustodyVisitation.attachments,
                              formFl312: setDraftFieldValue(fl100.childCustodyVisitation.attachments.formFl312, checked),
                            },
                          },
                        }))}
                      />
                      <ScopeToggle
                        title="FL-341 custody order set"
                        description="Master switch for FL-341(A/B/C/D/E). Turning off removes all selected 341 attachments."
                        checked={shouldIncludeFl341}
                        onCheckedChange={(checked) => updateFl100((fl100) => ({
                          ...fl100,
                          childCustodyVisitation: {
                            ...fl100.childCustodyVisitation,
                            attachments: {
                              ...fl100.childCustodyVisitation.attachments,
                              formFl341a: setDraftFieldValue(fl100.childCustodyVisitation.attachments.formFl341a, checked ? fl100.childCustodyVisitation.attachments.formFl341a.value : false),
                              formFl341b: setDraftFieldValue(fl100.childCustodyVisitation.attachments.formFl341b, checked ? fl100.childCustodyVisitation.attachments.formFl341b.value : false),
                              formFl341c: setDraftFieldValue(fl100.childCustodyVisitation.attachments.formFl341c, checked ? fl100.childCustodyVisitation.attachments.formFl341c.value : false),
                              formFl341d: setDraftFieldValue(fl100.childCustodyVisitation.attachments.formFl341d, checked ? fl100.childCustodyVisitation.attachments.formFl341d.value : false),
                              formFl341e: setDraftFieldValue(fl100.childCustodyVisitation.attachments.formFl341e, checked ? fl100.childCustodyVisitation.attachments.formFl341e.value : false),
                            },
                          },
                        }))}
                      />
                    </div>

                    <details className="mt-4 rounded-2xl border border-white/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-800 dark:text-slate-100">Choose individual FL-341 attachments</summary>
                      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                        {([
                          ['formFl341a', 'FL-341(A)', 'Supervised visitation'],
                          ['formFl341b', 'FL-341(B)', 'Child abduction prevention'],
                          ['formFl341c', 'FL-341(C)', 'Holiday schedule'],
                          ['formFl341d', 'FL-341(D)', 'Physical custody provisions'],
                          ['formFl341e', 'FL-341(E)', 'Joint legal custody'],
                        ] as const).map(([key, label, description]) => (
                          <ScopeToggle
                            key={key}
                            title={label}
                            description={description}
                            checked={workspace.fl100.childCustodyVisitation.attachments[key].value}
                            field={workspace.fl100.childCustodyVisitation.attachments[key]}
                            onCheckedChange={(checked) => updateFl100((fl100) => ({
                              ...fl100,
                              childCustodyVisitation: {
                                ...fl100.childCustodyVisitation,
                                attachments: {
                                  ...fl100.childCustodyVisitation.attachments,
                                  [key]: setDraftFieldValue(fl100.childCustodyVisitation.attachments[key], checked),
                                },
                              },
                            }))}
                          />
                        ))}
                      </div>
                    </details>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Already filled / sourced</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Edit imported facts here; changes immediately update the draft packet fields.</p>
                      </div>
                      <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => jumpToDraftSection('draft-section-intake-review')}>
                        Review every sourced fact
                      </Button>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <CompactFact
                        label="Petitioner"
                        value={workspace.petitionerName.value}
                        field={workspace.petitionerName}
                        placeholder="Petitioner full legal name"
                        onChange={(value) => commitWorkspace((current) => ({ ...current, petitionerName: setDraftFieldValue(current.petitionerName, value) }))}
                      />
                      <CompactFact
                        label="Respondent"
                        value={workspace.respondentName.value}
                        field={workspace.respondentName}
                        placeholder="Respondent full legal name"
                        onChange={(value) => commitWorkspace((current) => ({ ...current, respondentName: setDraftFieldValue(current.respondentName, value) }))}
                      />
                      <CompactFact
                        label="County"
                        value={workspace.filingCounty.value}
                        field={workspace.filingCounty}
                        placeholder="County"
                        onChange={(value) => commitWorkspace((current) => ({ ...current, filingCounty: setDraftFieldValue(current.filingCounty, value) }))}
                      />
                      <CompactFact
                        label="Marriage date"
                        value={workspace.marriageDate.value}
                        field={workspace.marriageDate}
                        inputType="date"
                        onChange={(value) => commitWorkspace((current) => ({ ...current, marriageDate: setDraftFieldValue(current.marriageDate, value) }))}
                      />
                      <CompactFact
                        label="Separation date"
                        value={workspace.separationDate.value}
                        field={workspace.separationDate}
                        inputType="date"
                        onChange={(value) => commitWorkspace((current) => ({ ...current, separationDate: setDraftFieldValue(current.separationDate, value) }))}
                      />
                      <CompactFact
                        label="Minor children"
                        value={workspace.hasMinorChildren.value ? 'yes' : 'no'}
                        field={workspace.hasMinorChildren}
                        inputType="select"
                        options={[{ label: `Yes${workspace.children.length ? ` — ${workspace.children.length} listed` : ''}`, value: 'yes' }, { label: 'No minor children', value: 'no' }]}
                        onChange={(value) => commitWorkspace((current) => ({
                          ...current,
                          hasMinorChildren: setDraftFieldValue(current.hasMinorChildren, value === 'yes'),
                        }))}
                      />
                      <CompactFact label="Support snapshot" value={supportSnapshotAvailable ? 'Support/financial facts available' : 'No support snapshot selected'} readOnly />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Missing before generate</p>
                    {missingItems.length === 0 ? (
                      <div className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-200">
                        <CheckCircle2 className="h-4 w-4" />
                        Nothing required is missing. You can generate the packet.
                      </div>
                    ) : (
                      <ul className="mt-3 grid gap-2 text-sm text-slate-700 dark:text-slate-200 md:grid-cols-2">
                        {missingItems.slice(0, 10).map((item) => <li key={item}>• {item}</li>)}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
              </>
            )}

            <Card id="draft-section-intake-review" className="scroll-mt-28 rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-slate-950 dark:text-white">
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                      Intake Review
                    </CardTitle>
                    <CardDescription>
                      Every fact Maria, uploads, profile data, calculators, or manual edits send into the forms should be reviewed here before the packet is generated.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full">{pendingStagedFacts.length} pending</Badge>
                    <Badge variant="outline" className="rounded-full">{intakeReviewFacts.length} in forms</Badge>
                    <Badge variant={intakeNeedsReviewCount ? 'destructive' : 'outline'} className="rounded-full">{intakeNeedsReviewCount} need review</Badge>
                    <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={applyAllPendingFacts} disabled={pendingStagedFacts.length === 0}>
                      Apply all pending
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={approveAllIntakeFacts} disabled={intakeNeedsReviewCount === 0}>
                      Approve all reviewed facts
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {pendingStagedFacts.length > 0 && (
                  <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">Pending extracted facts</p>
                      <p className="text-xs text-emerald-800/80 dark:text-emerald-100/70">These are staged from Maria/uploads and do not drive forms until applied.</p>
                    </div>
                    <div className="max-h-80 space-y-3 overflow-auto pr-1">
                      {pendingStagedFacts.map((fact) => {
                        const isEditing = editingPendingFactId === fact.id;
                        return (
                        <div key={fact.id} className="rounded-xl border border-white/80 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-950/30">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{fact.label}</p>
                                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">{fact.sourceType} · {fact.confidence}</Badge>
                              </div>
                              {isEditing ? (
                                typeof fact.value === 'boolean' ? (
                                  <select
                                    className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
                                    value={editingPendingFactValue.toLowerCase().startsWith('n') ? 'No' : 'Yes'}
                                    onChange={(event) => setEditingPendingFactValue(event.target.value)}
                                  >
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                  </select>
                                ) : (
                                  <Textarea
                                    className="mt-2 min-h-24 bg-white text-sm font-medium text-slate-900 dark:bg-slate-950 dark:text-slate-100"
                                    value={editingPendingFactValue}
                                    onChange={(event) => setEditingPendingFactValue(event.target.value)}
                                    autoFocus
                                  />
                                )
                              ) : (
                                <p className="mt-2 whitespace-pre-wrap break-words text-sm font-medium text-slate-900 dark:text-slate-100">{formatIntakeValue(fact.value)}</p>
                              )}
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Target: {fact.path.map(humanizePathPart).join(' › ')} · Source: {fact.sourceLabel}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {isEditing ? (
                                <>
                                  <Button type="button" size="sm" variant="outline" onClick={() => saveEditedPendingFact(fact)}>Save</Button>
                                  <Button type="button" size="sm" variant="ghost" onClick={cancelEditPendingFact}>Cancel</Button>
                                </>
                              ) : (
                                <>
                                  <Button type="button" size="sm" variant="outline" onClick={() => beginEditPendingFact(fact)}>Edit</Button>
                                  <Button type="button" size="sm" variant="outline" onClick={() => applyPendingFact(fact)}>Apply</Button>
                                  <Button type="button" size="sm" variant="ghost" className="text-slate-500" onClick={() => dismissPendingFact(fact.id)}>Dismiss</Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  </div>
                )}
                {intakeReviewFacts.length === 0 ? (
                  <p className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    No extracted intake facts yet. Add Maria chat context, upload documents, edit profile details, or enter form fields manually.
                  </p>
                ) : (
                  <div className="max-h-[520px] space-y-3 overflow-auto pr-1">
                    {intakeReviewFacts.map((fact) => {
                      const factKey = getIntakeFactKey(fact.path);
                      const isEditing = editingIntakeFactKey === factKey;
                      return (
                      <div key={factKey} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{fact.label}</p>
                              <FieldSourceBadge field={fact.field} />
                              {fact.field.needsReview && <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">Needs review</Badge>}
                            </div>
                            {isEditing ? (
                              typeof fact.field.value === 'boolean' ? (
                                <select
                                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
                                  value={editingIntakeFactValue.toLowerCase().startsWith('n') ? 'No' : 'Yes'}
                                  onChange={(event) => setEditingIntakeFactValue(event.target.value)}
                                >
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              ) : (
                                <Textarea
                                  className="mt-2 min-h-24 bg-white text-sm font-medium text-slate-900 dark:bg-slate-950 dark:text-slate-100"
                                  value={editingIntakeFactValue}
                                  onChange={(event) => setEditingIntakeFactValue(event.target.value)}
                                  autoFocus
                                />
                              )
                            ) : (
                              <p className="mt-2 whitespace-pre-wrap break-words text-sm font-medium text-slate-900 dark:text-slate-100">{fact.value}</p>
                            )}
                            {fact.field.sourceLabel && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Source: {fact.field.sourceLabel}</p>}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {isEditing ? (
                              <>
                                <Button type="button" size="sm" variant="outline" onClick={() => saveEditedIntakeFact(fact)}>
                                  Save
                                </Button>
                                <Button type="button" size="sm" variant="ghost" onClick={cancelEditIntakeFact}>
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button type="button" size="sm" variant="outline" onClick={() => beginEditIntakeFact(fact)}>
                                  Edit
                                </Button>
                                <Button type="button" size="sm" variant="outline" onClick={() => approveIntakeFact(fact.path)} disabled={!fact.field.needsReview}>
                                  Approve
                                </Button>
                                <Button type="button" size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => clearIntakeFact(fact.path)}>
                                  Clear
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-slate-950 dark:text-white">FL-115 Proof of Service of Summons</CardTitle>
                <CardDescription>Optional proof filed after FL-100/FL-110 service is completed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <Checkbox checked={workspace.fl115.includeForm.value} onCheckedChange={(checked) => updateFl115((fl115) => ({ ...fl115, includeForm: setDraftFieldValue(fl115.includeForm, checked === true) }))} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Include FL-115 in generated packet</span><FieldSourceBadge field={workspace.fl115.includeForm} /></div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Use when service has happened or when preparing a service checklist for the server.</p>
                  </div>
                </label>
                {workspace.fl115.includeForm.value && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div><FieldHeader label="Service method" field={workspace.fl115.serviceMethod} /><select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950" value={workspace.fl115.serviceMethod.value} onChange={(e) => updateFl115((fl115) => ({ ...fl115, serviceMethod: setDraftFieldValue(fl115.serviceMethod, e.target.value as 'personal' | 'mail_acknowledgment') }))}><option value="personal">Personal service</option><option value="mail_acknowledgment">Mail + FL-117 acknowledgment</option></select></div>
                    <div><FieldHeader label="Address where served" field={workspace.fl115.addressWhereServed} /><Input value={workspace.fl115.addressWhereServed.value} onChange={(e) => updateFl115((fl115) => ({ ...fl115, addressWhereServed: setDraftFieldValue(fl115.addressWhereServed, e.target.value) }))} /></div>
                    <div><FieldHeader label="Service date" field={workspace.fl115.serviceDate} /><Input type="date" value={workspace.fl115.serviceDate.value} onChange={(e) => updateFl115((fl115) => ({ ...fl115, serviceDate: setDraftFieldValue(fl115.serviceDate, e.target.value) }))} /></div>
                    <div><FieldHeader label="Service time" field={workspace.fl115.serviceTime} /><Input value={workspace.fl115.serviceTime.value} placeholder="e.g., 2:30 PM" onChange={(e) => updateFl115((fl115) => ({ ...fl115, serviceTime: setDraftFieldValue(fl115.serviceTime, e.target.value) }))} /></div>
                    {workspace.fl115.serviceMethod.value === 'mail_acknowledgment' && <><div><FieldHeader label="Date mailed" field={workspace.fl115.dateMailed} /><Input type="date" value={workspace.fl115.dateMailed.value} onChange={(e) => updateFl115((fl115) => ({ ...fl115, dateMailed: setDraftFieldValue(fl115.dateMailed, e.target.value) }))} /></div><div><FieldHeader label="City mailed from" field={workspace.fl115.cityMailedFrom} /><Input value={workspace.fl115.cityMailedFrom.value} onChange={(e) => updateFl115((fl115) => ({ ...fl115, cityMailedFrom: setDraftFieldValue(fl115.cityMailedFrom, e.target.value) }))} /></div></>}
                    <div><FieldHeader label="Server name" field={workspace.fl115.serverName} /><Input value={workspace.fl115.serverName.value} onChange={(e) => updateFl115((fl115) => ({ ...fl115, serverName: setDraftFieldValue(fl115.serverName, e.target.value) }))} /></div>
                    <div><FieldHeader label="Server phone" field={workspace.fl115.serverPhone} /><Input value={workspace.fl115.serverPhone.value} onChange={(e) => updateFl115((fl115) => ({ ...fl115, serverPhone: setDraftFieldValue(fl115.serverPhone, e.target.value) }))} /></div>
                    <div><FieldHeader label="Server address" field={workspace.fl115.serverAddress} /><Input value={workspace.fl115.serverAddress.value} onChange={(e) => updateFl115((fl115) => ({ ...fl115, serverAddress: setDraftFieldValue(fl115.serverAddress, e.target.value) }))} /></div>
                    <div><FieldHeader label="Server signature date" field={workspace.fl115.signatureDate} /><Input type="date" value={workspace.fl115.signatureDate.value} onChange={(e) => updateFl115((fl115) => ({ ...fl115, signatureDate: setDraftFieldValue(fl115.signatureDate, e.target.value) }))} /></div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-slate-950 dark:text-white">FL-120 Response</CardTitle>
                <CardDescription>Optional respondent-side response using the case caption and core family facts already captured.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <Checkbox checked={workspace.fl120.includeForm.value} onCheckedChange={(checked) => updateFl120((fl120) => ({ ...fl120, includeForm: setDraftFieldValue(fl120.includeForm, checked === true) }))} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Include FL-120 in generated packet</span><FieldSourceBadge field={workspace.fl120.includeForm} /></div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Use for the respondent workflow; defaults mirror the petition facts for review.</p>
                  </div>
                </label>
                {workspace.fl120.includeForm.value && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5"><Checkbox checked={workspace.fl120.denyPetitionGrounds.value} onCheckedChange={(checked) => updateFl120((fl120) => ({ ...fl120, denyPetitionGrounds: setDraftFieldValue(fl120.denyPetitionGrounds, checked === true) }))} /><span className="text-sm text-slate-700 dark:text-slate-200">Respondent denies petition grounds</span></label>
                    <div><FieldHeader label="Respondent printed name" field={workspace.fl120.respondentPrintedName} /><Input value={workspace.fl120.respondentPrintedName.value} onChange={(e) => updateFl120((fl120) => ({ ...fl120, respondentPrintedName: setDraftFieldValue(fl120.respondentPrintedName, e.target.value) }))} /></div>
                    <div><FieldHeader label="Signature date" field={workspace.fl120.signatureDate} /><Input type="date" value={workspace.fl120.signatureDate.value} onChange={(e) => updateFl120((fl120) => ({ ...fl120, signatureDate: setDraftFieldValue(fl120.signatureDate, e.target.value) }))} /></div>
                  </div>
                )}
              </CardContent>
            </Card>


            <Card className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-slate-950 dark:text-white">FL-160 Property Declaration</CardTitle>
                <CardDescription>Minimal property declaration fields for a first property row plus signature.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <Checkbox checked={workspace.fl160.includeForm.value} onCheckedChange={(checked) => updateFl160((fl160) => ({ ...fl160, includeForm: setDraftFieldValue(fl160.includeForm, checked === true) }))} />
                  <div><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Include FL-160 in generated packet</span><FieldSourceBadge field={workspace.fl160.includeForm} /></div></div>
                </label>
                {workspace.fl160.includeForm.value && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div><FieldHeader label="Party" field={workspace.fl160.partyRole} /><select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950" value={workspace.fl160.partyRole.value} onChange={(e) => updateFl160((fl160) => ({ ...fl160, partyRole: setDraftFieldValue(fl160.partyRole, e.target.value as 'petitioner' | 'respondent') }))}><option value="petitioner">Petitioner</option><option value="respondent">Respondent</option></select></div>
                    <div><FieldHeader label="Property type" field={workspace.fl160.propertyType} /><select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950" value={workspace.fl160.propertyType.value} onChange={(e) => updateFl160((fl160) => ({ ...fl160, propertyType: setDraftFieldValue(fl160.propertyType, e.target.value as 'community' | 'separate') }))}><option value="community">Community/quasi-community</option><option value="separate">Separate property</option></select></div>
                    <div className="md:col-span-2"><FieldHeader label="Property description" field={workspace.fl160.itemDescription} /><Input value={workspace.fl160.itemDescription.value} onChange={(e) => updateFl160((fl160) => ({ ...fl160, itemDescription: setDraftFieldValue(fl160.itemDescription, e.target.value) }))} /></div>
                    <div><FieldHeader label="Date acquired" field={workspace.fl160.dateAcquired} /><Input type="date" value={workspace.fl160.dateAcquired.value} onChange={(e) => updateFl160((fl160) => ({ ...fl160, dateAcquired: setDraftFieldValue(fl160.dateAcquired, e.target.value) }))} /></div>
                    <div><FieldHeader label="Gross fair market value" field={workspace.fl160.grossFairMarketValue} /><Input value={workspace.fl160.grossFairMarketValue.value} onChange={(e) => updateFl160((fl160) => ({ ...fl160, grossFairMarketValue: setDraftFieldValue(fl160.grossFairMarketValue, e.target.value) }))} /></div>
                    <div><FieldHeader label="Debt amount" field={workspace.fl160.debtAmount} /><Input value={workspace.fl160.debtAmount.value} onChange={(e) => updateFl160((fl160) => ({ ...fl160, debtAmount: setDraftFieldValue(fl160.debtAmount, e.target.value) }))} /></div>
                    <div><FieldHeader label="Net fair market value" field={workspace.fl160.netFairMarketValue} /><Input value={workspace.fl160.netFairMarketValue.value} onChange={(e) => updateFl160((fl160) => ({ ...fl160, netFairMarketValue: setDraftFieldValue(fl160.netFairMarketValue, e.target.value) }))} /></div>
                    <div><FieldHeader label="Proposed award to petitioner" field={workspace.fl160.proposedAwardPetitioner} /><Input value={workspace.fl160.proposedAwardPetitioner.value} onChange={(e) => updateFl160((fl160) => ({ ...fl160, proposedAwardPetitioner: setDraftFieldValue(fl160.proposedAwardPetitioner, e.target.value) }))} /></div>
                    <div><FieldHeader label="Proposed award to respondent" field={workspace.fl160.proposedAwardRespondent} /><Input value={workspace.fl160.proposedAwardRespondent.value} onChange={(e) => updateFl160((fl160) => ({ ...fl160, proposedAwardRespondent: setDraftFieldValue(fl160.proposedAwardRespondent, e.target.value) }))} /></div>
                    <div><FieldHeader label="Signature date" field={workspace.fl160.signatureDate} /><Input type="date" value={workspace.fl160.signatureDate.value} onChange={(e) => updateFl160((fl160) => ({ ...fl160, signatureDate: setDraftFieldValue(fl160.signatureDate, e.target.value) }))} /></div>
                    <div><FieldHeader label="Typed/printed name" field={workspace.fl160.typePrintName} /><Input value={workspace.fl160.typePrintName.value} onChange={(e) => updateFl160((fl160) => ({ ...fl160, typePrintName: setDraftFieldValue(fl160.typePrintName, e.target.value) }))} /></div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-slate-950 dark:text-white">FL-342 / FL-343 Support Attachments</CardTitle>
                <CardDescription>Core order amounts, dates, parties, and free-text details for support attachments.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5"><Checkbox checked={workspace.fl342.includeForm.value} onCheckedChange={(checked) => updateFl342((fl342) => ({ ...fl342, includeForm: setDraftFieldValue(fl342.includeForm, checked === true) }))} /><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Include FL-342 Child Support Attachment</span></label>
                {workspace.fl342.includeForm.value && <div className="grid gap-4 md:grid-cols-2"><div><FieldHeader label="Attach to" field={workspace.fl342.attachTo} /><select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950" value={workspace.fl342.attachTo.value} onChange={(e) => updateFl342((fl342) => ({ ...fl342, attachTo: setDraftFieldValue(fl342.attachTo, e.target.value as DraftFormsWorkspace['fl342']['attachTo']['value']) }))}><option value="fl300">FL-300</option><option value="fl340">FL-340</option><option value="fl350">FL-350</option><option value="fl355">FL-355</option><option value="judgment">Judgment</option><option value="other">Other</option></select></div><div><FieldHeader label="Other attachment" field={workspace.fl342.attachToOther} /><Input value={workspace.fl342.attachToOther.value} onChange={(e) => updateFl342((fl342) => ({ ...fl342, attachToOther: setDraftFieldValue(fl342.attachToOther, e.target.value) }))} /></div><div><FieldHeader label="Base monthly child support" field={workspace.fl342.baseMonthlyChildSupport} /><Input value={workspace.fl342.baseMonthlyChildSupport.value} onChange={(e) => updateFl342((fl342) => ({ ...fl342, baseMonthlyChildSupport: setDraftFieldValue(fl342.baseMonthlyChildSupport, e.target.value) }))} /></div><div><FieldHeader label="Payment start date" field={workspace.fl342.paymentStartDate} /><Input type="date" value={workspace.fl342.paymentStartDate.value} onChange={(e) => updateFl342((fl342) => ({ ...fl342, paymentStartDate: setDraftFieldValue(fl342.paymentStartDate, e.target.value) }))} /></div><div><FieldHeader label="Payable to" field={workspace.fl342.payableTo} /><Input value={workspace.fl342.payableTo.value} onChange={(e) => updateFl342((fl342) => ({ ...fl342, payableTo: setDraftFieldValue(fl342.payableTo, e.target.value) }))} /></div><div><FieldHeader label="Guideline total" field={workspace.fl342.guidelineTotal} /><Input value={workspace.fl342.guidelineTotal.value} onChange={(e) => updateFl342((fl342) => ({ ...fl342, guidelineTotal: setDraftFieldValue(fl342.guidelineTotal, e.target.value) }))} /></div><div><FieldHeader label="Petitioner gross/net income" field={workspace.fl342.petitionerGrossIncome} /><Input value={workspace.fl342.petitionerGrossIncome.value} placeholder="Gross" onChange={(e) => updateFl342((fl342) => ({ ...fl342, petitionerGrossIncome: setDraftFieldValue(fl342.petitionerGrossIncome, e.target.value) }))} /><Input className="mt-2" value={workspace.fl342.petitionerNetIncome.value} placeholder="Net" onChange={(e) => updateFl342((fl342) => ({ ...fl342, petitionerNetIncome: setDraftFieldValue(fl342.petitionerNetIncome, e.target.value) }))} /></div><div><FieldHeader label="Respondent gross/net income" field={workspace.fl342.respondentGrossIncome} /><Input value={workspace.fl342.respondentGrossIncome.value} placeholder="Gross" onChange={(e) => updateFl342((fl342) => ({ ...fl342, respondentGrossIncome: setDraftFieldValue(fl342.respondentGrossIncome, e.target.value) }))} /><Input className="mt-2" value={workspace.fl342.respondentNetIncome.value} placeholder="Net" onChange={(e) => updateFl342((fl342) => ({ ...fl342, respondentNetIncome: setDraftFieldValue(fl342.respondentNetIncome, e.target.value) }))} /></div><div className="md:col-span-2"><FieldHeader label="Other child support orders" field={workspace.fl342.otherOrders} /><Textarea value={workspace.fl342.otherOrders.value} onChange={(e) => updateFl342((fl342) => ({ ...fl342, otherOrders: setDraftFieldValue(fl342.otherOrders, e.target.value) }))} /></div></div>}
                <Separator />
                <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5"><Checkbox checked={workspace.fl343.includeForm.value} onCheckedChange={(checked) => updateFl343((fl343) => ({ ...fl343, includeForm: setDraftFieldValue(fl343.includeForm, checked === true) }))} /><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Include FL-343 Support Order Attachment</span></label>
                {workspace.fl343.includeForm.value && <div className="grid gap-4 md:grid-cols-2"><div><FieldHeader label="Support type" field={workspace.fl343.supportType} /><select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950" value={workspace.fl343.supportType.value} onChange={(e) => updateFl343((fl343) => ({ ...fl343, supportType: setDraftFieldValue(fl343.supportType, e.target.value as DraftFormsWorkspace['fl343']['supportType']['value']) }))}><option value="spousal">Spousal</option><option value="domestic_partner">Domestic partner</option><option value="family">Family</option></select></div><div><FieldHeader label="Monthly amount" field={workspace.fl343.monthlyAmount} /><Input value={workspace.fl343.monthlyAmount.value} onChange={(e) => updateFl343((fl343) => ({ ...fl343, monthlyAmount: setDraftFieldValue(fl343.monthlyAmount, e.target.value) }))} /></div><div><FieldHeader label="Payor" field={workspace.fl343.payor} /><select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950" value={workspace.fl343.payor.value} onChange={(e) => updateFl343((fl343) => ({ ...fl343, payor: setDraftFieldValue(fl343.payor, e.target.value as 'petitioner' | 'respondent') }))}><option value="petitioner">Petitioner</option><option value="respondent">Respondent</option></select></div><div><FieldHeader label="Payee" field={workspace.fl343.payee} /><select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950" value={workspace.fl343.payee.value} onChange={(e) => updateFl343((fl343) => ({ ...fl343, payee: setDraftFieldValue(fl343.payee, e.target.value as 'petitioner' | 'respondent') }))}><option value="petitioner">Petitioner</option><option value="respondent">Respondent</option></select></div><div><FieldHeader label="Start date" field={workspace.fl343.paymentStartDate} /><Input type="date" value={workspace.fl343.paymentStartDate.value} onChange={(e) => updateFl343((fl343) => ({ ...fl343, paymentStartDate: setDraftFieldValue(fl343.paymentStartDate, e.target.value) }))} /></div><div><FieldHeader label="End date" field={workspace.fl343.paymentEndDate} /><Input type="date" value={workspace.fl343.paymentEndDate.value} onChange={(e) => updateFl343((fl343) => ({ ...fl343, paymentEndDate: setDraftFieldValue(fl343.paymentEndDate, e.target.value) }))} /></div><label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5"><Checkbox checked={workspace.fl343.wageAssignment.value} onCheckedChange={(checked) => updateFl343((fl343) => ({ ...fl343, wageAssignment: setDraftFieldValue(fl343.wageAssignment, checked === true) }))} /><span className="text-sm text-slate-700 dark:text-slate-200">Wage assignment</span></label><label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5"><Checkbox checked={workspace.fl343.terminateOnDeathOrRemarriage.value} onCheckedChange={(checked) => updateFl343((fl343) => ({ ...fl343, terminateOnDeathOrRemarriage: setDraftFieldValue(fl343.terminateOnDeathOrRemarriage, checked === true) }))} /><span className="text-sm text-slate-700 dark:text-slate-200">Terminate on death/remarriage</span></label><div className="md:col-span-2"><FieldHeader label="Other support orders" field={workspace.fl343.otherOrders} /><Textarea value={workspace.fl343.otherOrders.value} onChange={(e) => updateFl343((fl343) => ({ ...fl343, otherOrders: setDraftFieldValue(fl343.otherOrders, e.target.value) }))} /></div></div>}
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-slate-950 dark:text-white">Judgment and property forms</CardTitle>
                <CardDescription>Practical v1 fields for FL-130, FL-144, FL-170, FL-180, FL-190, FL-345, and FL-348. These are intentionally core-only.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5"><Checkbox checked={workspace.fl130.includeForm.value} onCheckedChange={(checked) => updateFl130((fl130) => ({ ...fl130, includeForm: setDraftFieldValue(fl130.includeForm, checked === true) }))} /><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Include FL-130 Appearance/Stipulations/Waivers</span></label>
                {workspace.fl130.includeForm.value && <div className="grid gap-4 md:grid-cols-2"><div><FieldHeader label="Appearance by" field={workspace.fl130.appearanceBy} /><select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950" value={workspace.fl130.appearanceBy.value} onChange={(e) => updateFl130((fl130) => ({ ...fl130, appearanceBy: setDraftFieldValue(fl130.appearanceBy, e.target.value as DraftFormsWorkspace['fl130']['appearanceBy']['value']) }))}><option value="petitioner">Petitioner</option><option value="respondent">Respondent</option><option value="both">Both parties</option></select></div><div><FieldHeader label="Respondent signature date" field={workspace.fl130.respondentSignatureDate} /><Input type="date" value={workspace.fl130.respondentSignatureDate.value} onChange={(e) => updateFl130((fl130) => ({ ...fl130, respondentSignatureDate: setDraftFieldValue(fl130.respondentSignatureDate, e.target.value) }))} /></div><div><FieldHeader label="Petitioner printed name" field={workspace.fl130.petitionerPrintedName} /><Input value={workspace.fl130.petitionerPrintedName.value} onChange={(e) => updateFl130((fl130) => ({ ...fl130, petitionerPrintedName: setDraftFieldValue(fl130.petitionerPrintedName, e.target.value) }))} /></div><div><FieldHeader label="Respondent printed name" field={workspace.fl130.respondentPrintedName} /><Input value={workspace.fl130.respondentPrintedName.value} onChange={(e) => updateFl130((fl130) => ({ ...fl130, respondentPrintedName: setDraftFieldValue(fl130.respondentPrintedName, e.target.value) }))} /></div><div><FieldHeader label="Petitioner signature date" field={workspace.fl130.petitionerSignatureDate} /><Input type="date" value={workspace.fl130.petitionerSignatureDate.value} onChange={(e) => updateFl130((fl130) => ({ ...fl130, petitionerSignatureDate: setDraftFieldValue(fl130.petitionerSignatureDate, e.target.value) }))} /></div><div className="md:col-span-2"><FieldHeader label="Agreement/stipulation summary" field={workspace.fl130.agreementSummary} /><Textarea value={workspace.fl130.agreementSummary.value} onChange={(e) => updateFl130((fl130) => ({ ...fl130, agreementSummary: setDraftFieldValue(fl130.agreementSummary, e.target.value) }))} /></div></div>}

                <Separator />
                <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5"><Checkbox checked={workspace.fl144.includeForm.value} onCheckedChange={(checked) => updateFl144((fl144) => ({ ...fl144, includeForm: setDraftFieldValue(fl144.includeForm, checked === true) }))} /><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Include FL-144 Stipulation to Waive Final Disclosure</span></label>
                {workspace.fl144.includeForm.value && <div className="grid gap-4 md:grid-cols-2"><div><FieldHeader label="Signature date" field={workspace.fl144.signatureDate} /><Input type="date" value={workspace.fl144.signatureDate.value} onChange={(e) => updateFl144((fl144) => ({ ...fl144, signatureDate: setDraftFieldValue(fl144.signatureDate, e.target.value) }))} /></div><div><FieldHeader label="Other party/claimant name" field={workspace.fl144.thirdPartyName} /><Input value={workspace.fl144.thirdPartyName.value} onChange={(e) => updateFl144((fl144) => ({ ...fl144, thirdPartyName: setDraftFieldValue(fl144.thirdPartyName, e.target.value) }))} /></div><div><FieldHeader label="Petitioner printed name" field={workspace.fl144.petitionerPrintedName} /><Input value={workspace.fl144.petitionerPrintedName.value} onChange={(e) => updateFl144((fl144) => ({ ...fl144, petitionerPrintedName: setDraftFieldValue(fl144.petitionerPrintedName, e.target.value) }))} /></div><div><FieldHeader label="Respondent printed name" field={workspace.fl144.respondentPrintedName} /><Input value={workspace.fl144.respondentPrintedName.value} onChange={(e) => updateFl144((fl144) => ({ ...fl144, respondentPrintedName: setDraftFieldValue(fl144.respondentPrintedName, e.target.value) }))} /></div><div className="md:col-span-2"><FieldHeader label="Stipulation text" field={workspace.fl144.stipulationText} /><Textarea value={workspace.fl144.stipulationText.value} onChange={(e) => updateFl144((fl144) => ({ ...fl144, stipulationText: setDraftFieldValue(fl144.stipulationText, e.target.value) }))} /></div></div>}

                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5"><Checkbox checked={workspace.fl170.includeForm.value} onCheckedChange={(checked) => updateFl170((fl170) => ({ ...fl170, includeForm: setDraftFieldValue(fl170.includeForm, checked === true) }))} /><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Include FL-170</span></label>
                  <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5"><Checkbox checked={workspace.fl180.includeForm.value} onCheckedChange={(checked) => updateFl180((fl180) => ({ ...fl180, includeForm: setDraftFieldValue(fl180.includeForm, checked === true) }))} /><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Include FL-180 Judgment</span></label>
                  <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5"><Checkbox checked={workspace.fl190.includeForm.value} onCheckedChange={(checked) => updateFl190((fl190) => ({ ...fl190, includeForm: setDraftFieldValue(fl190.includeForm, checked === true) }))} /><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Include FL-190</span></label>
                  <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5"><Checkbox checked={workspace.fl345.includeForm.value} onCheckedChange={(checked) => updateFl345((fl345) => ({ ...fl345, includeForm: setDraftFieldValue(fl345.includeForm, checked === true) }))} /><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Include FL-345 Property Order</span></label>
                  <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5"><Checkbox checked={workspace.fl348.includeForm.value} onCheckedChange={(checked) => updateFl348((fl348) => ({ ...fl348, includeForm: setDraftFieldValue(fl348.includeForm, checked === true) }))} /><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Include FL-348 Pension Benefits</span></label>
                </div>

                {(workspace.fl170.includeForm.value || workspace.fl180.includeForm.value || workspace.fl190.includeForm.value || workspace.fl345.includeForm.value || workspace.fl348.includeForm.value) && <div className="grid gap-4 md:grid-cols-2">
                  {workspace.fl170.includeForm.value && <><div><FieldHeader label="FL-170 signature date" field={workspace.fl170.signatureDate} /><Input type="date" value={workspace.fl170.signatureDate.value} onChange={(e) => updateFl170((fl170) => ({ ...fl170, signatureDate: setDraftFieldValue(fl170.signatureDate, e.target.value) }))} /></div><div><FieldHeader label="FL-170 printed name" field={workspace.fl170.printedName} /><Input value={workspace.fl170.printedName.value} onChange={(e) => updateFl170((fl170) => ({ ...fl170, printedName: setDraftFieldValue(fl170.printedName, e.target.value) }))} /></div><div className="md:col-span-2"><FieldHeader label="FL-170 declaration text" field={workspace.fl170.declarationText} /><Textarea value={workspace.fl170.declarationText.value} onChange={(e) => updateFl170((fl170) => ({ ...fl170, declarationText: setDraftFieldValue(fl170.declarationText, e.target.value) }))} /></div></>}
                  {workspace.fl180.includeForm.value && <><div><FieldHeader label="FL-180 status termination date" field={workspace.fl180.statusTerminationDate} /><Input type="date" value={workspace.fl180.statusTerminationDate.value} onChange={(e) => updateFl180((fl180) => ({ ...fl180, statusTerminationDate: setDraftFieldValue(fl180.statusTerminationDate, e.target.value) }))} /></div><div><FieldHeader label="FL-180 judgment entered date" field={workspace.fl180.judgmentEnteredDate} /><Input type="date" value={workspace.fl180.judgmentEnteredDate.value} onChange={(e) => updateFl180((fl180) => ({ ...fl180, judgmentEnteredDate: setDraftFieldValue(fl180.judgmentEnteredDate, e.target.value) }))} /></div><div><FieldHeader label="FL-180 child support amount" field={workspace.fl180.childSupportAmount} /><Input value={workspace.fl180.childSupportAmount.value} onChange={(e) => updateFl180((fl180) => ({ ...fl180, childSupportAmount: setDraftFieldValue(fl180.childSupportAmount, e.target.value) }))} /></div><div><FieldHeader label="FL-180 spousal support amount" field={workspace.fl180.spousalSupportAmount} /><Input value={workspace.fl180.spousalSupportAmount.value} onChange={(e) => updateFl180((fl180) => ({ ...fl180, spousalSupportAmount: setDraftFieldValue(fl180.spousalSupportAmount, e.target.value) }))} /></div><div className="md:col-span-2"><FieldHeader label="FL-180 property/debt orders" field={workspace.fl180.propertyDebtOrders} /><Textarea value={workspace.fl180.propertyDebtOrders.value} onChange={(e) => updateFl180((fl180) => ({ ...fl180, propertyDebtOrders: setDraftFieldValue(fl180.propertyDebtOrders, e.target.value) }))} /></div></>}
                  {workspace.fl190.includeForm.value && <><div><FieldHeader label="FL-190 notice date" field={workspace.fl190.noticeDate} /><Input type="date" value={workspace.fl190.noticeDate.value} onChange={(e) => updateFl190((fl190) => ({ ...fl190, noticeDate: setDraftFieldValue(fl190.noticeDate, e.target.value) }))} /></div><div><FieldHeader label="FL-190 judgment entered date" field={workspace.fl190.judgmentEnteredDate} /><Input type="date" value={workspace.fl190.judgmentEnteredDate.value} onChange={(e) => updateFl190((fl190) => ({ ...fl190, judgmentEnteredDate: setDraftFieldValue(fl190.judgmentEnteredDate, e.target.value) }))} /></div><div className="md:col-span-2"><FieldHeader label="FL-190 notice text" field={workspace.fl190.noticeText} /><Textarea value={workspace.fl190.noticeText.value} onChange={(e) => updateFl190((fl190) => ({ ...fl190, noticeText: setDraftFieldValue(fl190.noticeText, e.target.value) }))} /></div></>}
                  {workspace.fl345.includeForm.value && <><div className="md:col-span-2"><FieldHeader label="FL-345 property award summary" field={workspace.fl345.propertyAwardSummary} /><Textarea value={workspace.fl345.propertyAwardSummary.value} onChange={(e) => updateFl345((fl345) => ({ ...fl345, propertyAwardSummary: setDraftFieldValue(fl345.propertyAwardSummary, e.target.value) }))} /></div><div className="md:col-span-2"><FieldHeader label="FL-345 debt allocation summary" field={workspace.fl345.debtAllocationSummary} /><Textarea value={workspace.fl345.debtAllocationSummary.value} onChange={(e) => updateFl345((fl345) => ({ ...fl345, debtAllocationSummary: setDraftFieldValue(fl345.debtAllocationSummary, e.target.value) }))} /></div><div><FieldHeader label="FL-345 equalization payment" field={workspace.fl345.equalizationPayment} /><Input value={workspace.fl345.equalizationPayment.value} onChange={(e) => updateFl345((fl345) => ({ ...fl345, equalizationPayment: setDraftFieldValue(fl345.equalizationPayment, e.target.value) }))} /></div></>}
                  {workspace.fl348.includeForm.value && <><div><FieldHeader label="FL-348 employee party" field={workspace.fl348.employeePartyName} /><Input value={workspace.fl348.employeePartyName.value} onChange={(e) => updateFl348((fl348) => ({ ...fl348, employeePartyName: setDraftFieldValue(fl348.employeePartyName, e.target.value) }))} /></div><div><FieldHeader label="FL-348 retirement plan" field={workspace.fl348.retirementPlanName} /><Input value={workspace.fl348.retirementPlanName.value} onChange={(e) => updateFl348((fl348) => ({ ...fl348, retirementPlanName: setDraftFieldValue(fl348.retirementPlanName, e.target.value) }))} /></div><div><FieldHeader label="FL-348 claimant party" field={workspace.fl348.claimantPartyName} /><Input value={workspace.fl348.claimantPartyName.value} onChange={(e) => updateFl348((fl348) => ({ ...fl348, claimantPartyName: setDraftFieldValue(fl348.claimantPartyName, e.target.value) }))} /></div><div className="md:col-span-2"><FieldHeader label="FL-348 order summary" field={workspace.fl348.orderSummary} /><Textarea value={workspace.fl348.orderSummary.value} onChange={(e) => updateFl348((fl348) => ({ ...fl348, orderSummary: setDraftFieldValue(fl348.orderSummary, e.target.value) }))} /></div></>}
                </div>}
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-slate-950 dark:text-white">Domestic violence forms</CardTitle>
                <CardDescription>Core-only DV template wiring for DV-100, 101, 105, 108, 109, 110, 120, 130, 140, and 200. Review official forms before filing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {dvFormOptions.map((form, index) => {
                  const section = workspace[form.key];
                  const issues = getDvReadinessIssues(section, form.formNumber);
                  return (
                    <div key={form.key} className="space-y-4">
                      {index > 0 && <Separator />}
                      <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                        <Checkbox checked={section.includeForm.value} onCheckedChange={(checked) => updateDvForm(form.key, (current) => ({ ...current, includeForm: setDraftFieldValue(current.includeForm, checked === true) }))} />
                        <div>
                          <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Include {form.formNumber} — {form.title}</span><FieldSourceBadge field={section.includeForm} /></div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{form.note}</p>
                        </div>
                      </label>
                      {section.includeForm.value && (
                        <div className="grid gap-4 md:grid-cols-2">
                          {issues.length > 0 && <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">{issues.join(' · ')}</div>}
                          <div><FieldHeader label="Protected party name" field={section.protectedPartyName} /><Input value={section.protectedPartyName.value} onChange={(e) => updateDvForm(form.key, (current) => ({ ...current, protectedPartyName: setDraftFieldValue(current.protectedPartyName, e.target.value) }))} /></div>
                          <div><FieldHeader label="Restrained party name" field={section.restrainedPartyName} /><Input value={section.restrainedPartyName.value} onChange={(e) => updateDvForm(form.key, (current) => ({ ...current, restrainedPartyName: setDraftFieldValue(current.restrainedPartyName, e.target.value) }))} /></div>
                          <div><FieldHeader label="Relationship / connection" field={section.relationship} /><Input value={section.relationship.value} onChange={(e) => updateDvForm(form.key, (current) => ({ ...current, relationship: setDraftFieldValue(current.relationship, e.target.value) }))} /></div>
                          <div><FieldHeader label="Restrained person description" field={section.restrainedPersonDescription} /><Input value={section.restrainedPersonDescription.value} onChange={(e) => updateDvForm(form.key, (current) => ({ ...current, restrainedPersonDescription: setDraftFieldValue(current.restrainedPersonDescription, e.target.value) }))} /></div>
                          <div className="md:col-span-2"><FieldHeader label="Other protected people" field={section.otherProtectedPeople} /><Textarea value={section.otherProtectedPeople.value} onChange={(e) => updateDvForm(form.key, (current) => ({ ...current, otherProtectedPeople: setDraftFieldValue(current.otherProtectedPeople, e.target.value) }))} /></div>
                          <div className="md:col-span-2"><FieldHeader label="Children / child names" field={section.childNames} /><Textarea value={section.childNames.value} placeholder="Leave blank to use children already entered in Draft Forms." onChange={(e) => updateDvForm(form.key, (current) => ({ ...current, childNames: setDraftFieldValue(current.childNames, e.target.value) }))} /></div>
                          <div><FieldHeader label="Hearing / order date" field={section.hearingDate} /><Input type="date" value={section.hearingDate.value} onChange={(e) => updateDvForm(form.key, (current) => ({ ...current, hearingDate: setDraftFieldValue(current.hearingDate, e.target.value) }))} /></div>
                          <div><FieldHeader label="Hearing time" field={section.hearingTime} /><Input value={section.hearingTime.value} placeholder="e.g., 8:30 AM" onChange={(e) => updateDvForm(form.key, (current) => ({ ...current, hearingTime: setDraftFieldValue(current.hearingTime, e.target.value) }))} /></div>
                          <div><FieldHeader label="Department" field={section.hearingDepartment} /><Input value={section.hearingDepartment.value} onChange={(e) => updateDvForm(form.key, (current) => ({ ...current, hearingDepartment: setDraftFieldValue(current.hearingDepartment, e.target.value) }))} /></div>
                          <div><FieldHeader label="Room" field={section.hearingRoom} /><Input value={section.hearingRoom.value} onChange={(e) => updateDvForm(form.key, (current) => ({ ...current, hearingRoom: setDraftFieldValue(current.hearingRoom, e.target.value) }))} /></div>
                          <div><FieldHeader label="Service date" field={section.serviceDate} /><Input type="date" value={section.serviceDate.value} onChange={(e) => updateDvForm(form.key, (current) => ({ ...current, serviceDate: setDraftFieldValue(current.serviceDate, e.target.value) }))} /></div>
                          <div><FieldHeader label="Service time" field={section.serviceTime} /><Input value={section.serviceTime.value} placeholder="e.g., 2:15 PM" onChange={(e) => updateDvForm(form.key, (current) => ({ ...current, serviceTime: setDraftFieldValue(current.serviceTime, e.target.value) }))} /></div>
                          <div><FieldHeader label="Served by" field={section.servedByName} /><Input value={section.servedByName.value} onChange={(e) => updateDvForm(form.key, (current) => ({ ...current, servedByName: setDraftFieldValue(current.servedByName, e.target.value) }))} /></div>
                          <div><FieldHeader label="Printed name" field={section.printedName} /><Input value={section.printedName.value} onChange={(e) => updateDvForm(form.key, (current) => ({ ...current, printedName: setDraftFieldValue(current.printedName, e.target.value) }))} /></div>
                          <div><FieldHeader label="Signature date" field={section.signatureDate} /><Input type="date" value={section.signatureDate.value} onChange={(e) => updateDvForm(form.key, (current) => ({ ...current, signatureDate: setDraftFieldValue(current.signatureDate, e.target.value) }))} /></div>
                          <div className="md:col-span-2"><FieldHeader label="Request / facts summary" field={section.requestSummary} /><Textarea value={section.requestSummary.value} onChange={(e) => updateDvForm(form.key, (current) => ({ ...current, requestSummary: setDraftFieldValue(current.requestSummary, e.target.value) }))} /></div>
                          <div className="md:col-span-2"><FieldHeader label="Order summary" field={section.orderSummary} /><Textarea value={section.orderSummary.value} onChange={(e) => updateDvForm(form.key, (current) => ({ ...current, orderSummary: setDraftFieldValue(current.orderSummary, e.target.value) }))} /></div>
                          <div className="md:col-span-2"><FieldHeader label="Response summary" field={section.responseSummary} /><Textarea value={section.responseSummary.value} onChange={(e) => updateDvForm(form.key, (current) => ({ ...current, responseSummary: setDraftFieldValue(current.responseSummary, e.target.value) }))} /></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-slate-950 dark:text-white">Remaining family-law forms</CardTitle>
                <CardDescription>Core-only generation for remaining FL assets. Captures caption, selected options, amounts/dates/text/name/signature fields where available.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {remainingFlFormOptions.map((form, index) => {
                  const section = workspace[form.key];
                  const issues = getRemainingFlReadinessIssues(section, form.formNumber);
                  return (
                    <div key={form.key} className="space-y-4">
                      {index > 0 && <Separator />}
                      <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                        <Checkbox checked={section.includeForm.value} onCheckedChange={(checked) => updateRemainingFlForm(form.key, (current) => ({ ...current, includeForm: setDraftFieldValue(current.includeForm, checked === true) }))} />
                        <div>
                          <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Include {form.formNumber} — {form.title}</span><FieldSourceBadge field={section.includeForm} /></div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{form.note}</p>
                        </div>
                      </label>
                      {section.includeForm.value && (
                        <div className="grid gap-4 md:grid-cols-2">
                          {issues.length > 0 && <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">{issues.join(' · ')}</div>}
                          <div><FieldHeader label="Primary party" field={section.primaryParty} /><select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950" value={section.primaryParty.value} onChange={(e) => updateRemainingFlForm(form.key, (current) => ({ ...current, primaryParty: setDraftFieldValue(current.primaryParty, e.target.value as DraftFormsWorkspace[RemainingFlFormKey]['primaryParty']['value']) }))}><option value="petitioner">Petitioner</option><option value="respondent">Respondent</option><option value="both">Both parties</option><option value="other">Other</option></select></div>
                          <div><FieldHeader label="Attach to / order source" field={section.attachTo} /><select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950" value={section.attachTo.value} onChange={(e) => updateRemainingFlForm(form.key, (current) => ({ ...current, attachTo: setDraftFieldValue(current.attachTo, e.target.value as DraftFormsWorkspace[RemainingFlFormKey]['attachTo']['value']) }))}><option value="fl180">FL-180 / Judgment</option><option value="fl300">FL-300</option><option value="fl340">FL-340</option><option value="fl350">FL-350</option><option value="fl355">FL-355</option><option value="other">Other</option></select></div>
                          <div><FieldHeader label="Amount" field={section.amount} /><Input value={section.amount.value} onChange={(e) => updateRemainingFlForm(form.key, (current) => ({ ...current, amount: setDraftFieldValue(current.amount, e.target.value) }))} /></div>
                          <div><FieldHeader label="Date" field={section.date} /><Input type="date" value={section.date.value} onChange={(e) => updateRemainingFlForm(form.key, (current) => ({ ...current, date: setDraftFieldValue(current.date, e.target.value) }))} /></div>
                          <div><FieldHeader label="Other party / employer / plan" field={section.otherPartyName} /><Input value={section.otherPartyName.value} onChange={(e) => updateRemainingFlForm(form.key, (current) => ({ ...current, otherPartyName: setDraftFieldValue(current.otherPartyName, e.target.value) }))} /></div>
                          <div><FieldHeader label="Printed name" field={section.printedName} /><Input value={section.printedName.value} onChange={(e) => updateRemainingFlForm(form.key, (current) => ({ ...current, printedName: setDraftFieldValue(current.printedName, e.target.value) }))} /></div>
                          <div><FieldHeader label="Signature date" field={section.signatureDate} /><Input type="date" value={section.signatureDate.value} onChange={(e) => updateRemainingFlForm(form.key, (current) => ({ ...current, signatureDate: setDraftFieldValue(current.signatureDate, e.target.value) }))} /></div>
                          <div className="md:col-span-2"><FieldHeader label="Options / findings / order details" field={section.details} /><Textarea value={section.details.value} onChange={(e) => updateRemainingFlForm(form.key, (current) => ({ ...current, details: setDraftFieldValue(current.details, e.target.value) }))} /></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-slate-950 dark:text-white">FL-117 Notice and Acknowledgment of Receipt</CardTitle>
                <CardDescription>Optional service-by-mail acknowledgment. The respondent signs the acknowledgment portion after receipt.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <Checkbox checked={workspace.fl117.includeForm.value} onCheckedChange={(checked) => updateFl117((fl117) => ({ ...fl117, includeForm: setDraftFieldValue(fl117.includeForm, checked === true) }))} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Include FL-117 in generated packet</span><FieldSourceBadge field={workspace.fl117.includeForm} /></div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Use only when the receiving party will acknowledge receipt.</p>
                  </div>
                </label>
                {workspace.fl117.includeForm.value && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div><FieldHeader label="Person being served" field={workspace.fl117.personServedName} /><Input value={workspace.fl117.personServedName.value} onChange={(e) => updateFl117((fl117) => ({ ...fl117, personServedName: setDraftFieldValue(fl117.personServedName, e.target.value) }))} /></div>
                    <div><FieldHeader label="Date mailed" field={workspace.fl117.dateMailed} /><Input type="date" value={workspace.fl117.dateMailed.value} onChange={(e) => updateFl117((fl117) => ({ ...fl117, dateMailed: setDraftFieldValue(fl117.dateMailed, e.target.value) }))} /></div>
                    <div><FieldHeader label="Petitioner printed name" field={workspace.fl117.petitionerPrintedName} /><Input value={workspace.fl117.petitionerPrintedName.value} onChange={(e) => updateFl117((fl117) => ({ ...fl117, petitionerPrintedName: setDraftFieldValue(fl117.petitionerPrintedName, e.target.value) }))} /></div>
                    <div><FieldHeader label="Acknowledgment date signed" field={workspace.fl117.acknowledgmentDateSigned} /><Input type="date" value={workspace.fl117.acknowledgmentDateSigned.value} onChange={(e) => updateFl117((fl117) => ({ ...fl117, acknowledgmentDateSigned: setDraftFieldValue(fl117.acknowledgmentDateSigned, e.target.value) }))} /></div>
                    <div className="md:col-span-2"><FieldHeader label="Acknowledgment printed name" field={workspace.fl117.acknowledgmentPrintedName} /><Input value={workspace.fl117.acknowledgmentPrintedName.value} onChange={(e) => updateFl117((fl117) => ({ ...fl117, acknowledgmentPrintedName: setDraftFieldValue(fl117.acknowledgmentPrintedName, e.target.value) }))} /></div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-slate-950 dark:text-white">FL-142 Schedule of Assets and Debts</CardTitle>
                <CardDescription>Optional schedule used with FL-140 disclosures. Enter only known facts; leave unknown cells blank.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <Checkbox checked={workspace.fl142.includeForm.value} onCheckedChange={(checked) => updateFl142((fl142) => ({ ...fl142, includeForm: setDraftFieldValue(fl142.includeForm, checked === true) }))} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Include FL-142 in generated packet</span><FieldSourceBadge field={workspace.fl142.includeForm} /></div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Good companion to FL-140 when listing assets and debts.</p>
                  </div>
                </label>
                {workspace.fl142.includeForm.value && (
                  <div className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div><FieldHeader label="Whose schedule" field={workspace.fl142.partyRole} /><select value={workspace.fl142.partyRole.value} onChange={(e) => updateFl142((fl142) => ({ ...fl142, partyRole: setDraftFieldValue(fl142.partyRole, e.target.value as 'petitioner' | 'respondent') }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"><option value="petitioner">Petitioner</option><option value="respondent">Respondent</option></select></div>
                      <div><FieldHeader label="Continuation pages attached" field={workspace.fl142.continuationPagesAttached} /><Input value={workspace.fl142.continuationPagesAttached.value} onChange={(e) => updateFl142((fl142) => ({ ...fl142, continuationPagesAttached: setDraftFieldValue(fl142.continuationPagesAttached, e.target.value) }))} /></div>
                    </div>
                    <details open className="rounded-2xl border border-slate-200/80 p-4 dark:border-white/10">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-900 dark:text-white">Assets</summary>
                      <div className="mt-4 space-y-4">
                        {fl142AssetLabels.map(([key, label]) => {
                          const row = workspace.fl142.assets[key];
                          return (
                            <div key={key} className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
                              <div className="mt-3 grid gap-3 md:grid-cols-5">
                                <div className="md:col-span-2"><Input placeholder="Description" value={row.description.value} onChange={(e) => updateFl142((fl142) => ({ ...fl142, assets: { ...fl142.assets, [key]: { ...fl142.assets[key], description: setDraftFieldValue(fl142.assets[key].description, e.target.value) } } }))} /></div>
                                <Input placeholder="Sep. prop" value={row.separateProperty.value} onChange={(e) => updateFl142((fl142) => ({ ...fl142, assets: { ...fl142.assets, [key]: { ...fl142.assets[key], separateProperty: setDraftFieldValue(fl142.assets[key].separateProperty, e.target.value) } } }))} />
                                <Input placeholder="Date acquired" value={row.dateAcquired.value} onChange={(e) => updateFl142((fl142) => ({ ...fl142, assets: { ...fl142.assets, [key]: { ...fl142.assets[key], dateAcquired: setDraftFieldValue(fl142.assets[key].dateAcquired, e.target.value) } } }))} />
                                <Input placeholder="Gross value" value={row.grossValue.value} onChange={(e) => updateFl142((fl142) => ({ ...fl142, assets: { ...fl142.assets, [key]: { ...fl142.assets[key], grossValue: setDraftFieldValue(fl142.assets[key].grossValue, e.target.value) } } }))} />
                                <Input placeholder="Amount owed" value={row.amountOwed.value} onChange={(e) => updateFl142((fl142) => ({ ...fl142, assets: { ...fl142.assets, [key]: { ...fl142.assets[key], amountOwed: setDraftFieldValue(fl142.assets[key].amountOwed, e.target.value) } } }))} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                    <details className="rounded-2xl border border-slate-200/80 p-4 dark:border-white/10">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-900 dark:text-white">Debts</summary>
                      <div className="mt-4 space-y-4">
                        {fl142DebtLabels.map(([key, label]) => {
                          const row = workspace.fl142.debts[key];
                          return (
                            <div key={key} className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
                              <div className="mt-3 grid gap-3 md:grid-cols-4">
                                <div className="md:col-span-2"><Input placeholder="Description" value={row.description.value} onChange={(e) => updateFl142((fl142) => ({ ...fl142, debts: { ...fl142.debts, [key]: { ...fl142.debts[key], description: setDraftFieldValue(fl142.debts[key].description, e.target.value) } } }))} /></div>
                                <Input placeholder="Sep. prop" value={row.separateProperty.value} onChange={(e) => updateFl142((fl142) => ({ ...fl142, debts: { ...fl142.debts, [key]: { ...fl142.debts[key], separateProperty: setDraftFieldValue(fl142.debts[key].separateProperty, e.target.value) } } }))} />
                                <Input placeholder="Total owing" value={row.totalOwing.value} onChange={(e) => updateFl142((fl142) => ({ ...fl142, debts: { ...fl142.debts, [key]: { ...fl142.debts[key], totalOwing: setDraftFieldValue(fl142.debts[key].totalOwing, e.target.value) } } }))} />
                                <Input placeholder="Date acquired" value={row.dateAcquired.value} onChange={(e) => updateFl142((fl142) => ({ ...fl142, debts: { ...fl142.debts, [key]: { ...fl142.debts[key], dateAcquired: setDraftFieldValue(fl142.debts[key].dateAcquired, e.target.value) } } }))} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                    <div className="grid gap-4 md:grid-cols-3"><div><FieldHeader label="Total asset gross value" field={workspace.fl142.assetTotalGrossValue} /><Input value={workspace.fl142.assetTotalGrossValue.value} onChange={(e) => updateFl142((fl142) => ({ ...fl142, assetTotalGrossValue: setDraftFieldValue(fl142.assetTotalGrossValue, e.target.value) }))} /></div><div><FieldHeader label="Total asset encumbrance" field={workspace.fl142.assetTotalAmountOwed} /><Input value={workspace.fl142.assetTotalAmountOwed.value} onChange={(e) => updateFl142((fl142) => ({ ...fl142, assetTotalAmountOwed: setDraftFieldValue(fl142.assetTotalAmountOwed, e.target.value) }))} /></div><div><FieldHeader label="Total debts" field={workspace.fl142.debtTotalOwing} /><Input value={workspace.fl142.debtTotalOwing.value} onChange={(e) => updateFl142((fl142) => ({ ...fl142, debtTotalOwing: setDraftFieldValue(fl142.debtTotalOwing, e.target.value) }))} /></div></div>
                    <div className="grid gap-4 md:grid-cols-2"><div><FieldHeader label="Signature date" field={workspace.fl142.signatureDate} /><Input type="date" value={workspace.fl142.signatureDate.value} onChange={(e) => updateFl142((fl142) => ({ ...fl142, signatureDate: setDraftFieldValue(fl142.signatureDate, e.target.value) }))} /></div><div><FieldHeader label="Type/print name" field={workspace.fl142.typePrintName} /><Input value={workspace.fl142.typePrintName.value} onChange={(e) => updateFl142((fl142) => ({ ...fl142, typePrintName: setDraftFieldValue(fl142.typePrintName, e.target.value) }))} /></div></div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-slate-950 dark:text-white">FL-141 Declaration Regarding Service of Disclosure</CardTitle>
                <CardDescription>Optional service declaration for preliminary/final financial disclosures.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <Checkbox checked={workspace.fl141.includeForm.value} onCheckedChange={(checked) => updateFl141((fl141) => ({ ...fl141, includeForm: setDraftFieldValue(fl141.includeForm, checked === true) }))} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Include FL-141 in generated packet</span><FieldSourceBadge field={workspace.fl141.includeForm} /></div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Use after disclosures are actually served.</p>
                  </div>
                </label>
                {workspace.fl141.includeForm.value && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div><FieldHeader label="Disclosure type" field={workspace.fl141.disclosureType} /><select value={workspace.fl141.disclosureType.value} onChange={(e) => updateFl141((fl141) => ({ ...fl141, disclosureType: setDraftFieldValue(fl141.disclosureType, e.target.value as 'preliminary' | 'final') }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"><option value="preliminary">Preliminary</option><option value="final">Final</option></select></div>
                    <div><FieldHeader label="Service method" field={workspace.fl141.serviceMethod} /><select value={workspace.fl141.serviceMethod.value} onChange={(e) => updateFl141((fl141) => ({ ...fl141, serviceMethod: setDraftFieldValue(fl141.serviceMethod, e.target.value as 'personal' | 'mail') }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"><option value="personal">Personal service</option><option value="mail">By mail</option></select></div>
                    <div><FieldHeader label="Serving party" field={workspace.fl141.servingParty} /><select value={workspace.fl141.servingParty.value} onChange={(e) => updateFl141((fl141) => ({ ...fl141, servingParty: setDraftFieldValue(fl141.servingParty, e.target.value as 'petitioner' | 'respondent') }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"><option value="petitioner">Petitioner</option><option value="respondent">Respondent</option></select></div>
                    <div><FieldHeader label="Served on" field={workspace.fl141.servedOnParty} /><select value={workspace.fl141.servedOnParty.value} onChange={(e) => updateFl141((fl141) => ({ ...fl141, servedOnParty: setDraftFieldValue(fl141.servedOnParty, e.target.value as 'petitioner' | 'respondent') }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"><option value="petitioner">Petitioner</option><option value="respondent">Respondent</option></select></div>
                    <div><FieldHeader label="Service date" field={workspace.fl141.serviceDate} /><Input type="date" value={workspace.fl141.serviceDate.value} onChange={(e) => updateFl141((fl141) => ({ ...fl141, serviceDate: setDraftFieldValue(fl141.serviceDate, e.target.value) }))} /></div>
                    <div><FieldHeader label="Other documents served" field={workspace.fl141.otherDocuments} /><Input value={workspace.fl141.otherDocuments.value} onChange={(e) => updateFl141((fl141) => ({ ...fl141, otherDocuments: setDraftFieldValue(fl141.otherDocuments, e.target.value) }))} /></div>
                    <label className="flex items-start gap-2"><Checkbox checked={workspace.fl141.waiveFinalDeclaration.value} onCheckedChange={(checked) => updateFl141((fl141) => ({ ...fl141, waiveFinalDeclaration: setDraftFieldValue(fl141.waiveFinalDeclaration, checked === true) }))} /><span className="text-sm">Final declaration waived</span></label>
                    <label className="flex items-start gap-2"><Checkbox checked={workspace.fl141.finalIncomeExpenseServed.value} onCheckedChange={(checked) => updateFl141((fl141) => ({ ...fl141, finalIncomeExpenseServed: setDraftFieldValue(fl141.finalIncomeExpenseServed, checked === true) }))} /><span className="text-sm">Final FL-150 served</span></label>
                    <label className="flex items-start gap-2"><Checkbox checked={workspace.fl141.waiveReceipt.value} onCheckedChange={(checked) => updateFl141((fl141) => ({ ...fl141, waiveReceipt: setDraftFieldValue(fl141.waiveReceipt, checked === true) }))} /><span className="text-sm">Receipt/waiver served</span></label>
                    <div />
                    <div><FieldHeader label="Signature date" field={workspace.fl141.signatureDate} /><Input type="date" value={workspace.fl141.signatureDate.value} onChange={(e) => updateFl141((fl141) => ({ ...fl141, signatureDate: setDraftFieldValue(fl141.signatureDate, e.target.value) }))} /></div>
                    <div><FieldHeader label="Type/print name" field={workspace.fl141.typePrintName} /><Input value={workspace.fl141.typePrintName.value} onChange={(e) => updateFl141((fl141) => ({ ...fl141, typePrintName: setDraftFieldValue(fl141.typePrintName, e.target.value) }))} /></div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-slate-950 dark:text-white">FL-140 Declaration of Disclosure</CardTitle>
                <CardDescription>Optional declaration for preliminary or final financial disclosures.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <Checkbox checked={workspace.fl140.includeForm.value} onCheckedChange={(checked) => updateFl140((fl140) => ({ ...fl140, includeForm: setDraftFieldValue(fl140.includeForm, checked === true) }))} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Include FL-140 in generated packet</span><FieldSourceBadge field={workspace.fl140.includeForm} /></div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Use for preliminary/final disclosure service. This does not replace actually serving the supporting disclosures.</p>
                  </div>
                </label>
                {workspace.fl140.includeForm.value && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <FieldHeader label="Declarant" field={workspace.fl140.declarantRole} />
                      <select value={workspace.fl140.declarantRole.value} onChange={(e) => updateFl140((fl140) => ({ ...fl140, declarantRole: setDraftFieldValue(fl140.declarantRole, e.target.value as 'petitioner' | 'respondent') }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                        <option value="petitioner">Petitioner</option><option value="respondent">Respondent</option>
                      </select>
                    </div>
                    <div>
                      <FieldHeader label="Disclosure type" field={workspace.fl140.disclosureType} />
                      <select value={workspace.fl140.disclosureType.value} onChange={(e) => updateFl140((fl140) => ({ ...fl140, disclosureType: setDraftFieldValue(fl140.disclosureType, e.target.value as 'preliminary' | 'final') }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                        <option value="preliminary">Preliminary</option><option value="final">Final</option>
                      </select>
                    </div>
                    <label className="flex items-start gap-2"><Checkbox checked={workspace.fl140.servedScheduleOrPropertyDeclaration.value} onCheckedChange={(checked) => updateFl140((fl140) => ({ ...fl140, servedScheduleOrPropertyDeclaration: setDraftFieldValue(fl140.servedScheduleOrPropertyDeclaration, checked === true) }))} /><span className="text-sm">Served FL-142 or FL-160</span></label>
                    <label className="flex items-start gap-2"><Checkbox checked={workspace.fl140.servedIncomeExpenseDeclaration.value} onCheckedChange={(checked) => updateFl140((fl140) => ({ ...fl140, servedIncomeExpenseDeclaration: setDraftFieldValue(fl140.servedIncomeExpenseDeclaration, checked === true) }))} /><span className="text-sm">Served FL-150 Income & Expense</span></label>
                    <label className="flex items-start gap-2"><Checkbox checked={workspace.fl140.scheduleIncludesCommunityProperty.value} onCheckedChange={(checked) => updateFl140((fl140) => ({ ...fl140, scheduleIncludesCommunityProperty: setDraftFieldValue(fl140.scheduleIncludesCommunityProperty, checked === true) }))} /><span className="text-sm">Property schedule includes community/quasi-community property</span></label>
                    <label className="flex items-start gap-2"><Checkbox checked={workspace.fl140.scheduleIncludesSeparateProperty.value} onCheckedChange={(checked) => updateFl140((fl140) => ({ ...fl140, scheduleIncludesSeparateProperty: setDraftFieldValue(fl140.scheduleIncludesSeparateProperty, checked === true) }))} /><span className="text-sm">Property schedule includes separate property</span></label>
                    <label className="flex items-start gap-2"><Checkbox checked={workspace.fl140.servedTaxReturns.value} onCheckedChange={(checked) => updateFl140((fl140) => ({ ...fl140, servedTaxReturns: setDraftFieldValue(fl140.servedTaxReturns, checked === true) }))} /><span className="text-sm">Served two years of tax returns</span></label>
                    <label className="flex items-start gap-2"><Checkbox checked={workspace.fl140.noTaxReturnsFiled.value} onCheckedChange={(checked) => updateFl140((fl140) => ({ ...fl140, noTaxReturnsFiled: setDraftFieldValue(fl140.noTaxReturnsFiled, checked === true) }))} /><span className="text-sm">No tax returns filed in the prior two years</span></label>
                    <label className="flex items-start gap-2"><Checkbox checked={workspace.fl140.servedObligationsStatement.value} onCheckedChange={(checked) => updateFl140((fl140) => ({ ...fl140, servedObligationsStatement: setDraftFieldValue(fl140.servedObligationsStatement, checked === true) }))} /><span className="text-sm">Served obligations statement</span></label>
                    <label className="flex items-start gap-2"><Checkbox checked={workspace.fl140.servedInvestmentOpportunityStatement.value} onCheckedChange={(checked) => updateFl140((fl140) => ({ ...fl140, servedInvestmentOpportunityStatement: setDraftFieldValue(fl140.servedInvestmentOpportunityStatement, checked === true) }))} /><span className="text-sm">Served investment opportunity statement</span></label>
                    <div className="md:col-span-2"><FieldHeader label="Material facts statement" field={workspace.fl140.materialFactsStatement} /><Textarea className="min-h-[72px]" value={workspace.fl140.materialFactsStatement.value} onChange={(e) => updateFl140((fl140) => ({ ...fl140, materialFactsStatement: setDraftFieldValue(fl140.materialFactsStatement, e.target.value) }))} /></div>
                    <div className="md:col-span-2"><FieldHeader label="Obligations statement details" field={workspace.fl140.obligationsStatement} /><Textarea className="min-h-[72px]" value={workspace.fl140.obligationsStatement.value} onChange={(e) => updateFl140((fl140) => ({ ...fl140, obligationsStatement: setDraftFieldValue(fl140.obligationsStatement, e.target.value) }))} /></div>
                    <div className="md:col-span-2"><FieldHeader label="Investment opportunity statement details" field={workspace.fl140.investmentOpportunityStatement} /><Textarea className="min-h-[72px]" value={workspace.fl140.investmentOpportunityStatement.value} onChange={(e) => updateFl140((fl140) => ({ ...fl140, investmentOpportunityStatement: setDraftFieldValue(fl140.investmentOpportunityStatement, e.target.value) }))} /></div>
                    <div><FieldHeader label="Signature date" field={workspace.fl140.signatureDate} /><Input type="date" value={workspace.fl140.signatureDate.value} onChange={(e) => updateFl140((fl140) => ({ ...fl140, signatureDate: setDraftFieldValue(fl140.signatureDate, e.target.value) }))} /></div>
                    <div><FieldHeader label="Type/print name" field={workspace.fl140.typePrintName} /><Input value={workspace.fl140.typePrintName.value} onChange={(e) => updateFl140((fl140) => ({ ...fl140, typePrintName: setDraftFieldValue(fl140.typePrintName, e.target.value) }))} /></div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <details
                open={formMode === 'advanced' || simplePanelsOpen.handoff}
                onToggle={(event) => {
                  if (formMode === 'simple') {
                    setSimplePanelsOpen((current) => ({ ...current, handoff: event.currentTarget.open }));
                  }
                }}
              >
                <summary className="cursor-pointer list-none px-6 py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:px-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
                        <Sparkles className="h-5 w-5 text-emerald-600" />
                        View captured chat handoff
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Raw Maria handoff is available for audit, but the form fields below remain the source of truth.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="rounded-full">Chat context</Badge>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          void loadMariaChatPicker();
                        }}
                      >
                        <PencilLine className="mr-2 h-4 w-4" />
                        Edit Maria chats
                      </Button>
                    </div>
                  </div>
                </summary>
                <CardContent className="space-y-5 border-t border-slate-200/70 pt-5 dark:border-white/10">
                  {chatPickerOpen && (
                    <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
                            <MessageSquareText className="h-4 w-4 text-emerald-600" />
                            Choose exactly what Maria chat context goes into this form
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                            Selected messages replace the captured handoff below, so random unrelated chat text does not get mixed into the draft.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" size="sm" onClick={applySelectedChatHandoff} disabled={chatPickerLoading || selectedChatMessages.length === 0}>
                            Use {selectedChatMessages.length} selected
                          </Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => setChatPickerOpen(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                      {chatPickerLoading ? (
                        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading Maria chats...
                        </div>
                      ) : chatPickerSessions.length === 0 ? (
                        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">No saved Maria chats were found yet.</p>
                      ) : (
                        <div className="mt-4 max-h-96 space-y-4 overflow-auto pr-1">
                          {chatPickerSessions.map((session) => (
                            <div key={session.id} className="rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-950/30">
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{session.title || 'Maria chat'}</p>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 rounded-full px-3 text-xs"
                                  onClick={() => {
                                    setSelectedChatMessageIds((current) => {
                                      const next = new Set(current);
                                      const allSelected = session.messages.every((message) => next.has(message.id));
                                      session.messages.forEach((message) => allSelected ? next.delete(message.id) : next.add(message.id));
                                      return next;
                                    });
                                  }}
                                >
                                  Toggle chat
                                </Button>
                              </div>
                              <div className="space-y-2">
                                {session.messages.map((message) => (
                                  <label key={message.id} className="flex cursor-pointer gap-3 rounded-lg border border-slate-200/70 bg-slate-50/70 p-3 text-sm dark:border-white/10 dark:bg-white/5">
                                    <Checkbox checked={selectedChatMessageIds.has(message.id)} onCheckedChange={() => toggleChatMessageSelection(message.id)} />
                                    <div className="min-w-0 flex-1">
                                      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                        <span>{message.role === 'assistant' ? 'Maria' : 'User'}</span>
                                        <span>{new Date(message.timestamp).toLocaleString()}</span>
                                      </div>
                                      <p className="line-clamp-4 whitespace-pre-wrap text-slate-700 dark:text-slate-200">
                                        {message.content || (message.attachments?.length ? `Attachments: ${message.attachments.map((attachment) => attachment.name).join(', ')}` : 'Empty message')}
                                      </p>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">User request</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
                      {workspace.intake.userRequest || 'No specific chat request was captured yet.'}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Maria summary</p>
                    <p className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
                      {workspace.intake.mariaSummary || 'No Maria summary captured yet.'}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Uploaded evidence</p>
                    {workspace.intake.attachmentNames.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {workspace.intake.attachmentNames.map((name) => (
                          <Badge key={name} variant="outline" className="rounded-full">{name}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No uploaded files were attached to the captured handoff.</p>
                    )}
                  </div>
                </CardContent>
              </details>
            </Card>

            <Card id="draft-section-fl300" className="scroll-mt-24 rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-slate-950 dark:text-white">FL-300 Request for Order</CardTitle>
                <CardDescription>Optional RFO generation. Every legally material choice here is explicit; Draft Forms will not infer orders from the starter packet.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <Checkbox
                    checked={workspace.fl300.includeForm.value}
                    onCheckedChange={(checked) => updateFl300((fl300) => ({ ...fl300, includeForm: setDraftFieldValue(fl300.includeForm, checked === true) }))}
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Include FL-300 in generated packet</span>
                      <FieldSourceBadge field={workspace.fl300.includeForm} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Use only when you are deliberately filing a Request for Order. Financial requests are supported as a safe v1 subset with optional FL-150 and FL-319 attachments.</p>
                  </div>
                </label>

                {workspace.fl300.includeForm.value && (
                  <details
                    className="rounded-2xl border border-amber-200/80 bg-amber-50/60 dark:border-amber-300/20 dark:bg-amber-500/10"
                    open={formMode === 'advanced' || simplePanelsOpen.fl300}
                    onToggle={(event) => {
                      if (formMode === 'simple') {
                        setSimplePanelsOpen((current) => ({ ...current, fl300: event.currentTarget.open }));
                      }
                    }}
                  >
                    <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-amber-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-100">
                      {formMode === 'simple' ? 'Edit exact FL-300 fields' : 'Exact FL-300 field editor'}
                      <span className="ml-2 text-xs font-normal text-amber-800/80 dark:text-amber-100/70">Optional request-for-order details</span>
                    </summary>
                    <div className="space-y-5 border-t border-amber-200/70 p-4 dark:border-amber-300/20">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Request type flags</p>
                      <div className="mt-3 grid gap-2 md:grid-cols-3">
                        {[
                          ['childCustody', 'Child custody'],
                          ['visitation', 'Visitation / parenting time'],
                          ['childSupport', 'Child support'],
                          ['spousalSupport', 'Spousal / partner support'],
                          ['propertyControl', 'Property control'],
                          ['attorneyFeesCosts', 'Attorney fees/costs'],
                          ['other', 'Other orders'],
                          ['changeModify', 'Change / modify'],
                          ['temporaryEmergencyOrders', 'Temporary emergency orders'],
                        ].map(([key, label]) => (
                          <label key={key} className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5">
                            <Checkbox
                              checked={workspace.fl300.requestTypes[key as keyof DraftFormsWorkspace['fl300']['requestTypes']].value}
                              onCheckedChange={(checked) => updateFl300((fl300) => ({
                                ...fl300,
                                requestTypes: {
                                  ...fl300.requestTypes,
                                  [key]: setDraftFieldValue(fl300.requestTypes[key as keyof DraftFormsWorkspace['fl300']['requestTypes']], checked === true),
                                },
                              }))}
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div id="draft-field-fl300-served-party" className="scroll-mt-24">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">TO / served party</p>
                      <div className="mt-3 grid gap-2 md:grid-cols-4">
                        {[
                          ['petitioner', 'Petitioner'],
                          ['respondent', 'Respondent'],
                          ['otherParentParty', 'Other parent/party'],
                          ['other', 'Other'],
                        ].map(([key, label]) => (
                          <label key={key} className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5">
                            <Checkbox
                              checked={workspace.fl300.requestedAgainst[key as 'petitioner' | 'respondent' | 'otherParentParty' | 'other'].value}
                              onCheckedChange={(checked) => updateFl300((fl300) => ({
                                ...fl300,
                                requestedAgainst: {
                                  ...fl300.requestedAgainst,
                                  [key]: setDraftFieldValue(fl300.requestedAgainst[key as 'petitioner' | 'respondent' | 'otherParentParty' | 'other'], checked === true),
                                },
                              }))}
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
                          </label>
                        ))}
                      </div>
                      {workspace.fl300.requestedAgainst.other.value && (
                        <div className="mt-3">
                          <FieldHeader label="Other served party name" field={workspace.fl300.requestedAgainst.otherName} />
                          <Input value={workspace.fl300.requestedAgainst.otherName.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, requestedAgainst: { ...fl300.requestedAgainst, otherName: setDraftFieldValue(fl300.requestedAgainst.otherName, e.target.value) } }))} />
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                      <div><FieldHeader label="Hearing date" field={workspace.fl300.hearing.date} /><Input type="date" value={workspace.fl300.hearing.date.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, hearing: { ...fl300.hearing, date: setDraftFieldValue(fl300.hearing.date, e.target.value) } }))} /></div>
                      <div><FieldHeader label="Hearing time" field={workspace.fl300.hearing.time} /><Input value={workspace.fl300.hearing.time.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, hearing: { ...fl300.hearing, time: setDraftFieldValue(fl300.hearing.time, e.target.value) } }))} placeholder="8:30 AM" /></div>
                      <div><FieldHeader label="Dept." field={workspace.fl300.hearing.department} /><Input value={workspace.fl300.hearing.department.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, hearing: { ...fl300.hearing, department: setDraftFieldValue(fl300.hearing.department, e.target.value) } }))} /></div>
                      <div><FieldHeader label="Room" field={workspace.fl300.hearing.room} /><Input value={workspace.fl300.hearing.room.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, hearing: { ...fl300.hearing, room: setDraftFieldValue(fl300.hearing.room, e.target.value) } }))} /></div>
                      <div className="md:col-span-2">
                        <FieldHeader label="Hearing location mode" field={workspace.fl300.hearing.locationMode} />
                        <select value={workspace.fl300.hearing.locationMode.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, hearing: { ...fl300.hearing, locationMode: setDraftFieldValue(fl300.hearing.locationMode, e.target.value as 'unspecified' | 'same_as_above' | 'other') } }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                          <option value="unspecified">Not selected</option><option value="same_as_above">Same as caption court</option><option value="other">Other</option>
                        </select>
                      </div>
                      {workspace.fl300.hearing.locationMode.value === 'other' && <div className="md:col-span-2"><FieldHeader label="Other hearing location" field={workspace.fl300.hearing.otherLocation} /><Input value={workspace.fl300.hearing.otherLocation.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, hearing: { ...fl300.hearing, otherLocation: setDraftFieldValue(fl300.hearing.otherLocation, e.target.value) } }))} /></div>}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5"><Checkbox checked={workspace.fl300.temporaryEmergencyFl305Applies.value} onCheckedChange={(checked) => updateFl300((fl300) => ({ ...fl300, temporaryEmergencyFl305Applies: setDraftFieldValue(fl300.temporaryEmergencyFl305Applies, checked === true) }))} /><span className="text-sm text-slate-700 dark:text-slate-200">FL-305 applies</span></label>
                      <label className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5"><Checkbox checked={workspace.fl300.custodyMediation.required.value} onCheckedChange={(checked) => updateFl300((fl300) => ({ ...fl300, custodyMediation: { ...fl300.custodyMediation, required: setDraftFieldValue(fl300.custodyMediation.required, checked === true) } }))} /><span className="text-sm text-slate-700 dark:text-slate-200">Custody mediation/counseling appointment</span></label>
                      <label className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5"><Checkbox checked={workspace.fl300.service.timeShortened.value} onCheckedChange={(checked) => updateFl300((fl300) => ({ ...fl300, service: { ...fl300.service, timeShortened: setDraftFieldValue(fl300.service.timeShortened, checked === true) } }))} /><span className="text-sm text-slate-700 dark:text-slate-200">Time for service / hearing shortened</span></label>
                      {workspace.fl300.custodyMediation.required.value && <div className="md:col-span-3"><FieldHeader label="Mediation/counseling date, time, and location" field={workspace.fl300.custodyMediation.details} /><Textarea className="min-h-[72px]" value={workspace.fl300.custodyMediation.details.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, custodyMediation: { ...fl300.custodyMediation, details: setDraftFieldValue(fl300.custodyMediation.details, e.target.value) } }))} /></div>}
                      <div><FieldHeader label="Service on/before date" field={workspace.fl300.service.serviceDate} /><Input type="date" value={workspace.fl300.service.serviceDate.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, service: { ...fl300.service, serviceDate: setDraftFieldValue(fl300.service.serviceDate, e.target.value) } }))} /></div>
                      <div><FieldHeader label="FL-320 response due date" field={workspace.fl300.service.responsiveDeclarationDueDate} /><Input type="date" value={workspace.fl300.service.responsiveDeclarationDueDate.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, service: { ...fl300.service, responsiveDeclarationDueDate: setDraftFieldValue(fl300.service.responsiveDeclarationDueDate, e.target.value) } }))} /></div>
                      <div><FieldHeader label="Court days before hearing" field={workspace.fl300.service.courtDaysBeforeHearing} /><Input value={workspace.fl300.service.courtDaysBeforeHearing.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, service: { ...fl300.service, courtDaysBeforeHearing: setDraftFieldValue(fl300.service.courtDaysBeforeHearing, e.target.value) } }))} /></div>
                      <div className="md:col-span-3"><FieldHeader label="Reason for shortened time / orders" field={workspace.fl300.service.orderShorterServiceReason} /><Textarea className="min-h-[72px]" value={workspace.fl300.service.orderShorterServiceReason.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, service: { ...fl300.service, orderShorterServiceReason: setDraftFieldValue(fl300.service.orderShorterServiceReason, e.target.value) } }))} /></div>
                    </div>

                    {(workspace.fl300.requestTypes.childCustody.value || workspace.fl300.requestTypes.visitation.value) && (
                      <div className="rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Custody / visitation request details</p>
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          <label className="flex items-start gap-2"><Checkbox checked={workspace.fl300.custodyRequests.useChildRows.value} onCheckedChange={(checked) => updateFl300((fl300) => ({ ...fl300, custodyRequests: { ...fl300.custodyRequests, useChildRows: setDraftFieldValue(fl300.custodyRequests.useChildRows, checked === true) } }))} /><span className="text-sm">Fill child custody rows</span></label>
                          <label className="flex items-start gap-2"><Checkbox checked={workspace.fl300.custodyRequests.useCustodyAttachments.value} onCheckedChange={(checked) => updateFl300((fl300) => ({ ...fl300, custodyRequests: { ...fl300.custodyRequests, useCustodyAttachments: setDraftFieldValue(fl300.custodyRequests.useCustodyAttachments, checked === true) } }))} /><span className="text-sm">Reference attached custody forms</span></label>
                          {(['useFl305', 'useFl311', 'useFl312', 'useFl341c', 'useFl341d', 'useFl341e'] as const).map((key) => <label key={key} className="flex items-start gap-2"><Checkbox checked={workspace.fl300.custodyRequests[key].value} onCheckedChange={(checked) => updateFl300((fl300) => ({ ...fl300, custodyRequests: { ...fl300.custodyRequests, [key]: setDraftFieldValue(fl300.custodyRequests[key], checked === true) } }))} /><span className="text-sm">{key.replace('use', '')}</span></label>)}
                          <div><FieldHeader label="Legal custody text" field={workspace.fl300.custodyRequests.legalCustodyToText} /><Input value={workspace.fl300.custodyRequests.legalCustodyToText.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, custodyRequests: { ...fl300.custodyRequests, legalCustodyToText: setDraftFieldValue(fl300.custodyRequests.legalCustodyToText, e.target.value) } }))} placeholder="e.g., Joint" /></div>
                          <div><FieldHeader label="Physical custody text" field={workspace.fl300.custodyRequests.physicalCustodyToText} /><Input value={workspace.fl300.custodyRequests.physicalCustodyToText.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, custodyRequests: { ...fl300.custodyRequests, physicalCustodyToText: setDraftFieldValue(fl300.custodyRequests.physicalCustodyToText, e.target.value) } }))} placeholder="e.g., Petitioner" /></div>
                          <div><FieldHeader label="Other attachment" field={workspace.fl300.custodyRequests.otherAttachmentText} /><Input value={workspace.fl300.custodyRequests.otherAttachmentText.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, custodyRequests: { ...fl300.custodyRequests, otherAttachmentText: setDraftFieldValue(fl300.custodyRequests.otherAttachmentText, e.target.value) } }))} /></div>
                          <div className="md:col-span-3"><FieldHeader label="As-follows custody / visitation orders" field={workspace.fl300.custodyRequests.asFollowsText} /><Textarea className="min-h-[80px]" value={workspace.fl300.custodyRequests.asFollowsText.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, custodyRequests: { ...fl300.custodyRequests, asFollowsText: setDraftFieldValue(fl300.custodyRequests.asFollowsText, e.target.value) } }))} /></div>
                          <div className="md:col-span-3"><FieldHeader label="Best-interest reasons" field={workspace.fl300.custodyRequests.bestInterestReasons} /><Textarea className="min-h-[80px]" value={workspace.fl300.custodyRequests.bestInterestReasons.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, custodyRequests: { ...fl300.custodyRequests, bestInterestReasons: setDraftFieldValue(fl300.custodyRequests.bestInterestReasons, e.target.value) } }))} /></div>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div><FieldHeader label="Child support amount/details" field={workspace.fl300.supportRequests.childSupportMonthlyAmountText} /><Input value={workspace.fl300.supportRequests.childSupportMonthlyAmountText.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, supportRequests: { ...fl300.supportRequests, childSupportMonthlyAmountText: setDraftFieldValue(fl300.supportRequests.childSupportMonthlyAmountText, e.target.value) } }))} /></div>
                      <label className="mt-7 flex items-start gap-2"><Checkbox checked={workspace.fl300.supportRequests.childSupportGuideline.value} onCheckedChange={(checked) => updateFl300((fl300) => ({ ...fl300, supportRequests: { ...fl300.supportRequests, childSupportGuideline: setDraftFieldValue(fl300.supportRequests.childSupportGuideline, checked === true) } }))} /><span className="text-sm">Request guideline child support</span></label>
                      <div><FieldHeader label="Spousal support amount" field={workspace.fl300.supportRequests.spousalSupportAmount} /><Input value={workspace.fl300.supportRequests.spousalSupportAmount.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, supportRequests: { ...fl300.supportRequests, spousalSupportAmount: setDraftFieldValue(fl300.supportRequests.spousalSupportAmount, e.target.value) } }))} /></div>
                      <div><FieldHeader label="Attorney fees/costs amount" field={workspace.fl300.attorneyFees.amount} /><Input value={workspace.fl300.attorneyFees.amount.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, attorneyFees: { ...fl300.attorneyFees, amount: setDraftFieldValue(fl300.attorneyFees.amount, e.target.value) } }))} /></div>
                      {workspace.fl300.requestTypes.attorneyFeesCosts.value && (
                        <div className="md:col-span-2 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                          <label className="flex items-start gap-2">
                            <Checkbox checked={workspace.fl300.attorneyFees.includeFl319.value} onCheckedChange={(checked) => updateFl300((fl300) => ({ ...fl300, attorneyFees: { ...fl300.attorneyFees, includeFl319: setDraftFieldValue(fl300.attorneyFees.includeFl319, checked === true) } }))} />
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Include FL-319 attorney fees/costs attachment</span>
                          </label>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Use this when FL-300 asks the court to order another party to pay attorney fees or costs.</p>
                          {workspace.fl300.attorneyFees.includeFl319.value && (
                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                              <label className="flex items-start gap-2 md:col-span-3"><Checkbox checked={workspace.fl300.attorneyFees.freeLegalServices.value} onCheckedChange={(checked) => updateFl300((fl300) => ({ ...fl300, attorneyFees: { ...fl300.attorneyFees, freeLegalServices: setDraftFieldValue(fl300.attorneyFees.freeLegalServices, checked === true) } }))} /><span className="text-sm">Receiving free legal services</span></label>
                              <div><FieldHeader label="Fees requested" field={workspace.fl300.attorneyFees.feesRequestedAmount} /><Input value={workspace.fl300.attorneyFees.feesRequestedAmount.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, attorneyFees: { ...fl300.attorneyFees, feesRequestedAmount: setDraftFieldValue(fl300.attorneyFees.feesRequestedAmount, e.target.value) } }))} placeholder="$5,000" /></div>
                              <div><FieldHeader label="Costs requested" field={workspace.fl300.attorneyFees.costsRequestedAmount} /><Input value={workspace.fl300.attorneyFees.costsRequestedAmount.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, attorneyFees: { ...fl300.attorneyFees, costsRequestedAmount: setDraftFieldValue(fl300.attorneyFees.costsRequestedAmount, e.target.value) } }))} placeholder="$750" /></div>
                              <div><FieldHeader label="Fees/costs incurred to date" field={workspace.fl300.attorneyFees.incurredToDateAmount} /><Input value={workspace.fl300.attorneyFees.incurredToDateAmount.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, attorneyFees: { ...fl300.attorneyFees, incurredToDateAmount: setDraftFieldValue(fl300.attorneyFees.incurredToDateAmount, e.target.value) } }))} /></div>
                              <div><FieldHeader label="Estimated future fees/costs" field={workspace.fl300.attorneyFees.estimatedFutureAmount} /><Input value={workspace.fl300.attorneyFees.estimatedFutureAmount.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, attorneyFees: { ...fl300.attorneyFees, estimatedFutureAmount: setDraftFieldValue(fl300.attorneyFees.estimatedFutureAmount, e.target.value) } }))} /></div>
                              <div><FieldHeader label="Limited scope fees/costs" field={workspace.fl300.attorneyFees.limitedScopeAmount} /><Input value={workspace.fl300.attorneyFees.limitedScopeAmount.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, attorneyFees: { ...fl300.attorneyFees, limitedScopeAmount: setDraftFieldValue(fl300.attorneyFees.limitedScopeAmount, e.target.value) } }))} /></div>
                              <div>
                                <FieldHeader label="Payment requested from" field={workspace.fl300.attorneyFees.paymentRequestedFrom} />
                                <select value={workspace.fl300.attorneyFees.paymentRequestedFrom.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, attorneyFees: { ...fl300.attorneyFees, paymentRequestedFrom: setDraftFieldValue(fl300.attorneyFees.paymentRequestedFrom, e.target.value as 'unspecified' | 'petitioner' | 'respondent' | 'other') } }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                                  <option value="unspecified">Not selected</option><option value="petitioner">Petitioner</option><option value="respondent">Respondent</option><option value="other">Other</option>
                                </select>
                              </div>
                              {workspace.fl300.attorneyFees.paymentRequestedFrom.value === 'other' && <div><FieldHeader label="Other paying party name" field={workspace.fl300.attorneyFees.paymentRequestedFromOtherName} /><Input value={workspace.fl300.attorneyFees.paymentRequestedFromOtherName.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, attorneyFees: { ...fl300.attorneyFees, paymentRequestedFromOtherName: setDraftFieldValue(fl300.attorneyFees.paymentRequestedFromOtherName, e.target.value) } }))} /></div>}
                              <div>
                                <FieldHeader label="Prior fee order?" field={workspace.fl300.attorneyFees.priorFeeOrderExists} />
                                <select value={workspace.fl300.attorneyFees.priorFeeOrderExists.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, attorneyFees: { ...fl300.attorneyFees, priorFeeOrderExists: setDraftFieldValue(fl300.attorneyFees.priorFeeOrderExists, e.target.value as 'unspecified' | 'no' | 'yes') } }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                                  <option value="unspecified">Not selected</option><option value="no">No</option><option value="yes">Yes</option>
                                </select>
                              </div>
                              {workspace.fl300.attorneyFees.priorFeeOrderExists.value === 'yes' && <>
                                <div><FieldHeader label="Prior order payor" field={workspace.fl300.attorneyFees.priorFeeOrderPayor} /><select value={workspace.fl300.attorneyFees.priorFeeOrderPayor.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, attorneyFees: { ...fl300.attorneyFees, priorFeeOrderPayor: setDraftFieldValue(fl300.attorneyFees.priorFeeOrderPayor, e.target.value as 'unspecified' | 'petitioner' | 'respondent' | 'other') } }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"><option value="unspecified">Not selected</option><option value="petitioner">Petitioner</option><option value="respondent">Respondent</option><option value="other">Other</option></select></div>
                                <div><FieldHeader label="Prior order amount" field={workspace.fl300.attorneyFees.priorFeeOrderAmount} /><Input value={workspace.fl300.attorneyFees.priorFeeOrderAmount.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, attorneyFees: { ...fl300.attorneyFees, priorFeeOrderAmount: setDraftFieldValue(fl300.attorneyFees.priorFeeOrderAmount, e.target.value) } }))} /></div>
                                <div><FieldHeader label="Prior order date" field={workspace.fl300.attorneyFees.priorFeeOrderDate} /><Input type="date" value={workspace.fl300.attorneyFees.priorFeeOrderDate.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, attorneyFees: { ...fl300.attorneyFees, priorFeeOrderDate: setDraftFieldValue(fl300.attorneyFees.priorFeeOrderDate, e.target.value) } }))} /></div>
                              </>}
                              <div>
                                <FieldHeader label="Prior payments status" field={workspace.fl300.attorneyFees.priorPaymentsStatus} />
                                <select value={workspace.fl300.attorneyFees.priorPaymentsStatus.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, attorneyFees: { ...fl300.attorneyFees, priorPaymentsStatus: setDraftFieldValue(fl300.attorneyFees.priorPaymentsStatus, e.target.value as 'unspecified' | 'made' | 'not_made' | 'partial') } }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                                  <option value="unspecified">Not selected</option><option value="made">Have been made</option><option value="not_made">Have not been made</option><option value="partial">Have been made in part</option>
                                </select>
                              </div>
                              <div><FieldHeader label="Pages attached to FL-319" field={workspace.fl300.attorneyFees.pagesAttached} /><Input value={workspace.fl300.attorneyFees.pagesAttached.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, attorneyFees: { ...fl300.attorneyFees, pagesAttached: setDraftFieldValue(fl300.attorneyFees.pagesAttached, e.target.value) } }))} /></div>
                              <div className="md:col-span-3"><FieldHeader label="Payment sources, if known" field={workspace.fl300.attorneyFees.paymentSources} /><Textarea className="min-h-[72px]" value={workspace.fl300.attorneyFees.paymentSources.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, attorneyFees: { ...fl300.attorneyFees, paymentSources: setDraftFieldValue(fl300.attorneyFees.paymentSources, e.target.value) } }))} /></div>
                              <div className="md:col-span-3"><FieldHeader label="Additional FL-319 information" field={workspace.fl300.attorneyFees.additionalInformation} /><Textarea className="min-h-[90px]" value={workspace.fl300.attorneyFees.additionalInformation.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, attorneyFees: { ...fl300.attorneyFees, additionalInformation: setDraftFieldValue(fl300.attorneyFees.additionalInformation, e.target.value) } }))} /></div>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="md:col-span-2"><FieldHeader label="Property-control property/debt details" field={workspace.fl300.propertyControl.propertyDescription} /><Textarea className="min-h-[72px]" value={workspace.fl300.propertyControl.propertyDescription.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, propertyControl: { ...fl300.propertyControl, propertyDescription: setDraftFieldValue(fl300.propertyControl.propertyDescription, e.target.value) } }))} /></div>
                      <div className="md:col-span-2"><FieldHeader label="Other orders requested" field={workspace.fl300.otherOrdersRequested} /><Textarea className="min-h-[72px]" value={workspace.fl300.otherOrdersRequested.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, otherOrdersRequested: setDraftFieldValue(fl300.otherOrdersRequested, e.target.value) }))} /></div>
                      <div id="draft-field-fl300-facts" className="scroll-mt-24 md:col-span-2"><FieldHeader label="Facts supporting the requested orders" field={workspace.fl300.facts} /><Textarea className="min-h-[110px]" value={workspace.fl300.facts.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, facts: setDraftFieldValue(fl300.facts, e.target.value) }))} placeholder="Required. Longer facts will generate an Attachment 9 continuation." /></div>
                      <div id="draft-field-fl300-signature-date" className="scroll-mt-24"><FieldHeader label="Signature date" field={workspace.fl300.signatureDate} /><Input type="date" value={workspace.fl300.signatureDate.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, signatureDate: setDraftFieldValue(fl300.signatureDate, e.target.value) }))} /></div>
                      <div><FieldHeader label="Type/print name" field={workspace.fl300.typePrintName} /><Input value={workspace.fl300.typePrintName.value} onChange={(e) => updateFl300((fl300) => ({ ...fl300, typePrintName: setDraftFieldValue(fl300.typePrintName, e.target.value) }))} /></div>
                    </div>
                    </div>
                  </details>
                )}
              </CardContent>
            </Card>

            <Card id="draft-section-fl150" className="scroll-mt-24 rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-slate-950 dark:text-white">FL-150 Income and Expense Declaration</CardTitle>
                <CardDescription>Optional financial declaration for support/fee requests. Values are never inferred from FL-300; enter only explicit financial facts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <Checkbox checked={workspace.fl150.includeForm.value} onCheckedChange={(checked) => updateFl150((fl150) => ({ ...fl150, includeForm: setDraftFieldValue(fl150.includeForm, checked === true) }))} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Include FL-150 in generated packet</span><FieldSourceBadge field={workspace.fl150.includeForm} /></div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Recommended when FL-300 requests child support, spousal/partner support, or attorney fees/costs. Blank/unknown financial entries remain blank.</p>
                  </div>
                </label>
                {(workspace.fl300.includeForm.value && (workspace.fl300.requestTypes.childSupport.value || workspace.fl300.requestTypes.spousalSupport.value || workspace.fl300.requestTypes.attorneyFeesCosts.value)) && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-300/20 dark:bg-amber-500/10 dark:text-amber-100">
                    FL-300 has a support/fee request selected. FL-150 is recommended, but not auto-selected.
                  </div>
                )}
                {workspace.fl150.includeForm.value && (
                  <details
                    className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-300/20 dark:bg-emerald-500/10"
                    open={formMode === 'advanced' || simplePanelsOpen.fl150}
                    onToggle={(event) => {
                      if (formMode === 'simple') {
                        setSimplePanelsOpen((current) => ({ ...current, fl150: event.currentTarget.open }));
                      }
                    }}
                  >
                    <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-emerald-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-100">
                      {formMode === 'simple' ? 'Edit exact FL-150 fields' : 'Exact FL-150 field editor'}
                      <span className="ml-2 text-xs font-normal text-emerald-800/80 dark:text-emerald-100/70">Optional income and expense details</span>
                    </summary>
                    <div className="space-y-5 border-t border-emerald-200/70 p-4 dark:border-emerald-300/20">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div><FieldHeader label="Employer" field={workspace.fl150.employment.employer} /><Input value={workspace.fl150.employment.employer.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, employment: { ...fl150.employment, employer: setDraftFieldValue(fl150.employment.employer, e.target.value) } }))} /></div>
                      <div><FieldHeader label="Occupation" field={workspace.fl150.employment.occupation} /><Input value={workspace.fl150.employment.occupation.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, employment: { ...fl150.employment, occupation: setDraftFieldValue(fl150.employment.occupation, e.target.value) } }))} /></div>
                      <div><FieldHeader label="Hours/week" field={workspace.fl150.employment.hoursPerWeek} /><Input value={workspace.fl150.employment.hoursPerWeek.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, employment: { ...fl150.employment, hoursPerWeek: setDraftFieldValue(fl150.employment.hoursPerWeek, e.target.value) } }))} /></div>
                      <div className="md:col-span-2"><FieldHeader label="Employer address" field={workspace.fl150.employment.employerAddress} /><Input value={workspace.fl150.employment.employerAddress.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, employment: { ...fl150.employment, employerAddress: setDraftFieldValue(fl150.employment.employerAddress, e.target.value) } }))} /></div>
                      <div><FieldHeader label="Employer phone" field={workspace.fl150.employment.employerPhone} /><Input value={workspace.fl150.employment.employerPhone.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, employment: { ...fl150.employment, employerPhone: setDraftFieldValue(fl150.employment.employerPhone, e.target.value) } }))} /></div>
                      <div><FieldHeader label="Job start date" field={workspace.fl150.employment.jobStartDate} /><Input type="date" value={workspace.fl150.employment.jobStartDate.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, employment: { ...fl150.employment, jobStartDate: setDraftFieldValue(fl150.employment.jobStartDate, e.target.value) } }))} /></div>
                      <div><FieldHeader label="Job end date if unemployed" field={workspace.fl150.employment.jobEndDate} /><Input type="date" value={workspace.fl150.employment.jobEndDate.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, employment: { ...fl150.employment, jobEndDate: setDraftFieldValue(fl150.employment.jobEndDate, e.target.value) } }))} /></div>
                      <div><FieldHeader label="Pay amount" field={workspace.fl150.employment.payAmount} /><Input value={workspace.fl150.employment.payAmount.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, employment: { ...fl150.employment, payAmount: setDraftFieldValue(fl150.employment.payAmount, e.target.value) } }))} /></div>
                      <div><FieldHeader label="Pay period" field={workspace.fl150.employment.payPeriod} /><select value={workspace.fl150.employment.payPeriod.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, employment: { ...fl150.employment, payPeriod: setDraftFieldValue(fl150.employment.payPeriod, e.target.value as DraftFormsWorkspace['fl150']['employment']['payPeriod']['value']) } }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="unspecified">Not selected</option><option value="month">Per month</option><option value="week">Per week</option><option value="hour">Per hour</option></select></div>
                    </div>
                    <Separator />
                    <div className="grid gap-4 md:grid-cols-4">
                      <div><FieldHeader label="Age" field={workspace.fl150.education.age} /><Input value={workspace.fl150.education.age.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, education: { ...fl150.education, age: setDraftFieldValue(fl150.education.age, e.target.value) } }))} /></div>
                      <div><FieldHeader label="High school graduated" field={workspace.fl150.education.highSchoolGraduated} /><select value={workspace.fl150.education.highSchoolGraduated.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, education: { ...fl150.education, highSchoolGraduated: setDraftFieldValue(fl150.education.highSchoolGraduated, e.target.value as DraftFormsWorkspace['fl150']['education']['highSchoolGraduated']['value']) } }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="unspecified">Not selected</option><option value="yes">Yes</option><option value="no">No</option></select></div>
                      <div><FieldHeader label="Tax year" field={workspace.fl150.taxes.taxYear} /><Input value={workspace.fl150.taxes.taxYear.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, taxes: { ...fl150.taxes, taxYear: setDraftFieldValue(fl150.taxes.taxYear, e.target.value) } }))} /></div>
                      <div><FieldHeader label="Tax exemptions" field={workspace.fl150.taxes.exemptions} /><Input value={workspace.fl150.taxes.exemptions.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, taxes: { ...fl150.taxes, exemptions: setDraftFieldValue(fl150.taxes.exemptions, e.target.value) } }))} /></div>
                      <div><FieldHeader label="Filing status" field={workspace.fl150.taxes.filingStatus} /><select value={workspace.fl150.taxes.filingStatus.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, taxes: { ...fl150.taxes, filingStatus: setDraftFieldValue(fl150.taxes.filingStatus, e.target.value as DraftFormsWorkspace['fl150']['taxes']['filingStatus']['value']) } }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="unspecified">Not selected</option><option value="single">Single</option><option value="head_of_household">Head of household</option><option value="married_separate">Married filing separately</option><option value="married_joint">Married filing jointly</option></select></div>
                      <div><FieldHeader label="Tax state" field={workspace.fl150.taxes.taxState} /><select value={workspace.fl150.taxes.taxState.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, taxes: { ...fl150.taxes, taxState: setDraftFieldValue(fl150.taxes.taxState, e.target.value as DraftFormsWorkspace['fl150']['taxes']['taxState']['value']) } }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="unspecified">Not selected</option><option value="california">California</option><option value="other">Other</option></select></div>
                      <div><FieldHeader label="Other party gross monthly income estimate" field={workspace.fl150.otherPartyIncome.grossMonthlyEstimate} /><Input value={workspace.fl150.otherPartyIncome.grossMonthlyEstimate.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, otherPartyIncome: { ...fl150.otherPartyIncome, grossMonthlyEstimate: setDraftFieldValue(fl150.otherPartyIncome.grossMonthlyEstimate, e.target.value) } }))} /></div>
                      <div><FieldHeader label="Estimate basis" field={workspace.fl150.otherPartyIncome.basis} /><Input value={workspace.fl150.otherPartyIncome.basis.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, otherPartyIncome: { ...fl150.otherPartyIncome, basis: setDraftFieldValue(fl150.otherPartyIncome.basis, e.target.value) } }))} /></div>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Income (last month / average monthly)</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {([['salaryWages', 'Salary/wages'], ['overtime', 'Overtime'], ['commissionsBonuses', 'Commissions/bonuses'], ['publicAssistance', 'Public assistance'], ['spousalSupport', 'Spousal support'], ['partnerSupport', 'Partner support'], ['pensionRetirement', 'Pension/retirement'], ['socialSecurityDisability', 'Social Security/disability'], ['unemploymentWorkersComp', 'Unemployment/workers comp'], ['otherIncome', 'Other income']] as const).map(([key, label]) => (
                          <div key={key} className="grid grid-cols-[1fr_7rem_7rem] items-end gap-2"><span className="pb-2 text-sm text-slate-700 dark:text-slate-200">{label}</span><Input placeholder="Last" value={workspace.fl150.income[key].lastMonth.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, income: { ...fl150.income, [key]: { ...fl150.income[key], lastMonth: setDraftFieldValue(fl150.income[key].lastMonth, e.target.value) } } }))} /><Input placeholder="Avg" value={workspace.fl150.income[key].averageMonthly.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, income: { ...fl150.income, [key]: { ...fl150.income[key], averageMonthly: setDraftFieldValue(fl150.income[key].averageMonthly, e.target.value) } } }))} /></div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div className="grid gap-4 md:grid-cols-3">
                      {([['requiredUnionDues', 'Union dues'], ['retirement', 'Retirement'], ['medicalInsurance', 'Medical insurance'], ['supportPaid', 'Support paid'], ['wageAssignment', 'Wage assignment'], ['jobExpenses', 'Job expenses'], ['otherDeductions', 'Other deductions'], ['totalDeductions', 'Total deductions']] as const).map(([key, label]) => <div key={key}><FieldHeader label={label} field={workspace.fl150.deductions[key]} /><Input value={workspace.fl150.deductions[key].value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, deductions: { ...fl150.deductions, [key]: setDraftFieldValue(fl150.deductions[key], e.target.value) } }))} /></div>)}
                      {([['cashChecking', 'Cash/checking'], ['savingsCreditUnion', 'Savings/credit union'], ['stocksBonds', 'Stocks/bonds'], ['realProperty', 'Real property'], ['otherProperty', 'Other property']] as const).map(([key, label]) => <div key={key}><FieldHeader label={label} field={workspace.fl150.assets[key]} /><Input value={workspace.fl150.assets[key].value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, assets: { ...fl150.assets, [key]: setDraftFieldValue(fl150.assets[key], e.target.value) } }))} /></div>)}
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Monthly expenses</p>
                      <div className="mt-3 grid gap-4 md:grid-cols-4">
                        <div><FieldHeader label="Expense basis" field={workspace.fl150.expenses.basis} /><select value={workspace.fl150.expenses.basis.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, expenses: { ...fl150.expenses, basis: setDraftFieldValue(fl150.expenses.basis, e.target.value as DraftFormsWorkspace['fl150']['expenses']['basis']['value']) } }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="unspecified">Not selected</option><option value="estimated">Estimated</option><option value="actual">Actual</option><option value="proposed">Proposed needs</option></select></div>
                        {([['rentOrMortgage', 'Rent/mortgage'], ['propertyTax', 'Property tax'], ['insurance', 'Insurance'], ['maintenance', 'Maintenance'], ['healthCosts', 'Health costs'], ['groceriesHousehold', 'Groceries/household'], ['eatingOut', 'Eating out'], ['utilities', 'Utilities'], ['phone', 'Phone'], ['laundryCleaning', 'Laundry/cleaning'], ['clothes', 'Clothes'], ['education', 'Education'], ['entertainmentGiftsVacation', 'Entertainment/gifts/vacation'], ['auto', 'Auto'], ['autoInsurance', 'Auto insurance'], ['savingsInvestments', 'Savings/investments'], ['charitable', 'Charitable'], ['monthlyDebtPayments', 'Monthly debt payments'], ['otherExpenses', 'Other expenses'], ['totalExpenses', 'Total expenses']] as const).map(([key, label]) => <div key={key}><FieldHeader label={label} field={workspace.fl150.expenses[key]} /><Input value={workspace.fl150.expenses[key].value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, expenses: { ...fl150.expenses, [key]: setDraftFieldValue(fl150.expenses[key], e.target.value) } }))} /></div>)}
                        <div className="md:col-span-2"><FieldHeader label="Other expense description" field={workspace.fl150.expenses.otherDescription} /><Input value={workspace.fl150.expenses.otherDescription.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, expenses: { ...fl150.expenses, otherDescription: setDraftFieldValue(fl150.expenses.otherDescription, e.target.value) } }))} /></div>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid gap-4 md:grid-cols-3">
                      <div><FieldHeader label="Children health insurance" field={workspace.fl150.childrenSupport.hasChildrenHealthInsurance} /><select value={workspace.fl150.childrenSupport.hasChildrenHealthInsurance.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, childrenSupport: { ...fl150.childrenSupport, hasChildrenHealthInsurance: setDraftFieldValue(fl150.childrenSupport.hasChildrenHealthInsurance, e.target.value as DraftFormsWorkspace['fl150']['childrenSupport']['hasChildrenHealthInsurance']['value']) } }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="unspecified">Not selected</option><option value="yes">I do</option><option value="no">I do not</option></select></div>
                      <div><FieldHeader label="Insurance company" field={workspace.fl150.childrenSupport.insuranceCompanyName} /><Input value={workspace.fl150.childrenSupport.insuranceCompanyName.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, childrenSupport: { ...fl150.childrenSupport, insuranceCompanyName: setDraftFieldValue(fl150.childrenSupport.insuranceCompanyName, e.target.value) } }))} /></div>
                      <div><FieldHeader label="Insurance monthly cost" field={workspace.fl150.childrenSupport.insuranceMonthlyCost} /><Input value={workspace.fl150.childrenSupport.insuranceMonthlyCost.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, childrenSupport: { ...fl150.childrenSupport, insuranceMonthlyCost: setDraftFieldValue(fl150.childrenSupport.insuranceMonthlyCost, e.target.value) } }))} /></div>
                      <div><FieldHeader label="Number of children" field={workspace.fl150.childrenSupport.numberOfChildren} /><Input value={workspace.fl150.childrenSupport.numberOfChildren.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, childrenSupport: { ...fl150.childrenSupport, numberOfChildren: setDraftFieldValue(fl150.childrenSupport.numberOfChildren, e.target.value) } }))} /></div>
                      <div><FieldHeader label="Parenting time % with me" field={workspace.fl150.childrenSupport.timeshareMePercent} /><Input value={workspace.fl150.childrenSupport.timeshareMePercent.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, childrenSupport: { ...fl150.childrenSupport, timeshareMePercent: setDraftFieldValue(fl150.childrenSupport.timeshareMePercent, e.target.value) } }))} /></div>
                      <div><FieldHeader label="Parenting time % with other parent" field={workspace.fl150.childrenSupport.timeshareOtherParentPercent} /><Input value={workspace.fl150.childrenSupport.timeshareOtherParentPercent.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, childrenSupport: { ...fl150.childrenSupport, timeshareOtherParentPercent: setDraftFieldValue(fl150.childrenSupport.timeshareOtherParentPercent, e.target.value) } }))} /></div>
                      <div><FieldHeader label="Child care costs" field={workspace.fl150.childrenSupport.childCareCosts} /><Input value={workspace.fl150.childrenSupport.childCareCosts.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, childrenSupport: { ...fl150.childrenSupport, childCareCosts: setDraftFieldValue(fl150.childrenSupport.childCareCosts, e.target.value) } }))} /></div>
                      <div><FieldHeader label="Health care costs not covered" field={workspace.fl150.childrenSupport.healthCareCostsNotCovered} /><Input value={workspace.fl150.childrenSupport.healthCareCostsNotCovered.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, childrenSupport: { ...fl150.childrenSupport, healthCareCostsNotCovered: setDraftFieldValue(fl150.childrenSupport.healthCareCostsNotCovered, e.target.value) } }))} /></div>
                      <div><FieldHeader label="Special needs amount" field={workspace.fl150.childrenSupport.specialNeedsAmount} /><Input value={workspace.fl150.childrenSupport.specialNeedsAmount.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, childrenSupport: { ...fl150.childrenSupport, specialNeedsAmount: setDraftFieldValue(fl150.childrenSupport.specialNeedsAmount, e.target.value) } }))} /></div>
                      <div className="md:col-span-3"><FieldHeader label="Parenting schedule / special needs notes" field={workspace.fl150.childrenSupport.parentingScheduleDescription} /><Textarea className="min-h-[72px]" value={workspace.fl150.childrenSupport.parentingScheduleDescription.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, childrenSupport: { ...fl150.childrenSupport, parentingScheduleDescription: setDraftFieldValue(fl150.childrenSupport.parentingScheduleDescription, e.target.value) } }))} /></div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div><FieldHeader label="Attachment page count" field={workspace.fl150.attachmentPageCount} /><Input value={workspace.fl150.attachmentPageCount.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, attachmentPageCount: setDraftFieldValue(fl150.attachmentPageCount, e.target.value) }))} /></div>
                      <div id="draft-field-fl150-signature-date" className="scroll-mt-24"><FieldHeader label="Signature date" field={workspace.fl150.signatureDate} /><Input type="date" value={workspace.fl150.signatureDate.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, signatureDate: setDraftFieldValue(fl150.signatureDate, e.target.value) }))} /></div>
                      <div><FieldHeader label="Type/print name" field={workspace.fl150.typePrintName} /><Input value={workspace.fl150.typePrintName.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, typePrintName: setDraftFieldValue(fl150.typePrintName, e.target.value) }))} /></div>
                      <div className="md:col-span-3"><FieldHeader label="Other support information / hardship explanation" field={workspace.fl150.supportOtherInformation} /><Textarea className="min-h-[80px]" value={workspace.fl150.supportOtherInformation.value} onChange={(e) => updateFl150((fl150) => ({ ...fl150, supportOtherInformation: setDraftFieldValue(fl150.supportOtherInformation, e.target.value) }))} /></div>
                    </div>
                    </div>
                  </details>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-slate-950 dark:text-white">Case basics</CardTitle>
                <CardDescription>Core starter-packet facts plus court caption details used across FL-100 and FL-105/GC-120.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <div>
                  <FieldHeader label="Filing county" field={workspace.filingCounty} />
                  <Input
                    value={workspace.filingCounty.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, filingCounty: setDraftFieldValue(current.filingCounty, e.target.value) }))}
                    placeholder="Los Angeles"
                  />
                </div>
                <div>
                  <FieldHeader label="Case number" field={workspace.caseNumber} />
                  <Input
                    value={workspace.caseNumber.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, caseNumber: setDraftFieldValue(current.caseNumber, e.target.value) }))}
                    placeholder="24FL000123"
                  />
                </div>
                <div>
                  <FieldHeader label="Respondent name" field={workspace.respondentName} />
                  <Input
                    value={workspace.respondentName.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, respondentName: setDraftFieldValue(current.respondentName, e.target.value) }))}
                    placeholder="Spouse / respondent full name"
                  />
                </div>
                <div>
                  <FieldHeader label="Date of marriage" field={workspace.marriageDate} />
                  <Input
                    type="date"
                    value={workspace.marriageDate.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, marriageDate: setDraftFieldValue(current.marriageDate, e.target.value) }))}
                  />
                </div>
                <div>
                  <FieldHeader label="Date of separation" field={workspace.separationDate} />
                  <Input
                    type="date"
                    value={workspace.separationDate.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, separationDate: setDraftFieldValue(current.separationDate, e.target.value) }))}
                  />
                </div>
                <div>
                  <FieldHeader label="Court street" field={workspace.courtStreet} />
                  <Input
                    value={workspace.courtStreet.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, courtStreet: setDraftFieldValue(current.courtStreet, e.target.value) }))}
                    placeholder="111 N Hill St"
                  />
                </div>
                <div>
                  <FieldHeader label="Court mailing address" field={workspace.courtMailingAddress} />
                  <Input
                    value={workspace.courtMailingAddress.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, courtMailingAddress: setDraftFieldValue(current.courtMailingAddress, e.target.value) }))}
                    placeholder="Same as street or P.O. Box"
                  />
                </div>
                <div>
                  <FieldHeader label="Court city / ZIP" field={workspace.courtCityZip} />
                  <Input
                    value={workspace.courtCityZip.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, courtCityZip: setDraftFieldValue(current.courtCityZip, e.target.value) }))}
                    placeholder="Los Angeles, CA 90012"
                  />
                </div>
                <div>
                  <FieldHeader label="Court branch" field={workspace.courtBranch} />
                  <Input
                    value={workspace.courtBranch.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, courtBranch: setDraftFieldValue(current.courtBranch, e.target.value) }))}
                    placeholder="Central District / Stanley Mosk"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-slate-950 dark:text-white">Petitioner contact</CardTitle>
                <CardDescription>Editable, structured data that will later drive PDF generation.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <div>
                  <FieldHeader label="Petitioner name" field={workspace.petitionerName} />
                  <Input
                    value={workspace.petitionerName.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, petitionerName: setDraftFieldValue(current.petitionerName, e.target.value) }))}
                    placeholder="Your full legal name"
                  />
                </div>
                <div>
                  <FieldHeader label="Petitioner email" field={workspace.petitionerEmail} />
                  <Input
                    value={workspace.petitionerEmail.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, petitionerEmail: setDraftFieldValue(current.petitionerEmail, e.target.value) }))}
                    placeholder="name@email.com"
                  />
                </div>
                <div>
                  <FieldHeader label="Petitioner phone" field={workspace.petitionerPhone} />
                  <Input
                    value={workspace.petitionerPhone.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, petitionerPhone: setDraftFieldValue(current.petitionerPhone, e.target.value) }))}
                    placeholder="(555) 555-5555"
                  />
                </div>
                <div>
                  <FieldHeader label="Petitioner fax (FL-100)" field={workspace.petitionerFax} />
                  <Input
                    value={workspace.petitionerFax.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, petitionerFax: setDraftFieldValue(current.petitionerFax, e.target.value) }))}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <FieldHeader label="Attorney or party name (FL-100)" field={workspace.petitionerAttorneyOrPartyName} />
                  <Input
                    value={workspace.petitionerAttorneyOrPartyName.value}
                    onChange={(e) => commitWorkspace((current) => ({
                      ...current,
                      petitionerAttorneyOrPartyName: setDraftFieldValue(current.petitionerAttorneyOrPartyName, e.target.value),
                    }))}
                    placeholder="Name on caption: attorney, or your name if self-represented"
                  />
                </div>
                <div>
                  <FieldHeader label="Firm name (FL-100)" field={workspace.petitionerFirmName} />
                  <Input
                    value={workspace.petitionerFirmName.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, petitionerFirmName: setDraftFieldValue(current.petitionerFirmName, e.target.value) }))}
                    placeholder="Optional; leave blank if self-represented"
                  />
                </div>
                <div>
                  <FieldHeader label="State bar number (FL-100)" field={workspace.petitionerStateBarNumber} />
                  <Input
                    value={workspace.petitionerStateBarNumber.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, petitionerStateBarNumber: setDraftFieldValue(current.petitionerStateBarNumber, e.target.value) }))}
                    placeholder="Optional; leave blank if self-represented"
                  />
                </div>
                <div className="md:col-span-2">
                  <FieldHeader label="Attorney for (FL-100)" field={workspace.petitionerAttorneyFor} />
                  <Input
                    value={workspace.petitionerAttorneyFor.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, petitionerAttorneyFor: setDraftFieldValue(current.petitionerAttorneyFor, e.target.value) }))}
                    placeholder="Example: Petitioner in pro per"
                  />
                </div>
                <div className="md:col-span-2">
                  <FieldHeader label="Petitioner mailing address" field={workspace.petitionerAddress} />
                  <Textarea
                    value={workspace.petitionerAddress.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, petitionerAddress: setDraftFieldValue(current.petitionerAddress, e.target.value) }))}
                    placeholder="Street, city, state, ZIP"
                    className="min-h-[96px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-slate-950 dark:text-white">FL-100 mapping slice</CardTitle>
                <CardDescription>These are the first petition-specific fields needed to move from general intake into a real FL-100 packet.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-5 md:grid-cols-4">
                  <div>
                    <FieldHeader label="Proceeding type" field={workspace.fl100.proceedingType} />
                    <select
                      value={workspace.fl100.proceedingType.value}
                      onChange={(e) => commitWorkspace((current) => ({
                        ...current,
                        fl100: {
                          ...current.fl100,
                          proceedingType: setDraftFieldValue(current.fl100.proceedingType, e.target.value as 'dissolution' | 'legal_separation' | 'nullity'),
                        },
                      }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="dissolution">Dissolution (divorce)</option>
                      <option value="legal_separation">Legal separation</option>
                      <option value="nullity">Nullity</option>
                    </select>
                  </div>
                  <div>
                    <FieldHeader label="Relationship for selected proceeding" field={workspace.fl100.relationshipType} />
                    <select
                      value={workspace.fl100.relationshipType.value}
                      onChange={(e) => commitWorkspace((current) => ({
                        ...current,
                        fl100: {
                          ...current.fl100,
                          relationshipType: setDraftFieldValue(current.fl100.relationshipType, e.target.value as 'marriage' | 'domestic_partnership' | 'both'),
                        },
                      }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="marriage">Marriage</option>
                      <option value="domestic_partnership">Domestic partnership</option>
                      <option value="both">Marriage + domestic partnership</option>
                    </select>
                  </div>
                  <div>
                    <FieldHeader label="Former name to restore" field={workspace.fl100.formerName} />
                    <Input
                      value={workspace.fl100.formerName.value}
                      onChange={(e) => commitWorkspace((current) => ({
                        ...current,
                        fl100: {
                          ...current.fl100,
                          formerName: setDraftFieldValue(current.fl100.formerName, e.target.value),
                        },
                      }))}
                      placeholder="Only if a former name restoration is requested"
                    />
                  </div>
                  <div>
                    <FieldHeader label="FL-100 signature date" field={workspace.fl100.signatureDate} />
                    <Input
                      type="date"
                      value={workspace.fl100.signatureDate.value}
                      onChange={(e) => commitWorkspace((current) => ({
                        ...current,
                        fl100: {
                          ...current.fl100,
                          signatureDate: setDraftFieldValue(current.fl100.signatureDate, e.target.value),
                        },
                      }))}
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Maps to FL-100 page 3 petitioner date fields.</p>
                  </div>
                </div>
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <Checkbox
                    checked={workspace.fl100.isAmended.value}
                    onCheckedChange={(checked) => updateFl100((fl100) => ({
                      ...fl100,
                      isAmended: setDraftFieldValue(fl100.isAmended, checked === true),
                    }))}
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Mark petition as amended (FL-100 caption)</span>
                      <FieldSourceBadge field={workspace.fl100.isAmended} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Maps to FL-100 `Amended_cb[0]`.</p>
                  </div>
                </label>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  {isDissolutionProceeding
                    ? 'Dissolution: confirm a residency path (petitioner or respondent at 6 months in California and 3 months in filing county), or use a supported jurisdiction exception when available.'
                    : isNullityProceeding
                      ? 'Nullity: residency qualification is not a blocker in this checklist, but keep residency facts for filing strategy and court review.'
                      : 'Legal separation: dissolution residency thresholds are not required for this checklist, but residency facts are still useful for venue and planning.'}
                </div>

                {(isDomesticPartnershipRelationship || isMarriageRelationship) && (
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Jurisdiction exceptions</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Maps FL-100 domestic-partnership and same-sex-marriage jurisdiction exception checkboxes.</p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {isDomesticPartnershipRelationship && (
                        <>
                          <div>
                            <FieldHeader label="Domestic partnership establishment" field={workspace.fl100.domesticPartnership.establishment} />
                            <select
                              value={workspace.fl100.domesticPartnership.establishment.value}
                              onChange={(e) => updateFl100((fl100) => ({
                                ...fl100,
                                domesticPartnership: {
                                  ...fl100.domesticPartnership,
                                  establishment: setDraftFieldValue(
                                    fl100.domesticPartnership.establishment,
                                    e.target.value as 'unspecified' | 'established_in_california' | 'not_established_in_california',
                                  ),
                                },
                              }))}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            >
                              <option value="unspecified">Not specified yet</option>
                              <option value="established_in_california">Established in California</option>
                              <option value="not_established_in_california">Not established in California</option>
                            </select>
                          </div>
                          <div>
                            <FieldHeader label="Domestic partnership registration date" field={workspace.fl100.domesticPartnership.registrationDate} />
                            <Input
                              type="date"
                              value={workspace.fl100.domesticPartnership.registrationDate.value}
                              onChange={(e) => updateFl100((fl100) => ({
                                ...fl100,
                                domesticPartnership: {
                                  ...fl100.domesticPartnership,
                                  registrationDate: setDraftFieldValue(fl100.domesticPartnership.registrationDate, e.target.value),
                                },
                              }))}
                            />
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Maps to FL-100 `DateTimeField1[0]` and drives item 3b duration fields.</p>
                          </div>
                          <div>
                            <FieldHeader label="Domestic partnership date of separation" field={workspace.fl100.domesticPartnership.partnerSeparationDate} />
                            <Input
                              type="date"
                              value={workspace.fl100.domesticPartnership.partnerSeparationDate.value}
                              onChange={(e) => updateFl100((fl100) => ({
                                ...fl100,
                                domesticPartnership: {
                                  ...fl100.domesticPartnership,
                                  partnerSeparationDate: setDraftFieldValue(fl100.domesticPartnership.partnerSeparationDate, e.target.value),
                                },
                              }))}
                            />
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Maps to FL-100 `DatePartnersSeparated_dt[0]` and is separate from marriage separation date.</p>
                          </div>
                          <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                            <Checkbox
                              checked={workspace.fl100.domesticPartnership.californiaResidencyException.value}
                              onCheckedChange={(checked) => updateFl100((fl100) => ({
                                ...fl100,
                                domesticPartnership: {
                                  ...fl100.domesticPartnership,
                                  californiaResidencyException: setDraftFieldValue(fl100.domesticPartnership.californiaResidencyException, checked === true),
                                },
                              }))}
                            />
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Use CA domestic-partnership residency exception</span>
                                <FieldSourceBadge field={workspace.fl100.domesticPartnership.californiaResidencyException} />
                              </div>
                            </div>
                          </label>
                        </>
                      )}
                      <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5 md:col-span-2">
                        <Checkbox
                          checked={workspace.fl100.domesticPartnership.sameSexMarriageJurisdictionException.value}
                          onCheckedChange={(checked) => updateFl100((fl100) => ({
                            ...fl100,
                            domesticPartnership: {
                              ...fl100.domesticPartnership,
                              sameSexMarriageJurisdictionException: setDraftFieldValue(fl100.domesticPartnership.sameSexMarriageJurisdictionException, checked === true),
                            },
                          }))}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Same-sex married in California jurisdiction exception</span>
                            <FieldSourceBadge field={workspace.fl100.domesticPartnership.sameSexMarriageJurisdictionException} />
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {isNullityProceeding && (
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Nullity basis</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pick one or more basis options shown in FL-100 for void/voidable nullity proceedings.</p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                        <Checkbox
                          checked={workspace.fl100.nullity.basedOnIncest.value}
                          onCheckedChange={(checked) => updateFl100((fl100) => ({
                            ...fl100,
                            nullity: { ...fl100.nullity, basedOnIncest: setDraftFieldValue(fl100.nullity.basedOnIncest, checked === true) },
                          }))}
                        />
                        <div><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Void: incest</span></div>
                      </label>
                      <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                        <Checkbox
                          checked={workspace.fl100.nullity.basedOnBigamy.value}
                          onCheckedChange={(checked) => updateFl100((fl100) => ({
                            ...fl100,
                            nullity: { ...fl100.nullity, basedOnBigamy: setDraftFieldValue(fl100.nullity.basedOnBigamy, checked === true) },
                          }))}
                        />
                        <div><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Void: bigamy</span></div>
                      </label>
                      <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                        <Checkbox
                          checked={workspace.fl100.nullity.basedOnAge.value}
                          onCheckedChange={(checked) => updateFl100((fl100) => ({
                            ...fl100,
                            nullity: { ...fl100.nullity, basedOnAge: setDraftFieldValue(fl100.nullity.basedOnAge, checked === true) },
                          }))}
                        />
                        <div><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Voidable: age</span></div>
                      </label>
                      <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                        <Checkbox
                          checked={workspace.fl100.nullity.basedOnPriorExistingMarriageOrPartnership.value}
                          onCheckedChange={(checked) => updateFl100((fl100) => ({
                            ...fl100,
                            nullity: {
                              ...fl100.nullity,
                              basedOnPriorExistingMarriageOrPartnership: setDraftFieldValue(fl100.nullity.basedOnPriorExistingMarriageOrPartnership, checked === true),
                            },
                          }))}
                        />
                        <div><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Voidable: prior existing marriage/DP</span></div>
                      </label>
                      <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                        <Checkbox
                          checked={workspace.fl100.nullity.basedOnUnsoundMind.value}
                          onCheckedChange={(checked) => updateFl100((fl100) => ({
                            ...fl100,
                            nullity: { ...fl100.nullity, basedOnUnsoundMind: setDraftFieldValue(fl100.nullity.basedOnUnsoundMind, checked === true) },
                          }))}
                        />
                        <div><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Voidable: unsound mind</span></div>
                      </label>
                      <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                        <Checkbox
                          checked={workspace.fl100.nullity.basedOnFraud.value}
                          onCheckedChange={(checked) => updateFl100((fl100) => ({
                            ...fl100,
                            nullity: { ...fl100.nullity, basedOnFraud: setDraftFieldValue(fl100.nullity.basedOnFraud, checked === true) },
                          }))}
                        />
                        <div><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Voidable: fraud</span></div>
                      </label>
                      <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                        <Checkbox
                          checked={workspace.fl100.nullity.basedOnForce.value}
                          onCheckedChange={(checked) => updateFl100((fl100) => ({
                            ...fl100,
                            nullity: { ...fl100.nullity, basedOnForce: setDraftFieldValue(fl100.nullity.basedOnForce, checked === true) },
                          }))}
                        />
                        <div><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Voidable: force</span></div>
                      </label>
                      <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                        <Checkbox
                          checked={workspace.fl100.nullity.basedOnPhysicalIncapacity.value}
                          onCheckedChange={(checked) => updateFl100((fl100) => ({
                            ...fl100,
                            nullity: { ...fl100.nullity, basedOnPhysicalIncapacity: setDraftFieldValue(fl100.nullity.basedOnPhysicalIncapacity, checked === true) },
                          }))}
                        />
                        <div><span className="text-sm font-medium text-slate-800 dark:text-slate-100">Voidable: physical incapacity</span></div>
                      </label>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <p id="draft-field-residency-path" className="scroll-mt-24 text-sm font-medium text-slate-800 dark:text-slate-100">Residency for filing eligibility</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {isDissolutionProceeding
                      ? 'For dissolution, FL-100 residency qualification is typically 6 months in California and 3 months in the filing county for either spouse (unless a listed jurisdiction exception applies).'
                      : isNullityProceeding
                        ? 'For nullity, this workspace tracks residency months as supporting facts; they do not gate packet generation by themselves.'
                        : 'For legal separation, this workspace tracks residency months for context and venue decisions; dissolution-style residency qualification does not gate packet generation.'}
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <FieldHeader label="Petitioner months in California" field={workspace.fl100.residency.petitionerCaliforniaMonths} />
                      <Input
                        value={workspace.fl100.residency.petitionerCaliforniaMonths.value}
                        onChange={(e) => commitWorkspace((current) => ({
                          ...current,
                          fl100: {
                            ...current.fl100,
                            residency: {
                              ...current.fl100.residency,
                              petitionerCaliforniaMonths: setDraftFieldValue(current.fl100.residency.petitionerCaliforniaMonths, e.target.value),
                            },
                          },
                        }))}
                        placeholder="Example: 8"
                      />
                    </div>
                    <div>
                      <FieldHeader label="Petitioner months in filing county" field={workspace.fl100.residency.petitionerCountyMonths} />
                      <Input
                        value={workspace.fl100.residency.petitionerCountyMonths.value}
                        onChange={(e) => commitWorkspace((current) => ({
                          ...current,
                          fl100: {
                            ...current.fl100,
                            residency: {
                              ...current.fl100.residency,
                              petitionerCountyMonths: setDraftFieldValue(current.fl100.residency.petitionerCountyMonths, e.target.value),
                            },
                          },
                        }))}
                        placeholder="Example: 4"
                      />
                    </div>
                    <div>
                      <FieldHeader label="Petitioner lives in (FL-100 item 2)" field={workspace.fl100.residency.petitionerResidenceLocation} />
                      <Input
                        value={workspace.fl100.residency.petitionerResidenceLocation.value}
                        onChange={(e) => commitWorkspace((current) => ({
                          ...current,
                          fl100: {
                            ...current.fl100,
                            residency: {
                              ...current.fl100.residency,
                              petitionerResidenceLocation: setDraftFieldValue(current.fl100.residency.petitionerResidenceLocation, e.target.value),
                            },
                          },
                        }))}
                        placeholder="Example: Los Angeles County, California"
                      />
                    </div>
                    <div>
                      <FieldHeader label="Respondent months in California" field={workspace.fl100.residency.respondentCaliforniaMonths} />
                      <Input
                        value={workspace.fl100.residency.respondentCaliforniaMonths.value}
                        onChange={(e) => commitWorkspace((current) => ({
                          ...current,
                          fl100: {
                            ...current.fl100,
                            residency: {
                              ...current.fl100.residency,
                              respondentCaliforniaMonths: setDraftFieldValue(current.fl100.residency.respondentCaliforniaMonths, e.target.value),
                            },
                          },
                        }))}
                        placeholder="Optional if petitioner qualifies"
                      />
                    </div>
                    <div>
                      <FieldHeader label="Respondent months in filing county" field={workspace.fl100.residency.respondentCountyMonths} />
                      <Input
                        value={workspace.fl100.residency.respondentCountyMonths.value}
                        onChange={(e) => commitWorkspace((current) => ({
                          ...current,
                          fl100: {
                            ...current.fl100,
                            residency: {
                              ...current.fl100.residency,
                              respondentCountyMonths: setDraftFieldValue(current.fl100.residency.respondentCountyMonths, e.target.value),
                            },
                          },
                        }))}
                        placeholder="Optional if petitioner qualifies"
                      />
                    </div>
                    <div>
                      <FieldHeader label="Respondent lives in (FL-100 item 2)" field={workspace.fl100.residency.respondentResidenceLocation} />
                      <Input
                        value={workspace.fl100.residency.respondentResidenceLocation.value}
                        onChange={(e) => commitWorkspace((current) => ({
                          ...current,
                          fl100: {
                            ...current.fl100,
                            residency: {
                              ...current.fl100.residency,
                              respondentResidenceLocation: setDraftFieldValue(current.fl100.residency.respondentResidenceLocation, e.target.value),
                            },
                          },
                        }))}
                        placeholder="Optional if respondent residency facts are being used"
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">FL-100 item 2 now uses the exact “lives in (specify)” values you enter here instead of auto-filling the filing county.</p>
                  {isDissolutionProceeding ? (
                    <div className="mt-4 grid gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <p>Petitioner month-based qualification: {petitionerQualifiesResidencyByMonths ? 'Meets 6/3 threshold' : 'Not yet at 6/3 threshold or incomplete'}</p>
                      <p>Respondent month-based qualification: {respondentQualifiesResidencyByMonths ? 'Meets 6/3 threshold' : 'Not yet at 6/3 threshold or incomplete'}</p>
                      <p>Jurisdiction exception selected: {hasJurisdictionException ? 'Yes' : 'No'}</p>
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                      Proceeding type is not dissolution, so these residency fields are informational in this readiness checklist.
                    </p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <Checkbox
                      checked={workspace.fl100.legalGrounds.irreconcilableDifferences.value}
                      onCheckedChange={(checked) => commitWorkspace((current) => ({
                        ...current,
                        fl100: {
                          ...current.fl100,
                          legalGrounds: {
                            ...current.fl100.legalGrounds,
                            irreconcilableDifferences: setDraftFieldValue(current.fl100.legalGrounds.irreconcilableDifferences, checked === true),
                          },
                        },
                      }))}
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-100">Legal ground: irreconcilable differences</span>
                        <FieldSourceBadge field={workspace.fl100.legalGrounds.irreconcilableDifferences} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Default for most divorce filings.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <Checkbox
                      checked={workspace.fl100.legalGrounds.permanentLegalIncapacity.value}
                      onCheckedChange={(checked) => commitWorkspace((current) => ({
                        ...current,
                        fl100: {
                          ...current.fl100,
                          legalGrounds: {
                            ...current.fl100.legalGrounds,
                            permanentLegalIncapacity: setDraftFieldValue(current.fl100.legalGrounds.permanentLegalIncapacity, checked === true),
                          },
                        },
                      }))}
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-100">Legal ground: permanent legal incapacity</span>
                        <FieldSourceBadge field={workspace.fl100.legalGrounds.permanentLegalIncapacity} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Rare. Keep this off unless the facts really support it.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <Checkbox
                      checked={workspace.fl100.propertyDeclarations.communityAndQuasiCommunity.value}
                      onCheckedChange={(checked) => commitWorkspace((current) => ({
                        ...current,
                        fl100: {
                          ...current.fl100,
                          propertyDeclarations: {
                            ...current.fl100.propertyDeclarations,
                            communityAndQuasiCommunity: setDraftFieldValue(current.fl100.propertyDeclarations.communityAndQuasiCommunity, checked === true),
                          },
                        },
                      }))}
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-100">Community / quasi-community property exists</span>
                        <FieldSourceBadge field={workspace.fl100.propertyDeclarations.communityAndQuasiCommunity} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use this when there are assets or debts to divide.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <Checkbox
                      checked={workspace.fl100.propertyDeclarations.separateProperty.value}
                      onCheckedChange={(checked) => commitWorkspace((current) => ({
                        ...current,
                        fl100: {
                          ...current.fl100,
                          propertyDeclarations: {
                            ...current.fl100.propertyDeclarations,
                            separateProperty: setDraftFieldValue(current.fl100.propertyDeclarations.separateProperty, checked === true),
                          },
                        },
                      }))}
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-100">Separate property exists</span>
                        <FieldSourceBadge field={workspace.fl100.propertyDeclarations.separateProperty} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Turn this on if either spouse claims separate property.</p>
                    </div>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <FieldHeader label="Community/quasi-community where listed" field={workspace.fl100.propertyDeclarations.communityAndQuasiCommunityWhereListed} />
                    <select
                      value={workspace.fl100.propertyDeclarations.communityAndQuasiCommunityWhereListed.value}
                      onChange={(e) => updateFl100((fl100) => ({
                        ...fl100,
                        propertyDeclarations: {
                          ...fl100.propertyDeclarations,
                          communityAndQuasiCommunityWhereListed: setDraftFieldValue(fl100.propertyDeclarations.communityAndQuasiCommunityWhereListed, e.target.value as 'unspecified' | 'fl160' | 'attachment' | 'inline_list'),
                        },
                      }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="unspecified">Not selected</option>
                      <option value="fl160">Property Declaration (FL-160)</option>
                      <option value="attachment">Attachment 10b</option>
                      <option value="inline_list">Inline list on FL-100 item 10b(3)</option>
                    </select>
                    <div className="mt-3">
                      <FieldHeader label="Community / quasi-community property details" field={workspace.fl100.propertyDeclarations.communityAndQuasiCommunityDetails} />
                      <Textarea
                        value={workspace.fl100.propertyDeclarations.communityAndQuasiCommunityDetails.value}
                        onChange={(e) => updateFl100((fl100) => ({
                          ...fl100,
                          propertyDeclarations: {
                            ...fl100.propertyDeclarations,
                            communityAndQuasiCommunityDetails: setDraftFieldValue(fl100.propertyDeclarations.communityAndQuasiCommunityDetails, e.target.value),
                          },
                        }))}
                        className="min-h-[96px]"
                        placeholder="If using inline list or attachment 10b, enter community/quasi-community assets/debts here."
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {workspace.fl100.propertyDeclarations.communityAndQuasiCommunityWhereListed.value === 'attachment'
                        ? 'Starter-packet generation will turn these details into a labeled FL-100 attachment 10b page.'
                        : 'Generator only checks FL-160 or attachment boxes when you explicitly choose them.'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <FieldHeader label="Separate property where listed" field={workspace.fl100.propertyDeclarations.separatePropertyWhereListed} />
                    <select
                      value={workspace.fl100.propertyDeclarations.separatePropertyWhereListed.value}
                      onChange={(e) => updateFl100((fl100) => ({
                        ...fl100,
                        propertyDeclarations: {
                          ...fl100.propertyDeclarations,
                          separatePropertyWhereListed: setDraftFieldValue(fl100.propertyDeclarations.separatePropertyWhereListed, e.target.value as 'unspecified' | 'fl160' | 'attachment' | 'inline_list'),
                        },
                      }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="unspecified">Not selected</option>
                      <option value="fl160">Property Declaration (FL-160)</option>
                      <option value="attachment">Attachment 9b</option>
                      <option value="inline_list">Inline list on FL-100 item 9b(3)</option>
                    </select>
                    <div className="mt-3">
                      <FieldHeader label="Separate property details" field={workspace.fl100.propertyDeclarations.separatePropertyDetails} />
                      <Textarea
                        value={workspace.fl100.propertyDeclarations.separatePropertyDetails.value}
                        onChange={(e) => updateFl100((fl100) => ({
                          ...fl100,
                          propertyDeclarations: {
                            ...fl100.propertyDeclarations,
                            separatePropertyDetails: setDraftFieldValue(fl100.propertyDeclarations.separatePropertyDetails, e.target.value),
                          },
                        }))}
                        className="min-h-[96px]"
                        placeholder="If using inline list or attachment 9b: one property/debt entry per line."
                      />
                    </div>
                    <div className="mt-3">
                      <FieldHeader label="Separate property should be confirmed to" field={workspace.fl100.propertyDeclarations.separatePropertyAwardedTo} />
                      <Input
                        value={workspace.fl100.propertyDeclarations.separatePropertyAwardedTo.value}
                        onChange={(e) => updateFl100((fl100) => ({
                          ...fl100,
                          propertyDeclarations: {
                            ...fl100.propertyDeclarations,
                            separatePropertyAwardedTo: setDraftFieldValue(fl100.propertyDeclarations.separatePropertyAwardedTo, e.target.value),
                          },
                        }))}
                        placeholder="If inline list: one target per line, or one value for all rows."
                      />
                    </div>
                    {workspace.fl100.propertyDeclarations.separatePropertyWhereListed.value === 'inline_list'
                      && splitNonEmptyLines(workspace.fl100.propertyDeclarations.separatePropertyDetails.value).length > FL100_SEPARATE_PROPERTY_VISIBLE_ROWS ? (
                        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                          Inline list exceeds FL-100 visible separate-property rows ({FL100_SEPARATE_PROPERTY_VISIBLE_ROWS}). Choose FL-160 or attachment 9b to continue.
                        </p>
                      ) : workspace.fl100.propertyDeclarations.separatePropertyWhereListed.value === 'attachment' ? (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Starter-packet generation will create a labeled FL-100 attachment 9b page from these entries and the “confirmed to” field.</p>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Inline separate-property rows are limited to {FL100_SEPARATE_PROPERTY_VISIBLE_ROWS} visible entries in this packet.</p>
                      )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Child custody and visitation direction</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Explicitly map FL-100 item 4 and item 5 direction checkboxes instead of assuming defaults.</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div>
                      <FieldHeader label="Legal custody to" field={workspace.fl100.childCustodyVisitation.legalCustodyTo} />
                      <select
                        value={workspace.fl100.childCustodyVisitation.legalCustodyTo.value}
                        onChange={(e) => updateFl100((fl100) => ({
                          ...fl100,
                          childCustodyVisitation: {
                            ...fl100.childCustodyVisitation,
                            legalCustodyTo: setDraftFieldValue(fl100.childCustodyVisitation.legalCustodyTo, e.target.value as 'none' | 'petitioner' | 'respondent' | 'joint' | 'other'),
                          },
                        }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="none">Not selected</option>
                        <option value="petitioner">Petitioner</option>
                        <option value="respondent">Respondent</option>
                        <option value="joint">Joint</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <FieldHeader label="Physical custody to" field={workspace.fl100.childCustodyVisitation.physicalCustodyTo} />
                      <select
                        value={workspace.fl100.childCustodyVisitation.physicalCustodyTo.value}
                        onChange={(e) => updateFl100((fl100) => ({
                          ...fl100,
                          childCustodyVisitation: {
                            ...fl100.childCustodyVisitation,
                            physicalCustodyTo: setDraftFieldValue(fl100.childCustodyVisitation.physicalCustodyTo, e.target.value as 'none' | 'petitioner' | 'respondent' | 'joint' | 'other'),
                          },
                        }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="none">Not selected</option>
                        <option value="petitioner">Petitioner</option>
                        <option value="respondent">Respondent</option>
                        <option value="joint">Joint</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <FieldHeader label="Visitation to" field={workspace.fl100.childCustodyVisitation.visitationTo} />
                      <select
                        value={workspace.fl100.childCustodyVisitation.visitationTo.value}
                        onChange={(e) => updateFl100((fl100) => ({
                          ...fl100,
                          childCustodyVisitation: {
                            ...fl100.childCustodyVisitation,
                            visitationTo: setDraftFieldValue(fl100.childCustodyVisitation.visitationTo, e.target.value as 'none' | 'petitioner' | 'respondent' | 'other'),
                          },
                        }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="none">Not selected</option>
                        <option value="petitioner">Petitioner</option>
                        <option value="respondent">Respondent</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                      <Checkbox
                        checked={workspace.fl100.childCustodyVisitation.attachments.formFl311.value}
                        onCheckedChange={(checked) => updateFl100((fl100) => ({
                          ...fl100,
                          childCustodyVisitation: {
                            ...fl100.childCustodyVisitation,
                            attachments: {
                              ...fl100.childCustodyVisitation.attachments,
                              formFl311: setDraftFieldValue(fl100.childCustodyVisitation.attachments.formFl311, checked === true),
                            },
                          },
                        }))}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Attach FL-311</span>
                          <FieldSourceBadge field={workspace.fl100.childCustodyVisitation.attachments.formFl311} />
                        </div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                      <Checkbox
                        checked={workspace.fl100.childCustodyVisitation.attachments.formFl312.value}
                        onCheckedChange={(checked) => updateFl100((fl100) => ({
                          ...fl100,
                          childCustodyVisitation: {
                            ...fl100.childCustodyVisitation,
                            attachments: {
                              ...fl100.childCustodyVisitation.attachments,
                              formFl312: setDraftFieldValue(fl100.childCustodyVisitation.attachments.formFl312, checked === true),
                            },
                          },
                        }))}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Attach FL-312</span>
                          <FieldSourceBadge field={workspace.fl100.childCustodyVisitation.attachments.formFl312} />
                        </div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                      <Checkbox
                        checked={workspace.fl100.childCustodyVisitation.attachments.formFl341a.value}
                        onCheckedChange={(checked) => updateFl100((fl100) => ({
                          ...fl100,
                          childCustodyVisitation: {
                            ...fl100.childCustodyVisitation,
                            attachments: {
                              ...fl100.childCustodyVisitation.attachments,
                              formFl341a: setDraftFieldValue(fl100.childCustodyVisitation.attachments.formFl341a, checked === true),
                            },
                          },
                        }))}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Attach FL-341(A)</span>
                          <FieldSourceBadge field={workspace.fl100.childCustodyVisitation.attachments.formFl341a} />
                        </div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                      <Checkbox
                        checked={workspace.fl100.childCustodyVisitation.attachments.formFl341b.value}
                        onCheckedChange={(checked) => updateFl100((fl100) => ({
                          ...fl100,
                          childCustodyVisitation: {
                            ...fl100.childCustodyVisitation,
                            attachments: {
                              ...fl100.childCustodyVisitation.attachments,
                              formFl341b: setDraftFieldValue(fl100.childCustodyVisitation.attachments.formFl341b, checked === true),
                            },
                          },
                        }))}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Attach FL-341(B)</span>
                          <FieldSourceBadge field={workspace.fl100.childCustodyVisitation.attachments.formFl341b} />
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Child abduction prevention order attachment.</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                      <Checkbox
                        checked={workspace.fl100.childCustodyVisitation.attachments.formFl341c.value}
                        onCheckedChange={(checked) => updateFl100((fl100) => ({
                          ...fl100,
                          childCustodyVisitation: {
                            ...fl100.childCustodyVisitation,
                            attachments: {
                              ...fl100.childCustodyVisitation.attachments,
                              formFl341c: setDraftFieldValue(fl100.childCustodyVisitation.attachments.formFl341c, checked === true),
                            },
                          },
                        }))}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Attach FL-341(C)</span>
                          <FieldSourceBadge field={workspace.fl100.childCustodyVisitation.attachments.formFl341c} />
                        </div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                      <Checkbox
                        checked={workspace.fl100.childCustodyVisitation.attachments.formFl341d.value}
                        onCheckedChange={(checked) => updateFl100((fl100) => ({
                          ...fl100,
                          childCustodyVisitation: {
                            ...fl100.childCustodyVisitation,
                            attachments: {
                              ...fl100.childCustodyVisitation.attachments,
                              formFl341d: setDraftFieldValue(fl100.childCustodyVisitation.attachments.formFl341d, checked === true),
                            },
                          },
                        }))}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Attach FL-341(D)</span>
                          <FieldSourceBadge field={workspace.fl100.childCustodyVisitation.attachments.formFl341d} />
                        </div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                      <Checkbox
                        checked={workspace.fl100.childCustodyVisitation.attachments.formFl341e.value}
                        onCheckedChange={(checked) => updateFl100((fl100) => ({
                          ...fl100,
                          childCustodyVisitation: {
                            ...fl100.childCustodyVisitation,
                            attachments: {
                              ...fl100.childCustodyVisitation.attachments,
                              formFl341e: setDraftFieldValue(fl100.childCustodyVisitation.attachments.formFl341e, checked === true),
                            },
                          },
                        }))}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Attach FL-341(E)</span>
                          <FieldSourceBadge field={workspace.fl100.childCustodyVisitation.attachments.formFl341e} />
                        </div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                      <Checkbox
                        checked={workspace.fl100.childCustodyVisitation.attachments.attachment6c1.value}
                        onCheckedChange={(checked) => updateFl100((fl100) => ({
                          ...fl100,
                          childCustodyVisitation: {
                            ...fl100.childCustodyVisitation,
                            attachments: {
                              ...fl100.childCustodyVisitation.attachments,
                              attachment6c1: setDraftFieldValue(fl100.childCustodyVisitation.attachments.attachment6c1, checked === true),
                            },
                          },
                        }))}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Attach item 6c(1)</span>
                          <FieldSourceBadge field={workspace.fl100.childCustodyVisitation.attachments.attachment6c1} />
                        </div>
                      </div>
                    </label>
                  </div>
                  {workspace.fl100.childCustodyVisitation.attachments.formFl311.value && (
                    <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 dark:border-amber-300/20 dark:bg-amber-500/10">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">FL-311 v1 details</p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        This version fills official FL-311 caption fields, child rows, custody direction, and basic visitation direction only.
                      </p>
                      <div className="mt-3 grid gap-4 md:grid-cols-2">
                        <div>
                          <FieldHeader label="Filing party other-parent name (optional)" field={workspace.fl100.childCustodyVisitation.fl311.filingPartyOtherName} />
                          <Input
                            value={workspace.fl100.childCustodyVisitation.fl311.filingPartyOtherName.value}
                            onChange={(e) => updateFl100((fl100) => ({
                              ...fl100,
                              childCustodyVisitation: {
                                ...fl100.childCustodyVisitation,
                                fl311: {
                                  ...fl100.childCustodyVisitation.fl311,
                                  filingPartyOtherName: setDraftFieldValue(fl100.childCustodyVisitation.fl311.filingPartyOtherName, e.target.value),
                                },
                              },
                            }))}
                            placeholder="Only if an additional party must be listed"
                          />
                        </div>
                        <div>
                          <FieldHeader label="Visitation plan mode (FL-311 item 2)" field={workspace.fl100.childCustodyVisitation.fl311.visitationPlanMode} />
                          <select
                            value={workspace.fl100.childCustodyVisitation.fl311.visitationPlanMode.value}
                            onChange={(e) => updateFl100((fl100) => ({
                              ...fl100,
                              childCustodyVisitation: {
                                ...fl100.childCustodyVisitation,
                                fl311: {
                                  ...fl100.childCustodyVisitation.fl311,
                                  visitationPlanMode: setDraftFieldValue(
                                    fl100.childCustodyVisitation.fl311.visitationPlanMode,
                                    e.target.value as 'unspecified' | 'reasonable_right_of_visitation' | 'attachment_on_file',
                                  ),
                                },
                              },
                            }))}
                            className={cn(
                              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                              workspace.fl100.childCustodyVisitation.visitationTo.value === 'none' && 'opacity-70',
                            )}
                          >
                            <option value="unspecified">Not selected</option>
                            <option value="reasonable_right_of_visitation">Reasonable right of visitation</option>
                            <option value="attachment_on_file">See attached visitation-plan document</option>
                          </select>
                        </div>
                        {workspace.fl100.childCustodyVisitation.fl311.visitationPlanMode.value === 'attachment_on_file' && (
                          <>
                            <div>
                              <FieldHeader label="Attached visitation-plan page count" field={workspace.fl100.childCustodyVisitation.fl311.visitationAttachmentPageCount} />
                              <Input
                                value={workspace.fl100.childCustodyVisitation.fl311.visitationAttachmentPageCount.value}
                                onChange={(e) => updateFl100((fl100) => ({
                                  ...fl100,
                                  childCustodyVisitation: {
                                    ...fl100.childCustodyVisitation,
                                    fl311: {
                                      ...fl100.childCustodyVisitation.fl311,
                                      visitationAttachmentPageCount: setDraftFieldValue(fl100.childCustodyVisitation.fl311.visitationAttachmentPageCount, e.target.value),
                                    },
                                  },
                                }))}
                                placeholder="e.g., 2"
                                inputMode="numeric"
                              />
                            </div>
                            <div>
                              <FieldHeader label="Attached plan date (FL-311 item 2b)" field={workspace.fl100.childCustodyVisitation.fl311.visitationAttachmentDate} />
                              <Input
                                type="date"
                                value={workspace.fl100.childCustodyVisitation.fl311.visitationAttachmentDate.value}
                                onChange={(e) => updateFl100((fl100) => ({
                                  ...fl100,
                                  childCustodyVisitation: {
                                    ...fl100.childCustodyVisitation,
                                    fl311: {
                                      ...fl100.childCustodyVisitation.fl311,
                                      visitationAttachmentDate: setDraftFieldValue(fl100.childCustodyVisitation.fl311.visitationAttachmentDate, e.target.value),
                                    },
                                  },
                                }))}
                              />
                            </div>
                          </>
                        )}
                      </div>
                      {workspace.children.length > FL105_FORM_CAPACITY.childrenRows && (
                        <p className="mt-2 text-xs text-amber-800/90 dark:text-amber-100/80">
                          FL-311 v1 currently supports the first {FL105_FORM_CAPACITY.childrenRows} child rows only. Reduce child rows or defer FL-311 until overflow support is added.
                        </p>
                      )}
                    </div>
                  )}
                  {workspace.fl100.childCustodyVisitation.attachments.formFl312.value && (
                    <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 dark:border-amber-300/20 dark:bg-amber-500/10">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">FL-312 v1 details</p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        FL-312 is generated only from explicit Draft Forms choices. No abduction-risk or requested-order fields are inferred.
                      </p>
                      <div className="mt-3 grid gap-4 md:grid-cols-2">
                        <div>
                          <FieldHeader label="Other parent/party in caption (optional)" field={workspace.fl100.childCustodyVisitation.fl312.filingPartyOtherName} />
                          <Input
                            value={workspace.fl100.childCustodyVisitation.fl312.filingPartyOtherName.value}
                            onChange={(e) => updateFl100((fl100) => ({
                              ...fl100,
                              childCustodyVisitation: {
                                ...fl100.childCustodyVisitation,
                                fl312: {
                                  ...fl100.childCustodyVisitation.fl312,
                                  filingPartyOtherName: setDraftFieldValue(fl100.childCustodyVisitation.fl312.filingPartyOtherName, e.target.value),
                                },
                              },
                            }))}
                          />
                        </div>
                        <div>
                          <FieldHeader label="Item 1: your name" field={workspace.fl100.childCustodyVisitation.fl312.requestingPartyName} />
                          <Input
                            value={workspace.fl100.childCustodyVisitation.fl312.requestingPartyName.value}
                            onChange={(e) => updateFl100((fl100) => ({
                              ...fl100,
                              childCustodyVisitation: {
                                ...fl100.childCustodyVisitation,
                                fl312: {
                                  ...fl100.childCustodyVisitation.fl312,
                                  requestingPartyName: setDraftFieldValue(fl100.childCustodyVisitation.fl312.requestingPartyName, e.target.value),
                                },
                              },
                            }))}
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Item 2: prevent abduction by</p>
                        <div className="mt-2 grid gap-2 md:grid-cols-3">
                          {[
                            { label: 'Petitioner', key: 'petitioner' as const },
                            { label: 'Respondent', key: 'respondent' as const },
                            { label: 'Other Parent/Party', key: 'otherParentParty' as const },
                          ].map((option) => (
                            <label key={option.key} className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5">
                              <Checkbox
                                checked={workspace.fl100.childCustodyVisitation.fl312.abductionBy[option.key].value}
                                onCheckedChange={(checked) => updateFl100((fl100) => ({
                                  ...fl100,
                                  childCustodyVisitation: {
                                    ...fl100.childCustodyVisitation,
                                    fl312: {
                                      ...fl100.childCustodyVisitation.fl312,
                                      abductionBy: {
                                        ...fl100.childCustodyVisitation.fl312.abductionBy,
                                        [option.key]: setDraftFieldValue(fl100.childCustodyVisitation.fl312.abductionBy[option.key], checked === true),
                                      },
                                    },
                                  },
                                }))}
                              />
                              <span className="text-sm text-slate-700 dark:text-slate-200">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Item 3: destination risk</p>
                        <div className="mt-2 grid gap-3 md:grid-cols-2">
                          <label className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5">
                            <Checkbox
                              checked={workspace.fl100.childCustodyVisitation.fl312.riskDestinations.anotherCaliforniaCounty.value}
                              onCheckedChange={(checked) => updateFl100((fl100) => ({
                                ...fl100,
                                childCustodyVisitation: {
                                  ...fl100.childCustodyVisitation,
                                  fl312: {
                                    ...fl100.childCustodyVisitation.fl312,
                                    riskDestinations: {
                                      ...fl100.childCustodyVisitation.fl312.riskDestinations,
                                      anotherCaliforniaCounty: setDraftFieldValue(fl100.childCustodyVisitation.fl312.riskDestinations.anotherCaliforniaCounty, checked === true),
                                    },
                                  },
                                },
                              }))}
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-200">Another California county</span>
                          </label>
                          <Input
                            placeholder="County name"
                            value={workspace.fl100.childCustodyVisitation.fl312.riskDestinations.anotherCaliforniaCountyName.value}
                            onChange={(e) => updateFl100((fl100) => ({
                              ...fl100,
                              childCustodyVisitation: {
                                ...fl100.childCustodyVisitation,
                                fl312: {
                                  ...fl100.childCustodyVisitation.fl312,
                                  riskDestinations: {
                                    ...fl100.childCustodyVisitation.fl312.riskDestinations,
                                    anotherCaliforniaCountyName: setDraftFieldValue(fl100.childCustodyVisitation.fl312.riskDestinations.anotherCaliforniaCountyName, e.target.value),
                                  },
                                },
                              },
                            }))}
                          />
                          <label className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5">
                            <Checkbox
                              checked={workspace.fl100.childCustodyVisitation.fl312.riskDestinations.anotherState.value}
                              onCheckedChange={(checked) => updateFl100((fl100) => ({
                                ...fl100,
                                childCustodyVisitation: {
                                  ...fl100.childCustodyVisitation,
                                  fl312: {
                                    ...fl100.childCustodyVisitation.fl312,
                                    riskDestinations: {
                                      ...fl100.childCustodyVisitation.fl312.riskDestinations,
                                      anotherState: setDraftFieldValue(fl100.childCustodyVisitation.fl312.riskDestinations.anotherState, checked === true),
                                    },
                                  },
                                },
                              }))}
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-200">Another state</span>
                          </label>
                          <Input
                            placeholder="State name"
                            value={workspace.fl100.childCustodyVisitation.fl312.riskDestinations.anotherStateName.value}
                            onChange={(e) => updateFl100((fl100) => ({
                              ...fl100,
                              childCustodyVisitation: {
                                ...fl100.childCustodyVisitation,
                                fl312: {
                                  ...fl100.childCustodyVisitation.fl312,
                                  riskDestinations: {
                                    ...fl100.childCustodyVisitation.fl312.riskDestinations,
                                    anotherStateName: setDraftFieldValue(fl100.childCustodyVisitation.fl312.riskDestinations.anotherStateName, e.target.value),
                                  },
                                },
                              },
                            }))}
                          />
                          <label className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5">
                            <Checkbox
                              checked={workspace.fl100.childCustodyVisitation.fl312.riskDestinations.foreignCountry.value}
                              onCheckedChange={(checked) => updateFl100((fl100) => ({
                                ...fl100,
                                childCustodyVisitation: {
                                  ...fl100.childCustodyVisitation,
                                  fl312: {
                                    ...fl100.childCustodyVisitation.fl312,
                                    riskDestinations: {
                                      ...fl100.childCustodyVisitation.fl312.riskDestinations,
                                      foreignCountry: setDraftFieldValue(fl100.childCustodyVisitation.fl312.riskDestinations.foreignCountry, checked === true),
                                    },
                                  },
                                },
                              }))}
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-200">Foreign country</span>
                          </label>
                          <Input
                            placeholder="Foreign country"
                            value={workspace.fl100.childCustodyVisitation.fl312.riskDestinations.foreignCountryName.value}
                            onChange={(e) => updateFl100((fl100) => ({
                              ...fl100,
                              childCustodyVisitation: {
                                ...fl100.childCustodyVisitation,
                                fl312: {
                                  ...fl100.childCustodyVisitation.fl312,
                                  riskDestinations: {
                                    ...fl100.childCustodyVisitation.fl312.riskDestinations,
                                    foreignCountryName: setDraftFieldValue(fl100.childCustodyVisitation.fl312.riskDestinations.foreignCountryName, e.target.value),
                                  },
                                },
                              },
                            }))}
                          />
                        </div>
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          <label className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5">
                            <Checkbox
                              checked={workspace.fl100.childCustodyVisitation.fl312.riskDestinations.foreignCountryCitizen.value}
                              onCheckedChange={(checked) => updateFl100((fl100) => ({
                                ...fl100,
                                childCustodyVisitation: {
                                  ...fl100.childCustodyVisitation,
                                  fl312: {
                                    ...fl100.childCustodyVisitation.fl312,
                                    riskDestinations: {
                                      ...fl100.childCustodyVisitation.fl312.riskDestinations,
                                      foreignCountryCitizen: setDraftFieldValue(fl100.childCustodyVisitation.fl312.riskDestinations.foreignCountryCitizen, checked === true),
                                    },
                                  },
                                },
                              }))}
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-200">Person is a citizen of that country</span>
                          </label>
                          <label className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5">
                            <Checkbox
                              checked={workspace.fl100.childCustodyVisitation.fl312.riskDestinations.foreignCountryHasTies.value}
                              onCheckedChange={(checked) => updateFl100((fl100) => ({
                                ...fl100,
                                childCustodyVisitation: {
                                  ...fl100.childCustodyVisitation,
                                  fl312: {
                                    ...fl100.childCustodyVisitation.fl312,
                                    riskDestinations: {
                                      ...fl100.childCustodyVisitation.fl312.riskDestinations,
                                      foreignCountryHasTies: setDraftFieldValue(fl100.childCustodyVisitation.fl312.riskDestinations.foreignCountryHasTies, checked === true),
                                    },
                                  },
                                },
                              }))}
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-200">Person has family/emotional ties there</span>
                          </label>
                        </div>
                        <div className="mt-2">
                          <Textarea
                            className="min-h-[72px]"
                            placeholder="Item 3c(2) explanation"
                            value={workspace.fl100.childCustodyVisitation.fl312.riskDestinations.foreignCountryTiesDetails.value}
                            onChange={(e) => updateFl100((fl100) => ({
                              ...fl100,
                              childCustodyVisitation: {
                                ...fl100.childCustodyVisitation,
                                fl312: {
                                  ...fl100.childCustodyVisitation.fl312,
                                  riskDestinations: {
                                    ...fl100.childCustodyVisitation.fl312.riskDestinations,
                                    foreignCountryTiesDetails: setDraftFieldValue(fl100.childCustodyVisitation.fl312.riskDestinations.foreignCountryTiesDetails, e.target.value),
                                  },
                                },
                              },
                            }))}
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Item 4: reasons for risk</p>
                        <div className="mt-2 grid gap-3">
                          <label className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5">
                            <Checkbox
                              checked={workspace.fl100.childCustodyVisitation.fl312.riskFactors.custodyOrderViolationThreat.value}
                              onCheckedChange={(checked) => updateFl100((fl100) => ({
                                ...fl100,
                                childCustodyVisitation: {
                                  ...fl100.childCustodyVisitation,
                                  fl312: {
                                    ...fl100.childCustodyVisitation.fl312,
                                    riskFactors: {
                                      ...fl100.childCustodyVisitation.fl312.riskFactors,
                                      custodyOrderViolationThreat: setDraftFieldValue(fl100.childCustodyVisitation.fl312.riskFactors.custodyOrderViolationThreat, checked === true),
                                    },
                                  },
                                },
                              }))}
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-200">4a violated or threatened to violate custody/visitation orders</span>
                          </label>
                          <Textarea
                            className="min-h-[72px]"
                            placeholder="Item 4a explanation"
                            value={workspace.fl100.childCustodyVisitation.fl312.riskFactors.custodyOrderViolationThreatDetails.value}
                            onChange={(e) => updateFl100((fl100) => ({
                              ...fl100,
                              childCustodyVisitation: {
                                ...fl100.childCustodyVisitation,
                                fl312: {
                                  ...fl100.childCustodyVisitation.fl312,
                                  riskFactors: {
                                    ...fl100.childCustodyVisitation.fl312.riskFactors,
                                    custodyOrderViolationThreatDetails: setDraftFieldValue(fl100.childCustodyVisitation.fl312.riskFactors.custodyOrderViolationThreatDetails, e.target.value),
                                  },
                                },
                              },
                            }))}
                          />
                          <label className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5">
                            <Checkbox
                              checked={workspace.fl100.childCustodyVisitation.fl312.riskFactors.weakCaliforniaTies.value}
                              onCheckedChange={(checked) => updateFl100((fl100) => ({
                                ...fl100,
                                childCustodyVisitation: {
                                  ...fl100.childCustodyVisitation,
                                  fl312: {
                                    ...fl100.childCustodyVisitation.fl312,
                                    riskFactors: {
                                      ...fl100.childCustodyVisitation.fl312.riskFactors,
                                      weakCaliforniaTies: setDraftFieldValue(fl100.childCustodyVisitation.fl312.riskFactors.weakCaliforniaTies, checked === true),
                                    },
                                  },
                                },
                              }))}
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-200">4b does not have strong ties to California</span>
                          </label>
                          <Textarea
                            className="min-h-[72px]"
                            placeholder="Item 4b explanation"
                            value={workspace.fl100.childCustodyVisitation.fl312.riskFactors.weakCaliforniaTiesDetails.value}
                            onChange={(e) => updateFl100((fl100) => ({
                              ...fl100,
                              childCustodyVisitation: {
                                ...fl100.childCustodyVisitation,
                                fl312: {
                                  ...fl100.childCustodyVisitation.fl312,
                                  riskFactors: {
                                    ...fl100.childCustodyVisitation.fl312.riskFactors,
                                    weakCaliforniaTiesDetails: setDraftFieldValue(fl100.childCustodyVisitation.fl312.riskFactors.weakCaliforniaTiesDetails, e.target.value),
                                  },
                                },
                              },
                            }))}
                          />
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <label className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5">
                          <Checkbox
                            checked={workspace.fl100.childCustodyVisitation.fl312.riskFactors.recentAbductionPlanningActions.value}
                            onCheckedChange={(checked) => updateFl100((fl100) => ({
                              ...fl100,
                              childCustodyVisitation: {
                                ...fl100.childCustodyVisitation,
                                fl312: {
                                  ...fl100.childCustodyVisitation.fl312,
                                  riskFactors: {
                                    ...fl100.childCustodyVisitation.fl312.riskFactors,
                                    recentAbductionPlanningActions: setDraftFieldValue(fl100.childCustodyVisitation.fl312.riskFactors.recentAbductionPlanningActions, checked === true),
                                  },
                                },
                              },
                            }))}
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-200">4c recent actions making abduction easier</span>
                        </label>
                        <label className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5">
                          <Checkbox
                            checked={workspace.fl100.childCustodyVisitation.fl312.riskFactors.historyOfRiskBehaviors.value}
                            onCheckedChange={(checked) => updateFl100((fl100) => ({
                              ...fl100,
                              childCustodyVisitation: {
                                ...fl100.childCustodyVisitation,
                                fl312: {
                                  ...fl100.childCustodyVisitation.fl312,
                                  riskFactors: {
                                    ...fl100.childCustodyVisitation.fl312.riskFactors,
                                    historyOfRiskBehaviors: setDraftFieldValue(fl100.childCustodyVisitation.fl312.riskFactors.historyOfRiskBehaviors, checked === true),
                                  },
                                },
                              },
                            }))}
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-200">4d history of risk behaviors</span>
                        </label>
                      </div>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        {[
                          { label: 'Quit job', key: 'recentActionQuitJob' as const },
                          { label: 'Sold home', key: 'recentActionSoldHome' as const },
                          { label: 'Closed bank account', key: 'recentActionClosedBankAccount' as const },
                          { label: 'Ended lease', key: 'recentActionEndedLease' as const },
                          { label: 'Sold assets', key: 'recentActionSoldAssets' as const },
                          { label: 'Hid/destroyed documents', key: 'recentActionHidOrDestroyedDocuments' as const },
                          { label: 'Applied for travel documents', key: 'recentActionAppliedForTravelDocuments' as const },
                          { label: 'Other recent action', key: 'recentActionOther' as const },
                        ].map((option) => (
                          <label key={option.key} className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5">
                            <Checkbox
                              checked={workspace.fl100.childCustodyVisitation.fl312.riskFactors[option.key].value}
                              onCheckedChange={(checked) => updateFl100((fl100) => ({
                                ...fl100,
                                childCustodyVisitation: {
                                  ...fl100.childCustodyVisitation,
                                  fl312: {
                                    ...fl100.childCustodyVisitation.fl312,
                                    riskFactors: {
                                      ...fl100.childCustodyVisitation.fl312.riskFactors,
                                      [option.key]: setDraftFieldValue(fl100.childCustodyVisitation.fl312.riskFactors[option.key], checked === true),
                                    },
                                  },
                                },
                              }))}
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-200">{option.label}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        <Textarea
                          className="min-h-[72px]"
                          placeholder="Item 4c other action details"
                          value={workspace.fl100.childCustodyVisitation.fl312.riskFactors.recentActionOtherDetails.value}
                          onChange={(e) => updateFl100((fl100) => ({
                            ...fl100,
                            childCustodyVisitation: {
                              ...fl100.childCustodyVisitation,
                              fl312: {
                                ...fl100.childCustodyVisitation.fl312,
                                riskFactors: {
                                  ...fl100.childCustodyVisitation.fl312.riskFactors,
                                  recentActionOtherDetails: setDraftFieldValue(fl100.childCustodyVisitation.fl312.riskFactors.recentActionOtherDetails, e.target.value),
                                },
                              },
                            },
                          }))}
                        />
                        <Textarea
                          className="min-h-[72px]"
                          placeholder="Item 4d explanation"
                          value={workspace.fl100.childCustodyVisitation.fl312.riskFactors.historyDetails.value}
                          onChange={(e) => updateFl100((fl100) => ({
                            ...fl100,
                            childCustodyVisitation: {
                              ...fl100.childCustodyVisitation,
                              fl312: {
                                ...fl100.childCustodyVisitation.fl312,
                                riskFactors: {
                                  ...fl100.childCustodyVisitation.fl312.riskFactors,
                                  historyDetails: setDraftFieldValue(fl100.childCustodyVisitation.fl312.riskFactors.historyDetails, e.target.value),
                                },
                              },
                            },
                          }))}
                        />
                      </div>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        {[
                          { label: 'Domestic violence', key: 'historyDomesticViolence' as const },
                          { label: 'Child abuse', key: 'historyChildAbuse' as const },
                          { label: 'Not cooperating in parenting', key: 'historyParentingNonCooperation' as const },
                          { label: 'Took children without permission', key: 'historyChildTakingWithoutPermission' as const },
                        ].map((option) => (
                          <label key={option.key} className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5">
                            <Checkbox
                              checked={workspace.fl100.childCustodyVisitation.fl312.riskFactors[option.key].value}
                              onCheckedChange={(checked) => updateFl100((fl100) => ({
                                ...fl100,
                                childCustodyVisitation: {
                                  ...fl100.childCustodyVisitation,
                                  fl312: {
                                    ...fl100.childCustodyVisitation.fl312,
                                    riskFactors: {
                                      ...fl100.childCustodyVisitation.fl312.riskFactors,
                                      [option.key]: setDraftFieldValue(fl100.childCustodyVisitation.fl312.riskFactors[option.key], checked === true),
                                    },
                                  },
                                },
                              }))}
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-200">{option.label}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-2 grid gap-3 md:grid-cols-2">
                        <label className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5">
                          <Checkbox
                            checked={workspace.fl100.childCustodyVisitation.fl312.riskFactors.criminalRecord.value}
                            onCheckedChange={(checked) => updateFl100((fl100) => ({
                              ...fl100,
                              childCustodyVisitation: {
                                ...fl100.childCustodyVisitation,
                                fl312: {
                                  ...fl100.childCustodyVisitation.fl312,
                                  riskFactors: {
                                    ...fl100.childCustodyVisitation.fl312.riskFactors,
                                    criminalRecord: setDraftFieldValue(fl100.childCustodyVisitation.fl312.riskFactors.criminalRecord, checked === true),
                                  },
                                },
                              },
                            }))}
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-200">4e criminal record</span>
                        </label>
                        <Textarea
                          className="min-h-[72px]"
                          placeholder="Item 4e explanation"
                          value={workspace.fl100.childCustodyVisitation.fl312.riskFactors.criminalRecordDetails.value}
                          onChange={(e) => updateFl100((fl100) => ({
                            ...fl100,
                            childCustodyVisitation: {
                              ...fl100.childCustodyVisitation,
                              fl312: {
                                ...fl100.childCustodyVisitation.fl312,
                                riskFactors: {
                                  ...fl100.childCustodyVisitation.fl312.riskFactors,
                                  criminalRecordDetails: setDraftFieldValue(fl100.childCustodyVisitation.fl312.riskFactors.criminalRecordDetails, e.target.value),
                                },
                              },
                            },
                          }))}
                        />
                      </div>
                      <div className="mt-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Page 2: requested orders against</p>
                        <div className="mt-2 grid gap-2 md:grid-cols-3">
                          {[
                            { label: 'Petitioner', key: 'petitioner' as const },
                            { label: 'Respondent', key: 'respondent' as const },
                            { label: 'Other Parent/Party', key: 'otherParentParty' as const },
                          ].map((option) => (
                            <label key={option.key} className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5">
                              <Checkbox
                                checked={workspace.fl100.childCustodyVisitation.fl312.requestedOrdersAgainst[option.key].value}
                                onCheckedChange={(checked) => updateFl100((fl100) => ({
                                  ...fl100,
                                  childCustodyVisitation: {
                                    ...fl100.childCustodyVisitation,
                                    fl312: {
                                      ...fl100.childCustodyVisitation.fl312,
                                      requestedOrdersAgainst: {
                                        ...fl100.childCustodyVisitation.fl312.requestedOrdersAgainst,
                                        [option.key]: setDraftFieldValue(fl100.childCustodyVisitation.fl312.requestedOrdersAgainst[option.key], checked === true),
                                      },
                                    },
                                  },
                                }))}
                              />
                              <span className="text-sm text-slate-700 dark:text-slate-200">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {[
                          { label: '5. Supervised visitation', key: 'supervisedVisitation' as const },
                          { label: '6. Post bond', key: 'postBond' as const },
                          { label: '7. Do not move without permission/order', key: 'noMoveWithoutWrittenPermissionOrCourtOrder' as const },
                          { label: '8. No travel without permission/order', key: 'noTravelWithoutWrittenPermissionOrCourtOrder' as const },
                          { label: '9. Register order in another state', key: 'registerOrderInOtherState' as const },
                          { label: '10. Turn in passports/travel documents', key: 'turnInPassportsAndTravelDocuments' as const },
                          { label: '10. Do not apply for new passports/documents', key: 'doNotApplyForNewPassportsOrDocuments' as const },
                          { label: '11. Provide itinerary', key: 'provideTravelItinerary' as const },
                          { label: '11. Provide round-trip tickets', key: 'provideRoundTripAirlineTickets' as const },
                          { label: '11. Provide addresses/telephone', key: 'provideAddressesAndTelephone' as const },
                          { label: '11. Provide open return ticket', key: 'provideOpenReturnTicketForRequestingParty' as const },
                          { label: '11. Provide other travel docs', key: 'provideOtherTravelDocuments' as const },
                          { label: '12. Notify foreign embassy/consulate', key: 'notifyForeignEmbassyOrConsulate' as const },
                          { label: '13. Foreign custody/visitation order before travel', key: 'obtainForeignCustodyAndVisitationOrderBeforeTravel' as const },
                          { label: '14. Other orders', key: 'otherOrdersRequested' as const },
                        ].map((option) => (
                          <label key={option.key} className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5">
                            <Checkbox
                              checked={workspace.fl100.childCustodyVisitation.fl312.requestedOrders[option.key].value}
                              onCheckedChange={(checked) => updateFl100((fl100) => ({
                                ...fl100,
                                childCustodyVisitation: {
                                  ...fl100.childCustodyVisitation,
                                  fl312: {
                                    ...fl100.childCustodyVisitation.fl312,
                                    requestedOrders: {
                                      ...fl100.childCustodyVisitation.fl312.requestedOrders,
                                      [option.key]: setDraftFieldValue(fl100.childCustodyVisitation.fl312.requestedOrders[option.key], checked === true),
                                    },
                                  },
                                },
                              }))}
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-200">{option.label}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div>
                          <FieldHeader label="Item 5 terms mode" field={workspace.fl100.childCustodyVisitation.fl312.requestedOrders.supervisedVisitationTermsMode} />
                          <select
                            value={workspace.fl100.childCustodyVisitation.fl312.requestedOrders.supervisedVisitationTermsMode.value}
                            onChange={(e) => updateFl100((fl100) => ({
                              ...fl100,
                              childCustodyVisitation: {
                                ...fl100.childCustodyVisitation,
                                fl312: {
                                  ...fl100.childCustodyVisitation.fl312,
                                  requestedOrders: {
                                    ...fl100.childCustodyVisitation.fl312.requestedOrders,
                                    supervisedVisitationTermsMode: setDraftFieldValue(
                                      fl100.childCustodyVisitation.fl312.requestedOrders.supervisedVisitationTermsMode,
                                      e.target.value as 'unspecified' | 'fl311' | 'as_follows',
                                    ),
                                  },
                                },
                              },
                            }))}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          >
                            <option value="unspecified">Not selected</option>
                            <option value="fl311">Form FL-311</option>
                            <option value="as_follows">As follows</option>
                          </select>
                        </div>
                        <div>
                          <FieldHeader label="Item 6 bond amount" field={workspace.fl100.childCustodyVisitation.fl312.requestedOrders.postBondAmount} />
                          <Input
                            inputMode="decimal"
                            placeholder="e.g., 5000"
                            value={workspace.fl100.childCustodyVisitation.fl312.requestedOrders.postBondAmount.value}
                            onChange={(e) => updateFl100((fl100) => ({
                              ...fl100,
                              childCustodyVisitation: {
                                ...fl100.childCustodyVisitation,
                                fl312: {
                                  ...fl100.childCustodyVisitation.fl312,
                                  requestedOrders: {
                                    ...fl100.childCustodyVisitation.fl312.requestedOrders,
                                    postBondAmount: setDraftFieldValue(fl100.childCustodyVisitation.fl312.requestedOrders.postBondAmount, e.target.value),
                                  },
                                },
                              },
                            }))}
                          />
                        </div>
                        <div>
                          <FieldHeader label="Item 5 as-follows terms" field={workspace.fl100.childCustodyVisitation.fl312.requestedOrders.supervisedVisitationTermsDetails} />
                          <Textarea
                            className="min-h-[72px]"
                            value={workspace.fl100.childCustodyVisitation.fl312.requestedOrders.supervisedVisitationTermsDetails.value}
                            onChange={(e) => updateFl100((fl100) => ({
                              ...fl100,
                              childCustodyVisitation: {
                                ...fl100.childCustodyVisitation,
                                fl312: {
                                  ...fl100.childCustodyVisitation.fl312,
                                  requestedOrders: {
                                    ...fl100.childCustodyVisitation.fl312.requestedOrders,
                                    supervisedVisitationTermsDetails: setDraftFieldValue(fl100.childCustodyVisitation.fl312.requestedOrders.supervisedVisitationTermsDetails, e.target.value),
                                  },
                                },
                              },
                            }))}
                          />
                        </div>
                        <div>
                          <FieldHeader label="Item 9 registration state" field={workspace.fl100.childCustodyVisitation.fl312.requestedOrders.registerOrderStateName} />
                          <Input
                            value={workspace.fl100.childCustodyVisitation.fl312.requestedOrders.registerOrderStateName.value}
                            onChange={(e) => updateFl100((fl100) => ({
                              ...fl100,
                              childCustodyVisitation: {
                                ...fl100.childCustodyVisitation,
                                fl312: {
                                  ...fl100.childCustodyVisitation.fl312,
                                  requestedOrders: {
                                    ...fl100.childCustodyVisitation.fl312.requestedOrders,
                                    registerOrderStateName: setDraftFieldValue(fl100.childCustodyVisitation.fl312.requestedOrders.registerOrderStateName, e.target.value),
                                  },
                                },
                              },
                            }))}
                          />
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {[
                          { label: 'Item 8: this county', key: 'travelRestrictionThisCounty' as const },
                          { label: 'Item 8: California', key: 'travelRestrictionCalifornia' as const },
                          { label: 'Item 8: United States', key: 'travelRestrictionUnitedStates' as const },
                          { label: 'Item 8: Other restriction', key: 'travelRestrictionOther' as const },
                        ].map((option) => (
                          <label key={option.key} className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5">
                            <Checkbox
                              checked={workspace.fl100.childCustodyVisitation.fl312.requestedOrders[option.key].value}
                              onCheckedChange={(checked) => updateFl100((fl100) => ({
                                ...fl100,
                                childCustodyVisitation: {
                                  ...fl100.childCustodyVisitation,
                                  fl312: {
                                    ...fl100.childCustodyVisitation.fl312,
                                    requestedOrders: {
                                      ...fl100.childCustodyVisitation.fl312.requestedOrders,
                                      [option.key]: setDraftFieldValue(fl100.childCustodyVisitation.fl312.requestedOrders[option.key], checked === true),
                                    },
                                  },
                                },
                              }))}
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-200">{option.label}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-2 grid gap-3 md:grid-cols-2">
                        <Input
                          placeholder="Item 8 other travel restriction details"
                          value={workspace.fl100.childCustodyVisitation.fl312.requestedOrders.travelRestrictionOtherDetails.value}
                          onChange={(e) => updateFl100((fl100) => ({
                            ...fl100,
                            childCustodyVisitation: {
                              ...fl100.childCustodyVisitation,
                              fl312: {
                                ...fl100.childCustodyVisitation.fl312,
                                requestedOrders: {
                                  ...fl100.childCustodyVisitation.fl312.requestedOrders,
                                  travelRestrictionOtherDetails: setDraftFieldValue(fl100.childCustodyVisitation.fl312.requestedOrders.travelRestrictionOtherDetails, e.target.value),
                                },
                              },
                            },
                          }))}
                        />
                        <Input
                          placeholder="Item 11 other travel documents"
                          value={workspace.fl100.childCustodyVisitation.fl312.requestedOrders.provideOtherTravelDocumentsDetails.value}
                          onChange={(e) => updateFl100((fl100) => ({
                            ...fl100,
                            childCustodyVisitation: {
                              ...fl100.childCustodyVisitation,
                              fl312: {
                                ...fl100.childCustodyVisitation.fl312,
                                requestedOrders: {
                                  ...fl100.childCustodyVisitation.fl312.requestedOrders,
                                  provideOtherTravelDocumentsDetails: setDraftFieldValue(fl100.childCustodyVisitation.fl312.requestedOrders.provideOtherTravelDocumentsDetails, e.target.value),
                                },
                              },
                            },
                          }))}
                        />
                        <Input
                          placeholder="Item 12 embassy/consulate country"
                          value={workspace.fl100.childCustodyVisitation.fl312.requestedOrders.embassyOrConsulateCountry.value}
                          onChange={(e) => updateFl100((fl100) => ({
                            ...fl100,
                            childCustodyVisitation: {
                              ...fl100.childCustodyVisitation,
                              fl312: {
                                ...fl100.childCustodyVisitation.fl312,
                                requestedOrders: {
                                  ...fl100.childCustodyVisitation.fl312.requestedOrders,
                                  embassyOrConsulateCountry: setDraftFieldValue(fl100.childCustodyVisitation.fl312.requestedOrders.embassyOrConsulateCountry, e.target.value),
                                },
                              },
                            },
                          }))}
                        />
                        <Input
                          inputMode="numeric"
                          placeholder="Item 12 calendar days"
                          value={workspace.fl100.childCustodyVisitation.fl312.requestedOrders.embassyNotificationWithinDays.value}
                          onChange={(e) => updateFl100((fl100) => ({
                            ...fl100,
                            childCustodyVisitation: {
                              ...fl100.childCustodyVisitation,
                              fl312: {
                                ...fl100.childCustodyVisitation.fl312,
                                requestedOrders: {
                                  ...fl100.childCustodyVisitation.fl312.requestedOrders,
                                  embassyNotificationWithinDays: setDraftFieldValue(fl100.childCustodyVisitation.fl312.requestedOrders.embassyNotificationWithinDays, e.target.value),
                                },
                              },
                            },
                          }))}
                        />
                        <Textarea
                          className="min-h-[72px] md:col-span-2"
                          placeholder="Item 14 other orders details"
                          value={workspace.fl100.childCustodyVisitation.fl312.requestedOrders.otherOrdersDetails.value}
                          onChange={(e) => updateFl100((fl100) => ({
                            ...fl100,
                            childCustodyVisitation: {
                              ...fl100.childCustodyVisitation,
                              fl312: {
                                ...fl100.childCustodyVisitation.fl312,
                                requestedOrders: {
                                  ...fl100.childCustodyVisitation.fl312.requestedOrders,
                                  otherOrdersDetails: setDraftFieldValue(fl100.childCustodyVisitation.fl312.requestedOrders.otherOrdersDetails, e.target.value),
                                },
                              },
                            },
                          }))}
                        />
                        <div>
                          <FieldHeader label="FL-312 signature date" field={workspace.fl100.childCustodyVisitation.fl312.signatureDate} />
                          <Input
                            type="date"
                            value={workspace.fl100.childCustodyVisitation.fl312.signatureDate.value}
                            onChange={(e) => updateFl100((fl100) => ({
                              ...fl100,
                              childCustodyVisitation: {
                                ...fl100.childCustodyVisitation,
                                fl312: {
                                  ...fl100.childCustodyVisitation.fl312,
                                  signatureDate: setDraftFieldValue(fl100.childCustodyVisitation.fl312.signatureDate, e.target.value),
                                },
                              },
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {(workspace.fl100.childCustodyVisitation.attachments.formFl341a.value
                    || workspace.fl100.childCustodyVisitation.attachments.formFl341b.value
                    || workspace.fl100.childCustodyVisitation.attachments.formFl341c.value
                    || workspace.fl100.childCustodyVisitation.attachments.formFl341d.value
                    || workspace.fl100.childCustodyVisitation.attachments.formFl341e.value) && (
                    <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 dark:border-amber-300/20 dark:bg-amber-500/10">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">FL-341 v1 details</p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        FL-341 and FL-341(A)/(B)/(C)/(D)/(E) are generated from explicit Draft Forms choices. No supervised-visitation, abduction-prevention, holiday, physical-custody, or joint-legal-custody term is inferred.
                      </p>
                      <div className="mt-3 grid gap-4 md:grid-cols-2">
                        <div>
                          <FieldHeader label="FL-341 source order form" field={workspace.fl100.childCustodyVisitation.fl341.sourceOrder} />
                          <select
                            value={workspace.fl100.childCustodyVisitation.fl341.sourceOrder.value}
                            onChange={(e) => updateFl100((fl100) => ({
                              ...fl100,
                              childCustodyVisitation: {
                                ...fl100.childCustodyVisitation,
                                fl341: {
                                  ...fl100.childCustodyVisitation.fl341,
                                  sourceOrder: setDraftFieldValue(
                                    fl100.childCustodyVisitation.fl341.sourceOrder,
                                    e.target.value as 'unspecified' | 'fl340' | 'fl180' | 'fl250' | 'fl355' | 'other',
                                  ),
                                },
                              },
                            }))}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          >
                            <option value="unspecified">Not selected</option>
                            <option value="fl340">FL-340 (Findings and Order After Hearing)</option>
                            <option value="fl180">FL-180 (Judgment)</option>
                            <option value="fl250">FL-250 (Judgment)</option>
                            <option value="fl355">FL-355 (Stipulation and Order)</option>
                            <option value="other">Other order form</option>
                          </select>
                        </div>
                        <div>
                          <FieldHeader label="Other parent/party in caption (optional)" field={workspace.fl100.childCustodyVisitation.fl341.otherParentPartyName} />
                          <Input
                            value={workspace.fl100.childCustodyVisitation.fl341.otherParentPartyName.value}
                            onChange={(e) => updateFl100((fl100) => ({
                              ...fl100,
                              childCustodyVisitation: {
                                ...fl100.childCustodyVisitation,
                                fl341: {
                                  ...fl100.childCustodyVisitation.fl341,
                                  otherParentPartyName: setDraftFieldValue(fl100.childCustodyVisitation.fl341.otherParentPartyName, e.target.value),
                                },
                              },
                            }))}
                            placeholder="Only if another parent/party must appear in caption"
                          />
                        </div>
                        {workspace.fl100.childCustodyVisitation.fl341.sourceOrder.value === 'other' && (
                          <div className="md:col-span-2">
                            <FieldHeader label="Other order form details" field={workspace.fl100.childCustodyVisitation.fl341.sourceOrderOtherText} />
                            <Input
                              value={workspace.fl100.childCustodyVisitation.fl341.sourceOrderOtherText.value}
                              onChange={(e) => updateFl100((fl100) => ({
                                ...fl100,
                                childCustodyVisitation: {
                                  ...fl100.childCustodyVisitation,
                                  fl341: {
                                    ...fl100.childCustodyVisitation.fl341,
                                    sourceOrderOtherText: setDraftFieldValue(fl100.childCustodyVisitation.fl341.sourceOrderOtherText, e.target.value),
                                  },
                                },
                              }))}
                              placeholder="Specify the order form FL-341 is attached to"
                            />
                          </div>
                        )}
                      </div>
                      {workspace.fl100.childCustodyVisitation.attachments.formFl341a.value && (
                        <div className="mt-4 rounded-lg border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">FL-341(A) supervised visitation terms</p>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Enter explicit supervised party, supervisor, schedule mode, and any conditions.</p>
                          <div className="mt-3 grid gap-3 md:grid-cols-3">
                            {[
                              { key: 'petitioner' as const, label: 'Petitioner supervised' },
                              { key: 'respondent' as const, label: 'Respondent supervised' },
                              { key: 'otherParentParty' as const, label: 'Other parent/party supervised' },
                            ].map((entry) => (
                              <label key={entry.key} className="flex items-center gap-2 rounded border border-slate-200/80 p-2 dark:border-white/10">
                                <Checkbox
                                  checked={workspace.fl100.childCustodyVisitation.fl341.fl341a.supervisedParty[entry.key].value}
                                  onCheckedChange={(checked) => updateFl100((fl100) => ({
                                    ...fl100,
                                    childCustodyVisitation: {
                                      ...fl100.childCustodyVisitation,
                                      fl341: {
                                        ...fl100.childCustodyVisitation.fl341,
                                        fl341a: {
                                          ...fl100.childCustodyVisitation.fl341.fl341a,
                                          supervisedParty: {
                                            ...fl100.childCustodyVisitation.fl341.fl341a.supervisedParty,
                                            [entry.key]: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341a.supervisedParty[entry.key], checked === true),
                                          },
                                        },
                                      },
                                    },
                                  }))}
                                />
                                <span className="text-xs text-slate-700 dark:text-slate-200">{entry.label}</span>
                              </label>
                            ))}
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <div>
                              <FieldHeader label="Supervisor type" field={workspace.fl100.childCustodyVisitation.fl341.fl341a.supervisor.type} />
                              <select
                                value={workspace.fl100.childCustodyVisitation.fl341.fl341a.supervisor.type.value}
                                onChange={(e) => updateFl100((fl100) => ({
                                  ...fl100,
                                  childCustodyVisitation: {
                                    ...fl100.childCustodyVisitation,
                                    fl341: {
                                      ...fl100.childCustodyVisitation.fl341,
                                      fl341a: {
                                        ...fl100.childCustodyVisitation.fl341.fl341a,
                                        supervisor: {
                                          ...fl100.childCustodyVisitation.fl341.fl341a.supervisor,
                                          type: setDraftFieldValue(
                                            fl100.childCustodyVisitation.fl341.fl341a.supervisor.type,
                                            e.target.value as 'unspecified' | 'professional' | 'nonprofessional' | 'other',
                                          ),
                                        },
                                      },
                                    },
                                  },
                                }))}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                              >
                                <option value="unspecified">Not selected</option>
                                <option value="professional">Professional supervisor</option>
                                <option value="nonprofessional">Nonprofessional supervisor</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            {workspace.fl100.childCustodyVisitation.fl341.fl341a.supervisor.type.value === 'other' && (
                              <div>
                                <FieldHeader label="Supervisor type other details" field={workspace.fl100.childCustodyVisitation.fl341.fl341a.supervisor.otherTypeText} />
                                <Input
                                  value={workspace.fl100.childCustodyVisitation.fl341.fl341a.supervisor.otherTypeText.value}
                                  onChange={(e) => updateFl100((fl100) => ({
                                    ...fl100,
                                    childCustodyVisitation: {
                                      ...fl100.childCustodyVisitation,
                                      fl341: {
                                        ...fl100.childCustodyVisitation.fl341,
                                        fl341a: {
                                          ...fl100.childCustodyVisitation.fl341.fl341a,
                                          supervisor: {
                                            ...fl100.childCustodyVisitation.fl341.fl341a.supervisor,
                                            otherTypeText: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341a.supervisor.otherTypeText, e.target.value),
                                          },
                                        },
                                      },
                                    },
                                  }))}
                                />
                              </div>
                            )}
                            <div>
                              <FieldHeader label="Supervisor name" field={workspace.fl100.childCustodyVisitation.fl341.fl341a.supervisor.name} />
                              <Input
                                value={workspace.fl100.childCustodyVisitation.fl341.fl341a.supervisor.name.value}
                                onChange={(e) => updateFl100((fl100) => ({
                                  ...fl100,
                                  childCustodyVisitation: {
                                    ...fl100.childCustodyVisitation,
                                    fl341: {
                                      ...fl100.childCustodyVisitation.fl341,
                                      fl341a: {
                                        ...fl100.childCustodyVisitation.fl341.fl341a,
                                        supervisor: {
                                          ...fl100.childCustodyVisitation.fl341.fl341a.supervisor,
                                          name: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341a.supervisor.name, e.target.value),
                                        },
                                      },
                                    },
                                  },
                                }))}
                              />
                            </div>
                            <div>
                              <FieldHeader label="Supervisor contact" field={workspace.fl100.childCustodyVisitation.fl341.fl341a.supervisor.contact} />
                              <Input
                                value={workspace.fl100.childCustodyVisitation.fl341.fl341a.supervisor.contact.value}
                                onChange={(e) => updateFl100((fl100) => ({
                                  ...fl100,
                                  childCustodyVisitation: {
                                    ...fl100.childCustodyVisitation,
                                    fl341: {
                                      ...fl100.childCustodyVisitation.fl341,
                                      fl341a: {
                                        ...fl100.childCustodyVisitation.fl341.fl341a,
                                        supervisor: {
                                          ...fl100.childCustodyVisitation.fl341.fl341a.supervisor,
                                          contact: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341a.supervisor.contact, e.target.value),
                                        },
                                      },
                                    },
                                  },
                                }))}
                              />
                            </div>
                            <div>
                              <FieldHeader label="Supervisor fees paid by" field={workspace.fl100.childCustodyVisitation.fl341.fl341a.supervisor.feesPaidBy} />
                              <select
                                value={workspace.fl100.childCustodyVisitation.fl341.fl341a.supervisor.feesPaidBy.value}
                                onChange={(e) => updateFl100((fl100) => ({
                                  ...fl100,
                                  childCustodyVisitation: {
                                    ...fl100.childCustodyVisitation,
                                    fl341: {
                                      ...fl100.childCustodyVisitation.fl341,
                                      fl341a: {
                                        ...fl100.childCustodyVisitation.fl341.fl341a,
                                        supervisor: {
                                          ...fl100.childCustodyVisitation.fl341.fl341a.supervisor,
                                          feesPaidBy: setDraftFieldValue(
                                            fl100.childCustodyVisitation.fl341.fl341a.supervisor.feesPaidBy,
                                            e.target.value as 'unspecified' | 'petitioner' | 'respondent' | 'shared' | 'other',
                                          ),
                                        },
                                      },
                                    },
                                  },
                                }))}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                              >
                                <option value="unspecified">Not selected</option>
                                <option value="petitioner">Petitioner</option>
                                <option value="respondent">Respondent</option>
                                <option value="shared">Shared</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            {workspace.fl100.childCustodyVisitation.fl341.fl341a.supervisor.feesPaidBy.value === 'other' && (
                              <div>
                                <FieldHeader label="Supervisor fees other details" field={workspace.fl100.childCustodyVisitation.fl341.fl341a.supervisor.feesOtherText} />
                                <Input
                                  value={workspace.fl100.childCustodyVisitation.fl341.fl341a.supervisor.feesOtherText.value}
                                  onChange={(e) => updateFl100((fl100) => ({
                                    ...fl100,
                                    childCustodyVisitation: {
                                      ...fl100.childCustodyVisitation,
                                      fl341: {
                                        ...fl100.childCustodyVisitation.fl341,
                                        fl341a: {
                                          ...fl100.childCustodyVisitation.fl341.fl341a,
                                          supervisor: {
                                            ...fl100.childCustodyVisitation.fl341.fl341a.supervisor,
                                            feesOtherText: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341a.supervisor.feesOtherText, e.target.value),
                                          },
                                        },
                                      },
                                    },
                                  }))}
                                />
                              </div>
                            )}
                            <div>
                              <FieldHeader label="Schedule mode" field={workspace.fl100.childCustodyVisitation.fl341.fl341a.schedule.mode} />
                              <select
                                value={workspace.fl100.childCustodyVisitation.fl341.fl341a.schedule.mode.value}
                                onChange={(e) => updateFl100((fl100) => ({
                                  ...fl100,
                                  childCustodyVisitation: {
                                    ...fl100.childCustodyVisitation,
                                    fl341: {
                                      ...fl100.childCustodyVisitation.fl341,
                                      fl341a: {
                                        ...fl100.childCustodyVisitation.fl341.fl341a,
                                        schedule: {
                                          ...fl100.childCustodyVisitation.fl341.fl341a.schedule,
                                          mode: setDraftFieldValue(
                                            fl100.childCustodyVisitation.fl341.fl341a.schedule.mode,
                                            e.target.value as 'unspecified' | 'fl311' | 'attachment' | 'text',
                                          ),
                                        },
                                      },
                                    },
                                  },
                                }))}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                              >
                                <option value="unspecified">Not selected</option>
                                <option value="fl311">Use FL-311 terms</option>
                                <option value="attachment">Use attached schedule</option>
                                <option value="text">As follows</option>
                              </select>
                            </div>
                            {workspace.fl100.childCustodyVisitation.fl341.fl341a.schedule.mode.value === 'attachment' && (
                              <div>
                                <FieldHeader label="Attached schedule page count" field={workspace.fl100.childCustodyVisitation.fl341.fl341a.schedule.attachmentPageCount} />
                                <Input
                                  inputMode="numeric"
                                  value={workspace.fl100.childCustodyVisitation.fl341.fl341a.schedule.attachmentPageCount.value}
                                  onChange={(e) => updateFl100((fl100) => ({
                                    ...fl100,
                                    childCustodyVisitation: {
                                      ...fl100.childCustodyVisitation,
                                      fl341: {
                                        ...fl100.childCustodyVisitation.fl341,
                                        fl341a: {
                                          ...fl100.childCustodyVisitation.fl341.fl341a,
                                          schedule: {
                                            ...fl100.childCustodyVisitation.fl341.fl341a.schedule,
                                            attachmentPageCount: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341a.schedule.attachmentPageCount, e.target.value),
                                          },
                                        },
                                      },
                                    },
                                  }))}
                                />
                              </div>
                            )}
                          </div>
                          {workspace.fl100.childCustodyVisitation.fl341.fl341a.schedule.mode.value === 'text' && (
                            <Textarea
                              className="mt-3 min-h-[72px]"
                              placeholder="FL-341(A) schedule terms (as follows)"
                              value={workspace.fl100.childCustodyVisitation.fl341.fl341a.schedule.text.value}
                              onChange={(e) => updateFl100((fl100) => ({
                                ...fl100,
                                childCustodyVisitation: {
                                  ...fl100.childCustodyVisitation,
                                  fl341: {
                                    ...fl100.childCustodyVisitation.fl341,
                                    fl341a: {
                                      ...fl100.childCustodyVisitation.fl341.fl341a,
                                      schedule: {
                                        ...fl100.childCustodyVisitation.fl341.fl341a.schedule,
                                        text: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341a.schedule.text, e.target.value),
                                      },
                                    },
                                  },
                                },
                              }))}
                            />
                          )}
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <div>
                              <FieldHeader label="Restrictions / conditions (optional)" field={workspace.fl100.childCustodyVisitation.fl341.fl341a.restrictions} />
                              <Textarea
                                className="min-h-[72px]"
                                value={workspace.fl100.childCustodyVisitation.fl341.fl341a.restrictions.value}
                                onChange={(e) => updateFl100((fl100) => ({
                                  ...fl100,
                                  childCustodyVisitation: {
                                    ...fl100.childCustodyVisitation,
                                    fl341: {
                                      ...fl100.childCustodyVisitation.fl341,
                                      fl341a: {
                                        ...fl100.childCustodyVisitation.fl341.fl341a,
                                        restrictions: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341a.restrictions, e.target.value),
                                      },
                                    },
                                  },
                                }))}
                              />
                            </div>
                            <div>
                              <FieldHeader label="Other terms (optional)" field={workspace.fl100.childCustodyVisitation.fl341.fl341a.otherTerms} />
                              <Textarea
                                className="min-h-[72px]"
                                value={workspace.fl100.childCustodyVisitation.fl341.fl341a.otherTerms.value}
                                onChange={(e) => updateFl100((fl100) => ({
                                  ...fl100,
                                  childCustodyVisitation: {
                                    ...fl100.childCustodyVisitation,
                                    fl341: {
                                      ...fl100.childCustodyVisitation.fl341,
                                      fl341a: {
                                        ...fl100.childCustodyVisitation.fl341.fl341a,
                                        otherTerms: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341a.otherTerms, e.target.value),
                                      },
                                    },
                                  },
                                }))}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      {workspace.fl100.childCustodyVisitation.attachments.formFl341b.value && (
                        <div className="mt-4 rounded-lg border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">FL-341(B) child abduction prevention order terms</p>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">FL-341(B) is the order attachment counterpart to FL-312. Select risk factors and requested order terms explicitly.</p>
                          <div className="mt-3">
                            <FieldHeader label="Party restrained by FL-341(B)" field={workspace.fl100.childCustodyVisitation.fl341.fl341b.restrainedPartyName} />
                            <Input
                              value={workspace.fl100.childCustodyVisitation.fl341.fl341b.restrainedPartyName.value}
                              onChange={(e) => updateFl341B((fl341b) => ({
                                ...fl341b,
                                restrainedPartyName: setDraftFieldValue(fl341b.restrainedPartyName, e.target.value),
                              }))}
                              placeholder="Name of parent/party subject to abduction-prevention orders"
                            />
                          </div>
                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            {[
                              ['violatedPastOrders', 'Violated or threatened to violate custody/visitation orders'],
                              ['noStrongCaliforniaTies', 'Weak California ties / strong ties elsewhere'],
                              ['criminalRecord', 'Relevant criminal record'],
                              ['tiesToOtherJurisdiction', 'Ties to another state/country or jurisdiction'],
                            ].map(([key, label]) => (
                              <label key={key} className="flex items-center gap-2 rounded border border-slate-200/80 p-2 dark:border-white/10">
                                <Checkbox
                                  checked={workspace.fl100.childCustodyVisitation.fl341.fl341b.risk[key as 'violatedPastOrders' | 'noStrongCaliforniaTies' | 'criminalRecord' | 'tiesToOtherJurisdiction'].value}
                                  onCheckedChange={(checked) => updateFl341B((fl341b) => ({
                                    ...fl341b,
                                    risk: {
                                      ...fl341b.risk,
                                      [key]: setDraftFieldValue(fl341b.risk[key as 'violatedPastOrders' | 'noStrongCaliforniaTies' | 'criminalRecord' | 'tiesToOtherJurisdiction'], checked === true),
                                    },
                                  }))}
                                />
                                <span className="text-xs text-slate-700 dark:text-slate-200">{label}</span>
                              </label>
                            ))}
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <label className="flex items-center gap-2 rounded border border-slate-200/80 p-2 dark:border-white/10">
                              <Checkbox
                                checked={workspace.fl100.childCustodyVisitation.fl341.fl341b.risk.preparationActions.selected.value}
                                onCheckedChange={(checked) => updateFl341B((fl341b) => ({
                                  ...fl341b,
                                  risk: {
                                    ...fl341b.risk,
                                    preparationActions: {
                                      ...fl341b.risk.preparationActions,
                                      selected: setDraftFieldValue(fl341b.risk.preparationActions.selected, checked === true),
                                    },
                                  },
                                }))}
                              />
                              <span className="text-xs text-slate-700 dark:text-slate-200">Recent abduction-preparation actions</span>
                            </label>
                            <label className="flex items-center gap-2 rounded border border-slate-200/80 p-2 dark:border-white/10">
                              <Checkbox
                                checked={workspace.fl100.childCustodyVisitation.fl341.fl341b.risk.history.selected.value}
                                onCheckedChange={(checked) => updateFl341B((fl341b) => ({
                                  ...fl341b,
                                  risk: {
                                    ...fl341b.risk,
                                    history: {
                                      ...fl341b.risk.history,
                                      selected: setDraftFieldValue(fl341b.risk.history.selected, checked === true),
                                    },
                                  },
                                }))}
                              />
                              <span className="text-xs text-slate-700 dark:text-slate-200">History of domestic violence/abuse/noncooperation</span>
                            </label>
                          </div>
                          {workspace.fl100.childCustodyVisitation.fl341.fl341b.risk.preparationActions.selected.value && (
                            <div className="mt-3 rounded-md border border-slate-200/80 p-3 dark:border-white/10">
                              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">Preparation-action details</p>
                              <div className="mt-2 grid gap-2 md:grid-cols-3">
                                {[
                                  ['quitJob', 'Quit job'],
                                  ['soldHome', 'Sold home'],
                                  ['closedBankAccount', 'Closed bank account'],
                                  ['endedLease', 'Ended lease'],
                                  ['soldAssets', 'Sold assets'],
                                  ['hiddenOrDestroyedDocuments', 'Hid/destroyed documents'],
                                  ['appliedForPassport', 'Applied for passport/docs'],
                                  ['other', 'Other'],
                                ].map(([key, label]) => (
                                  <label key={key} className="flex items-center gap-2">
                                    <Checkbox
                                      checked={workspace.fl100.childCustodyVisitation.fl341.fl341b.risk.preparationActions[key as 'quitJob' | 'soldHome' | 'closedBankAccount' | 'endedLease' | 'soldAssets' | 'hiddenOrDestroyedDocuments' | 'appliedForPassport' | 'other'].value}
                                      onCheckedChange={(checked) => updateFl341B((fl341b) => ({
                                        ...fl341b,
                                        risk: {
                                          ...fl341b.risk,
                                          preparationActions: {
                                            ...fl341b.risk.preparationActions,
                                            [key]: setDraftFieldValue(fl341b.risk.preparationActions[key as 'quitJob' | 'soldHome' | 'closedBankAccount' | 'endedLease' | 'soldAssets' | 'hiddenOrDestroyedDocuments' | 'appliedForPassport' | 'other'], checked === true),
                                          },
                                        },
                                      }))}
                                    />
                                    <span className="text-xs text-slate-700 dark:text-slate-200">{label}</span>
                                  </label>
                                ))}
                              </div>
                              {workspace.fl100.childCustodyVisitation.fl341.fl341b.risk.preparationActions.other.value && (
                                <Input
                                  className="mt-2"
                                  value={workspace.fl100.childCustodyVisitation.fl341.fl341b.risk.preparationActions.otherDetails.value}
                                  onChange={(e) => updateFl341B((fl341b) => ({
                                    ...fl341b,
                                    risk: {
                                      ...fl341b.risk,
                                      preparationActions: {
                                        ...fl341b.risk.preparationActions,
                                        otherDetails: setDraftFieldValue(fl341b.risk.preparationActions.otherDetails, e.target.value),
                                      },
                                    },
                                  }))}
                                  placeholder="Other preparation-action details"
                                />
                              )}
                            </div>
                          )}
                          {workspace.fl100.childCustodyVisitation.fl341.fl341b.risk.history.selected.value && (
                            <div className="mt-3 grid gap-2 md:grid-cols-3">
                              {[
                                ['domesticViolence', 'Domestic violence'],
                                ['childAbuse', 'Child abuse'],
                                ['nonCooperation', 'Parenting noncooperation'],
                              ].map(([key, label]) => (
                                <label key={key} className="flex items-center gap-2 rounded border border-slate-200/80 p-2 dark:border-white/10">
                                  <Checkbox
                                    checked={workspace.fl100.childCustodyVisitation.fl341.fl341b.risk.history[key as 'domesticViolence' | 'childAbuse' | 'nonCooperation'].value}
                                    onCheckedChange={(checked) => updateFl341B((fl341b) => ({
                                      ...fl341b,
                                      risk: {
                                        ...fl341b.risk,
                                        history: {
                                          ...fl341b.risk.history,
                                          [key]: setDraftFieldValue(fl341b.risk.history[key as 'domesticViolence' | 'childAbuse' | 'nonCooperation'], checked === true),
                                        },
                                      },
                                    }))}
                                  />
                                  <span className="text-xs text-slate-700 dark:text-slate-200">{label}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          <div className="mt-4 rounded-md border border-slate-200/80 p-3 dark:border-white/10">
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-200">Requested FL-341(B) orders</p>
                            <div className="mt-2 grid gap-2 md:grid-cols-2">
                              {[
                                ['supervisedVisitation', 'Supervised visitation'],
                                ['postBond', 'Post bond'],
                                ['noMoveWithoutPermission', 'No move without permission/order'],
                                ['noTravelWithoutPermission', 'No travel without permission/order'],
                                ['registerInOtherState', 'Register order in another state'],
                                ['noPassportApplications', 'No passport/travel-document applications'],
                                ['turnInPassportsAndVitalDocs', 'Turn in passports/vital documents'],
                                ['provideTravelInfo', 'Provide travel information'],
                                ['notifyEmbassyOrConsulate', 'Notify embassy/consulate'],
                                ['obtainForeignOrderBeforeTravel', 'Obtain foreign order before travel'],
                                ['enforceOrder', 'Enforcement assistance/contact'],
                                ['other', 'Other order'],
                              ].map(([key, label]) => (
                                <label key={key} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={workspace.fl100.childCustodyVisitation.fl341.fl341b.orders[key as 'supervisedVisitation' | 'postBond' | 'noMoveWithoutPermission' | 'noTravelWithoutPermission' | 'registerInOtherState' | 'noPassportApplications' | 'turnInPassportsAndVitalDocs' | 'provideTravelInfo' | 'notifyEmbassyOrConsulate' | 'obtainForeignOrderBeforeTravel' | 'enforceOrder' | 'other'].value}
                                    onCheckedChange={(checked) => updateFl341B((fl341b) => ({
                                      ...fl341b,
                                      orders: {
                                        ...fl341b.orders,
                                        [key]: setDraftFieldValue(fl341b.orders[key as 'supervisedVisitation' | 'postBond' | 'noMoveWithoutPermission' | 'noTravelWithoutPermission' | 'registerInOtherState' | 'noPassportApplications' | 'turnInPassportsAndVitalDocs' | 'provideTravelInfo' | 'notifyEmbassyOrConsulate' | 'obtainForeignOrderBeforeTravel' | 'enforceOrder' | 'other'], checked === true),
                                      },
                                    }))}
                                  />
                                  <span className="text-xs text-slate-700 dark:text-slate-200">{label}</span>
                                </label>
                              ))}
                            </div>
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                              {workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.supervisedVisitation.value && (
                                <div>
                                  <FieldHeader label="Supervised visitation terms mode" field={workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.supervisedVisitationTermsMode} />
                                  <select
                                    value={workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.supervisedVisitationTermsMode.value}
                                    onChange={(e) => updateFl341B((fl341b) => ({
                                      ...fl341b,
                                      orders: {
                                        ...fl341b.orders,
                                        supervisedVisitationTermsMode: setDraftFieldValue(fl341b.orders.supervisedVisitationTermsMode, e.target.value as 'unspecified' | 'fl341a' | 'as_follows'),
                                      },
                                    }))}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                  >
                                    <option value="unspecified">Not selected</option>
                                    <option value="fl341a">Use FL-341(A)</option>
                                    <option value="as_follows">As follows</option>
                                  </select>
                                </div>
                              )}
                              {workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.postBond.value && (
                                <div>
                                  <FieldHeader label="Bond amount" field={workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.postBondAmount} />
                                  <Input value={workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.postBondAmount.value} onChange={(e) => updateFl341B((fl341b) => ({ ...fl341b, orders: { ...fl341b.orders, postBondAmount: setDraftFieldValue(fl341b.orders.postBondAmount, e.target.value) } }))} />
                                </div>
                              )}
                              {workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.registerInOtherState.value && (
                                <div>
                                  <FieldHeader label="Registration state" field={workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.registerInOtherStateName} />
                                  <Input value={workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.registerInOtherStateName.value} onChange={(e) => updateFl341B((fl341b) => ({ ...fl341b, orders: { ...fl341b.orders, registerInOtherStateName: setDraftFieldValue(fl341b.orders.registerInOtherStateName, e.target.value) } }))} />
                                </div>
                              )}
                              {workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.notifyEmbassyOrConsulate.value && (
                                <>
                                  <div>
                                    <FieldHeader label="Embassy/consulate country" field={workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.notifyEmbassyCountry} />
                                    <Input value={workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.notifyEmbassyCountry.value} onChange={(e) => updateFl341B((fl341b) => ({ ...fl341b, orders: { ...fl341b.orders, notifyEmbassyCountry: setDraftFieldValue(fl341b.orders.notifyEmbassyCountry, e.target.value) } }))} />
                                  </div>
                                  <div>
                                    <FieldHeader label="Notification days" field={workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.notifyEmbassyWithinDays} />
                                    <Input value={workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.notifyEmbassyWithinDays.value} onChange={(e) => updateFl341B((fl341b) => ({ ...fl341b, orders: { ...fl341b.orders, notifyEmbassyWithinDays: setDraftFieldValue(fl341b.orders.notifyEmbassyWithinDays, e.target.value) } }))} />
                                  </div>
                                </>
                              )}
                            </div>
                            {(workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.supervisedVisitationTermsMode.value === 'as_follows'
                              || workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.postBond.value
                              || workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.noMoveOtherPlace.value
                              || workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.travelRestrictionOther.value
                              || workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.provideOtherTravelInfo.value
                              || workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.enforceOrder.value
                              || workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.other.value) && (
                              <div className="mt-3 grid gap-3 md:grid-cols-2">
                                {workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.supervisedVisitationTermsMode.value === 'as_follows' && (
                                  <Textarea className="min-h-[72px]" placeholder="Supervised visitation terms" value={workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.supervisedVisitationTermsDetails.value} onChange={(e) => updateFl341B((fl341b) => ({ ...fl341b, orders: { ...fl341b.orders, supervisedVisitationTermsDetails: setDraftFieldValue(fl341b.orders.supervisedVisitationTermsDetails, e.target.value) } }))} />
                                )}
                                {workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.noMoveOtherPlace.value && (
                                  <Input placeholder="Other no-move place" value={workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.noMoveOtherPlaceDetails.value} onChange={(e) => updateFl341B((fl341b) => ({ ...fl341b, orders: { ...fl341b.orders, noMoveOtherPlaceDetails: setDraftFieldValue(fl341b.orders.noMoveOtherPlaceDetails, e.target.value) } }))} />
                                )}
                                {workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.travelRestrictionOther.value && (
                                  <Input placeholder="Other travel restriction" value={workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.travelRestrictionOtherDetails.value} onChange={(e) => updateFl341B((fl341b) => ({ ...fl341b, orders: { ...fl341b.orders, travelRestrictionOtherDetails: setDraftFieldValue(fl341b.orders.travelRestrictionOtherDetails, e.target.value) } }))} />
                                )}
                                {workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.provideOtherTravelInfo.value && (
                                  <Input placeholder="Other travel information details" value={workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.provideOtherTravelInfoDetails.value} onChange={(e) => updateFl341B((fl341b) => ({ ...fl341b, orders: { ...fl341b.orders, provideOtherTravelInfoDetails: setDraftFieldValue(fl341b.orders.provideOtherTravelInfoDetails, e.target.value) } }))} />
                                )}
                                {workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.enforceOrder.value && (
                                  <Input placeholder="Enforcement contact information" value={workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.enforceOrderContactInfo.value} onChange={(e) => updateFl341B((fl341b) => ({ ...fl341b, orders: { ...fl341b.orders, enforceOrderContactInfo: setDraftFieldValue(fl341b.orders.enforceOrderContactInfo, e.target.value) } }))} />
                                )}
                                {workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.other.value && (
                                  <Textarea className="min-h-[72px]" placeholder="Other FL-341(B) order details" value={workspace.fl100.childCustodyVisitation.fl341.fl341b.orders.otherDetails.value} onChange={(e) => updateFl341B((fl341b) => ({ ...fl341b, orders: { ...fl341b.orders, otherDetails: setDraftFieldValue(fl341b.orders.otherDetails, e.target.value) } }))} />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {workspace.fl100.childCustodyVisitation.attachments.formFl341c.value && (
                        <div className="mt-4 rounded-lg border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">FL-341(C) holiday schedule terms</p>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">For each enabled row, choose year pattern and assigned party explicitly.</p>
                          <div className="mt-3 space-y-3">
                            {[
                              { key: 'newYearsDay' as const, label: "New Year's Day" },
                              { key: 'springBreak' as const, label: 'Spring Break' },
                              { key: 'thanksgivingDay' as const, label: 'Thanksgiving Day' },
                              { key: 'winterBreak' as const, label: 'Winter Break' },
                              { key: 'childBirthday' as const, label: "Child's Birthday" },
                            ].map((entry) => {
                              const row = workspace.fl100.childCustodyVisitation.fl341.fl341c.holidayRows[entry.key];
                              return (
                                <div key={entry.key} className="rounded-md border border-slate-200/80 p-3 dark:border-white/10">
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      checked={row.enabled.value}
                                      onCheckedChange={(checked) => updateFl100((fl100) => ({
                                        ...fl100,
                                        childCustodyVisitation: {
                                          ...fl100.childCustodyVisitation,
                                          fl341: {
                                            ...fl100.childCustodyVisitation.fl341,
                                            fl341c: {
                                              ...fl100.childCustodyVisitation.fl341.fl341c,
                                              holidayRows: {
                                                ...fl100.childCustodyVisitation.fl341.fl341c.holidayRows,
                                                [entry.key]: {
                                                  ...fl100.childCustodyVisitation.fl341.fl341c.holidayRows[entry.key],
                                                  enabled: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341c.holidayRows[entry.key].enabled, checked === true),
                                                },
                                              },
                                            },
                                          },
                                        },
                                      }))}
                                    />
                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{entry.label}</span>
                                  </div>
                                  {row.enabled.value && (
                                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                                      <div>
                                        <FieldHeader label="Year pattern" field={row.yearPattern} />
                                        <select
                                          value={row.yearPattern.value}
                                          onChange={(e) => updateFl100((fl100) => ({
                                            ...fl100,
                                            childCustodyVisitation: {
                                              ...fl100.childCustodyVisitation,
                                              fl341: {
                                                ...fl100.childCustodyVisitation.fl341,
                                                fl341c: {
                                                  ...fl100.childCustodyVisitation.fl341.fl341c,
                                                  holidayRows: {
                                                    ...fl100.childCustodyVisitation.fl341.fl341c.holidayRows,
                                                    [entry.key]: {
                                                      ...fl100.childCustodyVisitation.fl341.fl341c.holidayRows[entry.key],
                                                      yearPattern: setDraftFieldValue(
                                                        fl100.childCustodyVisitation.fl341.fl341c.holidayRows[entry.key].yearPattern,
                                                        e.target.value as 'unspecified' | 'every_year' | 'even_years' | 'odd_years',
                                                      ),
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                          }))}
                                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        >
                                          <option value="unspecified">Not selected</option>
                                          <option value="every_year">Every year</option>
                                          <option value="even_years">Even years</option>
                                          <option value="odd_years">Odd years</option>
                                        </select>
                                      </div>
                                      <div>
                                        <FieldHeader label="Assigned to" field={row.assignedTo} />
                                        <select
                                          value={row.assignedTo.value}
                                          onChange={(e) => updateFl100((fl100) => ({
                                            ...fl100,
                                            childCustodyVisitation: {
                                              ...fl100.childCustodyVisitation,
                                              fl341: {
                                                ...fl100.childCustodyVisitation.fl341,
                                                fl341c: {
                                                  ...fl100.childCustodyVisitation.fl341.fl341c,
                                                  holidayRows: {
                                                    ...fl100.childCustodyVisitation.fl341.fl341c.holidayRows,
                                                    [entry.key]: {
                                                      ...fl100.childCustodyVisitation.fl341.fl341c.holidayRows[entry.key],
                                                      assignedTo: setDraftFieldValue(
                                                        fl100.childCustodyVisitation.fl341.fl341c.holidayRows[entry.key].assignedTo,
                                                        e.target.value as 'unspecified' | 'petitioner' | 'respondent' | 'other_parent_party',
                                                      ),
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                          }))}
                                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        >
                                          <option value="unspecified">Not selected</option>
                                          <option value="petitioner">Petitioner</option>
                                          <option value="respondent">Respondent</option>
                                          <option value="other_parent_party">Other parent/party</option>
                                        </select>
                                      </div>
                                      <div>
                                        <FieldHeader label="Times (optional)" field={row.times} />
                                        <Input
                                          value={row.times.value}
                                          onChange={(e) => updateFl100((fl100) => ({
                                            ...fl100,
                                            childCustodyVisitation: {
                                              ...fl100.childCustodyVisitation,
                                              fl341: {
                                                ...fl100.childCustodyVisitation.fl341,
                                                fl341c: {
                                                  ...fl100.childCustodyVisitation.fl341.fl341c,
                                                  holidayRows: {
                                                    ...fl100.childCustodyVisitation.fl341.fl341c.holidayRows,
                                                    [entry.key]: {
                                                      ...fl100.childCustodyVisitation.fl341.fl341c.holidayRows[entry.key],
                                                      times: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341c.holidayRows[entry.key].times, e.target.value),
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                          }))}
                                          placeholder="e.g., Fri 6:00 PM to Sun 6:00 PM"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <div>
                              <FieldHeader label="Additional holiday notes (optional)" field={workspace.fl100.childCustodyVisitation.fl341.fl341c.additionalHolidayNotes} />
                              <Textarea
                                className="min-h-[72px]"
                                value={workspace.fl100.childCustodyVisitation.fl341.fl341c.additionalHolidayNotes.value}
                                onChange={(e) => updateFl100((fl100) => ({
                                  ...fl100,
                                  childCustodyVisitation: {
                                    ...fl100.childCustodyVisitation,
                                    fl341: {
                                      ...fl100.childCustodyVisitation.fl341,
                                      fl341c: {
                                        ...fl100.childCustodyVisitation.fl341.fl341c,
                                        additionalHolidayNotes: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341c.additionalHolidayNotes, e.target.value),
                                      },
                                    },
                                  },
                                }))}
                              />
                            </div>
                            <div className="space-y-3">
                              <div>
                                <FieldHeader label="Vacation assigned to" field={workspace.fl100.childCustodyVisitation.fl341.fl341c.vacation.assignedTo} />
                                <select
                                  value={workspace.fl100.childCustodyVisitation.fl341.fl341c.vacation.assignedTo.value}
                                  onChange={(e) => updateFl100((fl100) => ({
                                    ...fl100,
                                    childCustodyVisitation: {
                                      ...fl100.childCustodyVisitation,
                                      fl341: {
                                        ...fl100.childCustodyVisitation.fl341,
                                        fl341c: {
                                          ...fl100.childCustodyVisitation.fl341.fl341c,
                                          vacation: {
                                            ...fl100.childCustodyVisitation.fl341.fl341c.vacation,
                                            assignedTo: setDraftFieldValue(
                                              fl100.childCustodyVisitation.fl341.fl341c.vacation.assignedTo,
                                              e.target.value as 'unspecified' | 'petitioner' | 'respondent' | 'other_parent_party',
                                            ),
                                          },
                                        },
                                      },
                                    },
                                  }))}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                >
                                  <option value="unspecified">Not selected</option>
                                  <option value="petitioner">Petitioner</option>
                                  <option value="respondent">Respondent</option>
                                  <option value="other_parent_party">Other parent/party</option>
                                </select>
                              </div>
                              <div className="grid gap-3 md:grid-cols-2">
                                <Input
                                  placeholder="Max duration"
                                  value={workspace.fl100.childCustodyVisitation.fl341.fl341c.vacation.maxDuration.value}
                                  onChange={(e) => updateFl100((fl100) => ({
                                    ...fl100,
                                    childCustodyVisitation: {
                                      ...fl100.childCustodyVisitation,
                                      fl341: {
                                        ...fl100.childCustodyVisitation.fl341,
                                        fl341c: {
                                          ...fl100.childCustodyVisitation.fl341.fl341c,
                                          vacation: {
                                            ...fl100.childCustodyVisitation.fl341.fl341c.vacation,
                                            maxDuration: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341c.vacation.maxDuration, e.target.value),
                                          },
                                        },
                                      },
                                    },
                                  }))}
                                  inputMode="numeric"
                                />
                                <select
                                  value={workspace.fl100.childCustodyVisitation.fl341.fl341c.vacation.maxDurationUnit.value}
                                  onChange={(e) => updateFl100((fl100) => ({
                                    ...fl100,
                                    childCustodyVisitation: {
                                      ...fl100.childCustodyVisitation,
                                      fl341: {
                                        ...fl100.childCustodyVisitation.fl341,
                                        fl341c: {
                                          ...fl100.childCustodyVisitation.fl341.fl341c,
                                          vacation: {
                                            ...fl100.childCustodyVisitation.fl341.fl341c.vacation,
                                            maxDurationUnit: setDraftFieldValue(
                                              fl100.childCustodyVisitation.fl341.fl341c.vacation.maxDurationUnit,
                                              e.target.value as 'unspecified' | 'days' | 'weeks',
                                            ),
                                          },
                                        },
                                      },
                                    },
                                  }))}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                >
                                  <option value="unspecified">Duration unit</option>
                                  <option value="days">Days</option>
                                  <option value="weeks">Weeks</option>
                                </select>
                                <Input
                                  placeholder="Times/year"
                                  value={workspace.fl100.childCustodyVisitation.fl341.fl341c.vacation.timesPerYear.value}
                                  onChange={(e) => updateFl100((fl100) => ({
                                    ...fl100,
                                    childCustodyVisitation: {
                                      ...fl100.childCustodyVisitation,
                                      fl341: {
                                        ...fl100.childCustodyVisitation.fl341,
                                        fl341c: {
                                          ...fl100.childCustodyVisitation.fl341.fl341c,
                                          vacation: {
                                            ...fl100.childCustodyVisitation.fl341.fl341c.vacation,
                                            timesPerYear: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341c.vacation.timesPerYear, e.target.value),
                                          },
                                        },
                                      },
                                    },
                                  }))}
                                />
                                <Input
                                  placeholder="Notice days"
                                  value={workspace.fl100.childCustodyVisitation.fl341.fl341c.vacation.noticeDays.value}
                                  onChange={(e) => updateFl100((fl100) => ({
                                    ...fl100,
                                    childCustodyVisitation: {
                                      ...fl100.childCustodyVisitation,
                                      fl341: {
                                        ...fl100.childCustodyVisitation.fl341,
                                        fl341c: {
                                          ...fl100.childCustodyVisitation.fl341.fl341c,
                                          vacation: {
                                            ...fl100.childCustodyVisitation.fl341.fl341c.vacation,
                                            noticeDays: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341c.vacation.noticeDays, e.target.value),
                                          },
                                        },
                                      },
                                    },
                                  }))}
                                />
                                <Input
                                  placeholder="Response days"
                                  value={workspace.fl100.childCustodyVisitation.fl341.fl341c.vacation.responseDays.value}
                                  onChange={(e) => updateFl100((fl100) => ({
                                    ...fl100,
                                    childCustodyVisitation: {
                                      ...fl100.childCustodyVisitation,
                                      fl341: {
                                        ...fl100.childCustodyVisitation.fl341,
                                        fl341c: {
                                          ...fl100.childCustodyVisitation.fl341.fl341c,
                                          vacation: {
                                            ...fl100.childCustodyVisitation.fl341.fl341c.vacation,
                                            responseDays: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341c.vacation.responseDays, e.target.value),
                                          },
                                        },
                                      },
                                    },
                                  }))}
                                />
                              </div>
                              <label className="flex items-center gap-2">
                                <Checkbox
                                  checked={workspace.fl100.childCustodyVisitation.fl341.fl341c.vacation.allowOutsideCalifornia.value}
                                  onCheckedChange={(checked) => updateFl100((fl100) => ({
                                    ...fl100,
                                    childCustodyVisitation: {
                                      ...fl100.childCustodyVisitation,
                                      fl341: {
                                        ...fl100.childCustodyVisitation.fl341,
                                        fl341c: {
                                          ...fl100.childCustodyVisitation.fl341.fl341c,
                                          vacation: {
                                            ...fl100.childCustodyVisitation.fl341.fl341c.vacation,
                                            allowOutsideCalifornia: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341c.vacation.allowOutsideCalifornia, checked === true),
                                          },
                                        },
                                      },
                                    },
                                  }))}
                                />
                                <span className="text-xs text-slate-700 dark:text-slate-200">Allow vacation outside California</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <Checkbox
                                  checked={workspace.fl100.childCustodyVisitation.fl341.fl341c.vacation.allowOutsideUnitedStates.value}
                                  onCheckedChange={(checked) => updateFl100((fl100) => ({
                                    ...fl100,
                                    childCustodyVisitation: {
                                      ...fl100.childCustodyVisitation,
                                      fl341: {
                                        ...fl100.childCustodyVisitation.fl341,
                                        fl341c: {
                                          ...fl100.childCustodyVisitation.fl341.fl341c,
                                          vacation: {
                                            ...fl100.childCustodyVisitation.fl341.fl341c.vacation,
                                            allowOutsideUnitedStates: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341c.vacation.allowOutsideUnitedStates, checked === true),
                                          },
                                        },
                                      },
                                    },
                                  }))}
                                />
                                <span className="text-xs text-slate-700 dark:text-slate-200">Allow vacation outside the United States</span>
                              </label>
                              <Textarea
                                className="min-h-[72px]"
                                placeholder="Other vacation terms"
                                value={workspace.fl100.childCustodyVisitation.fl341.fl341c.vacation.otherTerms.value}
                                onChange={(e) => updateFl100((fl100) => ({
                                  ...fl100,
                                  childCustodyVisitation: {
                                    ...fl100.childCustodyVisitation,
                                    fl341: {
                                      ...fl100.childCustodyVisitation.fl341,
                                      fl341c: {
                                        ...fl100.childCustodyVisitation.fl341.fl341c,
                                        vacation: {
                                          ...fl100.childCustodyVisitation.fl341.fl341c.vacation,
                                          otherTerms: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341c.vacation.otherTerms, e.target.value),
                                        },
                                      },
                                    },
                                  },
                                }))}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      {workspace.fl100.childCustodyVisitation.attachments.formFl341d.value && (
                        <div className="mt-4 rounded-lg border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">FL-341(D) additional physical-custody provisions</p>
                          <div className="mt-3 space-y-3">
                            {[
                              { key: 'exchangeSchedule' as const, label: 'Exchange schedule / locations / times' },
                              { key: 'transportation' as const, label: 'Transportation responsibilities' },
                              { key: 'makeupTime' as const, label: 'Make-up parenting time' },
                              { key: 'communication' as const, label: 'Parent-child communication terms' },
                              { key: 'rightOfFirstRefusal' as const, label: 'Right of first refusal' },
                              { key: 'temporaryChangesByAgreement' as const, label: 'Temporary schedule changes by written agreement' },
                              { key: 'other' as const, label: 'Other physical-custody provision' },
                            ].map((entry) => {
                              const provision = workspace.fl100.childCustodyVisitation.fl341.fl341d.provisions[entry.key];
                              return (
                                <div key={entry.key} className="rounded-md border border-slate-200/80 p-3 dark:border-white/10">
                                  <label className="flex items-center gap-2">
                                    <Checkbox
                                      checked={provision.selected.value}
                                      onCheckedChange={(checked) => updateFl100((fl100) => ({
                                        ...fl100,
                                        childCustodyVisitation: {
                                          ...fl100.childCustodyVisitation,
                                          fl341: {
                                            ...fl100.childCustodyVisitation.fl341,
                                            fl341d: {
                                              ...fl100.childCustodyVisitation.fl341.fl341d,
                                              provisions: {
                                                ...fl100.childCustodyVisitation.fl341.fl341d.provisions,
                                                [entry.key]: {
                                                  ...fl100.childCustodyVisitation.fl341.fl341d.provisions[entry.key],
                                                  selected: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341d.provisions[entry.key].selected, checked === true),
                                                },
                                              },
                                            },
                                          },
                                        },
                                      }))}
                                    />
                                    <span className="text-sm text-slate-800 dark:text-slate-100">{entry.label}</span>
                                  </label>
                                  {provision.selected.value && (
                                    <Textarea
                                      className="mt-2 min-h-[72px]"
                                      placeholder="Required details"
                                      value={provision.details.value}
                                      onChange={(e) => updateFl100((fl100) => ({
                                        ...fl100,
                                        childCustodyVisitation: {
                                          ...fl100.childCustodyVisitation,
                                          fl341: {
                                            ...fl100.childCustodyVisitation.fl341,
                                            fl341d: {
                                              ...fl100.childCustodyVisitation.fl341.fl341d,
                                              provisions: {
                                                ...fl100.childCustodyVisitation.fl341.fl341d.provisions,
                                                [entry.key]: {
                                                  ...fl100.childCustodyVisitation.fl341.fl341d.provisions[entry.key],
                                                  details: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341d.provisions[entry.key].details, e.target.value),
                                                },
                                              },
                                            },
                                          },
                                        },
                                      }))}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {workspace.fl100.childCustodyVisitation.attachments.formFl341e.value && (
                        <div className="mt-4 rounded-lg border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">FL-341(E) joint legal-custody terms</p>
                          <label className="mt-2 flex items-center gap-2">
                            <Checkbox
                              checked={workspace.fl100.childCustodyVisitation.fl341.fl341e.orderJointLegalCustody.value}
                              onCheckedChange={(checked) => updateFl100((fl100) => ({
                                ...fl100,
                                childCustodyVisitation: {
                                  ...fl100.childCustodyVisitation,
                                  fl341: {
                                    ...fl100.childCustodyVisitation.fl341,
                                    fl341e: {
                                      ...fl100.childCustodyVisitation.fl341.fl341e,
                                      orderJointLegalCustody: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341e.orderJointLegalCustody, checked === true),
                                    },
                                  },
                                },
                              }))}
                            />
                            <span className="text-sm text-slate-800 dark:text-slate-100">Order joint legal custody</span>
                          </label>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            {[
                              { key: 'education' as const, label: 'Education decisions' },
                              { key: 'nonEmergencyHealthcare' as const, label: 'Non-emergency healthcare decisions' },
                              { key: 'mentalHealth' as const, label: 'Mental-health counseling decisions' },
                              { key: 'extracurricular' as const, label: 'Extracurricular decisions' },
                            ].map((entry) => (
                              <div key={entry.key}>
                                <FieldHeader label={entry.label} field={workspace.fl100.childCustodyVisitation.fl341.fl341e.decisionMaking[entry.key]} />
                                <select
                                  value={workspace.fl100.childCustodyVisitation.fl341.fl341e.decisionMaking[entry.key].value}
                                  onChange={(e) => updateFl100((fl100) => ({
                                    ...fl100,
                                    childCustodyVisitation: {
                                      ...fl100.childCustodyVisitation,
                                      fl341: {
                                        ...fl100.childCustodyVisitation.fl341,
                                        fl341e: {
                                          ...fl100.childCustodyVisitation.fl341.fl341e,
                                          decisionMaking: {
                                            ...fl100.childCustodyVisitation.fl341.fl341e.decisionMaking,
                                            [entry.key]: setDraftFieldValue(
                                              fl100.childCustodyVisitation.fl341.fl341e.decisionMaking[entry.key],
                                              e.target.value as 'unspecified' | 'joint' | 'petitioner' | 'respondent' | 'other_parent_party',
                                            ),
                                          },
                                        },
                                      },
                                    },
                                  }))}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                >
                                  <option value="unspecified">Not selected</option>
                                  <option value="joint">Joint</option>
                                  <option value="petitioner">Petitioner</option>
                                  <option value="respondent">Respondent</option>
                                  <option value="other_parent_party">Other parent/party</option>
                                </select>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 grid gap-2 md:grid-cols-2">
                            {[
                              { key: 'recordsAccess' as const, label: 'Records access for both parents/parties' },
                              { key: 'emergencyNotice' as const, label: 'Emergency notice requirement' },
                              { key: 'portalAccess' as const, label: 'Share school/medical portal access' },
                              { key: 'contactUpdates' as const, label: 'Prompt contact-information updates' },
                            ].map((entry) => (
                              <label key={entry.key} className="flex items-center gap-2 rounded border border-slate-200/80 p-2 dark:border-white/10">
                                <Checkbox
                                  checked={workspace.fl100.childCustodyVisitation.fl341.fl341e.terms[entry.key].value}
                                  onCheckedChange={(checked) => updateFl100((fl100) => ({
                                    ...fl100,
                                    childCustodyVisitation: {
                                      ...fl100.childCustodyVisitation,
                                      fl341: {
                                        ...fl100.childCustodyVisitation.fl341,
                                        fl341e: {
                                          ...fl100.childCustodyVisitation.fl341.fl341e,
                                          terms: {
                                            ...fl100.childCustodyVisitation.fl341.fl341e.terms,
                                            [entry.key]: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341e.terms[entry.key], checked === true),
                                          },
                                        },
                                      },
                                    },
                                  }))}
                                />
                                <span className="text-xs text-slate-700 dark:text-slate-200">{entry.label}</span>
                              </label>
                            ))}
                          </div>
                          <div className="mt-3 grid gap-2 md:grid-cols-2">
                            {[
                              { key: 'meetAndConfer' as const, label: 'Meet and confer' },
                              { key: 'mediation' as const, label: 'Mediation before court' },
                              { key: 'court' as const, label: 'Court motion' },
                              { key: 'other' as const, label: 'Other dispute path' },
                            ].map((entry) => (
                              <label key={entry.key} className="flex items-center gap-2 rounded border border-slate-200/80 p-2 dark:border-white/10">
                                <Checkbox
                                  checked={workspace.fl100.childCustodyVisitation.fl341.fl341e.disputeResolution[entry.key].value}
                                  onCheckedChange={(checked) => updateFl100((fl100) => ({
                                    ...fl100,
                                    childCustodyVisitation: {
                                      ...fl100.childCustodyVisitation,
                                      fl341: {
                                        ...fl100.childCustodyVisitation.fl341,
                                        fl341e: {
                                          ...fl100.childCustodyVisitation.fl341.fl341e,
                                          disputeResolution: {
                                            ...fl100.childCustodyVisitation.fl341.fl341e.disputeResolution,
                                            [entry.key]: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341e.disputeResolution[entry.key], checked === true),
                                          },
                                        },
                                      },
                                    },
                                  }))}
                                />
                                <span className="text-xs text-slate-700 dark:text-slate-200">{entry.label}</span>
                              </label>
                            ))}
                            {workspace.fl100.childCustodyVisitation.fl341.fl341e.disputeResolution.other.value && (
                              <Input
                                className="md:col-span-2"
                                placeholder="Other dispute path details"
                                value={workspace.fl100.childCustodyVisitation.fl341.fl341e.disputeResolution.otherText.value}
                                onChange={(e) => updateFl100((fl100) => ({
                                  ...fl100,
                                  childCustodyVisitation: {
                                    ...fl100.childCustodyVisitation,
                                    fl341: {
                                      ...fl100.childCustodyVisitation.fl341,
                                      fl341e: {
                                        ...fl100.childCustodyVisitation.fl341.fl341e,
                                        disputeResolution: {
                                          ...fl100.childCustodyVisitation.fl341.fl341e.disputeResolution,
                                          otherText: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341e.disputeResolution.otherText, e.target.value),
                                        },
                                      },
                                    },
                                  },
                                }))}
                              />
                            )}
                          </div>
                          <Textarea
                            className="mt-3 min-h-[72px]"
                            placeholder="Additional FL-341(E) terms"
                            value={workspace.fl100.childCustodyVisitation.fl341.fl341e.additionalTerms.value}
                            onChange={(e) => updateFl100((fl100) => ({
                              ...fl100,
                              childCustodyVisitation: {
                                ...fl100.childCustodyVisitation,
                                fl341: {
                                  ...fl100.childCustodyVisitation.fl341,
                                  fl341e: {
                                    ...fl100.childCustodyVisitation.fl341.fl341e,
                                    additionalTerms: setDraftFieldValue(fl100.childCustodyVisitation.fl341.fl341e.additionalTerms, e.target.value),
                                  },
                                },
                              },
                            }))}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Spousal support request detail</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Replace fixed FL-100 support assumptions with explicit direction and reserve-jurisdiction choices.</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <FieldHeader label="Support order direction" field={workspace.fl100.spousalSupport.supportOrderDirection} />
                      <select
                        value={workspace.fl100.spousalSupport.supportOrderDirection.value}
                        onChange={(e) => updateFl100((fl100) => ({
                          ...fl100,
                          spousalSupport: {
                            ...fl100.spousalSupport,
                            supportOrderDirection: setDraftFieldValue(fl100.spousalSupport.supportOrderDirection, e.target.value as 'none' | 'petitioner_to_respondent' | 'respondent_to_petitioner'),
                          },
                        }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="none">No immediate support order requested</option>
                        <option value="petitioner_to_respondent">Petitioner pays support to respondent</option>
                        <option value="respondent_to_petitioner">Respondent pays support to petitioner</option>
                      </select>
                    </div>
                    <div>
                      <FieldHeader label="Reserve jurisdiction for support" field={workspace.fl100.spousalSupport.reserveJurisdictionFor} />
                      <select
                        value={workspace.fl100.spousalSupport.reserveJurisdictionFor.value}
                        onChange={(e) => updateFl100((fl100) => ({
                          ...fl100,
                          spousalSupport: {
                            ...fl100.spousalSupport,
                            reserveJurisdictionFor: setDraftFieldValue(fl100.spousalSupport.reserveJurisdictionFor, e.target.value as 'none' | 'petitioner' | 'respondent' | 'both'),
                          },
                        }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="none">Do not reserve jurisdiction</option>
                        <option value="petitioner">Reserve for petitioner</option>
                        <option value="respondent">Reserve for respondent</option>
                        <option value="both">Reserve for both</option>
                      </select>
                    </div>
                    <div>
                      <FieldHeader label="Terminate jurisdiction for support" field={workspace.fl100.spousalSupport.terminateJurisdictionFor} />
                      <select
                        value={workspace.fl100.spousalSupport.terminateJurisdictionFor.value}
                        onChange={(e) => updateFl100((fl100) => ({
                          ...fl100,
                          spousalSupport: {
                            ...fl100.spousalSupport,
                            terminateJurisdictionFor: setDraftFieldValue(fl100.spousalSupport.terminateJurisdictionFor, e.target.value as 'none' | 'petitioner' | 'respondent' | 'both'),
                          },
                        }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="none">Do not terminate jurisdiction</option>
                        <option value="petitioner">Terminate for petitioner</option>
                        <option value="respondent">Terminate for respondent</option>
                        <option value="both">Terminate for both</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <FieldHeader label="Spousal support details" field={workspace.fl100.spousalSupport.details} />
                      <Textarea
                        value={workspace.fl100.spousalSupport.details.value}
                        onChange={(e) => updateFl100((fl100) => ({
                          ...fl100,
                          spousalSupport: {
                            ...fl100.spousalSupport,
                            details: setDraftFieldValue(fl100.spousalSupport.details, e.target.value),
                          },
                        }))}
                        className="min-h-[96px]"
                        placeholder="Optional note for support request context."
                      />
                    </div>
                    <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                      <Checkbox
                        checked={workspace.fl100.spousalSupport.voluntaryDeclarationOfParentageSigned.value}
                        onCheckedChange={(checked) => updateFl100((fl100) => ({
                          ...fl100,
                          spousalSupport: {
                            ...fl100.spousalSupport,
                            voluntaryDeclarationOfParentageSigned: setDraftFieldValue(fl100.spousalSupport.voluntaryDeclarationOfParentageSigned, checked === true),
                          },
                        }))}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Parties signed voluntary declaration of parentage</span>
                          <FieldSourceBadge field={workspace.fl100.spousalSupport.voluntaryDeclarationOfParentageSigned} />
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Now explicitly editable instead of being auto-checked in generated FL-100.</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Child support, fees, and other relief details</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Map remaining FL-100 relief fields that were previously left blank or inferred.</p>
                  <div className="mt-4 space-y-4">
                    <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                      <Checkbox
                        checked={workspace.fl100.childSupport.requestAdditionalOrders.value}
                        onCheckedChange={(checked) => updateFl100((fl100) => ({
                          ...fl100,
                          childSupport: {
                            ...fl100.childSupport,
                            requestAdditionalOrders: setDraftFieldValue(fl100.childSupport.requestAdditionalOrders, checked === true),
                          },
                        }))}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Add child-support orders beyond standard guidelines</span>
                          <FieldSourceBadge field={workspace.fl100.childSupport.requestAdditionalOrders} />
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Fills FL-100 item 6c “Other child support” checkbox and text block.</p>
                      </div>
                    </label>
                    <div>
                      <FieldHeader label="Additional child support order details" field={workspace.fl100.childSupport.additionalOrdersDetails} />
                      <Textarea
                        value={workspace.fl100.childSupport.additionalOrdersDetails.value}
                        onChange={(e) => updateFl100((fl100) => ({
                          ...fl100,
                          childSupport: {
                            ...fl100.childSupport,
                            additionalOrdersDetails: setDraftFieldValue(fl100.childSupport.additionalOrdersDetails, e.target.value),
                          },
                        }))}
                        className="min-h-[96px]"
                        placeholder="Example: guideline support plus uninsured health, childcare, and extracurricular split."
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                        <Checkbox
                          checked={workspace.fl100.attorneyFeesAndCosts.requestAward.value}
                          onCheckedChange={(checked) => updateFl100((fl100) => ({
                            ...fl100,
                            attorneyFeesAndCosts: {
                              ...fl100.attorneyFeesAndCosts,
                              requestAward: setDraftFieldValue(fl100.attorneyFeesAndCosts.requestAward, checked === true),
                            },
                          }))}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Request attorney fees and costs</span>
                            <FieldSourceBadge field={workspace.fl100.attorneyFeesAndCosts.requestAward} />
                          </div>
                        </div>
                      </label>
                      <div>
                        <FieldHeader label="Fees/costs payable by" field={workspace.fl100.attorneyFeesAndCosts.payableBy} />
                        <select
                          value={workspace.fl100.attorneyFeesAndCosts.payableBy.value}
                          onChange={(e) => updateFl100((fl100) => ({
                            ...fl100,
                            attorneyFeesAndCosts: {
                              ...fl100.attorneyFeesAndCosts,
                              payableBy: setDraftFieldValue(fl100.attorneyFeesAndCosts.payableBy, e.target.value as 'none' | 'petitioner' | 'respondent' | 'both'),
                            },
                          }))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        >
                          <option value="none">Not specified</option>
                          <option value="petitioner">Petitioner</option>
                          <option value="respondent">Respondent</option>
                          <option value="both">Both parties</option>
                        </select>
                      </div>
                    </div>
                    <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                      <Checkbox
                        checked={workspace.fl100.otherRequests.requestOtherRelief.value}
                        onCheckedChange={(checked) => updateFl100((fl100) => ({
                          ...fl100,
                          otherRequests: {
                            ...fl100.otherRequests,
                            requestOtherRelief: setDraftFieldValue(fl100.otherRequests.requestOtherRelief, checked === true),
                          },
                        }))}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Request other relief</span>
                          <FieldSourceBadge field={workspace.fl100.otherRequests.requestOtherRelief} />
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Fills FL-100 item 11c with custom text.</p>
                      </div>
                    </label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <FieldHeader label="Other relief details" field={workspace.fl100.otherRequests.details} />
                        <Textarea
                          value={workspace.fl100.otherRequests.details.value}
                          onChange={(e) => updateFl100((fl100) => ({
                            ...fl100,
                            otherRequests: {
                              ...fl100.otherRequests,
                              details: setDraftFieldValue(fl100.otherRequests.details, e.target.value),
                            },
                          }))}
                          className="min-h-[96px]"
                          placeholder="Any additional request language for the petition."
                        />
                        {workspace.fl100.otherRequests.continuedOnAttachment.value && (
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Starter-packet generation will put these details on a labeled FL-100 attachment 11c page and reference that attachment from item 11c.</p>
                        )}
                      </div>
                      <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                        <Checkbox
                          checked={workspace.fl100.otherRequests.continuedOnAttachment.value}
                          onCheckedChange={(checked) => updateFl100((fl100) => ({
                            ...fl100,
                            otherRequests: {
                              ...fl100.otherRequests,
                              continuedOnAttachment: setDraftFieldValue(fl100.otherRequests.continuedOnAttachment, checked === true),
                            },
                          }))}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Continue this request on attachment</span>
                            <FieldSourceBadge field={workspace.fl100.otherRequests.continuedOnAttachment} />
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-slate-950 dark:text-white">Children + requests</CardTitle>
                <CardDescription>Conditional packet logic starts here. FL-105/GC-120 turns on only when it should.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <Checkbox
                    checked={workspace.hasMinorChildren.value}
                    onCheckedChange={(checked) => {
                      const nextValue = checked === true;
                      commitWorkspace((current) => ({
                        ...current,
                        hasMinorChildren: setDraftFieldValue(current.hasMinorChildren, nextValue),
                        children: nextValue ? current.children : [],
                        fl100: nextValue
                          ? current.fl100
                          : {
                            ...current.fl100,
                            minorChildren: {
                              ...current.fl100.minorChildren,
                              hasUnbornChild: setDraftFieldValue(current.fl100.minorChildren.hasUnbornChild, false),
                              detailsOnAttachment4b: setDraftFieldValue(current.fl100.minorChildren.detailsOnAttachment4b, false),
                            },
                          },
                      }));
                    }}
                  />
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100">There are minor children of the relationship</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">If checked, this workspace adds FL-105/GC-120 and child details.</p>
                  </div>
                </div>

                {workspace.hasMinorChildren.value && (
                  <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-100">Children</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Collect exact names and birth dates before packet generation.</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => commitWorkspace((current) => ({ ...current, children: [...current.children, createBlankChild()] }))}
                      >
                        Add child
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                        <Checkbox
                          checked={workspace.fl100.minorChildren.hasUnbornChild.value}
                          onCheckedChange={(checked) => updateFl100((fl100) => ({
                            ...fl100,
                            minorChildren: {
                              ...fl100.minorChildren,
                              hasUnbornChild: setDraftFieldValue(fl100.minorChildren.hasUnbornChild, checked === true),
                            },
                          }))}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Include unborn child in FL-100 item 4</span>
                            <FieldSourceBadge field={workspace.fl100.minorChildren.hasUnbornChild} />
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Maps to FL-100 `UnbornChild_cb[0]`.</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                        <Checkbox
                          checked={workspace.fl100.minorChildren.detailsOnAttachment4b.value}
                          onCheckedChange={(checked) => updateFl100((fl100) => ({
                            ...fl100,
                            minorChildren: {
                              ...fl100.minorChildren,
                              detailsOnAttachment4b: setDraftFieldValue(fl100.minorChildren.detailsOnAttachment4b, checked === true),
                            },
                          }))}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Child list continues on attachment 4b</span>
                            <FieldSourceBadge field={workspace.fl100.minorChildren.detailsOnAttachment4b} />
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Use when additional child detail is supplied outside visible FL-100 rows.</p>
                        </div>
                      </label>
                    </div>
                    {workspace.children.length === 0 ? (
                      <p className="text-sm text-amber-700 dark:text-amber-200">No child entries yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {workspace.children.map((child, index) => (
                          <div key={child.id} className="grid gap-4 md:grid-cols-[1.2fr_0.7fr_1fr_auto] md:items-end">
                            <div>
                              <FieldHeader label={`Child ${index + 1} full name`} field={child.fullName} />
                              <Input
                                value={child.fullName.value}
                                onChange={(e) => commitWorkspace((current) => ({
                                  ...current,
                                  children: current.children.map((entry) => entry.id === child.id
                                    ? { ...entry, fullName: setDraftFieldValue(entry.fullName, e.target.value) }
                                    : entry),
                                }))}
                                placeholder="Child full legal name"
                              />
                            </div>
                            <div>
                              <FieldHeader label="Birth date" field={child.birthDate} />
                              <Input
                                type="date"
                                value={child.birthDate.value}
                                onChange={(e) => commitWorkspace((current) => ({
                                  ...current,
                                  children: current.children.map((entry) => entry.id === child.id
                                    ? { ...entry, birthDate: setDraftFieldValue(entry.birthDate, e.target.value) }
                                    : entry),
                                }))}
                              />
                            </div>
                            <div>
                              <FieldHeader label="Place of birth" field={child.placeOfBirth} />
                              <Input
                                value={child.placeOfBirth.value}
                                onChange={(e) => commitWorkspace((current) => ({
                                  ...current,
                                  children: current.children.map((entry) => entry.id === child.id
                                    ? { ...entry, placeOfBirth: setDraftFieldValue(entry.placeOfBirth, e.target.value) }
                                    : entry),
                                }))}
                                placeholder="City, State"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => commitWorkspace((current) => ({
                                ...current,
                                children: current.children.filter((entry) => entry.id !== child.id),
                              }))}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          FL-100 page 1 and FL-105 page 1 each have {FL105_FORM_CAPACITY.childrenRows} visible child rows in this packet.
                        </p>
                        {hasOverflowMinorChildren && (
                          <div className="space-y-1 text-xs text-amber-700 dark:text-amber-200">
                            <p>
                              {overflowMinorChildrenCount} child(ren) exceed the visible FL-100 / FL-105 rows in this packet.
                            </p>
                            <p>
                              {workspace.fl100.minorChildren.detailsOnAttachment4b.value
                                ? `Starter-packet generation will add FL-100 attachment 4b and ${generatedChildAttachmentPageCount} generated FL-105 attachment page${generatedChildAttachmentPageCount === 1 ? '' : 's'} for the extra children.`
                                : 'Select “Child list continues on attachment 4b” so Draft Forms can generate the required FL-100 continuation page. FL-105 continuation pages will be added automatically once item 4b is enabled.'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {workspace.hasMinorChildren.value && (
                  <div className="space-y-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">FL-105 / GC-120 details</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Fill this top-to-bottom like the court form: first listed child on FL-105, then extra children on FL-105(A) only when they need their own five-year history.</p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-white/10 dark:bg-white/5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Step 1</p>
                        <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">First listed child</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          The residence-history table below fills item 3a for the first listed child (item 2a). Currently entered: {fl105ResidenceHistoryRowCount} row{fl105ResidenceHistoryRowCount === 1 ? '' : 's'}.
                        </p>
                      </div>
                      <div className={cn(
                        'rounded-xl border p-3',
                        fl105AdditionalChildrenRequired
                          ? 'border-amber-200/80 bg-amber-50/80 dark:border-amber-400/20 dark:bg-amber-400/10'
                          : 'border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-400/10',
                      )}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Step 2</p>
                        <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">Additional children</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {workspace.children.length <= 1
                            ? 'Add another child above if this case needs FL-105(A) pages.'
                            : fl105AdditionalChildrenRequired
                              ? `${fl105AdditionalChildSectionCount} child section(s) will generate across ${fl105AdditionalChildAttachmentPageCount} official FL-105(A) page(s).`
                              : 'No FL-105(A) pages are needed while all listed children shared the same five-year history.'}
                        </p>
                      </div>
                      <div className={cn(
                        'rounded-xl border p-3',
                        hasAutoGeneratedFl105Attachments
                          ? 'border-blue-200/80 bg-blue-50/80 dark:border-blue-400/20 dark:bg-blue-400/10'
                          : 'border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/5',
                      )}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Step 3</p>
                        <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">Attached pages total</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {hasAutoGeneratedFl105Attachments
                            ? 'Auto-generated FL-105 pages are active and will be counted for item 7 automatically.'
                            : 'Only manual extra FL-105 pages count here unless more data triggers generated attachments.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <FieldHeader label="FL-105 item 1 filing role" field={workspace.fl105.representationRole} />
                        <select
                          value={workspace.fl105.representationRole.value}
                          onChange={(e) => updateFl105((fl105) => ({
                            ...fl105,
                            representationRole: setDraftFieldValue(
                              fl105.representationRole,
                              e.target.value as 'party' | 'authorized_representative',
                            ),
                            authorizedRepresentativeAgencyName: e.target.value === 'authorized_representative'
                              ? fl105.authorizedRepresentativeAgencyName
                              : setDraftFieldValue(fl105.authorizedRepresentativeAgencyName, ''),
                          }))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        >
                          <option value="party">I am the party in this case</option>
                          <option value="authorized_representative">I am the authorized representative of a party</option>
                        </select>
                      </div>
                      <div>
                        <FieldHeader
                          label="Authorized representative agency name (FL-105 item 1)"
                          field={workspace.fl105.authorizedRepresentativeAgencyName}
                        />
                        <Input
                          value={workspace.fl105.authorizedRepresentativeAgencyName.value}
                          onChange={(e) => updateFl105((fl105) => ({
                            ...fl105,
                            authorizedRepresentativeAgencyName: setDraftFieldValue(
                              fl105.authorizedRepresentativeAgencyName,
                              e.target.value,
                            ),
                          }))}
                          placeholder="Agency, department, or entity name"
                          disabled={workspace.fl105.representationRole.value !== 'authorized_representative'}
                        />
                      </div>
                      <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                        <Checkbox
                          checked={workspace.fl105.childrenLivedTogetherPastFiveYears.value}
                          onCheckedChange={(checked) => updateFl105((fl105) => ({
                            ...fl105,
                            childrenLivedTogetherPastFiveYears: setDraftFieldValue(fl105.childrenLivedTogetherPastFiveYears, checked === true),
                            childrenResidenceAssertionReviewed: setDraftFieldValue(fl105.childrenResidenceAssertionReviewed, false),
                            additionalChildrenAttachments: fl105.additionalChildrenAttachments.map((attachment) => ({
                              ...attachment,
                              sameResidenceReviewed: setDraftFieldValue(attachment.sameResidenceReviewed, false),
                            })),
                          }))}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-slate-800 dark:text-slate-100">Children lived together for the last five years</span>
                            <FieldSourceBadge field={workspace.fl105.childrenLivedTogetherPastFiveYears} />
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Leave this checked when every listed child shares the same five-year history. Uncheck it only if one or more additional children need their own FL-105(A)/GC-120(A) history.</p>
                        </div>
                      </label>
                      <div>
                        <FieldHeader label="Declarant name (FL-105 signature line)" field={workspace.fl105.declarantName} />
                        <Input
                          value={workspace.fl105.declarantName.value}
                          onChange={(e) => updateFl105((fl105) => ({
                            ...fl105,
                            declarantName: setDraftFieldValue(fl105.declarantName, e.target.value),
                          }))}
                          placeholder="Usually petitioner name"
                        />
                      </div>
                      <div>
                        <FieldHeader label="Declarant signature date (FL-105)" field={workspace.fl105.signatureDate} />
                        <Input
                          type="date"
                          value={workspace.fl105.signatureDate.value}
                          onChange={(e) => updateFl105((fl105) => ({
                            ...fl105,
                            signatureDate: setDraftFieldValue(fl105.signatureDate, e.target.value),
                          }))}
                        />
                      </div>
                      <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                        <Checkbox
                          checked={workspace.fl105.attachmentsIncluded.value}
                          onCheckedChange={(checked) => updateFl105((fl105) => ({
                            ...fl105,
                            attachmentsIncluded: setDraftFieldValue(fl105.attachmentsIncluded, checked === true),
                            attachmentPageCount: checked === true
                              ? fl105.attachmentPageCount
                              : setDraftFieldValue(fl105.attachmentPageCount, ''),
                          }))}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-slate-800 dark:text-slate-100">FL-105 has attached pages</span>
                            <FieldSourceBadge field={workspace.fl105.attachmentsIncluded} />
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">This is item 7 on page 2. Turn it on when you have any manual extra pages; Draft Forms also adds generated FL-105 pages to the total for you.</p>
                        </div>
                      </label>
                      <div>
                        <FieldHeader label="Manual extra FL-105 attachment pages" field={workspace.fl105.attachmentPageCount} />
                        <Input
                          inputMode="numeric"
                          value={workspace.fl105.attachmentPageCount.value}
                          onChange={(e) => updateFl105((fl105) => ({
                            ...fl105,
                            attachmentPageCount: setDraftFieldValue(
                              fl105.attachmentPageCount,
                              e.target.value.replace(/[^\d]/g, ''),
                            ),
                          }))}
                          placeholder="e.g., 2"
                          disabled={!workspace.fl105.attachmentsIncluded.value}
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Only enter pages you created outside this flow. Generated child-overflow pages, FL-105(A) pages, attachment 3a pages, and overflow pages for items 4/5/6 are added to the final item 7 total automatically.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-amber-200/80 bg-amber-50/80 p-3 dark:border-amber-400/20 dark:bg-amber-400/10">
                      <div>
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Legal assertions reviewed</p>
                        <p className="text-xs text-amber-800/90 dark:text-amber-100/80">These checkboxes do not fill court fields. They block generation until someone confirms the sensitive yes/no statements Draft Forms will put on FL-105.</p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex items-start gap-3 rounded-lg border border-amber-200/80 bg-white/80 p-3 dark:border-amber-400/20 dark:bg-black/10">
                          <Checkbox
                            checked={workspace.fl105.childrenResidenceAssertionReviewed.value}
                            onCheckedChange={(checked) => updateFl105((fl105) => ({
                              ...fl105,
                              childrenResidenceAssertionReviewed: setDraftFieldValue(fl105.childrenResidenceAssertionReviewed, checked === true),
                            }))}
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Reviewed item 3 residence-history assertion</span>
                              <FieldSourceBadge field={workspace.fl105.childrenResidenceAssertionReviewed} />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Confirms the selected “children lived together” answer and the residence-history path are correct.
                            </p>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 rounded-lg border border-amber-200/80 bg-white/80 p-3 dark:border-amber-400/20 dark:bg-black/10">
                          <Checkbox
                            checked={workspace.fl105.otherProceedingsAssertionReviewed.value}
                            onCheckedChange={(checked) => updateFl105((fl105) => ({
                              ...fl105,
                              otherProceedingsAssertionReviewed: setDraftFieldValue(fl105.otherProceedingsAssertionReviewed, checked === true),
                            }))}
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Reviewed item 4 other-proceedings assertion</span>
                              <FieldSourceBadge field={workspace.fl105.otherProceedingsAssertionReviewed} />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Confirms the yes/no answer about other custody, parentage, guardianship, adoption, or juvenile cases.
                            </p>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 rounded-lg border border-amber-200/80 bg-white/80 p-3 dark:border-amber-400/20 dark:bg-black/10">
                          <Checkbox
                            checked={workspace.fl105.domesticViolenceOrdersAssertionReviewed.value}
                            onCheckedChange={(checked) => updateFl105((fl105) => ({
                              ...fl105,
                              domesticViolenceOrdersAssertionReviewed: setDraftFieldValue(fl105.domesticViolenceOrdersAssertionReviewed, checked === true),
                            }))}
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Reviewed item 5 protective-order assertion</span>
                              <FieldSourceBadge field={workspace.fl105.domesticViolenceOrdersAssertionReviewed} />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Confirms whether protective or restraining orders exist and whether the listed rows are complete.
                            </p>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 rounded-lg border border-amber-200/80 bg-white/80 p-3 dark:border-amber-400/20 dark:bg-black/10">
                          <Checkbox
                            checked={workspace.fl105.otherClaimantsAssertionReviewed.value}
                            onCheckedChange={(checked) => updateFl105((fl105) => ({
                              ...fl105,
                              otherClaimantsAssertionReviewed: setDraftFieldValue(fl105.otherClaimantsAssertionReviewed, checked === true),
                            }))}
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Reviewed item 6 other-claimants assertion</span>
                              <FieldSourceBadge field={workspace.fl105.otherClaimantsAssertionReviewed} />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Confirms whether anyone else claims custody or visitation rights for the children.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Five-year residence history</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Use this for the first listed child on FL-105 item 2a. Base form capacity: {FL105_FORM_CAPACITY.residenceHistoryRows} rows; extra rows generate attachment 3a pages automatically.</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => updateFl105((fl105) => ({
                            ...fl105,
                            residenceHistory: [...fl105.residenceHistory, createBlankFl105ResidenceHistoryEntry()],
                          }))}
                        >
                          Add history row
                        </Button>
                      </div>
                      {fl105ResidenceHistoryOverflowCount > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {fl105ResidenceHistoryOverflowCount} additional residence-history row(s) will be generated as FL-105 attachment 3a pages.
                        </p>
                      )}
                      <div className="grid gap-3 md:grid-cols-3">
                        <label className="flex items-start gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
                          <Checkbox
                            checked={workspace.fl105.additionalResidenceAddressesOnAttachment3a.value}
                            onCheckedChange={(checked) => updateFl105((fl105) => ({
                              ...fl105,
                              additionalResidenceAddressesOnAttachment3a: setDraftFieldValue(
                                fl105.additionalResidenceAddressesOnAttachment3a,
                                checked === true,
                              ),
                            }))}
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Additional addresses on attachment 3a</span>
                              <FieldSourceBadge field={workspace.fl105.additionalResidenceAddressesOnAttachment3a} />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Turn this on when the first listed child needs more address/history space. Overflow rows auto-trigger attachment 3a even if you forget to check it.</p>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
                          <Checkbox
                            checked={workspace.fl105.residenceAddressConfidentialStateOnly.value}
                            onCheckedChange={(checked) => updateFl105((fl105) => ({
                              ...fl105,
                              residenceAddressConfidentialStateOnly: setDraftFieldValue(
                                fl105.residenceAddressConfidentialStateOnly,
                                checked === true,
                              ),
                            }))}
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Residence confidential (state only)</span>
                              <FieldSourceBadge field={workspace.fl105.residenceAddressConfidentialStateOnly} />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Show only the state for the child&apos;s residence on this part of the form.</p>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
                          <Checkbox
                            checked={workspace.fl105.personAddressConfidentialStateOnly.value}
                            onCheckedChange={(checked) => updateFl105((fl105) => ({
                              ...fl105,
                              personAddressConfidentialStateOnly: setDraftFieldValue(
                                fl105.personAddressConfidentialStateOnly,
                                checked === true,
                              ),
                            }))}
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Person/address confidential (state only)</span>
                              <FieldSourceBadge field={workspace.fl105.personAddressConfidentialStateOnly} />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Show only the state for the person/address the child lived with.</p>
                          </div>
                        </label>
                      </div>
                      {(workspace.fl105.residenceAddressConfidentialStateOnly.value || workspace.fl105.personAddressConfidentialStateOnly.value) && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          When confidentiality is checked, keep address entries state-only (for example: <code>CA</code> or <code>California</code>) rather than full street details.
                        </p>
                      )}
                      <div className="space-y-3">
                        {workspace.fl105.residenceHistory.map((entry, index) => (
                          <div key={entry.id} className="space-y-3 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Residence row {index + 1}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">From newest to oldest when possible.</p>
                              </div>
                            </div>
                            <div className="grid gap-3 md:grid-cols-6">
                            <Input
                              type="date"
                              value={entry.fromDate.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                residenceHistory: fl105.residenceHistory.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, fromDate: setDraftFieldValue(candidate.fromDate, e.target.value) }
                                  : candidate),
                              }))}
                              placeholder="From"
                            />
                            <Input
                              type="date"
                              value={entry.toDate.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                residenceHistory: fl105.residenceHistory.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, toDate: setDraftFieldValue(candidate.toDate, e.target.value) }
                                  : candidate),
                              }))}
                              placeholder="To"
                            />
                            <Input
                              value={entry.residence.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                residenceHistory: fl105.residenceHistory.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, residence: setDraftFieldValue(candidate.residence, e.target.value) }
                                  : candidate),
                              }))}
                              className="md:col-span-2"
                              placeholder="Child's residence (city/state or address)"
                            />
                            <Input
                              value={entry.personAndAddress.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                residenceHistory: fl105.residenceHistory.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, personAndAddress: setDraftFieldValue(candidate.personAndAddress, e.target.value) }
                                  : candidate),
                              }))}
                              placeholder="Person child lived with + address"
                            />
                            <div className="flex gap-2">
                              <Input
                                value={entry.relationship.value}
                                onChange={(e) => updateFl105((fl105) => ({
                                  ...fl105,
                                  residenceHistory: fl105.residenceHistory.map((candidate) => candidate.id === entry.id
                                    ? { ...candidate, relationship: setDraftFieldValue(candidate.relationship, e.target.value) }
                                    : candidate),
                                }))}
                                placeholder="Relationship to child"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => updateFl105((fl105) => ({
                                  ...fl105,
                                  residenceHistory: fl105.residenceHistory.filter((candidate) => candidate.id !== entry.id),
                                }))}
                              >
                                Remove
                              </Button>
                            </div>
                            </div>
                          </div>
                        ))}
                        {workspace.fl105.residenceHistory.length === 0 && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">No residence rows added yet.</p>
                        )}
                      </div>
                    </div>

                    {workspace.children.length > 1 && (
                      <div className="space-y-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">FL-105(A) / GC-120(A) additional children</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">The main history block above always belongs to the first listed child (item 2a). Use this section only when later children need different five-year history details.</p>
                          </div>
                          {fl105AdditionalChildrenRequired && (
                            <Badge variant="secondary">
                              {fl105AdditionalChildAttachmentPageCount} generated page(s)
                            </Badge>
                          )}
                        </div>

                        {!fl105AdditionalChildrenRequired ? (
                          <div className="flex items-start gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-3 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                            <div>
                              <p className="text-sm font-medium">No extra child pages needed right now</p>
                              <p className="text-xs text-emerald-800/90 dark:text-emerald-100/80">Because “Children lived together for the last five years” is still checked, the court packet will use the shared history from the first listed child and skip FL-105(A) pages.</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {fl105AdditionalChildSectionCount} child section(s) will be emitted across {fl105AdditionalChildAttachmentPageCount} official FL-105(A)/GC-120(A) page(s).
                            </p>

                            <div className="space-y-3">
                              {workspace.children.slice(1).map((child, index) => {
                                const attachment = workspace.fl105.additionalChildrenAttachments.find((candidate) => candidate.childId === child.id);
                                if (!attachment) return null;

                                const childLabel = child.fullName.value.trim() || `Child ${index + 2}`;
                                const formItemLabel = index < 25 ? `2${String.fromCharCode(98 + index)}` : `additional child ${index + 2}`;
                                const childSpecificHistoryCount = attachment.residenceHistory.filter(hasFl105ResidenceHistoryData).length;

                                return (
                                  <div key={attachment.id} className="space-y-3 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">FL-105(A) for {childLabel}</p>
                                          <Badge variant="outline">Child {formItemLabel}</Badge>
                                          {attachment.sameResidenceAsChildA.value && <Badge variant="secondary">Same as item 2a</Badge>}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">If this child has the exact same five-year history as the first listed child, check the box on the right and skip the extra rows.</p>
                                      </div>
                                      <label className="flex items-start gap-3 rounded-lg border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5 md:max-w-md">
                                        <Checkbox
                                          checked={attachment.sameResidenceAsChildA.value}
                                          onCheckedChange={(checked) => updateFl105((fl105) => ({
                                            ...fl105,
                                            additionalChildrenAttachments: fl105.additionalChildrenAttachments.map((candidate) => candidate.id === attachment.id
                                              ? {
                                                ...candidate,
                                                sameResidenceAsChildA: setDraftFieldValue(candidate.sameResidenceAsChildA, checked === true),
                                                sameResidenceReviewed: setDraftFieldValue(candidate.sameResidenceReviewed, false),
                                                residenceHistory: checked === true
                                                  ? candidate.residenceHistory
                                                  : candidate.residenceHistory.length > 0
                                                    ? candidate.residenceHistory
                                                    : [createBlankFl105ResidenceHistoryEntry()],
                                              }
                                              : candidate),
                                          }))}
                                        />
                                        <div>
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Same five-year history as the first listed child (item 2a)</span>
                                            <FieldSourceBadge field={attachment.sameResidenceAsChildA} />
                                          </div>
                                          <p className="text-xs text-slate-500 dark:text-slate-400">This checks the official same-as-item-2a box for this child.</p>
                                        </div>
                                      </label>
                                    </div>

                                    {attachment.sameResidenceAsChildA.value && (
                                      <label className="flex items-start gap-3 rounded-lg border border-amber-200/80 bg-amber-50/80 p-3 dark:border-amber-400/20 dark:bg-amber-400/10">
                                        <Checkbox
                                          checked={attachment.sameResidenceReviewed.value}
                                          onCheckedChange={(checked) => updateFl105((fl105) => ({
                                            ...fl105,
                                            additionalChildrenAttachments: fl105.additionalChildrenAttachments.map((candidate) => candidate.id === attachment.id
                                              ? {
                                                ...candidate,
                                                sameResidenceReviewed: setDraftFieldValue(candidate.sameResidenceReviewed, checked === true),
                                              }
                                              : candidate),
                                          }))}
                                        />
                                        <div>
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-medium text-amber-900 dark:text-amber-100">Reviewed same-residence assertion for {childLabel}</span>
                                            <FieldSourceBadge field={attachment.sameResidenceReviewed} />
                                          </div>
                                          <p className="text-xs text-amber-800/90 dark:text-amber-100/80">Confirms this child really has the exact same five-year residence history as the first listed child.</p>
                                        </div>
                                      </label>
                                    )}

                                    {!attachment.sameResidenceAsChildA.value && (
                                      <>
                                        <div className="grid gap-3 md:grid-cols-2">
                                          <label className="flex items-start gap-3 rounded-lg border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                                            <Checkbox
                                              checked={attachment.residenceAddressConfidentialStateOnly.value}
                                              onCheckedChange={(checked) => updateFl105((fl105) => ({
                                                ...fl105,
                                                additionalChildrenAttachments: fl105.additionalChildrenAttachments.map((candidate) => candidate.id === attachment.id
                                                  ? {
                                                    ...candidate,
                                                    residenceAddressConfidentialStateOnly: setDraftFieldValue(
                                                      candidate.residenceAddressConfidentialStateOnly,
                                                      checked === true,
                                                    ),
                                                  }
                                                  : candidate),
                                              }))}
                                            />
                                            <div>
                                              <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Residence confidential (state only)</span>
                                                <FieldSourceBadge field={attachment.residenceAddressConfidentialStateOnly} />
                                              </div>
                                              <p className="text-xs text-slate-500 dark:text-slate-400">Show only the state for this child&apos;s residence.</p>
                                            </div>
                                          </label>

                                          <label className="flex items-start gap-3 rounded-lg border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                                            <Checkbox
                                              checked={attachment.personAddressConfidentialStateOnly.value}
                                              onCheckedChange={(checked) => updateFl105((fl105) => ({
                                                ...fl105,
                                                additionalChildrenAttachments: fl105.additionalChildrenAttachments.map((candidate) => candidate.id === attachment.id
                                                  ? {
                                                    ...candidate,
                                                    personAddressConfidentialStateOnly: setDraftFieldValue(
                                                      candidate.personAddressConfidentialStateOnly,
                                                      checked === true,
                                                    ),
                                                  }
                                                  : candidate),
                                              }))}
                                            />
                                            <div>
                                              <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Person/address confidential (state only)</span>
                                                <FieldSourceBadge field={attachment.personAddressConfidentialStateOnly} />
                                              </div>
                                              <p className="text-xs text-slate-500 dark:text-slate-400">Show only the state for the person/address this child lived with.</p>
                                            </div>
                                          </label>
                                        </div>

                                        {(attachment.residenceAddressConfidentialStateOnly.value || attachment.personAddressConfidentialStateOnly.value) && (
                                          <p className="text-xs text-slate-500 dark:text-slate-400">
                                            When confidentiality is checked, keep this child&apos;s address entries state-only (for example: <code>CA</code> or <code>California</code>) instead of full street details.
                                          </p>
                                        )}

                                        <div className="flex justify-end">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="rounded-full"
                                            onClick={() => updateFl105((fl105) => ({
                                              ...fl105,
                                              additionalChildrenAttachments: fl105.additionalChildrenAttachments.map((candidate) => candidate.id === attachment.id
                                                ? {
                                                  ...candidate,
                                                  residenceHistory: [...candidate.residenceHistory, createBlankFl105ResidenceHistoryEntry()],
                                                }
                                                : candidate),
                                            }))}
                                          >
                                            Add residence row for {childLabel}
                                          </Button>
                                        </div>

                                        <div className="space-y-3">
                                          {attachment.residenceHistory.map((entry, historyIndex) => (
                                            <div key={entry.id} className="space-y-3 rounded-lg border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                                              <div>
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{childLabel} — residence row {historyIndex + 1}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">From newest to oldest when possible.</p>
                                              </div>
                                              <div className="grid gap-3 md:grid-cols-6">
                                                <Input
                                                  type="date"
                                                  value={entry.fromDate.value}
                                                  onChange={(e) => updateFl105((fl105) => ({
                                                    ...fl105,
                                                    additionalChildrenAttachments: fl105.additionalChildrenAttachments.map((candidate) => candidate.id === attachment.id
                                                      ? {
                                                        ...candidate,
                                                        residenceHistory: candidate.residenceHistory.map((historyEntry) => historyEntry.id === entry.id
                                                          ? { ...historyEntry, fromDate: setDraftFieldValue(historyEntry.fromDate, e.target.value) }
                                                          : historyEntry),
                                                      }
                                                      : candidate),
                                                  }))}
                                                  placeholder="From"
                                                />
                                                <Input
                                                  type="date"
                                                  value={entry.toDate.value}
                                                  onChange={(e) => updateFl105((fl105) => ({
                                                    ...fl105,
                                                    additionalChildrenAttachments: fl105.additionalChildrenAttachments.map((candidate) => candidate.id === attachment.id
                                                      ? {
                                                        ...candidate,
                                                        residenceHistory: candidate.residenceHistory.map((historyEntry) => historyEntry.id === entry.id
                                                          ? { ...historyEntry, toDate: setDraftFieldValue(historyEntry.toDate, e.target.value) }
                                                          : historyEntry),
                                                      }
                                                      : candidate),
                                                  }))}
                                                  placeholder="To"
                                                />
                                                <Input
                                                  value={entry.residence.value}
                                                  onChange={(e) => updateFl105((fl105) => ({
                                                    ...fl105,
                                                    additionalChildrenAttachments: fl105.additionalChildrenAttachments.map((candidate) => candidate.id === attachment.id
                                                      ? {
                                                        ...candidate,
                                                        residenceHistory: candidate.residenceHistory.map((historyEntry) => historyEntry.id === entry.id
                                                          ? { ...historyEntry, residence: setDraftFieldValue(historyEntry.residence, e.target.value) }
                                                          : historyEntry),
                                                      }
                                                      : candidate),
                                                  }))}
                                                  className="md:col-span-2"
                                                  placeholder="Child's residence (city/state or address)"
                                                />
                                                <Input
                                                  value={entry.personAndAddress.value}
                                                  onChange={(e) => updateFl105((fl105) => ({
                                                    ...fl105,
                                                    additionalChildrenAttachments: fl105.additionalChildrenAttachments.map((candidate) => candidate.id === attachment.id
                                                      ? {
                                                        ...candidate,
                                                        residenceHistory: candidate.residenceHistory.map((historyEntry) => historyEntry.id === entry.id
                                                          ? { ...historyEntry, personAndAddress: setDraftFieldValue(historyEntry.personAndAddress, e.target.value) }
                                                          : historyEntry),
                                                      }
                                                      : candidate),
                                                  }))}
                                                  placeholder="Person child lived with + address"
                                                />
                                                <div className="flex gap-2">
                                                  <Input
                                                    value={entry.relationship.value}
                                                    onChange={(e) => updateFl105((fl105) => ({
                                                      ...fl105,
                                                      additionalChildrenAttachments: fl105.additionalChildrenAttachments.map((candidate) => candidate.id === attachment.id
                                                        ? {
                                                          ...candidate,
                                                          residenceHistory: candidate.residenceHistory.map((historyEntry) => historyEntry.id === entry.id
                                                            ? { ...historyEntry, relationship: setDraftFieldValue(historyEntry.relationship, e.target.value) }
                                                            : historyEntry),
                                                        }
                                                        : candidate),
                                                    }))}
                                                    placeholder="Relationship to child"
                                                  />
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => updateFl105((fl105) => ({
                                                      ...fl105,
                                                      additionalChildrenAttachments: fl105.additionalChildrenAttachments.map((candidate) => candidate.id === attachment.id
                                                        ? {
                                                          ...candidate,
                                                          residenceHistory: candidate.residenceHistory.filter((historyEntry) => historyEntry.id !== entry.id),
                                                        }
                                                        : candidate),
                                                    }))}
                                                  >
                                                    Remove
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                          {attachment.residenceHistory.length === 0 && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400">No child-specific residence rows added yet.</p>
                                          )}
                                        </div>

                                        {childSpecificHistoryCount > FL105_FORM_CAPACITY.residenceHistoryRows && (
                                          <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {childSpecificHistoryCount - FL105_FORM_CAPACITY.residenceHistoryRows} extra row(s) for {childLabel} will spill into additional FL-105(A)/GC-120(A) section(s).
                                          </p>
                                        )}
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <div className="space-y-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                      <label className="flex items-start gap-3">
                        <Checkbox
                          checked={workspace.fl105.otherProceedingsKnown.value}
                          onCheckedChange={(checked) => updateFl105((fl105) => ({
                            ...fl105,
                            otherProceedingsKnown: setDraftFieldValue(fl105.otherProceedingsKnown, checked === true),
                            otherProceedingsAssertionReviewed: setDraftFieldValue(fl105.otherProceedingsAssertionReviewed, false),
                          }))}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Other custody/parentage/adoption proceedings are known</span>
                            <FieldSourceBadge field={workspace.fl105.otherProceedingsKnown} />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Base FL-105 capacity: {FL105_FORM_CAPACITY.otherProceedingsRows} typed rows. Extra or duplicate proceeding rows generate attachment 4 pages automatically.</p>
                        </div>
                      </label>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => updateFl105((fl105) => ({
                            ...fl105,
                            otherProceedingsAssertionReviewed: setDraftFieldValue(fl105.otherProceedingsAssertionReviewed, false),
                            otherProceedings: [...fl105.otherProceedings, createBlankFl105OtherProceeding()],
                          }))}
                        >
                          Add proceeding
                        </Button>
                      </div>
                      {getFl105OtherProceedingOverflowCount(workspace.fl105.otherProceedings) > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {getFl105OtherProceedingOverflowCount(workspace.fl105.otherProceedings)} additional proceeding row(s) will be generated as FL-105 attachment 4 pages.
                        </p>
                      )}
                      <div className="space-y-3">
                        {workspace.fl105.otherProceedings.map((entry) => (
                          <div key={entry.id} className="grid gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 md:grid-cols-6 dark:border-white/10 dark:bg-white/5">
                            <select
                              value={normalizeFl105ProceedingType(entry.proceedingType.value)}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                otherProceedings: fl105.otherProceedings.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, proceedingType: setDraftFieldValue(candidate.proceedingType, e.target.value) }
                                  : candidate),
                              }))}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            >
                              <option value="">Proceeding type…</option>
                              <option value="family">Family</option>
                              <option value="guardianship">Guardianship</option>
                              <option value="other">Other</option>
                              <option value="juvenile">Juvenile</option>
                              <option value="adoption">Adoption</option>
                            </select>
                            <Input
                              value={entry.caseNumber.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                otherProceedings: fl105.otherProceedings.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, caseNumber: setDraftFieldValue(candidate.caseNumber, e.target.value) }
                                  : candidate),
                              }))}
                              placeholder="Case no."
                            />
                            <Input
                              value={entry.court.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                otherProceedings: fl105.otherProceedings.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, court: setDraftFieldValue(candidate.court, e.target.value) }
                                  : candidate),
                              }))}
                              placeholder="Court"
                            />
                            <Input
                              type="date"
                              value={entry.orderDate.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                otherProceedings: fl105.otherProceedings.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, orderDate: setDraftFieldValue(candidate.orderDate, e.target.value) }
                                  : candidate),
                              }))}
                            />
                            <Input
                              value={entry.childNames.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                otherProceedings: fl105.otherProceedings.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, childNames: setDraftFieldValue(candidate.childNames, e.target.value) }
                                  : candidate),
                              }))}
                              placeholder="Child(ren)"
                            />
                            <div className="flex gap-2">
                              <Input
                                value={entry.connection.value}
                                onChange={(e) => updateFl105((fl105) => ({
                                  ...fl105,
                                  otherProceedings: fl105.otherProceedings.map((candidate) => candidate.id === entry.id
                                    ? { ...candidate, connection: setDraftFieldValue(candidate.connection, e.target.value) }
                                    : candidate),
                                }))}
                                placeholder="Your role"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => updateFl105((fl105) => ({
                                  ...fl105,
                                  otherProceedingsAssertionReviewed: setDraftFieldValue(fl105.otherProceedingsAssertionReviewed, false),
                                  otherProceedings: fl105.otherProceedings.filter((candidate) => candidate.id !== entry.id),
                                }))}
                              >
                                Remove
                              </Button>
                            </div>
                            <Input
                              value={entry.status.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                otherProceedings: fl105.otherProceedings.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, status: setDraftFieldValue(candidate.status, e.target.value) }
                                  : candidate),
                              }))}
                              className="md:col-span-6"
                              placeholder="Current status/order summary"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                      <label className="flex items-start gap-3">
                        <Checkbox
                          checked={workspace.fl105.domesticViolenceOrdersExist.value}
                          onCheckedChange={(checked) => updateFl105((fl105) => ({
                            ...fl105,
                            domesticViolenceOrdersExist: setDraftFieldValue(fl105.domesticViolenceOrdersExist, checked === true),
                            domesticViolenceOrdersAssertionReviewed: setDraftFieldValue(fl105.domesticViolenceOrdersAssertionReviewed, false),
                          }))}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Protective / restraining orders exist</span>
                            <FieldSourceBadge field={workspace.fl105.domesticViolenceOrdersExist} />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Base FL-105 capacity: {FL105_FORM_CAPACITY.restrainingOrdersRows} typed rows. Extra or duplicate order rows generate attachment 5 pages automatically.</p>
                        </div>
                      </label>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => updateFl105((fl105) => ({
                            ...fl105,
                            domesticViolenceOrdersAssertionReviewed: setDraftFieldValue(fl105.domesticViolenceOrdersAssertionReviewed, false),
                            domesticViolenceOrders: [...fl105.domesticViolenceOrders, createBlankFl105RestrainingOrder()],
                          }))}
                        >
                          Add order
                        </Button>
                      </div>
                      {getFl105OrderOverflowCount(workspace.fl105.domesticViolenceOrders) > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {getFl105OrderOverflowCount(workspace.fl105.domesticViolenceOrders)} additional order row(s) will be generated as FL-105 attachment 5 pages.
                        </p>
                      )}
                      <div className="space-y-3">
                        {workspace.fl105.domesticViolenceOrders.map((entry) => (
                          <div key={entry.id} className="grid gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 md:grid-cols-6 dark:border-white/10 dark:bg-white/5">
                            <select
                              value={normalizeFl105OrderType(entry.orderType.value)}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                domesticViolenceOrders: fl105.domesticViolenceOrders.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, orderType: setDraftFieldValue(candidate.orderType, e.target.value) }
                                  : candidate),
                              }))}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            >
                              <option value="">Order type…</option>
                              <option value="criminal">Criminal</option>
                              <option value="family">Family</option>
                              <option value="juvenile">Juvenile</option>
                              <option value="other">Other</option>
                            </select>
                            <Input
                              value={entry.county.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                domesticViolenceOrders: fl105.domesticViolenceOrders.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, county: setDraftFieldValue(candidate.county, e.target.value) }
                                  : candidate),
                              }))}
                              placeholder="County"
                            />
                            <Input
                              value={entry.stateOrTribe.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                domesticViolenceOrders: fl105.domesticViolenceOrders.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, stateOrTribe: setDraftFieldValue(candidate.stateOrTribe, e.target.value) }
                                  : candidate),
                              }))}
                              placeholder="State/tribe"
                            />
                            <Input
                              value={entry.caseNumber.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                domesticViolenceOrders: fl105.domesticViolenceOrders.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, caseNumber: setDraftFieldValue(candidate.caseNumber, e.target.value) }
                                  : candidate),
                              }))}
                              placeholder="Case no."
                            />
                            <Input
                              type="date"
                              value={entry.expirationDate.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                domesticViolenceOrders: fl105.domesticViolenceOrders.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, expirationDate: setDraftFieldValue(candidate.expirationDate, e.target.value) }
                                  : candidate),
                              }))}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => updateFl105((fl105) => ({
                                ...fl105,
                                domesticViolenceOrdersAssertionReviewed: setDraftFieldValue(fl105.domesticViolenceOrdersAssertionReviewed, false),
                                domesticViolenceOrders: fl105.domesticViolenceOrders.filter((candidate) => candidate.id !== entry.id),
                              }))}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                      <label className="flex items-start gap-3">
                        <Checkbox
                          checked={workspace.fl105.otherClaimantsKnown.value}
                          onCheckedChange={(checked) => updateFl105((fl105) => ({
                            ...fl105,
                            otherClaimantsKnown: setDraftFieldValue(fl105.otherClaimantsKnown, checked === true),
                            otherClaimantsAssertionReviewed: setDraftFieldValue(fl105.otherClaimantsAssertionReviewed, false),
                          }))}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Other custody/visitation claimants are known</span>
                            <FieldSourceBadge field={workspace.fl105.otherClaimantsKnown} />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Base FL-105 capacity: {FL105_FORM_CAPACITY.otherClaimantsRows} rows. Extra claimant rows generate attachment 6 pages automatically.</p>
                        </div>
                      </label>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => updateFl105((fl105) => ({
                            ...fl105,
                            otherClaimantsAssertionReviewed: setDraftFieldValue(fl105.otherClaimantsAssertionReviewed, false),
                            otherClaimants: [...fl105.otherClaimants, createBlankFl105OtherClaimant()],
                          }))}
                        >
                          Add claimant
                        </Button>
                      </div>
                      {getFl105ClaimantOverflowCount(workspace.fl105.otherClaimants) > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {getFl105ClaimantOverflowCount(workspace.fl105.otherClaimants)} additional claimant row(s) will be generated as FL-105 attachment 6 pages.
                        </p>
                      )}
                      <div className="space-y-3">
                        {workspace.fl105.otherClaimants.map((entry) => (
                          <div key={entry.id} className="space-y-3 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
                            <div className="grid gap-3 md:grid-cols-3">
                              <Input
                                value={entry.nameAndAddress.value}
                                onChange={(e) => updateFl105((fl105) => ({
                                  ...fl105,
                                  otherClaimants: fl105.otherClaimants.map((candidate) => candidate.id === entry.id
                                    ? { ...candidate, nameAndAddress: setDraftFieldValue(candidate.nameAndAddress, e.target.value) }
                                    : candidate),
                                }))}
                                className="md:col-span-2"
                                placeholder="Name and address"
                              />
                              <Input
                                value={entry.childNames.value}
                                onChange={(e) => updateFl105((fl105) => ({
                                  ...fl105,
                                  otherClaimants: fl105.otherClaimants.map((candidate) => candidate.id === entry.id
                                    ? { ...candidate, childNames: setDraftFieldValue(candidate.childNames, e.target.value) }
                                    : candidate),
                                }))}
                                placeholder="Child names"
                              />
                            </div>
                            <div className="flex flex-wrap gap-4">
                              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                                <Checkbox
                                  checked={entry.hasPhysicalCustody.value}
                                  onCheckedChange={(checked) => updateFl105((fl105) => ({
                                    ...fl105,
                                    otherClaimants: fl105.otherClaimants.map((candidate) => candidate.id === entry.id
                                      ? { ...candidate, hasPhysicalCustody: setDraftFieldValue(candidate.hasPhysicalCustody, checked === true) }
                                      : candidate),
                                  }))}
                                />
                                Physical custody
                              </label>
                              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                                <Checkbox
                                  checked={entry.claimsCustodyRights.value}
                                  onCheckedChange={(checked) => updateFl105((fl105) => ({
                                    ...fl105,
                                    otherClaimants: fl105.otherClaimants.map((candidate) => candidate.id === entry.id
                                      ? { ...candidate, claimsCustodyRights: setDraftFieldValue(candidate.claimsCustodyRights, checked === true) }
                                      : candidate),
                                  }))}
                                />
                                Claims custody rights
                              </label>
                              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                                <Checkbox
                                  checked={entry.claimsVisitationRights.value}
                                  onCheckedChange={(checked) => updateFl105((fl105) => ({
                                    ...fl105,
                                    otherClaimants: fl105.otherClaimants.map((candidate) => candidate.id === entry.id
                                      ? { ...candidate, claimsVisitationRights: setDraftFieldValue(candidate.claimsVisitationRights, checked === true) }
                                      : candidate),
                                  }))}
                                />
                                Claims visitation rights
                              </label>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => updateFl105((fl105) => ({
                                  ...fl105,
                                  otherClaimantsAssertionReviewed: setDraftFieldValue(fl105.otherClaimantsAssertionReviewed, false),
                                  otherClaimants: fl105.otherClaimants.filter((candidate) => candidate.id !== entry.id),
                                }))}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  {([
                    ['childCustody', 'Request child custody'],
                    ['visitation', 'Request visitation / parenting time'],
                    ['childSupport', 'Request child support'],
                    ['spousalSupport', 'Request spousal support'],
                    ['propertyRightsDetermination', 'Request property rights determination'],
                    ['restoreFormerName', 'Request restoration of former name'],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                      <Checkbox
                        checked={workspace.requests[key].value}
                        onCheckedChange={(checked) => commitWorkspace((current) => ({
                          ...current,
                          requests: {
                            ...current.requests,
                            [key]: setDraftFieldValue(current.requests[key], checked === true),
                          },
                        }))}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-800 dark:text-slate-100">{label}</span>
                          <FieldSourceBadge field={workspace.requests[key]} />
                        </div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {workspace.requests[key].sourceLabel || 'No source captured yet'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card id="draft-section-generate" className="scroll-mt-28 rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-950 dark:text-white">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Packet readiness
                </CardTitle>
                <CardDescription>Draft Forms now produces prefilled FL-100, FL-110, conditional FL-105/GC-120, and conditional FL-341 in one official packet.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-200">Review progress</span>
                    <span className="text-slate-500 dark:text-slate-400">{progressValue}%</span>
                  </div>
                  <Progress value={progressValue} className="h-2" />
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Forms in scope</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {includedForms.map((form) => (
                      <Badge key={form} variant="outline" className="rounded-full">{form}</Badge>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Still needed before packet generation</p>
                  {missingItems.length === 0 ? (
                    <div className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-200">
                      <CheckCircle2 className="h-4 w-4" />
                      Ready for the PDF-generation slice.
                    </div>
                  ) : (
                    <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                      {missingItems.slice(0, 8).map((item) => {
                        const targetId = getMissingItemTargetId(item);
                        return (
                          <li key={item}>
                            <span>{item}</span>
                            {targetId && (
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  jumpToMissingItem(item);
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    jumpToMissingItem(item);
                                  }
                                }}
                                className="ml-2 inline-flex h-7 cursor-pointer items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15"
                              >
                                Show section
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {(missingItems.includes('FL-300 custody/visitation order source') || missingItems.includes('FL-300 facts supporting requested orders') || missingItems.includes('FL-150 signature date')) && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-300/20 dark:bg-amber-500/10">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-200">Quick fill missing fields</p>
                    <div className="mt-3 space-y-3">
                      {missingItems.includes('FL-300 custody/visitation order source') && (
                        <div>
                          <Label className="text-xs font-semibold text-amber-950 dark:text-amber-100">FL-300 custody/visitation order source</Label>
                          <Textarea
                            className="mt-1 min-h-[72px] bg-white/80 dark:bg-slate-950/60"
                            placeholder="Example: As follows: temporary joint legal custody, primary physical custody to petitioner, visitation as agreed or by court schedule."
                            value={workspace.fl300.custodyRequests.asFollowsText.value}
                            onChange={(event) => updateFl300((fl300) => ({ ...fl300, custodyRequests: { ...fl300.custodyRequests, asFollowsText: setDraftFieldValue(fl300.custodyRequests.asFollowsText, event.target.value) } }))}
                          />
                        </div>
                      )}
                      {missingItems.includes('FL-300 facts supporting requested orders') && (
                        <div>
                          <Label className="text-xs font-semibold text-amber-950 dark:text-amber-100">FL-300 facts supporting requested orders</Label>
                          <Textarea
                            className="mt-1 min-h-[90px] bg-white/80 dark:bg-slate-950/60"
                            placeholder="Enter the facts supporting the orders requested. Longer text becomes an Attachment 9 continuation."
                            value={workspace.fl300.facts.value}
                            onChange={(event) => updateFl300((fl300) => ({ ...fl300, facts: setDraftFieldValue(fl300.facts, event.target.value) }))}
                          />
                        </div>
                      )}
                      {missingItems.includes('FL-150 signature date') && (
                        <div>
                          <Label className="text-xs font-semibold text-amber-950 dark:text-amber-100">FL-150 signature date</Label>
                          <Input
                            type="date"
                            className="mt-1 bg-white/80 dark:bg-slate-950/60"
                            value={workspace.fl150.signatureDate.value}
                            onChange={(event) => updateFl150((fl150) => ({ ...fl150, signatureDate: setDraftFieldValue(fl150.signatureDate, event.target.value) }))}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
                  <div className="flex items-start gap-3">
                    <Wand2 className="mt-0.5 h-5 w-5 text-emerald-700 dark:text-emerald-200" />
                    <div>
                      <p className="font-medium text-emerald-900 dark:text-emerald-100">What this slice proves</p>
                      <p className="mt-1 text-sm leading-6 text-emerald-900/80 dark:text-emerald-100/80">
                        Maria now turns the structured workspace into an official starter packet PDF, including FL-105/GC-120 when minor children are present.
                      </p>
                    </div>
                  </div>
                </div>

                {generatedPacketName && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
                    Saved <strong>{generatedPacketName}</strong> to Saved Files.
                  </div>
                )}
                {packetError && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
                    {packetError}
                  </div>
                )}

                {missingItems.length > 0 && (
                  <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-300/20 dark:bg-amber-500/10 dark:text-amber-100">
                    <Checkbox
                      checked={packetReadinessOverride}
                      onCheckedChange={(checked) => setPacketReadinessOverride(checked === true)}
                    />
                    <span>
                      <span className="font-semibold">Manual override:</span> generate the packet anyway. I’ll fill or verify the remaining items manually before filing.
                    </span>
                  </label>
                )}

                <div className="grid gap-3">
                  <Button
                    onClick={handleGeneratePacket}
                    disabled={isGeneratingPacket || (missingItems.length > 0 && !packetReadinessOverride)}
                    className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  >
                    {isGeneratingPacket ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating official packet…</>
                    ) : generatedPacketName ? (
                      <><CheckCircle2 className="mr-2 h-4 w-4" /> Saved official packet</>
                    ) : (
                      'Generate official starter packet PDF'
                    )}
                  </Button>
                  <Button disabled variant="outline" className="rounded-full disabled:cursor-not-allowed disabled:opacity-60">
                    Send to concierge (after official packet generation)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
