import { promises as fs } from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

interface StarterPacketField<T> {
  value: T;
}

interface StarterPacketChild {
  fullName: StarterPacketField<string>;
  birthDate: StarterPacketField<string>;
}

interface StarterPacketWorkspace {
  filingCounty: StarterPacketField<string>;
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
    relationshipType: StarterPacketField<'marriage' | 'domestic_partnership' | 'both'>;
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
      separateProperty: StarterPacketField<boolean>;
    };
    formerName: StarterPacketField<string>;
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
const FL100_FIELDS_PATH = path.join(TEMPLATES_DIR, 'fl-100.fields.json');
const FL110_FIELDS_PATH = path.join(TEMPLATES_DIR, 'fl-110.fields.json');

let templateCache: Promise<{
  fl100Bytes: Uint8Array;
  fl110Bytes: Uint8Array;
  fl100Fields: TemplateField[];
  fl110Fields: TemplateField[];
}> | null = null;

async function loadTemplates() {
  if (!templateCache) {
    templateCache = Promise.all([
      fs.readFile(FL100_TEMPLATE_PATH),
      fs.readFile(FL110_TEMPLATE_PATH),
      fs.readFile(FL100_FIELDS_PATH, 'utf8'),
      fs.readFile(FL110_FIELDS_PATH, 'utf8'),
    ]).then(([fl100Bytes, fl110Bytes, fl100FieldsRaw, fl110FieldsRaw]) => ({
      fl100Bytes: new Uint8Array(fl100Bytes),
      fl110Bytes: new Uint8Array(fl110Bytes),
      fl100Fields: JSON.parse(fl100FieldsRaw) as TemplateField[],
      fl110Fields: JSON.parse(fl110FieldsRaw) as TemplateField[],
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

export async function generateOfficialStarterPacketPdf(workspace: StarterPacketWorkspace): Promise<Uint8Array> {
  const { fl100Bytes, fl110Bytes, fl100Fields, fl110Fields } = await loadTemplates();
  const output = await PDFDocument.create();
  const fontRegular = await output.embedFont(StandardFonts.Helvetica);

  const fl100Template = await PDFDocument.load(fl100Bytes);
  const fl110Template = await PDFDocument.load(fl110Bytes);
  const fl100Pages = await output.copyPages(fl100Template, fl100Template.getPageIndices());
  fl100Pages.forEach((page) => output.addPage(page));
  const fl110Pages = await output.copyPages(fl110Template, fl110Template.getPageIndices());
  fl110Pages.forEach((page) => output.addPage(page));

  const fl100FieldMap = mapFields(fl100Fields);
  const fl110FieldMap = mapFields(fl110Fields);

  const petitionerName = sanitizeText(workspace.petitionerName?.value);
  const respondentName = sanitizeText(workspace.respondentName?.value);
  const filingCounty = sanitizeText(workspace.filingCounty?.value);
  const petitionerEmail = sanitizeText(workspace.petitionerEmail?.value);
  const petitionerPhone = sanitizeText(workspace.petitionerPhone?.value);
  const petitionerAddress = sanitizeMultilineText(workspace.petitionerAddress?.value);
  const address = parseAddress(petitionerAddress);
  const marriageDate = formatDateForCourt(workspace.marriageDate?.value);
  const separationDate = formatDateForCourt(workspace.separationDate?.value);
  const relationshipType = workspace.fl100?.relationshipType?.value ?? 'marriage';
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
  const wantsSpousalSupport = Boolean(workspace.requests?.spousalSupport?.value);
  const wantsFormerNameRestore = Boolean(workspace.requests?.restoreFormerName?.value);

  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].CourtInfo[0].CrtCounty_ft[0]', filingCounty, fontRegular);
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

  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].DissolutionOf_cb[0]', true);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].Marriage_cb[0]', relationshipType === 'marriage' || relationshipType === 'both');
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].DomesticPartnership_cb[0]', relationshipType === 'domestic_partnership' || relationshipType === 'both');
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].WeAreMarried_cb[0]', relationshipType === 'marriage' || relationshipType === 'both');
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].DPEstablishedInCalifornia[0]', relationshipType === 'domestic_partnership' || relationshipType === 'both');
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].PetitionerMeetsResidencyReqs_cb[0]', petitionerQualifies);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].RespondentMeetsResidencyReqs_cb[0]', respondentQualifies);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].SepBasis_cb[0]', Boolean(workspace.fl100?.legalGrounds?.irreconcilableDifferences?.value));
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].SepBasis_cb[1]', Boolean(workspace.fl100?.legalGrounds?.permanentLegalIncapacity?.value));

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

  if (wantsSpousalSupport) {
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].PaySupport_cb[0]', true);
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].PaySupporttoPetitioner_cb[0]', true);
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].PartiesSignedVoluntaryPaternityDec_cb[0]', true);
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].ReserveJurixSupportPet_cb[0]', true);
  }

  if (wantsCommunityProperty) {
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].CommQuasiProperty_sf[0].PropertyListed_cb[0]', true);
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].CommQuasiProperty_sf[0].WhereCPListed_cb[2]', true);
    fillTextFields(
      fl100Pages,
      fl100FieldMap,
      'FL-100[0].Page3[0].CommQuasiProperty_sf[0].ListProperty_ft[0]',
      'Property division details to be finalized from Draft Forms and supporting schedules.',
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
      'Separate property claims to be detailed in follow-up schedules.',
      fontRegular,
      { size: 8 },
    );
    fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].ConfirmPropertyList1To_tf[0]', 'TBD', fontRegular, { size: 8 });
  } else {
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].NoSeparateProperty_cb[0]', true);
  }

  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].RestoreFormerName_cb[0]', wantsFormerNameRestore);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].SpecifyFormerName_tf[0]', sanitizeText(workspace.fl100?.formerName?.value), fontRegular);

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

  return output.save();
}
