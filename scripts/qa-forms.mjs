#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outDir = path.resolve('tmp', 'qa-forms');
const today = new Date().toISOString().slice(0, 10);

const field = (value, sourceLabel = 'QA fixture') => ({
  value,
  sourceType: 'manual',
  sourceLabel,
  confidence: 'high',
  needsReview: false,
});

const person = {
  petitioner: 'Alex Rivera',
  respondent: 'Jordan Rivera',
  child: 'Sam Rivera',
};

function baseWorkspace(id, preset) {
  return {
    id,
    userId: 'qa-user',
    title: `${preset} QA workspace`,
    packetType: 'starter_packet_v1',
    selectedPreset: field(preset, 'QA selected preset'),
    status: 'in_review',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    intake: { userRequest: 'QA representative packet fixture', attachmentNames: [], extractedFacts: [] },
    caseNumber: field(''),
    filingCounty: field('Los Angeles'),
    courtStreet: field('111 N. Hill Street'),
    courtMailingAddress: field('111 N. Hill Street'),
    courtCityZip: field('Los Angeles, CA 90012'),
    courtBranch: field('Stanley Mosk Courthouse'),
    petitionerName: field(person.petitioner),
    petitionerAddress: field('123 Main Street, Los Angeles, CA 90012'),
    petitionerPhone: field('(555) 010-1000'),
    petitionerEmail: field('alex.qa@example.com'),
    petitionerFax: field(''),
    petitionerAttorneyOrPartyName: field(person.petitioner),
    petitionerFirmName: field(''),
    petitionerStateBarNumber: field(''),
    petitionerAttorneyFor: field('Petitioner in pro per'),
    respondentName: field(person.respondent),
    marriageDate: field('2018-06-15'),
    separationDate: field('2026-01-10'),
    hasMinorChildren: field(false),
    children: [],
    requests: {
      childCustody: field(false), visitation: field(false), childSupport: field(false), spousalSupport: field(false), propertyRightsDetermination: field(true), restoreFormerName: field(false),
    },
  };
}

function starterFixture() {
  const w = baseWorkspace('qa-start-divorce', 'start_divorce');
  w.hasMinorChildren = field(true);
  w.children = [{ id: 'qa-child-1', fullName: field(person.child), birthDate: field('2019-04-12'), placeOfBirth: field('Los Angeles, CA') }];
  w.requests = { ...w.requests, childCustody: field(true), visitation: field(true), childSupport: field(true) };
  w.fw001 = { includeForm: field(true), details: field('Fee waiver requested due to limited monthly income and household expenses.'), amount: field('650'), printedName: field(person.petitioner), signatureDate: field(today) };
  w.notes = 'Representative start-divorce packet: FL-100/FL-110, FL-105 because children are present, and FW-001 fee waiver.';
  return w;
}

function responseFixture() {
  const w = baseWorkspace('qa-respond-divorce', 'respond_divorce');
  w.fl120 = { includeForm: field(true), denyPetitionGrounds: field(false), respondentPrintedName: field(person.respondent), signatureDate: field(today) };
  w.notes = 'Representative response packet with FL-120 enabled.';
  return w;
}

function judgmentFixture() {
  const w = baseWorkspace('qa-default-uncontested-judgment', 'default_uncontested_judgment');
  w.fl130 = { includeForm: field(true), appearanceBy: field('respondent'), agreementSummary: field('Parties agree to entry of judgment per attached terms.'), petitionerSignatureDate: field(today), petitionerPrintedName: field(person.petitioner), respondentSignatureDate: field(today), respondentPrintedName: field(person.respondent) };
  w.fl165 = { includeForm: field(true), details: field('Request to enter default.'), printedName: field(person.petitioner), signatureDate: field(today) };
  w.fl170 = { includeForm: field(true), isDefaultOrUncontested: field(true), declarationText: field('Default/uncontested judgment requested.'), signatureDate: field(today), printedName: field(person.petitioner) };
  w.fl180 = { includeForm: field(true), judgmentType: field('dissolution'), statusTerminationDate: field(today), propertyDebtOrders: field('Per written agreement.') };
  w.fl190 = { includeForm: field(true), noticeDate: field(today), noticeText: field('Notice of entry of judgment.') };
  w.notes = 'Representative default/uncontested judgment packet.';
  return w;
}

function rfoFixture() {
  const w = baseWorkspace('qa-rfo-support-fees', 'rfo_support_fees');
  w.fl300 = { includeForm: field(true), requestTypes: { childSupport: field(false), spousalSupport: field(true), attorneyFeesCosts: field(true) }, facts: field('Temporary support and fee contribution requested.'), signatureDate: field(today), typePrintName: field(person.petitioner) };
  w.fl150 = { includeForm: field(true), employment: { payAmount: field('6500'), payPeriod: field('month') }, income: { salaryWages: { averageMonthly: field('6500'), lastMonth: field('6500') } }, expenses: { totalExpenses: field('5200') }, signatureDate: field(today), typePrintName: field(person.petitioner) };
  w.fl343 = { includeForm: field(true), supportType: field('spousal'), payor: field('respondent'), payee: field('petitioner'), monthlyAmount: field('1500'), paymentStartDate: field(today) };
  w.fw003 = { includeForm: field(true), details: field('Proposed fee waiver order for court review.'), printedName: field(person.petitioner), signatureDate: field(today) };
  w.fw010 = { includeForm: field(false), details: field('Included as optional post-waiver notice fixture, not generated by default.'), printedName: field(person.petitioner), signatureDate: field(today) };
  w.notes = 'Representative RFO support/fees packet with optional fee-waiver order coverage.';
  return w;
}

function dvroFixture() {
  const w = baseWorkspace('qa-dvro', 'dvro');
  w.dv100 = { includeForm: field(true), protectedPartyName: field(person.petitioner), restrainedPartyName: field(person.respondent), relationship: field('Spouse'), requestSummary: field('QA placeholder abuse summary; replace with specific facts.'), signatureDate: field(today), printedName: field(person.petitioner) };
  w.dv101 = { includeForm: field(true), protectedPartyName: field(person.petitioner), restrainedPartyName: field(person.respondent), requestSummary: field('QA incident narrative placeholder.'), signatureDate: field(today), printedName: field(person.petitioner) };
  w.dv109 = { includeForm: field(true), protectedPartyName: field(person.petitioner), restrainedPartyName: field(person.respondent), hearingDate: field(today), hearingTime: field('8:30 AM'), hearingDepartment: field('8'), requestSummary: field('Hearing notice placeholder.'), printedName: field(person.petitioner) };
  w.dv110 = { includeForm: field(true), protectedPartyName: field(person.petitioner), restrainedPartyName: field(person.respondent), hearingDate: field(today), orderSummary: field('Temporary stay-away and no-contact orders requested.'), printedName: field(person.petitioner) };
  w.dv200 = { includeForm: field(true), protectedPartyName: field(person.petitioner), restrainedPartyName: field(person.respondent), serviceDate: field(today), serviceTime: field('2:00 PM'), servedByName: field('QA Server'), printedName: field('QA Server') };
  w.notes = 'Representative DVRO request packet.';
  return w;
}

const fixtures = [starterFixture(), responseFixture(), judgmentFixture(), rfoFixture(), dvroFixture()];
await mkdir(outDir, { recursive: true });
for (const fixture of fixtures) {
  await writeFile(path.join(outDir, `${fixture.id}.json`), `${JSON.stringify(fixture, null, 2)}\n`);
}

const manifest = {
  generatedAt: new Date().toISOString(),
  outputDir: outDir,
  fixtures: fixtures.map((fixture) => ({ id: fixture.id, preset: fixture.selectedPreset.value, file: `${fixture.id}.json`, notes: fixture.notes })),
  pdfGeneration: 'Optional: run the app locally, authenticate in browser, then POST a full in-app workspace export to /api/maria-documents. These fixtures are lightweight preset/regression samples, not a replacement for browser-generated complete workspaces.',
};
await writeFile(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${fixtures.length} QA form fixtures to ${outDir}`);
console.log('Use these for preset regression review; browser-created full workspaces remain the source for official PDF generation QA.');
