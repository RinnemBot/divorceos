import { promises as fs } from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

interface StarterPacketField<T> {
  value: T;
}

interface StarterPacketChild {
  fullName: StarterPacketField<string>;
  birthDate: StarterPacketField<string>;
  placeOfBirth: StarterPacketField<string>;
}

interface StarterPacketFl105ResidenceHistoryEntry {
  fromDate: StarterPacketField<string>;
  toDate: StarterPacketField<string>;
  residence: StarterPacketField<string>;
  personAndAddress: StarterPacketField<string>;
  relationship: StarterPacketField<string>;
}

interface StarterPacketFl105OtherProceeding {
  proceedingType: StarterPacketField<string>;
  caseNumber: StarterPacketField<string>;
  court: StarterPacketField<string>;
  orderDate: StarterPacketField<string>;
  childNames: StarterPacketField<string>;
  connection: StarterPacketField<string>;
  status: StarterPacketField<string>;
}

interface StarterPacketFl105RestrainingOrder {
  orderType: StarterPacketField<string>;
  county: StarterPacketField<string>;
  stateOrTribe: StarterPacketField<string>;
  caseNumber: StarterPacketField<string>;
  expirationDate: StarterPacketField<string>;
}

interface StarterPacketFl105OtherClaimant {
  nameAndAddress: StarterPacketField<string>;
  childNames: StarterPacketField<string>;
  hasPhysicalCustody: StarterPacketField<boolean>;
  claimsCustodyRights: StarterPacketField<boolean>;
  claimsVisitationRights: StarterPacketField<boolean>;
}

interface StarterPacketWorkspace {
  caseNumber: StarterPacketField<string>;
  filingCounty: StarterPacketField<string>;
  courtStreet: StarterPacketField<string>;
  courtMailingAddress: StarterPacketField<string>;
  courtCityZip: StarterPacketField<string>;
  courtBranch: StarterPacketField<string>;
  petitionerName: StarterPacketField<string>;
  petitionerAddress: StarterPacketField<string>;
  petitionerPhone: StarterPacketField<string>;
  petitionerEmail: StarterPacketField<string>;
  respondentName: StarterPacketField<string>;
  marriageDate: StarterPacketField<string>;
  separationDate: StarterPacketField<string>;
  hasMinorChildren: StarterPacketField<boolean>;
  children: StarterPacketChild[];
  fl100: {
    proceedingType: StarterPacketField<'dissolution' | 'legal_separation' | 'nullity'>;
    relationshipType: StarterPacketField<'marriage' | 'domestic_partnership' | 'both'>;
    domesticPartnership: {
      establishment: StarterPacketField<'unspecified' | 'established_in_california' | 'not_established_in_california'>;
      californiaResidencyException: StarterPacketField<boolean>;
      sameSexMarriageJurisdictionException: StarterPacketField<boolean>;
    };
    nullity: {
      basedOnIncest: StarterPacketField<boolean>;
      basedOnBigamy: StarterPacketField<boolean>;
      basedOnAge: StarterPacketField<boolean>;
      basedOnPriorExistingMarriageOrPartnership: StarterPacketField<boolean>;
      basedOnUnsoundMind: StarterPacketField<boolean>;
      basedOnFraud: StarterPacketField<boolean>;
      basedOnForce: StarterPacketField<boolean>;
      basedOnPhysicalIncapacity: StarterPacketField<boolean>;
    };
    residency: {
      petitionerCaliforniaMonths: StarterPacketField<string>;
      petitionerCountyMonths: StarterPacketField<string>;
      respondentCaliforniaMonths: StarterPacketField<string>;
      respondentCountyMonths: StarterPacketField<string>;
    };
    legalGrounds: {
      irreconcilableDifferences: StarterPacketField<boolean>;
      permanentLegalIncapacity: StarterPacketField<boolean>;
    };
    propertyDeclarations: {
      communityAndQuasiCommunity: StarterPacketField<boolean>;
      communityAndQuasiCommunityDetails: StarterPacketField<string>;
      separateProperty: StarterPacketField<boolean>;
      separatePropertyDetails: StarterPacketField<string>;
      separatePropertyAwardedTo: StarterPacketField<string>;
    };
    spousalSupport: {
      supportOrderDirection: StarterPacketField<'none' | 'petitioner_to_respondent' | 'respondent_to_petitioner'>;
      reserveJurisdictionFor: StarterPacketField<'none' | 'petitioner' | 'respondent' | 'both'>;
      terminateJurisdictionFor: StarterPacketField<'none' | 'petitioner' | 'respondent' | 'both'>;
      details: StarterPacketField<string>;
      voluntaryDeclarationOfParentageSigned: StarterPacketField<boolean>;
    };
    childSupport: {
      requestAdditionalOrders: StarterPacketField<boolean>;
      additionalOrdersDetails: StarterPacketField<string>;
    };
    childCustodyVisitation: {
      legalCustodyTo: StarterPacketField<'none' | 'petitioner' | 'respondent' | 'joint' | 'other'>;
      physicalCustodyTo: StarterPacketField<'none' | 'petitioner' | 'respondent' | 'joint' | 'other'>;
      visitationTo: StarterPacketField<'none' | 'petitioner' | 'respondent' | 'other'>;
      attachments: {
        formFl311: StarterPacketField<boolean>;
        formFl312: StarterPacketField<boolean>;
        formFl341c: StarterPacketField<boolean>;
        formFl341d: StarterPacketField<boolean>;
        formFl341e: StarterPacketField<boolean>;
        attachment6c1: StarterPacketField<boolean>;
      };
    };
    attorneyFeesAndCosts: {
      requestAward: StarterPacketField<boolean>;
      payableBy: StarterPacketField<'none' | 'petitioner' | 'respondent' | 'both'>;
    };
    otherRequests: {
      requestOtherRelief: StarterPacketField<boolean>;
      details: StarterPacketField<string>;
      continuedOnAttachment: StarterPacketField<boolean>;
    };
    formerName: StarterPacketField<string>;
  };
  fl105: {
    childrenLivedTogetherPastFiveYears: StarterPacketField<boolean>;
    residenceHistory: StarterPacketFl105ResidenceHistoryEntry[];
    otherProceedingsKnown: StarterPacketField<boolean>;
    otherProceedings: StarterPacketFl105OtherProceeding[];
    domesticViolenceOrdersExist: StarterPacketField<boolean>;
    domesticViolenceOrders: StarterPacketFl105RestrainingOrder[];
    otherClaimantsKnown: StarterPacketField<boolean>;
    otherClaimants: StarterPacketFl105OtherClaimant[];
    declarantName: StarterPacketField<string>;
  };
  requests: {
    propertyRightsDetermination: StarterPacketField<boolean>;
    restoreFormerName: StarterPacketField<boolean>;
    childCustody: StarterPacketField<boolean>;
    visitation: StarterPacketField<boolean>;
    childSupport: StarterPacketField<boolean>;
    spousalSupport: StarterPacketField<boolean>;
  };
}

interface TemplateField {
  page: number;
  name: string;
  fullName?: string | null;
  rect: [number, number, number, number];
  type: string | null;
  tooltip: string | null;
}

const TEMPLATES_DIR = path.join(process.cwd(), 'templates', 'forms');
const FL100_TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'fl-100.template.pdf');
const FL110_TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'fl-110.template.pdf');
const FL105_TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'fl-105.template.pdf');
const FL100_FIELDS_PATH = path.join(TEMPLATES_DIR, 'fl-100.fields.json');
const FL110_FIELDS_PATH = path.join(TEMPLATES_DIR, 'fl-110.fields.json');
const FL105_FIELDS_PATH = path.join(TEMPLATES_DIR, 'fl-105.fields.json');

let templateCache: Promise<{
  fl100Bytes: Uint8Array;
  fl110Bytes: Uint8Array;
  fl105Bytes: Uint8Array;
  fl100Fields: TemplateField[];
  fl110Fields: TemplateField[];
  fl105Fields: TemplateField[];
}> | null = null;

async function loadTemplates() {
  if (!templateCache) {
    templateCache = Promise.all([
      fs.readFile(FL100_TEMPLATE_PATH),
      fs.readFile(FL110_TEMPLATE_PATH),
      fs.readFile(FL105_TEMPLATE_PATH),
      fs.readFile(FL100_FIELDS_PATH, 'utf8'),
      fs.readFile(FL110_FIELDS_PATH, 'utf8'),
      fs.readFile(FL105_FIELDS_PATH, 'utf8'),
    ]).then(([fl100Bytes, fl110Bytes, fl105Bytes, fl100FieldsRaw, fl110FieldsRaw, fl105FieldsRaw]) => ({
      fl100Bytes: new Uint8Array(fl100Bytes),
      fl110Bytes: new Uint8Array(fl110Bytes),
      fl105Bytes: new Uint8Array(fl105Bytes),
      fl100Fields: JSON.parse(fl100FieldsRaw) as TemplateField[],
      fl110Fields: JSON.parse(fl110FieldsRaw) as TemplateField[],
      fl105Fields: JSON.parse(fl105FieldsRaw) as TemplateField[],
    }));
  }

  return templateCache;
}

function mapFields(fields: TemplateField[]) {
  const map = new Map<string, TemplateField[]>();
  const add = (key: string | undefined | null, field: TemplateField) => {
    if (!key) return;
    const existing = map.get(key) ?? [];
    existing.push(field);
    map.set(key, existing);
  };

  for (const field of fields) {
    add(field.name, field);
    if (field.fullName && field.fullName !== field.name) {
      add(field.fullName, field);
    }
  }

  return map;
}

function getFieldRects(fieldMap: Map<string, TemplateField[]>, name: string) {
  return fieldMap.get(name) ?? [];
}

function sanitizeText(value: string | undefined | null) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function sanitizeMultilineText(value: string | undefined | null) {
  return (value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

function formatDateForCourt(value: string | undefined | null) {
  const raw = sanitizeText(value);
  if (!raw) return '';
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[2]}/${match[3]}/${match[1]}`;
  }
  return raw;
}

function parseNumber(value: string | undefined | null) {
  const raw = sanitizeText(value);
  if (!raw) return 0;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function qualifiesForResidency(californiaMonths: string, countyMonths: string) {
  return parseNumber(californiaMonths) >= 6 && parseNumber(countyMonths) >= 3;
}

function formatChildAge(birthDate: string | undefined | null) {
  const raw = sanitizeText(birthDate);
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const beforeBirthday = today.getMonth() < date.getMonth() || (today.getMonth() === date.getMonth() && today.getDate() < date.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? String(age) : '';
}

function parseAddress(address: string) {
  const normalized = sanitizeMultilineText(address);
  if (!normalized) {
    return { street: '', city: '', state: '', zip: '' };
  }

  const lines = normalized.split('\n').filter(Boolean);
  const street = lines[0] ?? normalized;
  const remainder = lines.slice(1).join(' ').trim();
  const cityStateZip = remainder || lines[0] || '';
  const match = cityStateZip.match(/^(.*?)(?:,\s*)?([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i);

  if (match) {
    return {
      street,
      city: match[1].trim(),
      state: match[2].toUpperCase(),
      zip: match[3],
    };
  }

  return {
    street,
    city: cityStateZip !== street ? cityStateZip : '',
    state: '',
    zip: '',
  };
}

function wrapText(text: string, maxWidth: number, font: PDFFont, size: number) {
  const paragraphs = text.split(/\n+/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }

    let current = words[0];
    for (let index = 1; index < words.length; index += 1) {
      const candidate = `${current} ${words[index]}`;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
      } else {
        lines.push(current);
        current = words[index];
      }
    }
    lines.push(current);
  }

  return lines;
}

function drawTextToRect(page: PDFPage, rect: [number, number, number, number], value: string, font: PDFFont, options?: { size?: number; multiline?: boolean; bold?: boolean }) {
  const text = options?.multiline ? sanitizeMultilineText(value) : sanitizeText(value);
  if (!text) return;

  const [x1, y1, x2, y2] = rect;
  const width = x2 - x1;
  const height = y2 - y1;
  const size = options?.size ?? Math.max(8, Math.min(11, height - 1));
  const color = rgb(0.08, 0.16, 0.28);

  if (options?.multiline) {
    const lines = wrapText(text, width - 4, font, size);
    let cursorY = y2 - size - 1;
    for (const line of lines) {
      if (cursorY < y1) break;
      page.drawText(line, {
        x: x1 + 2,
        y: cursorY,
        size,
        font,
        color,
      });
      cursorY -= size + 2;
    }
    return;
  }

  page.drawText(text, {
    x: x1 + 2,
    y: y1 + Math.max(1, (height - size) / 2 - 0.5),
    size,
    font,
    color,
    maxWidth: width - 4,
  });
}

function drawCheckMark(page: PDFPage, rect: [number, number, number, number]) {
  const [x1, y1, x2, y2] = rect;
  const pad = 1.5;
  page.drawLine({ start: { x: x1 + pad, y: y1 + pad }, end: { x: x2 - pad, y: y2 - pad }, thickness: 1.2, color: rgb(0.06, 0.14, 0.24) });
  page.drawLine({ start: { x: x1 + pad, y: y2 - pad }, end: { x: x2 - pad, y: y1 + pad }, thickness: 1.2, color: rgb(0.06, 0.14, 0.24) });
}

function fillTextFields(pages: PDFPage[], fieldMap: Map<string, TemplateField[]>, name: string, value: string, font: PDFFont, options?: { size?: number; multiline?: boolean }) {
  for (const field of getFieldRects(fieldMap, name)) {
    drawTextToRect(pages[field.page], field.rect, value, font, options);
  }
}

function fillCheckbox(pages: PDFPage[], fieldMap: Map<string, TemplateField[]>, name: string, checked: boolean) {
  if (!checked) return;
  for (const field of getFieldRects(fieldMap, name)) {
    drawCheckMark(pages[field.page], field.rect);
  }
}

function buildShortTitle(petitionerName: string, respondentName: string) {
  const petitioner = sanitizeText(petitionerName);
  const respondent = sanitizeText(respondentName);
  if (!petitioner && !respondent) return '';
  if (!petitioner) return respondent;
  if (!respondent) return petitioner;
  return `${petitioner} v. ${respondent}`;
}

function normalizeProceedingType(value: string | undefined | null): 'family' | 'guardianship' | 'other' | 'juvenile' | 'adoption' | null {
  const raw = sanitizeText(value).toLowerCase();
  if (!raw) return null;
  if (/(family|dissolution|custody|divorce)/.test(raw)) return 'family';
  if (/(guardian|probate|minor guardianship)/.test(raw)) return 'guardianship';
  if (/(juvenile|dependency|delinquency)/.test(raw)) return 'juvenile';
  if (/(adoption|adopt)/.test(raw)) return 'adoption';
  if (/(other|tribal|out[- ]?of[- ]?state)/.test(raw)) return 'other';
  return null;
}

function normalizeOrderType(value: string | undefined | null): 'criminal' | 'family' | 'juvenile' | 'other' | null {
  const raw = sanitizeText(value).toLowerCase();
  if (!raw) return null;
  if (/(criminal|police|penal)/.test(raw)) return 'criminal';
  if (/(family|dvro|domestic)/.test(raw)) return 'family';
  if (/(juvenile|dependency|child welfare)/.test(raw)) return 'juvenile';
  if (/(other|civil|tribal)/.test(raw)) return 'other';
  return null;
}

export async function generateOfficialStarterPacketPdf(workspace: StarterPacketWorkspace): Promise<Uint8Array> {
  const { fl100Bytes, fl110Bytes, fl105Bytes, fl100Fields, fl110Fields, fl105Fields } = await loadTemplates();
  const output = await PDFDocument.create();
  const fontRegular = await output.embedFont(StandardFonts.Helvetica);

  const fl100Template = await PDFDocument.load(fl100Bytes);
  const fl110Template = await PDFDocument.load(fl110Bytes);
  const fl105Template = await PDFDocument.load(fl105Bytes);
  const fl100Pages = await output.copyPages(fl100Template, fl100Template.getPageIndices());
  fl100Pages.forEach((page) => output.addPage(page));
  const fl110Pages = await output.copyPages(fl110Template, fl110Template.getPageIndices());
  fl110Pages.forEach((page) => output.addPage(page));
  const fl105Pages = await output.copyPages(fl105Template, fl105Template.getPageIndices());

  const fl100FieldMap = mapFields(fl100Fields);
  const fl110FieldMap = mapFields(fl110Fields);
  const fl105FieldMap = mapFields(fl105Fields);

  const petitionerName = sanitizeText(workspace.petitionerName?.value);
  const respondentName = sanitizeText(workspace.respondentName?.value);
  const caseNumber = sanitizeText(workspace.caseNumber?.value);
  const filingCounty = sanitizeText(workspace.filingCounty?.value);
  const courtStreet = sanitizeText(workspace.courtStreet?.value);
  const courtMailingAddress = sanitizeText(workspace.courtMailingAddress?.value);
  const courtCityZip = sanitizeText(workspace.courtCityZip?.value);
  const courtBranch = sanitizeText(workspace.courtBranch?.value);
  const petitionerEmail = sanitizeText(workspace.petitionerEmail?.value);
  const petitionerPhone = sanitizeText(workspace.petitionerPhone?.value);
  const petitionerAddress = sanitizeMultilineText(workspace.petitionerAddress?.value);
  const address = parseAddress(petitionerAddress);
  const marriageDate = formatDateForCourt(workspace.marriageDate?.value);
  const separationDate = formatDateForCourt(workspace.separationDate?.value);
  const proceedingType = workspace.fl100?.proceedingType?.value ?? 'dissolution';
  const relationshipType = workspace.fl100?.relationshipType?.value ?? 'marriage';
  const domesticPartnershipEstablishment = workspace.fl100?.domesticPartnership?.establishment?.value ?? 'unspecified';
  const domesticPartnershipCaliforniaResidencyException = Boolean(workspace.fl100?.domesticPartnership?.californiaResidencyException?.value);
  const sameSexMarriageJurisdictionException = Boolean(workspace.fl100?.domesticPartnership?.sameSexMarriageJurisdictionException?.value);
  const nullityBasedOnIncest = Boolean(workspace.fl100?.nullity?.basedOnIncest?.value);
  const nullityBasedOnBigamy = Boolean(workspace.fl100?.nullity?.basedOnBigamy?.value);
  const nullityBasedOnAge = Boolean(workspace.fl100?.nullity?.basedOnAge?.value);
  const nullityBasedOnPriorExistingMarriageOrPartnership = Boolean(workspace.fl100?.nullity?.basedOnPriorExistingMarriageOrPartnership?.value);
  const nullityBasedOnUnsoundMind = Boolean(workspace.fl100?.nullity?.basedOnUnsoundMind?.value);
  const nullityBasedOnFraud = Boolean(workspace.fl100?.nullity?.basedOnFraud?.value);
  const nullityBasedOnForce = Boolean(workspace.fl100?.nullity?.basedOnForce?.value);
  const nullityBasedOnPhysicalIncapacity = Boolean(workspace.fl100?.nullity?.basedOnPhysicalIncapacity?.value);
  const hasVoidNullityBasis = nullityBasedOnIncest || nullityBasedOnBigamy;
  const hasVoidableNullityBasis = nullityBasedOnAge
    || nullityBasedOnPriorExistingMarriageOrPartnership
    || nullityBasedOnUnsoundMind
    || nullityBasedOnFraud
    || nullityBasedOnForce
    || nullityBasedOnPhysicalIncapacity;
  const isDissolutionProceeding = proceedingType === 'dissolution';
  const isLegalSeparationProceeding = proceedingType === 'legal_separation';
  const isNullityProceeding = proceedingType === 'nullity';
  const isDomesticPartnershipProceeding = relationshipType === 'domestic_partnership' || relationshipType === 'both';
  const isMarriageProceeding = relationshipType === 'marriage' || relationshipType === 'both';
  const hasMinorChildren = Boolean(workspace.hasMinorChildren?.value);
  const petitionerQualifies = qualifiesForResidency(
    workspace.fl100?.residency?.petitionerCaliforniaMonths?.value,
    workspace.fl100?.residency?.petitionerCountyMonths?.value,
  );
  const respondentQualifies = qualifiesForResidency(
    workspace.fl100?.residency?.respondentCaliforniaMonths?.value,
    workspace.fl100?.residency?.respondentCountyMonths?.value,
  );

  const wantsCommunityProperty = Boolean(
    workspace.requests?.propertyRightsDetermination?.value || workspace.fl100?.propertyDeclarations?.communityAndQuasiCommunity?.value,
  );
  const wantsSeparateProperty = Boolean(workspace.fl100?.propertyDeclarations?.separateProperty?.value);
  const spousalSupportDirection = workspace.fl100?.spousalSupport?.supportOrderDirection?.value ?? 'none';
  const spousalSupportReserveJurisdictionFor = workspace.fl100?.spousalSupport?.reserveJurisdictionFor?.value ?? 'none';
  const spousalSupportTerminateJurisdictionFor = workspace.fl100?.spousalSupport?.terminateJurisdictionFor?.value ?? 'none';
  const spousalSupportDetails = sanitizeMultilineText(workspace.fl100?.spousalSupport?.details?.value);
  const childSupportAdditionalOrdersRequested = Boolean(workspace.fl100?.childSupport?.requestAdditionalOrders?.value);
  const childSupportAdditionalOrdersDetails = sanitizeMultilineText(workspace.fl100?.childSupport?.additionalOrdersDetails?.value);
  const legalCustodyTo = workspace.fl100?.childCustodyVisitation?.legalCustodyTo?.value ?? 'none';
  const physicalCustodyTo = workspace.fl100?.childCustodyVisitation?.physicalCustodyTo?.value ?? 'none';
  const visitationTo = workspace.fl100?.childCustodyVisitation?.visitationTo?.value ?? 'none';
  const custodyRequested = Boolean(
    workspace.requests?.childCustody?.value
    || legalCustodyTo !== 'none'
    || physicalCustodyTo !== 'none',
  );
  const visitationRequested = Boolean(workspace.requests?.visitation?.value || visitationTo !== 'none');
  const custodyAttachments = {
    formFl311: Boolean(workspace.fl100?.childCustodyVisitation?.attachments?.formFl311?.value),
    formFl312: Boolean(workspace.fl100?.childCustodyVisitation?.attachments?.formFl312?.value),
    formFl341c: Boolean(workspace.fl100?.childCustodyVisitation?.attachments?.formFl341c?.value),
    formFl341d: Boolean(workspace.fl100?.childCustodyVisitation?.attachments?.formFl341d?.value),
    formFl341e: Boolean(workspace.fl100?.childCustodyVisitation?.attachments?.formFl341e?.value),
    attachment6c1: Boolean(workspace.fl100?.childCustodyVisitation?.attachments?.attachment6c1?.value),
  };
  const attorneyFeesRequested = Boolean(workspace.fl100?.attorneyFeesAndCosts?.requestAward?.value);
  const attorneyFeesPayableBy = workspace.fl100?.attorneyFeesAndCosts?.payableBy?.value ?? 'none';
  const otherRequestsSelected = Boolean(workspace.fl100?.otherRequests?.requestOtherRelief?.value);
  const otherRequestsDetails = sanitizeMultilineText(workspace.fl100?.otherRequests?.details?.value);
  const otherRequestsContinuedOnAttachment = Boolean(workspace.fl100?.otherRequests?.continuedOnAttachment?.value);
  const wantsOtherRequests = Boolean(otherRequestsSelected || otherRequestsDetails || otherRequestsContinuedOnAttachment);
  const wantsSpousalSupport = Boolean(
    workspace.requests?.spousalSupport?.value
    || spousalSupportDirection !== 'none'
    || spousalSupportReserveJurisdictionFor !== 'none'
    || spousalSupportTerminateJurisdictionFor !== 'none'
    || spousalSupportDetails,
  );
  const voluntaryDeclarationOfParentageSigned = Boolean(workspace.fl100?.spousalSupport?.voluntaryDeclarationOfParentageSigned?.value);
  const communityPropertyDetails = sanitizeMultilineText(workspace.fl100?.propertyDeclarations?.communityAndQuasiCommunityDetails?.value);
  const separatePropertyDetails = sanitizeMultilineText(workspace.fl100?.propertyDeclarations?.separatePropertyDetails?.value);
  const separatePropertyAwardedTo = sanitizeText(workspace.fl100?.propertyDeclarations?.separatePropertyAwardedTo?.value);
  const wantsFormerNameRestore = Boolean(workspace.requests?.restoreFormerName?.value);
  const shortTitle = buildShortTitle(petitionerName, respondentName);
  const fl105 = workspace.fl105;

  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].CourtInfo[0].CrtCounty_ft[0]', filingCounty, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].CourtInfo[0].Street_ft[0]', courtStreet, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].CourtInfo[0].MailingAdd_ft[0]', courtMailingAddress, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].CourtInfo[0].CityZip_ft[0]', courtCityZip, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].CourtInfo[0].Branch_ft[0]', courtBranch, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].CaseNumber[0].CaseNumber_ft[0]', caseNumber, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].CaseNumber[0].CaseNumber_ft[0]', caseNumber, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].CaseNumber[0].CaseNumber_ft[0]', caseNumber, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'Party1_ft[0]', petitionerName, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'Party2_ft[0]', respondentName, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].AttyName_ft[0]', petitionerName, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].AttyStreet_ft[0]', address.street, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].AttyCity_ft[0]', address.city, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].AttyState_ft[0]', address.state, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].AttyZip_ft[0]', address.zip, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].Phone_ft[0]', petitionerPhone, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].Email_ft[0]', petitionerEmail, fontRegular, { size: 8 });
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].AttyFor_ft[0]', petitionerName ? `${petitionerName} (in pro per)` : 'Petitioner in pro per', fontRegular, { size: 8 });
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].PetitionersResidence_tf[0]', filingCounty, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].RespondentsResidence_tf[0]', filingCounty, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].DateOfMarriage_dt[0]', marriageDate, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].DateOfSeparation_dt[0]', separationDate, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].PrintPetitionerName_tf[0]', petitionerName, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].PrintPetitionerAttorneyName_tf[0]', petitionerName, fontRegular);

  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].DissolutionOf_cb[0]', isDissolutionProceeding);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].LegalSeparationOf_cb[0]', isLegalSeparationProceeding);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].NullityOf_cb[0]', isNullityProceeding);
  fillCheckbox(
    fl100Pages,
    fl100FieldMap,
    isDissolutionProceeding
      ? 'FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].Marriage_cb[0]'
      : isLegalSeparationProceeding
        ? 'FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].Marriage_cb[2]'
        : 'FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].Marriage_cb[1]',
    relationshipType === 'marriage' || relationshipType === 'both',
  );
  fillCheckbox(
    fl100Pages,
    fl100FieldMap,
    isDissolutionProceeding
      ? 'FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].DomesticPartnership_cb[0]'
      : isLegalSeparationProceeding
        ? 'FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].DomesticPartnership_cb[2]'
        : 'FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].DomesticPartnership_cb[1]',
    relationshipType === 'domestic_partnership' || relationshipType === 'both',
  );
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].WeAreMarried_cb[0]', relationshipType === 'marriage' || relationshipType === 'both');
  fillCheckbox(
    fl100Pages,
    fl100FieldMap,
    'FL-100[0].Page1[0].DPEstablishedInCalifornia[0]',
    isDomesticPartnershipProceeding && domesticPartnershipEstablishment === 'established_in_california',
  );
  fillCheckbox(
    fl100Pages,
    fl100FieldMap,
    'FL-100[0].Page1[0].DPNOTEstablishedinCA_cb[0]',
    isDomesticPartnershipProceeding && domesticPartnershipEstablishment === 'not_established_in_california',
  );
  fillCheckbox(
    fl100Pages,
    fl100FieldMap,
    'FL-100[0].Page1[0].DPNOTEstablishedinCA_cb[1]',
    isDomesticPartnershipProceeding
      && domesticPartnershipEstablishment === 'not_established_in_california'
      && domesticPartnershipCaliforniaResidencyException,
  );
  fillCheckbox(
    fl100Pages,
    fl100FieldMap,
    'FL-100[0].Page1[0].SameSexMarriedInCA_cb[0]',
    isMarriageProceeding && sameSexMarriageJurisdictionException,
  );
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].PetitionerMeetsResidencyReqs_cb[0]', isDissolutionProceeding && petitionerQualifies);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].RespondentMeetsResidencyReqs_cb[0]', isDissolutionProceeding && respondentQualifies);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].SepTypeDef_cb[1]', isDissolutionProceeding);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].SepTypeDef_cb[0]', isLegalSeparationProceeding);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].SepBasis_cb[0]', !isNullityProceeding && Boolean(workspace.fl100?.legalGrounds?.irreconcilableDifferences?.value));
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].SepBasis_cb[1]', !isNullityProceeding && Boolean(workspace.fl100?.legalGrounds?.permanentLegalIncapacity?.value));
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].Nullity_cb[0]', isNullityProceeding && hasVoidNullityBasis);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].BasedOnIncest_cb[0]', isNullityProceeding && nullityBasedOnIncest);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].BasedOnBigamy_cb[0]', isNullityProceeding && nullityBasedOnBigamy);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].NullityofVoidableMarriageOrDP_cb[0]', isNullityProceeding && hasVoidableNullityBasis);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].BasedonAge_cb[0]', isNullityProceeding && nullityBasedOnAge);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].PriorExistingMarriageOrDP_cb[0]', isNullityProceeding && nullityBasedOnPriorExistingMarriageOrPartnership);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].BasedOnUnsoundMind_cb[0]', isNullityProceeding && nullityBasedOnUnsoundMind);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].BasedonFraud_cb[0]', isNullityProceeding && nullityBasedOnFraud);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].BasedOnForce_cb[0]', isNullityProceeding && nullityBasedOnForce);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].BasedonPhysicalIncapacity_cb[0]', isNullityProceeding && nullityBasedOnPhysicalIncapacity);

  if (!hasMinorChildren) {
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].ThereAreNoMinorChildren_cb[0]', true);
  } else {
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].MinorChildren_sf[0].MinorChildrenList_cb[0]', true);
    workspace.children.slice(0, 4).forEach((child, index) => {
      const number = index + 1;
      fillTextFields(fl100Pages, fl100FieldMap, `FL-100[0].Page1[0].MinorChildren_sf[0].Child${number}Name_tf[0]`, sanitizeText(child.fullName?.value), fontRegular, { size: 8 });
      fillTextFields(fl100Pages, fl100FieldMap, `FL-100[0].Page1[0].MinorChildren_sf[0].Child${number}Birthdate_dt[0]`, formatDateForCourt(child.birthDate?.value), fontRegular, { size: 8 });
      fillTextFields(fl100Pages, fl100FieldMap, `FL-100[0].Page1[0].MinorChildren_sf[0].Child${number}Age_tf[0]`, formatChildAge(child.birthDate?.value), fontRegular, { size: 8 });
    });
  }
  if (custodyRequested) {
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].ToPetitioner_cb[0]', legalCustodyTo === 'petitioner');
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].ToRespondent_cb[0]', legalCustodyTo === 'respondent');
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].ToBothJointly_cb[0]', legalCustodyTo === 'joint');
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].ToOther_cb[0]', legalCustodyTo === 'other');
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].ToPetitioner_cb[1]', physicalCustodyTo === 'petitioner');
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].ToRespondent_cb[1]', physicalCustodyTo === 'respondent');
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].ToBothJointly_cb[1]', physicalCustodyTo === 'joint');
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].ToOther_cb[1]', physicalCustodyTo === 'other');
  }
  if (visitationRequested) {
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].ForPetitioner_cb[0]', visitationTo === 'petitioner');
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].ForRespondent_cb[0]', visitationTo === 'respondent');
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].ForOther_cb[0]', visitationTo === 'other');
  }
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].FormFL-311_cb[0]', custodyAttachments.formFl311);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].FormFL-312_cb[0]', custodyAttachments.formFl312);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].FormFL-341C_cb[0]', custodyAttachments.formFl341c);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].FormFL-341D_cb[0]', custodyAttachments.formFl341d);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].FormFL-341E[0]', custodyAttachments.formFl341e);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].Attachment6e1[0]', custodyAttachments.attachment6c1);

  if (wantsSpousalSupport) {
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].PaySupport_cb[0]', true);
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].PaySupporttoPetitioner_cb[0]', spousalSupportDirection === 'respondent_to_petitioner');
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].PaySupportoRespondent_cb[0]', spousalSupportDirection === 'petitioner_to_respondent');
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].PartiesSignedVoluntaryPaternityDec_cb[0]', spousalSupportReserveJurisdictionFor !== 'none');
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].ReserveJurixSupportPet_cb[0]', spousalSupportReserveJurisdictionFor === 'petitioner' || spousalSupportReserveJurisdictionFor === 'both');
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].ReserveJurixSupportResp_cb[0]', spousalSupportReserveJurisdictionFor === 'respondent' || spousalSupportReserveJurisdictionFor === 'both');
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].EndJurixReSupport[0]', spousalSupportTerminateJurisdictionFor !== 'none');
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].EndJurixRePetitioner_cb[0]', spousalSupportTerminateJurisdictionFor === 'petitioner' || spousalSupportTerminateJurisdictionFor === 'both');
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].EndJurixReRespondent_cb[0]', spousalSupportTerminateJurisdictionFor === 'respondent' || spousalSupportTerminateJurisdictionFor === 'both');
  }
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].PartiesSignedVoluntaryPaternityDec_cb[0]', voluntaryDeclarationOfParentageSigned);
  if (spousalSupportDetails) {
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].Other_cb[0]', true);
    fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].OtherSupport_ft[0]', spousalSupportDetails, fontRegular, { size: 8, multiline: true });
  }
  if (childSupportAdditionalOrdersRequested || childSupportAdditionalOrdersDetails) {
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].OtherChildSupport_cb[0]', true);
    fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].ChildSupport_ft[0]', childSupportAdditionalOrdersDetails, fontRegular, { size: 8, multiline: true });
  }

  if (wantsCommunityProperty) {
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].CommQuasiProperty_sf[0].PropertyListed_cb[0]', true);
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].CommQuasiProperty_sf[0].WhereCPListed_cb[2]', true);
    fillTextFields(
      fl100Pages,
      fl100FieldMap,
      'FL-100[0].Page3[0].CommQuasiProperty_sf[0].ListProperty_ft[0]',
      communityPropertyDetails,
      fontRegular,
      { size: 8 },
    );
  } else {
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].NoCommOrQuasiCommProperty_cb[0]', true);
  }

  if (wantsSeparateProperty) {
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].ConfirmSeparateProperty_cb[0]', true);
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].WhereSPListed_cb[2]', true);
    fillTextFields(
      fl100Pages,
      fl100FieldMap,
      'FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].SeparatePropertyList1_tf[0]',
      separatePropertyDetails,
      fontRegular,
      { size: 8 },
    );
    fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].ConfirmPropertyList1To_tf[0]', separatePropertyAwardedTo, fontRegular, { size: 8 });
  } else {
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].NoSeparateProperty_cb[0]', true);
  }

  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].RestoreFormerName_cb[0]', wantsFormerNameRestore);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].SpecifyFormerName_tf[0]', sanitizeText(workspace.fl100?.formerName?.value), fontRegular);
  if (attorneyFeesRequested || attorneyFeesPayableBy !== 'none') {
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].FeesAndCost_cb[0]', true);
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].AttyFeePay_cb[1]', attorneyFeesPayableBy === 'petitioner' || attorneyFeesPayableBy === 'both');
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].AttyFeePay_cb[0]', attorneyFeesPayableBy === 'respondent' || attorneyFeesPayableBy === 'both');
  }
  if (wantsOtherRequests) {
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].OtherRequests_cb[0]', true);
    fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].SpecifyOtherRequests_tf[0]', otherRequestsDetails, fontRegular, { size: 8, multiline: true });
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].ContinuedOnAttachment_cb[0]', otherRequestsContinuedOnAttachment);
  }

  fillTextFields(fl110Pages, fl110FieldMap, 'FL-110[0].Page1[0].TextField2[0]', respondentName, fontRegular, { size: 10 });
  fillTextFields(fl110Pages, fl110FieldMap, 'FL-110[0].Page1[0].TextField2[1]', petitionerName, fontRegular, { size: 10 });
  fillTextFields(fl110Pages, fl110FieldMap, 'FL-110[0].Page1[0].#field[7]', respondentName, fontRegular, { size: 10 });
  fillTextFields(fl110Pages, fl110FieldMap, 'FL-110[0].Page1[0].#field[8]', petitionerName, fontRegular, { size: 10 });
  fillTextFields(
    fl110Pages,
    fl110FieldMap,
    'FL-110[0].Page1[0].T89[0]',
    [petitionerName, petitionerAddress, petitionerPhone ? `Phone: ${petitionerPhone}` : '', petitionerEmail ? `Email: ${petitionerEmail}` : '']
      .filter(Boolean)
      .join('\n'),
    fontRegular,
    { size: 9, multiline: true },
  );

  if (hasMinorChildren) {
    fl105Pages.forEach((page) => output.addPage(page));

    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].AttyName_ft[0]', petitionerName, fontRegular);
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].AttyStreet_ft[0]', address.street, fontRegular, { size: 8 });
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].AttyCity_ft[0]', address.city, fontRegular, { size: 8 });
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].AttyState_ft[0]', address.state, fontRegular, { size: 8 });
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].AttyZip_ft[0]', address.zip, fontRegular, { size: 8 });
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].Phone[0]', petitionerPhone, fontRegular, { size: 8 });
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].Email[0]', petitionerEmail, fontRegular, { size: 8 });
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].Name[0]', petitionerName ? `${petitionerName} (in pro per)` : '', fontRegular, { size: 8 });

    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].CrtInfo[0].CrtCounty[0]', filingCounty, fontRegular);
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].CrtInfo[0].CrtStreet[0]', courtStreet, fontRegular, { size: 8 });
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].CrtInfo[0].CrtMailingAdd[0]', courtMailingAddress, fontRegular, { size: 8 });
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].CrtInfo[0].CrtCityZip[0]', courtCityZip, fontRegular, { size: 8 });
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].CrtInfo[0].CrtBranch[0]', courtBranch, fontRegular, { size: 8 });
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].ProbateParty[0].Party1[0]', petitionerName, fontRegular, { size: 8 });
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].ProbateParty[0].Party2[0]', respondentName, fontRegular, { size: 8 });
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].CaseNo[0].CaseNumber[0]', caseNumber, fontRegular);
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page2[0].P2Caption[0].ShortTitle[0].ShortTitle_ft[0]', shortTitle, fontRegular, { size: 8 });
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page2[0].P2Caption[0].CaseNumber[0].CaseNumber[0]', caseNumber, fontRegular);

    fillCheckbox(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].List1[0].Li1[0].Party[0].PartyRepCB[0]', true);
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].List2[0].Li1[0].NumChildren[0]', String(Math.min(workspace.children.length, 4)), fontRegular);

    workspace.children.slice(0, 4).forEach((child, index) => {
      const row = index + 1;
      const childNameField = row === 1
        ? `FL-105[0].Page1[0].List2[0].Li1[0].Table[0].Row1[0].TextField7[0]`
        : `FL-105[0].Page1[0].List2[0].Li1[0].Table[0].Row${row}[0].TextField8[0]`;
      fillTextFields(fl105Pages, fl105FieldMap, childNameField, sanitizeText(child.fullName?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page1[0].List2[0].Li1[0].Table[0].Row${row}[0].TextField1[0]`, formatDateForCourt(child.birthDate?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page1[0].List2[0].Li1[0].Table[0].Row${row}[0].TextField2[0]`, sanitizeText(child.placeOfBirth?.value), fontRegular, { size: 8 });
    });

    fillCheckbox(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].List2[0].Li1[0].CheckBox19[0]', workspace.children.length > 4);
    fillCheckbox(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].List3[0].Li1[0].OneManyCB[0]', Boolean(fl105?.childrenLivedTogetherPastFiveYears?.value));
    fillCheckbox(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].List3[0].Li2[0].KidsLiveApart[0].OneManyCB[0]', !fl105?.childrenLivedTogetherPastFiveYears?.value);

    (fl105?.residenceHistory ?? []).slice(0, 5).forEach((entry, index) => {
      const row = index + 1;
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page1[0].List3[0].Li1[0].Table3a[0].Row${row}[0].From${row}[0]`, formatDateForCourt(entry.fromDate?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page1[0].List3[0].Li1[0].Table3a[0].Row${row}[0].To${row}[0]`, formatDateForCourt(entry.toDate?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page1[0].List3[0].Li1[0].Table3a[0].Row${row}[0].Residence${row}[0]`, sanitizeText(entry.residence?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page1[0].List3[0].Li1[0].Table3a[0].Row${row}[0].PersonStreet${row}[0]`, sanitizeText(entry.personAndAddress?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page1[0].List3[0].Li1[0].Table3a[0].Row${row}[0].Relationship${row}[0]`, sanitizeText(entry.relationship?.value), fontRegular, { size: 8 });
    });

    const proceedings = (fl105?.otherProceedings ?? []).filter((entry) => {
      return Boolean(
        sanitizeText(entry.proceedingType?.value) ||
        sanitizeText(entry.caseNumber?.value) ||
        sanitizeText(entry.court?.value) ||
        sanitizeText(entry.orderDate?.value) ||
        sanitizeText(entry.childNames?.value) ||
        sanitizeText(entry.connection?.value) ||
        sanitizeText(entry.status?.value),
      );
    });
    const proceedingsKnown = Boolean(fl105?.otherProceedingsKnown?.value || proceedings.length > 0);
    fillCheckbox(fl105Pages, fl105FieldMap, 'FL-105[0].Page2[0].Item4subformset[0].List4[0].Li1[0].OtherCaseYN[0]', proceedingsKnown);
    fillCheckbox(fl105Pages, fl105FieldMap, 'FL-105[0].Page2[0].Item4subformset[0].List4[0].Li1[0].OtherCaseYN[1]', !proceedingsKnown);

    const proceedingSlots = [
      { key: 'family' as const, row: '4a', checkbox: 'FL-105[0].Page2[0].Item4subformset[0].List4[0].Li1[0].Table4abc[0].Row4a[0].PGCell4a[0].FamilyCB[0]' },
      { key: 'guardianship' as const, row: '4b', checkbox: 'FL-105[0].Page2[0].Item4subformset[0].List4[0].Li1[0].Table4abc[0].Row4b[0].PGCell4b[0].PGCB4b[0]' },
      { key: 'other' as const, row: '4c', checkbox: 'FL-105[0].Page2[0].Item4subformset[0].List4[0].Li1[0].Table4abc[0].Row4c[0].PGCell4c[0].OtherCB[0]' },
      { key: 'juvenile' as const, row: '4d', checkbox: 'FL-105[0].Page2[0].Item4subformset[0].List4[0].Li1[0].Table4de[0].Row4d[0].PGCell4d[0].JuvCB[0]' },
      { key: 'adoption' as const, row: '4e', checkbox: 'FL-105[0].Page2[0].Item4subformset[0].List4[0].Li1[0].Table4de[0].Row4e[0].PGCell4e[0].AdoptCB[0]' },
    ];

    const unassignedProceedings = proceedings.slice(0, 5);
    for (const slot of proceedingSlots) {
      if (unassignedProceedings.length === 0) break;
      const targetIndex = unassignedProceedings.findIndex((entry) => normalizeProceedingType(entry.proceedingType?.value) === slot.key);
      const entry = targetIndex >= 0 ? unassignedProceedings.splice(targetIndex, 1)[0] : unassignedProceedings.shift();
      if (!entry) continue;

      fillCheckbox(fl105Pages, fl105FieldMap, slot.checkbox, true);
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].Item4subformset[0].List4[0].Li1[0].Table4abc[0].Row${slot.row}[0].CaseNo${slot.row}[0]`, sanitizeText(entry.caseNumber?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].Item4subformset[0].List4[0].Li1[0].Table4abc[0].Row${slot.row}[0].Court${slot.row}[0]`, sanitizeText(entry.court?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].Item4subformset[0].List4[0].Li1[0].Table4abc[0].Row${slot.row}[0].Date${slot.row}[0]`, formatDateForCourt(entry.orderDate?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].Item4subformset[0].List4[0].Li1[0].Table4abc[0].Row${slot.row}[0].ChildName${slot.row}[0]`, sanitizeText(entry.childNames?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].Item4subformset[0].List4[0].Li1[0].Table4abc[0].Row${slot.row}[0].YourRole${slot.row}[0]`, sanitizeText(entry.connection?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].Item4subformset[0].List4[0].Li1[0].Table4abc[0].Row${slot.row}[0].CaseStatus${slot.row}[0]`, sanitizeText(entry.status?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].Item4subformset[0].List4[0].Li1[0].Table4de[0].Row${slot.row}[0].CaseNo${slot.row}[0]`, sanitizeText(entry.caseNumber?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].Item4subformset[0].List4[0].Li1[0].Table4de[0].Row${slot.row}[0].Court${slot.row}[0]`, sanitizeText(entry.court?.value), fontRegular, { size: 8 });
    }

    const restrainingOrders = (fl105?.domesticViolenceOrders ?? []).filter((entry) => {
      return Boolean(
        sanitizeText(entry.orderType?.value) ||
        sanitizeText(entry.county?.value) ||
        sanitizeText(entry.stateOrTribe?.value) ||
        sanitizeText(entry.caseNumber?.value) ||
        sanitizeText(entry.expirationDate?.value),
      );
    });
    const restrainingKnown = Boolean(fl105?.domesticViolenceOrdersExist?.value || restrainingOrders.length > 0);
    fillCheckbox(fl105Pages, fl105FieldMap, 'FL-105[0].Page2[0].Item5subformset[0].List5[0].Li1[0].DVROCB[0].DVRO_CB[0]', restrainingKnown);

    const orderRows = [
      { key: 'criminal' as const, row: '5a', checkbox: 'FL-105[0].Page2[0].Item5subformset[0].List5[0].Li1[0].Table5[0].Row5a[0].ROCell5a[0].CrimPO_CB5a[0]' },
      { key: 'family' as const, row: '5b', checkbox: 'FL-105[0].Page2[0].Item5subformset[0].List5[0].Li1[0].Table5[0].Row5b[0].ROCell5b[0].FamRO_CB5b[0]' },
      { key: 'juvenile' as const, row: '5c', checkbox: 'FL-105[0].Page2[0].Item5subformset[0].List5[0].Li1[0].Table5[0].Row5c[0].ROCell5c[0].JuvRO_CB5c[0]' },
      { key: 'other' as const, row: '5d', checkbox: 'FL-105[0].Page2[0].Item5subformset[0].List5[0].Li1[0].Table5[0].Row5d[0].ROCell5d[0].OtherRO_CB5d[0]' },
    ];
    const unassignedOrders = restrainingOrders.slice(0, 4);
    for (const slot of orderRows) {
      if (unassignedOrders.length === 0) break;
      const targetIndex = unassignedOrders.findIndex((entry) => normalizeOrderType(entry.orderType?.value) === slot.key);
      const entry = targetIndex >= 0 ? unassignedOrders.splice(targetIndex, 1)[0] : unassignedOrders.shift();
      if (!entry) continue;

      fillCheckbox(fl105Pages, fl105FieldMap, slot.checkbox, true);
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].Item5subformset[0].List5[0].Li1[0].Table5[0].Row${slot.row}[0].County${slot.row}[0]`, sanitizeText(entry.county?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].Item5subformset[0].List5[0].Li1[0].Table5[0].Row${slot.row}[0].StateTribe${slot.row}[0]`, sanitizeText(entry.stateOrTribe?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].Item5subformset[0].List5[0].Li1[0].Table5[0].Row${slot.row}[0].CaseNo${slot.row}[0]`, sanitizeText(entry.caseNumber?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].Item5subformset[0].List5[0].Li1[0].Table5[0].Row${slot.row}[0].ExpDate${slot.row}[0]`, formatDateForCourt(entry.expirationDate?.value), fontRegular, { size: 8 });
    }

    const claimants = (fl105?.otherClaimants ?? []).filter((entry) => {
      return Boolean(
        sanitizeText(entry.nameAndAddress?.value) ||
        sanitizeText(entry.childNames?.value) ||
        entry.hasPhysicalCustody?.value ||
        entry.claimsCustodyRights?.value ||
        entry.claimsVisitationRights?.value,
      );
    });
    const claimantsKnown = Boolean(fl105?.otherClaimantsKnown?.value || claimants.length > 0);
    fillCheckbox(fl105Pages, fl105FieldMap, 'FL-105[0].Page2[0].List6[0].OtherPersonYN[0]', claimantsKnown);
    fillCheckbox(fl105Pages, fl105FieldMap, 'FL-105[0].Page2[0].List6[0].OtherPersonYN[1]', !claimantsKnown);

    claimants.slice(0, 3).forEach((entry, index) => {
      const row = ['a', 'b', 'c'][index];
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].List6[0].Li${index + 1}[0].Name6${row}[0]`, sanitizeText(entry.nameAndAddress?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].List6[0].Li${index + 1}[0].Child6${row}[0]`, sanitizeText(entry.childNames?.value), fontRegular, { size: 8 });
      fillCheckbox(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].List6[0].Li${index + 1}[0].CheckBox6${row}1[0]`, Boolean(entry.hasPhysicalCustody?.value));
      fillCheckbox(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].List6[0].Li${index + 1}[0].CheckBox6${row}2[0]`, Boolean(entry.claimsCustodyRights?.value));
      fillCheckbox(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].List6[0].Li${index + 1}[0].CheckBox6${row}3[0]`, Boolean(entry.claimsVisitationRights?.value));
    });

    const declarantName = sanitizeText(fl105?.declarantName?.value || petitionerName);
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page2[0].PoPDec[0].PrintName[0]', declarantName, fontRegular);
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page2[0].PoPDec[0].SigDate[0]', formatDateForCourt(new Date().toISOString().slice(0, 10)), fontRegular);
  }

  return output.save();
}
