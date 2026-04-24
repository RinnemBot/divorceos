import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileText, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { authService, type User } from '@/services/auth';
import { MariaDocumentError, createOfficialStarterPacketDocument } from '@/services/documents';
import {
  createBlankChild,
  createBlankFl105OtherClaimant,
  createBlankFl105OtherProceeding,
  createBlankFl105ResidenceHistoryEntry,
  createBlankFl105RestrainingOrder,
  FL105_FORM_CAPACITY,
  createStarterPacketWorkspace,
  getDraftWorkspace,
  saveDraftWorkspace,
  setDraftFieldValue,
  type DraftField,
  type DraftFormsWorkspace,
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

const FL100_SEPARATE_PROPERTY_VISIBLE_ROWS = 5;

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

export function DraftFormsPage() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<DraftFormsWorkspace | null>(null);
  const [isGeneratingPacket, setIsGeneratingPacket] = useState(false);
  const [generatedPacketName, setGeneratedPacketName] = useState<string | null>(null);
  const [packetError, setPacketError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    if (!user) {
      navigate('/', { replace: true });
      return;
    }

    if (workspaceId) {
      const existing = getDraftWorkspace(workspaceId);
      if (existing?.userId === user.id) {
        setWorkspace(existing);
        return;
      }
    }

    if (initializedRef.current) return;
    initializedRef.current = true;

    const created = createStarterPacketWorkspace({ user });
    setWorkspace(created);
    navigate(`/draft-forms/${created.id}`, { replace: true });
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

  const updateFl100 = (updater: (fl100: DraftFormsWorkspace['fl100']) => DraftFormsWorkspace['fl100']) => {
    commitWorkspace((current) => ({ ...current, fl100: updater(current.fl100) }));
  };

  const missingItems = useMemo(() => {
    if (!workspace) return [] as string[];
    const missing: string[] = [];
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
    if (isMarriageRelationship && !workspace.marriageDate.value.trim()) missing.push('Date of marriage');
    if (isDissolutionProceeding) {
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
    if (!isNullityProceeding && !workspace.fl100.legalGrounds.irreconcilableDifferences.value && !workspace.fl100.legalGrounds.permanentLegalIncapacity.value) {
      missing.push('At least one legal ground for FL-100');
    }
    if (isNullityProceeding && !hasNullityBasis) {
      missing.push('At least one nullity basis');
    }
    if (isDomesticPartnershipRelationship && workspace.fl100.domesticPartnership.establishment.value === 'unspecified') {
      missing.push('Domestic partnership establishment in California');
    }
    if (isDomesticPartnershipRelationship && !domesticPartnershipRegistrationDate) {
      missing.push('Domestic partnership registration date');
    }
    if (isDomesticPartnershipRelationship && !domesticPartnershipSeparationDate) {
      missing.push('Domestic partnership date of separation');
    }
    if (workspace.requests.restoreFormerName.value && !workspace.fl100.formerName.value.trim()) {
      missing.push('Former name to restore');
    }
    const communityWhereListed = workspace.fl100.propertyDeclarations.communityAndQuasiCommunityWhereListed.value;
    const separateWhereListed = workspace.fl100.propertyDeclarations.separatePropertyWhereListed.value;
    const separateInlineEntries = splitNonEmptyLines(workspace.fl100.propertyDeclarations.separatePropertyDetails.value);
    if (workspace.fl100.propertyDeclarations.communityAndQuasiCommunity.value) {
      if (communityWhereListed === 'unspecified') {
        missing.push('Community/quasi-community property list location');
      }
      if (communityWhereListed === 'inline_list' && !workspace.fl100.propertyDeclarations.communityAndQuasiCommunityDetails.value.trim()) {
        missing.push('Community / quasi-community inline property list');
      }
    }
    if (workspace.fl100.propertyDeclarations.separateProperty.value) {
      if (separateWhereListed === 'unspecified') {
        missing.push('Separate property list location');
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
      workspace.requests.spousalSupport.value
      && spousalSupportDirection === 'none'
      && spousalSupportReserve === 'none'
      && !spousalSupportDetails
    ) {
      missing.push('Spousal support direction or details');
    }
    if (workspace.fl100.childSupport.requestAdditionalOrders.value && !workspace.fl100.childSupport.additionalOrdersDetails.value.trim()) {
      missing.push('Additional child support order details');
    }
    if (
      workspace.requests.childCustody.value
      && workspace.fl100.childCustodyVisitation.legalCustodyTo.value === 'none'
      && workspace.fl100.childCustodyVisitation.physicalCustodyTo.value === 'none'
    ) {
      missing.push('Legal or physical custody direction');
    }
    if (workspace.requests.visitation.value && workspace.fl100.childCustodyVisitation.visitationTo.value === 'none') {
      missing.push('Visitation direction');
    }
    if (workspace.fl100.attorneyFeesAndCosts.requestAward.value && workspace.fl100.attorneyFeesAndCosts.payableBy.value === 'none') {
      missing.push('Who should pay attorney fees and costs');
    }
    if (workspace.fl100.otherRequests.requestOtherRelief.value && !workspace.fl100.otherRequests.details.value.trim()) {
      missing.push('Other FL-100 request details');
    }

    if (workspace.hasMinorChildren.value) {
      if (workspace.children.length === 0 && !workspace.fl100.minorChildren.hasUnbornChild.value) {
        missing.push('At least one child entry or unborn child selection');
      }
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
    if (missingItems.length > 0) {
      toast.message('Finish the required Draft Forms fields before generating the official starter packet PDF.');
      return;
    }

    setIsGeneratingPacket(true);
    setPacketError(null);

    try {
      const document = await createOfficialStarterPacketDocument(workspace);
      setGeneratedPacketName(document.name);
      toast.success('Official starter packet PDF saved to Saved Files.');
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

  const includedForms = workspace.hasMinorChildren.value
    ? ['FL-100', 'FL-110', 'FL-105/GC-120']
    : ['FL-100', 'FL-110'];
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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_14%_0%,rgba(16,185,129,0.16),transparent_24%),radial-gradient(circle_at_86%_8%,rgba(59,130,246,0.12),transparent_20%),linear-gradient(180deg,#f8fafc_0%,#ecfdf5_45%,#f8fafc_100%)] py-12 dark:bg-[radial-gradient(circle_at_16%_0%,rgba(16,185,129,0.16),transparent_24%),radial-gradient(circle_at_84%_8%,rgba(59,130,246,0.14),transparent_20%),linear-gradient(180deg,#020617_0%,#03111f_50%,#020617_100%)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge className="mb-3 border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
              Draft Forms MVP
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">Starter packet workspace</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Maria can hand facts into an editable workspace before anything becomes a court-ready packet. Structured form data stays the source of truth.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
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

        <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-6">
            <Card className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-950 dark:text-white">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  Intake handoff from Maria
                </CardTitle>
                <CardDescription>
                  This is the bridge between chat/uploads and editable form fields.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
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
                <div className="grid gap-5 md:grid-cols-3">
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
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Residency for filing eligibility</p>
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
                        placeholder="If using inline list, enter community/quasi-community assets/debts here."
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Generator only checks FL-160 or attachment boxes when you explicitly choose them.</p>
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
                        placeholder="If using inline list: one property/debt entry per line."
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
                          FL-100 page 1 has {FL105_FORM_CAPACITY.childrenRows} visible child rows in this packet.
                        </p>
                        {hasOverflowMinorChildren && (
                          <p className="text-xs text-amber-700 dark:text-amber-200">
                            {overflowMinorChildrenCount} child(ren) exceed visible FL-100 rows. Select “Child list continues on attachment 4b” before generation.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {workspace.hasMinorChildren.value && (
                  <div className="space-y-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">FL-105 / GC-120 details</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Capture the highest-value UCCJEA fields that map directly into the official form rows.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                        <Checkbox
                          checked={workspace.fl105.childrenLivedTogetherPastFiveYears.value}
                          onCheckedChange={(checked) => updateFl105((fl105) => ({
                            ...fl105,
                            childrenLivedTogetherPastFiveYears: setDraftFieldValue(fl105.childrenLivedTogetherPastFiveYears, checked === true),
                          }))}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-slate-800 dark:text-slate-100">Children lived together for the last five years</span>
                            <FieldSourceBadge field={workspace.fl105.childrenLivedTogetherPastFiveYears} />
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">If false, FL-105 indicates children did not all reside together.</p>
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
                    </div>

                    <div className="space-y-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Five-year residence history</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Visible FL-105 capacity: {FL105_FORM_CAPACITY.residenceHistoryRows} rows.</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          disabled={workspace.fl105.residenceHistory.length >= FL105_FORM_CAPACITY.residenceHistoryRows}
                          onClick={() => updateFl105((fl105) => ({
                            ...fl105,
                            residenceHistory: [...fl105.residenceHistory, createBlankFl105ResidenceHistoryEntry()],
                          }))}
                        >
                          Add history row
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {workspace.fl105.residenceHistory.map((entry) => (
                          <div key={entry.id} className="grid gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 md:grid-cols-6 dark:border-white/10 dark:bg-white/5">
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
                              placeholder="Child's residence"
                            />
                            <Input
                              value={entry.personAndAddress.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                residenceHistory: fl105.residenceHistory.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, personAndAddress: setDraftFieldValue(candidate.personAndAddress, e.target.value) }
                                  : candidate),
                              }))}
                              placeholder="Person + address"
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
                                placeholder="Relationship"
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
                        ))}
                        {workspace.fl105.residenceHistory.length === 0 && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">No residence rows added yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                      <label className="flex items-start gap-3">
                        <Checkbox
                          checked={workspace.fl105.otherProceedingsKnown.value}
                          onCheckedChange={(checked) => updateFl105((fl105) => ({
                            ...fl105,
                            otherProceedingsKnown: setDraftFieldValue(fl105.otherProceedingsKnown, checked === true),
                          }))}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Other custody/parentage/adoption proceedings are known</span>
                            <FieldSourceBadge field={workspace.fl105.otherProceedingsKnown} />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Visible FL-105 capacity: {FL105_FORM_CAPACITY.otherProceedingsRows} rows.</p>
                        </div>
                      </label>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          disabled={workspace.fl105.otherProceedings.length >= FL105_FORM_CAPACITY.otherProceedingsRows}
                          onClick={() => updateFl105((fl105) => ({
                            ...fl105,
                            otherProceedings: [...fl105.otherProceedings, createBlankFl105OtherProceeding()],
                          }))}
                        >
                          Add proceeding
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {workspace.fl105.otherProceedings.map((entry) => (
                          <div key={entry.id} className="grid gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 md:grid-cols-6 dark:border-white/10 dark:bg-white/5">
                            <Input
                              value={entry.proceedingType.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                otherProceedings: fl105.otherProceedings.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, proceedingType: setDraftFieldValue(candidate.proceedingType, e.target.value) }
                                  : candidate),
                              }))}
                              placeholder="Type"
                            />
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
                          }))}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Protective / restraining orders exist</span>
                            <FieldSourceBadge field={workspace.fl105.domesticViolenceOrdersExist} />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Visible FL-105 capacity: {FL105_FORM_CAPACITY.restrainingOrdersRows} rows.</p>
                        </div>
                      </label>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          disabled={workspace.fl105.domesticViolenceOrders.length >= FL105_FORM_CAPACITY.restrainingOrdersRows}
                          onClick={() => updateFl105((fl105) => ({
                            ...fl105,
                            domesticViolenceOrders: [...fl105.domesticViolenceOrders, createBlankFl105RestrainingOrder()],
                          }))}
                        >
                          Add order
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {workspace.fl105.domesticViolenceOrders.map((entry) => (
                          <div key={entry.id} className="grid gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 md:grid-cols-6 dark:border-white/10 dark:bg-white/5">
                            <Input
                              value={entry.orderType.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                domesticViolenceOrders: fl105.domesticViolenceOrders.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, orderType: setDraftFieldValue(candidate.orderType, e.target.value) }
                                  : candidate),
                              }))}
                              placeholder="Order type"
                            />
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
                          }))}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Other custody/visitation claimants are known</span>
                            <FieldSourceBadge field={workspace.fl105.otherClaimantsKnown} />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Visible FL-105 capacity: {FL105_FORM_CAPACITY.otherClaimantsRows} rows.</p>
                        </div>
                      </label>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          disabled={workspace.fl105.otherClaimants.length >= FL105_FORM_CAPACITY.otherClaimantsRows}
                          onClick={() => updateFl105((fl105) => ({
                            ...fl105,
                            otherClaimants: [...fl105.otherClaimants, createBlankFl105OtherClaimant()],
                          }))}
                        >
                          Add claimant
                        </Button>
                      </div>
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
            <Card className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-950 dark:text-white">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Packet readiness
                </CardTitle>
                <CardDescription>Draft Forms now produces prefilled FL-100, FL-110, and conditional FL-105/GC-120 in one official packet.</CardDescription>
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
                      {missingItems.slice(0, 8).map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  )}
                </div>

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

                <div className="grid gap-3">
                  <Button
                    onClick={handleGeneratePacket}
                    disabled={isGeneratingPacket || missingItems.length > 0}
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
