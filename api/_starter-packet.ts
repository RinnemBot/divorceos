import { promises as fs } from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

interface StarterPacketField<T> {
  value: T;
}

interface StarterPacketChild {
  id?: string;
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

interface StarterPacketFl105AdditionalChildAttachment {
  childId: string;
  sameResidenceAsChildA: StarterPacketField<boolean>;
  sameResidenceReviewed: StarterPacketField<boolean>;
  residenceHistory: StarterPacketFl105ResidenceHistoryEntry[];
  residenceAddressConfidentialStateOnly: StarterPacketField<boolean>;
  personAddressConfidentialStateOnly: StarterPacketField<boolean>;
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
  petitionerFax: StarterPacketField<string>;
  petitionerAttorneyOrPartyName: StarterPacketField<string>;
  petitionerFirmName: StarterPacketField<string>;
  petitionerStateBarNumber: StarterPacketField<string>;
  petitionerAttorneyFor: StarterPacketField<string>;
  respondentName: StarterPacketField<string>;
  marriageDate: StarterPacketField<string>;
  separationDate: StarterPacketField<string>;
  hasMinorChildren: StarterPacketField<boolean>;
  children: StarterPacketChild[];
  fl100: {
    proceedingType: StarterPacketField<'dissolution' | 'legal_separation' | 'nullity'>;
    isAmended: StarterPacketField<boolean>;
    relationshipType: StarterPacketField<'marriage' | 'domestic_partnership' | 'both'>;
    domesticPartnership: {
      establishment: StarterPacketField<'unspecified' | 'established_in_california' | 'not_established_in_california'>;
      californiaResidencyException: StarterPacketField<boolean>;
      sameSexMarriageJurisdictionException: StarterPacketField<boolean>;
      registrationDate: StarterPacketField<string>;
      partnerSeparationDate: StarterPacketField<string>;
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
      petitionerResidenceLocation: StarterPacketField<string>;
      respondentCaliforniaMonths: StarterPacketField<string>;
      respondentCountyMonths: StarterPacketField<string>;
      respondentResidenceLocation: StarterPacketField<string>;
    };
    legalGrounds: {
      irreconcilableDifferences: StarterPacketField<boolean>;
      permanentLegalIncapacity: StarterPacketField<boolean>;
    };
    propertyDeclarations: {
      communityAndQuasiCommunity: StarterPacketField<boolean>;
      communityAndQuasiCommunityWhereListed: StarterPacketField<'unspecified' | 'fl160' | 'attachment' | 'inline_list'>;
      communityAndQuasiCommunityDetails: StarterPacketField<string>;
      separateProperty: StarterPacketField<boolean>;
      separatePropertyWhereListed: StarterPacketField<'unspecified' | 'fl160' | 'attachment' | 'inline_list'>;
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
    minorChildren: {
      hasUnbornChild: StarterPacketField<boolean>;
      detailsOnAttachment4b: StarterPacketField<boolean>;
    };
    childCustodyVisitation: {
      legalCustodyTo: StarterPacketField<'none' | 'petitioner' | 'respondent' | 'joint' | 'other'>;
      physicalCustodyTo: StarterPacketField<'none' | 'petitioner' | 'respondent' | 'joint' | 'other'>;
      visitationTo: StarterPacketField<'none' | 'petitioner' | 'respondent' | 'other'>;
      fl311: {
        filingPartyOtherName: StarterPacketField<string>;
        visitationPlanMode: StarterPacketField<'unspecified' | 'reasonable_right_of_visitation' | 'attachment_on_file'>;
        visitationAttachmentPageCount: StarterPacketField<string>;
        visitationAttachmentDate: StarterPacketField<string>;
      };
      fl312: {
        filingPartyOtherName: StarterPacketField<string>;
        requestingPartyName: StarterPacketField<string>;
        abductionBy: {
          petitioner: StarterPacketField<boolean>;
          respondent: StarterPacketField<boolean>;
          otherParentParty: StarterPacketField<boolean>;
        };
        riskDestinations: {
          anotherCaliforniaCounty: StarterPacketField<boolean>;
          anotherCaliforniaCountyName: StarterPacketField<string>;
          anotherState: StarterPacketField<boolean>;
          anotherStateName: StarterPacketField<string>;
          foreignCountry: StarterPacketField<boolean>;
          foreignCountryName: StarterPacketField<string>;
          foreignCountryCitizen: StarterPacketField<boolean>;
          foreignCountryHasTies: StarterPacketField<boolean>;
          foreignCountryTiesDetails: StarterPacketField<string>;
        };
        riskFactors: {
          custodyOrderViolationThreat: StarterPacketField<boolean>;
          custodyOrderViolationThreatDetails: StarterPacketField<string>;
          weakCaliforniaTies: StarterPacketField<boolean>;
          weakCaliforniaTiesDetails: StarterPacketField<string>;
          recentAbductionPlanningActions: StarterPacketField<boolean>;
          recentActionQuitJob: StarterPacketField<boolean>;
          recentActionSoldHome: StarterPacketField<boolean>;
          recentActionClosedBankAccount: StarterPacketField<boolean>;
          recentActionEndedLease: StarterPacketField<boolean>;
          recentActionSoldAssets: StarterPacketField<boolean>;
          recentActionHidOrDestroyedDocuments: StarterPacketField<boolean>;
          recentActionAppliedForTravelDocuments: StarterPacketField<boolean>;
          recentActionOther: StarterPacketField<boolean>;
          recentActionOtherDetails: StarterPacketField<string>;
          historyOfRiskBehaviors: StarterPacketField<boolean>;
          historyDomesticViolence: StarterPacketField<boolean>;
          historyChildAbuse: StarterPacketField<boolean>;
          historyParentingNonCooperation: StarterPacketField<boolean>;
          historyChildTakingWithoutPermission: StarterPacketField<boolean>;
          historyDetails: StarterPacketField<string>;
          criminalRecord: StarterPacketField<boolean>;
          criminalRecordDetails: StarterPacketField<string>;
        };
        requestedOrdersAgainst: {
          petitioner: StarterPacketField<boolean>;
          respondent: StarterPacketField<boolean>;
          otherParentParty: StarterPacketField<boolean>;
        };
        requestedOrders: {
          supervisedVisitation: StarterPacketField<boolean>;
          supervisedVisitationTermsMode: StarterPacketField<'unspecified' | 'fl311' | 'as_follows'>;
          supervisedVisitationTermsDetails: StarterPacketField<string>;
          postBond: StarterPacketField<boolean>;
          postBondAmount: StarterPacketField<string>;
          noMoveWithoutWrittenPermissionOrCourtOrder: StarterPacketField<boolean>;
          noTravelWithoutWrittenPermissionOrCourtOrder: StarterPacketField<boolean>;
          travelRestrictionThisCounty: StarterPacketField<boolean>;
          travelRestrictionCalifornia: StarterPacketField<boolean>;
          travelRestrictionUnitedStates: StarterPacketField<boolean>;
          travelRestrictionOther: StarterPacketField<boolean>;
          travelRestrictionOtherDetails: StarterPacketField<string>;
          registerOrderInOtherState: StarterPacketField<boolean>;
          registerOrderStateName: StarterPacketField<string>;
          turnInPassportsAndTravelDocuments: StarterPacketField<boolean>;
          doNotApplyForNewPassportsOrDocuments: StarterPacketField<boolean>;
          provideTravelItinerary: StarterPacketField<boolean>;
          provideRoundTripAirlineTickets: StarterPacketField<boolean>;
          provideAddressesAndTelephone: StarterPacketField<boolean>;
          provideOpenReturnTicketForRequestingParty: StarterPacketField<boolean>;
          provideOtherTravelDocuments: StarterPacketField<boolean>;
          provideOtherTravelDocumentsDetails: StarterPacketField<string>;
          notifyForeignEmbassyOrConsulate: StarterPacketField<boolean>;
          embassyOrConsulateCountry: StarterPacketField<string>;
          embassyNotificationWithinDays: StarterPacketField<string>;
          obtainForeignCustodyAndVisitationOrderBeforeTravel: StarterPacketField<boolean>;
          otherOrdersRequested: StarterPacketField<boolean>;
          otherOrdersDetails: StarterPacketField<string>;
        };
        signatureDate: StarterPacketField<string>;
      };
      fl341: {
        sourceOrder: StarterPacketField<'unspecified' | 'fl340' | 'fl180' | 'fl250' | 'fl355' | 'other'>;
        sourceOrderOtherText: StarterPacketField<string>;
        otherParentPartyName: StarterPacketField<string>;
        fl341a: {
          supervisedParty: {
            petitioner: StarterPacketField<boolean>;
            respondent: StarterPacketField<boolean>;
            otherParentParty: StarterPacketField<boolean>;
          };
          supervisor: {
            type: StarterPacketField<'unspecified' | 'professional' | 'nonprofessional' | 'other'>;
            otherTypeText: StarterPacketField<string>;
            name: StarterPacketField<string>;
            contact: StarterPacketField<string>;
            feesPaidBy: StarterPacketField<'unspecified' | 'petitioner' | 'respondent' | 'shared' | 'other'>;
            feesOtherText: StarterPacketField<string>;
          };
          schedule: {
            mode: StarterPacketField<'unspecified' | 'fl311' | 'attachment' | 'text'>;
            attachmentPageCount: StarterPacketField<string>;
            text: StarterPacketField<string>;
          };
          restrictions: StarterPacketField<string>;
          otherTerms: StarterPacketField<string>;
        };
        fl341b?: any;
        fl341c: {
          holidayRows: {
            newYearsDay: {
              enabled: StarterPacketField<boolean>;
              yearPattern: StarterPacketField<'unspecified' | 'every_year' | 'even_years' | 'odd_years'>;
              assignedTo: StarterPacketField<'unspecified' | 'petitioner' | 'respondent' | 'other_parent_party'>;
              times: StarterPacketField<string>;
            };
            springBreak: {
              enabled: StarterPacketField<boolean>;
              yearPattern: StarterPacketField<'unspecified' | 'every_year' | 'even_years' | 'odd_years'>;
              assignedTo: StarterPacketField<'unspecified' | 'petitioner' | 'respondent' | 'other_parent_party'>;
              times: StarterPacketField<string>;
            };
            thanksgivingDay: {
              enabled: StarterPacketField<boolean>;
              yearPattern: StarterPacketField<'unspecified' | 'every_year' | 'even_years' | 'odd_years'>;
              assignedTo: StarterPacketField<'unspecified' | 'petitioner' | 'respondent' | 'other_parent_party'>;
              times: StarterPacketField<string>;
            };
            winterBreak: {
              enabled: StarterPacketField<boolean>;
              yearPattern: StarterPacketField<'unspecified' | 'every_year' | 'even_years' | 'odd_years'>;
              assignedTo: StarterPacketField<'unspecified' | 'petitioner' | 'respondent' | 'other_parent_party'>;
              times: StarterPacketField<string>;
            };
            childBirthday: {
              enabled: StarterPacketField<boolean>;
              yearPattern: StarterPacketField<'unspecified' | 'every_year' | 'even_years' | 'odd_years'>;
              assignedTo: StarterPacketField<'unspecified' | 'petitioner' | 'respondent' | 'other_parent_party'>;
              times: StarterPacketField<string>;
            };
          };
          additionalHolidayNotes: StarterPacketField<string>;
          vacation: {
            assignedTo: StarterPacketField<'unspecified' | 'petitioner' | 'respondent' | 'other_parent_party'>;
            maxDuration: StarterPacketField<string>;
            maxDurationUnit: StarterPacketField<'unspecified' | 'days' | 'weeks'>;
            timesPerYear: StarterPacketField<string>;
            noticeDays: StarterPacketField<string>;
            responseDays: StarterPacketField<string>;
            allowOutsideCalifornia: StarterPacketField<boolean>;
            allowOutsideUnitedStates: StarterPacketField<boolean>;
            otherTerms: StarterPacketField<string>;
          };
        };
        fl341d: {
          provisions: {
            exchangeSchedule: { selected: StarterPacketField<boolean>; details: StarterPacketField<string> };
            transportation: { selected: StarterPacketField<boolean>; details: StarterPacketField<string> };
            makeupTime: { selected: StarterPacketField<boolean>; details: StarterPacketField<string> };
            communication: { selected: StarterPacketField<boolean>; details: StarterPacketField<string> };
            rightOfFirstRefusal: { selected: StarterPacketField<boolean>; details: StarterPacketField<string> };
            temporaryChangesByAgreement: { selected: StarterPacketField<boolean>; details: StarterPacketField<string> };
            other: { selected: StarterPacketField<boolean>; details: StarterPacketField<string> };
          };
        };
        fl341e: {
          orderJointLegalCustody: StarterPacketField<boolean>;
          decisionMaking: {
            education: StarterPacketField<'unspecified' | 'joint' | 'petitioner' | 'respondent' | 'other_parent_party'>;
            nonEmergencyHealthcare: StarterPacketField<'unspecified' | 'joint' | 'petitioner' | 'respondent' | 'other_parent_party'>;
            mentalHealth: StarterPacketField<'unspecified' | 'joint' | 'petitioner' | 'respondent' | 'other_parent_party'>;
            extracurricular: StarterPacketField<'unspecified' | 'joint' | 'petitioner' | 'respondent' | 'other_parent_party'>;
          };
          terms: {
            recordsAccess: StarterPacketField<boolean>;
            emergencyNotice: StarterPacketField<boolean>;
            portalAccess: StarterPacketField<boolean>;
            contactUpdates: StarterPacketField<boolean>;
          };
          disputeResolution: {
            meetAndConfer: StarterPacketField<boolean>;
            mediation: StarterPacketField<boolean>;
            court: StarterPacketField<boolean>;
            other: StarterPacketField<boolean>;
            otherText: StarterPacketField<string>;
          };
          additionalTerms: StarterPacketField<string>;
        };
      };
      attachments: {
        formFl311: StarterPacketField<boolean>;
        formFl312: StarterPacketField<boolean>;
        formFl341a: StarterPacketField<boolean>;
        formFl341b: StarterPacketField<boolean>;
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
    signatureDate: StarterPacketField<string>;
    formerName: StarterPacketField<string>;
  };
  fl105: {
    representationRole: StarterPacketField<'party' | 'authorized_representative'>;
    authorizedRepresentativeAgencyName: StarterPacketField<string>;
    childrenLivedTogetherPastFiveYears: StarterPacketField<boolean>;
    childrenResidenceAssertionReviewed: StarterPacketField<boolean>;
    residenceHistory: StarterPacketFl105ResidenceHistoryEntry[];
    additionalChildrenAttachments: StarterPacketFl105AdditionalChildAttachment[];
    residenceAddressConfidentialStateOnly: StarterPacketField<boolean>;
    personAddressConfidentialStateOnly: StarterPacketField<boolean>;
    additionalResidenceAddressesOnAttachment3a: StarterPacketField<boolean>;
    otherProceedingsKnown: StarterPacketField<boolean>;
    otherProceedingsAssertionReviewed: StarterPacketField<boolean>;
    otherProceedings: StarterPacketFl105OtherProceeding[];
    domesticViolenceOrdersExist: StarterPacketField<boolean>;
    domesticViolenceOrdersAssertionReviewed: StarterPacketField<boolean>;
    domesticViolenceOrders: StarterPacketFl105RestrainingOrder[];
    otherClaimantsKnown: StarterPacketField<boolean>;
    otherClaimantsAssertionReviewed: StarterPacketField<boolean>;
    otherClaimants: StarterPacketFl105OtherClaimant[];
    attachmentsIncluded: StarterPacketField<boolean>;
    attachmentPageCount: StarterPacketField<string>;
    declarantName: StarterPacketField<string>;
    signatureDate: StarterPacketField<string>;
  };
  fl300?: any;
  fl150?: any;
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
const FL105A_TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'fl-105a.template.pdf');
const FL150_TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'fl-150.template.pdf');
const FL300_TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'fl-300.template.pdf');
const FL311_TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'fl-311.template.pdf');
const FL312_TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'fl-312.template.pdf');
const FL341_TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'fl-341.template.pdf');
const FL341A_TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'fl-341a.template.pdf');
const FL341B_TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'fl-341b.template.pdf');
const FL341C_TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'fl-341c.template.pdf');
const FL341D_TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'fl-341d.template.pdf');
const FL341E_TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'fl-341e.template.pdf');
const FW001_TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'fw-001.template.pdf');
const FL100_FIELDS_PATH = path.join(TEMPLATES_DIR, 'fl-100.fields.json');
const FL110_FIELDS_PATH = path.join(TEMPLATES_DIR, 'fl-110.fields.json');
const FL105_FIELDS_PATH = path.join(TEMPLATES_DIR, 'fl-105.fields.json');
const FL105A_FIELDS_PATH = path.join(TEMPLATES_DIR, 'fl-105a.fields.json');
const FL150_FIELDS_PATH = path.join(TEMPLATES_DIR, 'fl-150.fields.json');
const FL300_FIELDS_PATH = path.join(TEMPLATES_DIR, 'fl-300.fields.json');
const FL311_FIELDS_PATH = path.join(TEMPLATES_DIR, 'fl-311.fields.json');
const FL312_FIELDS_PATH = path.join(TEMPLATES_DIR, 'fl-312.fields.json');
const FL341_FIELDS_PATH = path.join(TEMPLATES_DIR, 'fl-341.fields.json');
const FL341A_FIELDS_PATH = path.join(TEMPLATES_DIR, 'fl-341a.fields.json');
const FL341B_FIELDS_PATH = path.join(TEMPLATES_DIR, 'fl-341b.fields.json');
const FL341C_FIELDS_PATH = path.join(TEMPLATES_DIR, 'fl-341c.fields.json');
const FL341D_FIELDS_PATH = path.join(TEMPLATES_DIR, 'fl-341d.fields.json');
const FL341E_FIELDS_PATH = path.join(TEMPLATES_DIR, 'fl-341e.fields.json');
const FW001_FIELDS_PATH = path.join(TEMPLATES_DIR, 'fw-001.fields.json');
const FL100_SEPARATE_PROPERTY_VISIBLE_ROWS = 5;
const BASE_CHILD_VISIBLE_ROWS = 4;
const GENERATED_CHILD_ATTACHMENT_ENTRIES_PER_PAGE = 6;
const FL105_RESIDENCE_HISTORY_VISIBLE_ROWS = 5;
const FL105_OTHER_CLAIMANTS_VISIBLE_ROWS = 3;
const ATTACHMENT_PAGE_SIZE: [number, number] = [612, 792];
const ATTACHMENT_PAGE_MARGIN = 48;

interface AttachmentSection {
  heading?: string;
  paragraphs: string[];
}

let templateCache: Promise<{
  fl100Bytes: Uint8Array;
  fl110Bytes: Uint8Array;
  fl105Bytes: Uint8Array;
  fl105aBytes: Uint8Array;
  fl150Bytes: Uint8Array;
  fl300Bytes: Uint8Array;
  fl311Bytes: Uint8Array;
  fl312Bytes: Uint8Array;
  fl341Bytes: Uint8Array;
  fl341aBytes: Uint8Array;
  fl341bBytes: Uint8Array;
  fl341cBytes: Uint8Array;
  fl341dBytes: Uint8Array;
  fl341eBytes: Uint8Array;
  fw001Bytes: Uint8Array;
  fl100Fields: TemplateField[];
  fl110Fields: TemplateField[];
  fl105Fields: TemplateField[];
  fl105aFields: TemplateField[];
  fl150Fields: TemplateField[];
  fl300Fields: TemplateField[];
  fl311Fields: TemplateField[];
  fl312Fields: TemplateField[];
  fl341Fields: TemplateField[];
  fl341aFields: TemplateField[];
  fl341bFields: TemplateField[];
  fl341cFields: TemplateField[];
  fl341dFields: TemplateField[];
  fl341eFields: TemplateField[];
  fw001Fields: TemplateField[];
}> | null = null;

async function loadTemplates() {
  if (!templateCache) {
    templateCache = Promise.all([
      fs.readFile(FL100_TEMPLATE_PATH),
      fs.readFile(FL110_TEMPLATE_PATH),
      fs.readFile(FL105_TEMPLATE_PATH),
      fs.readFile(FL105A_TEMPLATE_PATH),
      fs.readFile(FL150_TEMPLATE_PATH),
      fs.readFile(FL300_TEMPLATE_PATH),
      fs.readFile(FL311_TEMPLATE_PATH),
      fs.readFile(FL312_TEMPLATE_PATH),
      fs.readFile(FL341_TEMPLATE_PATH),
      fs.readFile(FL341A_TEMPLATE_PATH),
      fs.readFile(FL341B_TEMPLATE_PATH),
      fs.readFile(FL341C_TEMPLATE_PATH),
      fs.readFile(FL341D_TEMPLATE_PATH),
      fs.readFile(FL341E_TEMPLATE_PATH),
      fs.readFile(FW001_TEMPLATE_PATH),
      fs.readFile(FL100_FIELDS_PATH, 'utf8'),
      fs.readFile(FL110_FIELDS_PATH, 'utf8'),
      fs.readFile(FL105_FIELDS_PATH, 'utf8'),
      fs.readFile(FL105A_FIELDS_PATH, 'utf8'),
      fs.readFile(FL150_FIELDS_PATH, 'utf8'),
      fs.readFile(FL300_FIELDS_PATH, 'utf8'),
      fs.readFile(FL311_FIELDS_PATH, 'utf8'),
      fs.readFile(FL312_FIELDS_PATH, 'utf8'),
      fs.readFile(FL341_FIELDS_PATH, 'utf8'),
      fs.readFile(FL341A_FIELDS_PATH, 'utf8'),
      fs.readFile(FL341B_FIELDS_PATH, 'utf8'),
      fs.readFile(FL341C_FIELDS_PATH, 'utf8'),
      fs.readFile(FL341D_FIELDS_PATH, 'utf8'),
      fs.readFile(FL341E_FIELDS_PATH, 'utf8'),
      fs.readFile(FW001_FIELDS_PATH, 'utf8'),
    ]).then(([
      fl100Bytes,
      fl110Bytes,
      fl105Bytes,
      fl105aBytes,
      fl150Bytes,
      fl300Bytes,
      fl311Bytes,
      fl312Bytes,
      fl341Bytes,
      fl341aBytes,
      fl341bBytes,
      fl341cBytes,
      fl341dBytes,
      fl341eBytes,
      fw001Bytes,
      fl100FieldsRaw,
      fl110FieldsRaw,
      fl105FieldsRaw,
      fl105aFieldsRaw,
      fl150FieldsRaw,
      fl300FieldsRaw,
      fl311FieldsRaw,
      fl312FieldsRaw,
      fl341FieldsRaw,
      fl341aFieldsRaw,
      fl341bFieldsRaw,
      fl341cFieldsRaw,
      fl341dFieldsRaw,
      fl341eFieldsRaw,
      fw001FieldsRaw,
    ]) => ({
      fl100Bytes: new Uint8Array(fl100Bytes),
      fl110Bytes: new Uint8Array(fl110Bytes),
      fl105Bytes: new Uint8Array(fl105Bytes),
      fl105aBytes: new Uint8Array(fl105aBytes),
      fl150Bytes: new Uint8Array(fl150Bytes),
      fl300Bytes: new Uint8Array(fl300Bytes),
      fl311Bytes: new Uint8Array(fl311Bytes),
      fl312Bytes: new Uint8Array(fl312Bytes),
      fl341Bytes: new Uint8Array(fl341Bytes),
      fl341aBytes: new Uint8Array(fl341aBytes),
      fl341bBytes: new Uint8Array(fl341bBytes),
      fl341cBytes: new Uint8Array(fl341cBytes),
      fl341dBytes: new Uint8Array(fl341dBytes),
      fl341eBytes: new Uint8Array(fl341eBytes),
      fw001Bytes: new Uint8Array(fw001Bytes),
      fl100Fields: JSON.parse(fl100FieldsRaw) as TemplateField[],
      fl110Fields: JSON.parse(fl110FieldsRaw) as TemplateField[],
      fl105Fields: JSON.parse(fl105FieldsRaw) as TemplateField[],
      fl105aFields: JSON.parse(fl105aFieldsRaw) as TemplateField[],
      fl150Fields: JSON.parse(fl150FieldsRaw) as TemplateField[],
      fl300Fields: JSON.parse(fl300FieldsRaw) as TemplateField[],
      fl311Fields: JSON.parse(fl311FieldsRaw) as TemplateField[],
      fl312Fields: JSON.parse(fl312FieldsRaw) as TemplateField[],
      fl341Fields: JSON.parse(fl341FieldsRaw) as TemplateField[],
      fl341aFields: JSON.parse(fl341aFieldsRaw) as TemplateField[],
      fl341bFields: JSON.parse(fl341bFieldsRaw) as TemplateField[],
      fl341cFields: JSON.parse(fl341cFieldsRaw) as TemplateField[],
      fl341dFields: JSON.parse(fl341dFieldsRaw) as TemplateField[],
      fl341eFields: JSON.parse(fl341eFieldsRaw) as TemplateField[],
      fw001Fields: JSON.parse(fw001FieldsRaw) as TemplateField[],
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

function splitNonEmptyLines(value: string | undefined | null) {
  return sanitizeMultilineText(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function chunkArray<T>(items: T[], size: number) {
  if (size <= 0) return [items];

  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
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

function parseIsoDate(value: string | undefined | null) {
  const raw = sanitizeText(value);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() + 1 !== month
    || parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function calculateCourtDuration(start: string | undefined | null, end: string | undefined | null) {
  const startDate = parseIsoDate(start);
  const endDate = parseIsoDate(end);
  if (!startDate || !endDate) {
    return { years: '', months: '' };
  }

  let years = endDate.year - startDate.year;
  let months = endDate.month - startDate.month;
  const days = endDate.day - startDate.day;
  if (days < 0) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) {
    return { years: '', months: '' };
  }

  return {
    years: String(years),
    months: String(months),
  };
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

function assertLegalAssertionReviewed(field: StarterPacketField<boolean> | undefined, label: string) {
  if (!field?.value) {
    throw new Error(`${label} must be reviewed before generating the official starter packet.`);
  }
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

function parseAttachmentPageCount(value: string | undefined | null) {
  const digits = sanitizeText(value).replace(/\D/g, '');
  if (!digits) return 0;
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function addAttachmentHeader(
  page: PDFPage,
  title: string,
  shortTitle: string,
  caseNumber: string,
  fontRegular: PDFFont,
  fontBold: PDFFont,
  pageNumber: number,
  totalPages: number,
) {
  const { width, height } = page.getSize();
  const topY = height - ATTACHMENT_PAGE_MARGIN;
  const color = rgb(0.08, 0.16, 0.28);

  page.drawText(title, {
    x: ATTACHMENT_PAGE_MARGIN,
    y: topY,
    size: 15,
    font: fontBold,
    color,
  });

  const pageLabel = totalPages > 1 ? `Page ${pageNumber} of ${totalPages}` : 'Page 1';
  page.drawText(pageLabel, {
    x: width - ATTACHMENT_PAGE_MARGIN - fontRegular.widthOfTextAtSize(pageLabel, 10),
    y: topY + 2,
    size: 10,
    font: fontRegular,
    color,
  });

  const caseNameLine = `Case name: ${shortTitle || 'Not provided'}`;
  page.drawText(caseNameLine, {
    x: ATTACHMENT_PAGE_MARGIN,
    y: topY - 20,
    size: 10,
    font: fontRegular,
    color,
  });

  if (caseNumber) {
    const caseNumberLine = `Case number: ${caseNumber}`;
    page.drawText(caseNumberLine, {
      x: ATTACHMENT_PAGE_MARGIN,
      y: topY - 34,
      size: 10,
      font: fontRegular,
      color,
    });
  }

  page.drawLine({
    start: { x: ATTACHMENT_PAGE_MARGIN, y: topY - 44 },
    end: { x: width - ATTACHMENT_PAGE_MARGIN, y: topY - 44 },
    thickness: 1,
    color,
  });

  return topY - 62;
}

function appendChildAttachmentPages(
  output: PDFDocument,
  fontRegular: PDFFont,
  fontBold: PDFFont,
  title: string,
  shortTitle: string,
  caseNumber: string,
  children: StarterPacketChild[],
  options?: { includeAge?: boolean },
) {
  if (children.length === 0) return 0;

  const totalPages = Math.ceil(children.length / GENERATED_CHILD_ATTACHMENT_ENTRIES_PER_PAGE);
  const color = rgb(0.08, 0.16, 0.28);

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
    const page = output.addPage(ATTACHMENT_PAGE_SIZE);
    let cursorY = addAttachmentHeader(page, title, shortTitle, caseNumber, fontRegular, fontBold, pageIndex + 1, totalPages);
    const chunk = children.slice(
      pageIndex * GENERATED_CHILD_ATTACHMENT_ENTRIES_PER_PAGE,
      (pageIndex + 1) * GENERATED_CHILD_ATTACHMENT_ENTRIES_PER_PAGE,
    );

    chunk.forEach((child, chunkIndex) => {
      const itemNumber = pageIndex * GENERATED_CHILD_ATTACHMENT_ENTRIES_PER_PAGE + chunkIndex + 1;
      const fullName = sanitizeText(child.fullName?.value) || 'Not provided';
      const birthDate = formatDateForCourt(child.birthDate?.value) || 'Not provided';
      const placeOfBirth = sanitizeText(child.placeOfBirth?.value) || 'Not provided';
      const age = options?.includeAge ? (formatChildAge(child.birthDate?.value) || 'Not provided') : null;

      page.drawText(`${itemNumber}. ${fullName}`, {
        x: ATTACHMENT_PAGE_MARGIN,
        y: cursorY,
        size: 11,
        font: fontBold,
        color,
      });
      cursorY -= 15;

      const detailsLine = age
        ? `Birth date: ${birthDate}    Age: ${age}`
        : `Birth date: ${birthDate}`;
      page.drawText(detailsLine, {
        x: ATTACHMENT_PAGE_MARGIN + 12,
        y: cursorY,
        size: 10,
        font: fontRegular,
        color,
      });
      cursorY -= 13;

      page.drawText(`Place of birth: ${placeOfBirth}`, {
        x: ATTACHMENT_PAGE_MARGIN + 12,
        y: cursorY,
        size: 10,
        font: fontRegular,
        color,
        maxWidth: ATTACHMENT_PAGE_SIZE[0] - (ATTACHMENT_PAGE_MARGIN * 2) - 12,
      });
      cursorY -= 22;
    });
  }

  return totalPages;
}

function appendAttachmentTextPages(
  output: PDFDocument,
  fontRegular: PDFFont,
  fontBold: PDFFont,
  title: string,
  shortTitle: string,
  caseNumber: string,
  sections: AttachmentSection[],
) {
  const maxWidth = ATTACHMENT_PAGE_SIZE[0] - (ATTACHMENT_PAGE_MARGIN * 2);
  const regularSize = 10;
  const regularLineHeight = regularSize + 3;
  const headingSize = 11;
  const headingLineHeight = headingSize + 4;
  const bottomY = ATTACHMENT_PAGE_MARGIN;
  const pageColor = rgb(0.08, 0.16, 0.28);

  type LayoutItem =
    | { kind: 'spacer'; height: number }
    | { kind: 'line'; text: string; font: PDFFont; size: number; lineHeight: number };

  const layoutItems: LayoutItem[] = [];

  sections.forEach((section, sectionIndex) => {
    const heading = sanitizeText(section.heading);
    const paragraphs = section.paragraphs
      .map((paragraph) => sanitizeMultilineText(paragraph))
      .filter(Boolean);

    if (!heading && paragraphs.length === 0) return;

    if (layoutItems.length > 0) {
      layoutItems.push({ kind: 'spacer', height: sectionIndex === 0 ? 0 : 8 });
    }

    if (heading) {
      wrapText(heading, maxWidth, fontBold, headingSize).forEach((line) => {
        layoutItems.push({
          kind: 'line',
          text: line,
          font: fontBold,
          size: headingSize,
          lineHeight: headingLineHeight,
        });
      });
      layoutItems.push({ kind: 'spacer', height: 4 });
    }

    paragraphs.forEach((paragraph, paragraphIndex) => {
      wrapText(paragraph, maxWidth, fontRegular, regularSize).forEach((line) => {
        layoutItems.push({
          kind: 'line',
          text: line,
          font: fontRegular,
          size: regularSize,
          lineHeight: regularLineHeight,
        });
      });
      if (paragraphIndex < paragraphs.length - 1) {
        layoutItems.push({ kind: 'spacer', height: 6 });
      }
    });
  });

  const pages: LayoutItem[][] = [[]];
  const firstCursorY = ATTACHMENT_PAGE_SIZE[1] - ATTACHMENT_PAGE_MARGIN - 62;
  let cursorY = firstCursorY;

  const pushNewPage = () => {
    pages.push([]);
    cursorY = firstCursorY;
  };

  layoutItems.forEach((item) => {
    if (item.kind === 'spacer') {
      if (pages[pages.length - 1].length === 0) return;
      if (cursorY - item.height < bottomY) {
        pushNewPage();
        return;
      }
      pages[pages.length - 1].push(item);
      cursorY -= item.height;
      return;
    }

    if (cursorY - item.lineHeight < bottomY && pages[pages.length - 1].length > 0) {
      pushNewPage();
    }

    pages[pages.length - 1].push(item);
    cursorY -= item.lineHeight;
  });

  pages.forEach((pageItems, pageIndex) => {
    const page = output.addPage(ATTACHMENT_PAGE_SIZE);
    let currentY = addAttachmentHeader(page, title, shortTitle, caseNumber, fontRegular, fontBold, pageIndex + 1, pages.length);

    pageItems.forEach((item) => {
      if (item.kind === 'spacer') {
        currentY -= item.height;
        return;
      }

      page.drawText(item.text, {
        x: ATTACHMENT_PAGE_MARGIN,
        y: currentY,
        size: item.size,
        font: item.font,
        color: pageColor,
        maxWidth,
      });
      currentY -= item.lineHeight;
    });
  });

  return pages.length;
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
  if (raw === 'family' || raw === 'guardianship' || raw === 'other' || raw === 'juvenile' || raw === 'adoption') {
    return raw;
  }
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
  if (raw === 'criminal' || raw === 'family' || raw === 'juvenile' || raw === 'other') {
    return raw;
  }
  if (/(criminal|police|penal)/.test(raw)) return 'criminal';
  if (/(family|dvro|domestic)/.test(raw)) return 'family';
  if (/(juvenile|dependency|child welfare)/.test(raw)) return 'juvenile';
  if (/(other|civil|tribal)/.test(raw)) return 'other';
  return null;
}

function partitionFl105Proceedings(entries: StarterPacketFl105OtherProceeding[]) {
  const visibleByType = new Map<'family' | 'guardianship' | 'other' | 'juvenile' | 'adoption', StarterPacketFl105OtherProceeding>();
  const overflow: StarterPacketFl105OtherProceeding[] = [];

  entries.forEach((entry) => {
    const type = normalizeProceedingType(entry.proceedingType?.value);
    if (type && !visibleByType.has(type)) {
      visibleByType.set(type, entry);
      return;
    }
    overflow.push(entry);
  });

  return {
    visibleByType,
    overflow,
  };
}

function partitionFl105Orders(entries: StarterPacketFl105RestrainingOrder[]) {
  const visibleByType = new Map<'criminal' | 'family' | 'juvenile' | 'other', StarterPacketFl105RestrainingOrder>();
  const overflow: StarterPacketFl105RestrainingOrder[] = [];

  entries.forEach((entry) => {
    const type = normalizeOrderType(entry.orderType?.value);
    if (type && !visibleByType.has(type)) {
      visibleByType.set(type, entry);
      return;
    }
    overflow.push(entry);
  });

  return {
    visibleByType,
    overflow,
  };
}

interface Fl105AdditionalChildSection {
  childName: string;
  sameResidenceAsChildA: boolean;
  residenceHistory: StarterPacketFl105ResidenceHistoryEntry[];
  residenceAddressConfidentialStateOnly: boolean;
  personAddressConfidentialStateOnly: boolean;
}

function buildFl105AdditionalChildSections(workspace: StarterPacketWorkspace): Fl105AdditionalChildSection[] {
  if (workspace.fl105?.childrenLivedTogetherPastFiveYears?.value !== false) {
    return [];
  }

  const extraChildren = workspace.children.slice(1);
  if (extraChildren.length === 0) {
    return [];
  }

  const attachments = workspace.fl105?.additionalChildrenAttachments ?? [];
  const attachmentsByChildId = new Map(
    attachments
      .filter((entry) => Boolean(entry?.childId))
      .map((entry) => [entry.childId, entry]),
  );

  const sections: Fl105AdditionalChildSection[] = [];

  extraChildren.forEach((child, index) => {
    const attachment = (child.id ? attachmentsByChildId.get(child.id) : null) ?? attachments[index];
    const childName = sanitizeText(child.fullName?.value) || `Child ${index + 2}`;
    const sameResidenceAsChildA = attachment?.sameResidenceAsChildA?.value !== false;
    const historyEntries = (attachment?.residenceHistory ?? []).filter((entry) => Boolean(
      sanitizeText(entry.fromDate?.value)
      || sanitizeText(entry.toDate?.value)
      || sanitizeText(entry.residence?.value)
      || sanitizeText(entry.personAndAddress?.value)
      || sanitizeText(entry.relationship?.value),
    ));

    if (sameResidenceAsChildA) {
      sections.push({
        childName,
        sameResidenceAsChildA: true,
        residenceHistory: [],
        residenceAddressConfidentialStateOnly: false,
        personAddressConfidentialStateOnly: false,
      });
      return;
    }

    if (historyEntries.length === 0) {
      throw new Error(`FL-105(A)/GC-120(A) residence-history details are missing for ${childName}.`);
    }

    chunkArray(historyEntries, FL105_RESIDENCE_HISTORY_VISIBLE_ROWS).forEach((historyChunk) => {
      sections.push({
        childName,
        sameResidenceAsChildA: false,
        residenceHistory: historyChunk,
        residenceAddressConfidentialStateOnly: Boolean(attachment?.residenceAddressConfidentialStateOnly?.value),
        personAddressConfidentialStateOnly: Boolean(attachment?.personAddressConfidentialStateOnly?.value),
      });
    });
  });

  return sections;
}

function getFl105AdditionalChildListPrefix(slotIndex: number) {
  return slotIndex === 0
    ? 'FL-105A[0].Page1[0].List1[0].Li1[0]'
    : 'FL-105A[0].Page1[0].List2[0].Li1[0]';
}

function getFl105AdditionalChildTablePrefix(slotIndex: number) {
  return `${getFl105AdditionalChildListPrefix(slotIndex)}.${slotIndex === 0 ? 'Table3bX_sf[0].Table3bX[0]' : 'Table3bY_sf[0].Table3bY[0]'}`;
}

function getFl105AdditionalChildResidenceFieldName(slotIndex: number, row: number) {
  if (slotIndex === 1 && row === 4) {
    return 'Residnce4[0]';
  }
  return `Residence${row}[0]`;
}

function fillFl105AdditionalChildSection(
  page: PDFPage,
  fl105aFieldMap: Map<string, TemplateField[]>,
  fontRegular: PDFFont,
  slotIndex: number,
  section: Fl105AdditionalChildSection,
) {
  const pages = [page];
  const listPrefix = getFl105AdditionalChildListPrefix(slotIndex);
  const tablePrefix = getFl105AdditionalChildTablePrefix(slotIndex);

  fillCheckbox(pages, fl105aFieldMap, `${listPrefix}.Checkbox[0]`, true);
  fillTextFields(
    pages,
    fl105aFieldMap,
    slotIndex === 0 ? `${listPrefix}.ChildXName[0]` : `${listPrefix}.ChildYName[0]`,
    section.childName,
    fontRegular,
    { size: 8 },
  );
  fillCheckbox(pages, fl105aFieldMap, `${listPrefix}.ResidenceInfo2a[0].ResInfo2a_cb[0]`, section.sameResidenceAsChildA);

  if (section.sameResidenceAsChildA) {
    return;
  }

  const [currentResidence, ...priorResidences] = section.residenceHistory;
  if (currentResidence) {
    fillTextFields(pages, fl105aFieldMap, `${tablePrefix}.Row1[0].From1[0]`, formatDateForCourt(currentResidence.fromDate?.value), fontRegular, { size: 8 });
    fillTextFields(pages, fl105aFieldMap, `${tablePrefix}.Row1[0].Residence1[0]`, sanitizeText(currentResidence.residence?.value), fontRegular, { size: 8 });
    fillTextFields(pages, fl105aFieldMap, `${tablePrefix}.Row1[0].PersonStreet1[0]`, sanitizeText(currentResidence.personAndAddress?.value), fontRegular, { size: 8 });
    fillTextFields(pages, fl105aFieldMap, `${tablePrefix}.Row1[0].Relationship1[0]`, sanitizeText(currentResidence.relationship?.value), fontRegular, { size: 8 });
  }

  fillCheckbox(
    pages,
    fl105aFieldMap,
    slotIndex === 0
      ? `${tablePrefix}.Row1a[0].Condifential1a3[0].CheckBox3[0]`
      : `${tablePrefix}.Row1a[0].Confidential1a3_sf[0].CheckBox1a3[0]`,
    section.residenceAddressConfidentialStateOnly,
  );
  fillCheckbox(
    pages,
    fl105aFieldMap,
    slotIndex === 0
      ? `${tablePrefix}.Row1a[0].Confidential1a4[0].CheckBox3[0]`
      : `${tablePrefix}.Row1a[0].Confidential1a4_sf[0].CheckBox1a4[0]`,
    section.personAddressConfidentialStateOnly,
  );

  priorResidences.slice(0, 4).forEach((entry, index) => {
    const row = index + 2;
    fillTextFields(pages, fl105aFieldMap, `${tablePrefix}.Row${row}[0].From${row}[0]`, formatDateForCourt(entry.fromDate?.value), fontRegular, { size: 8 });
    fillTextFields(pages, fl105aFieldMap, `${tablePrefix}.Row${row}[0].To${row}[0]`, formatDateForCourt(entry.toDate?.value), fontRegular, { size: 8 });
    fillTextFields(pages, fl105aFieldMap, `${tablePrefix}.Row${row}[0].${getFl105AdditionalChildResidenceFieldName(slotIndex, row)}`, sanitizeText(entry.residence?.value), fontRegular, { size: 8 });
    fillTextFields(pages, fl105aFieldMap, `${tablePrefix}.Row${row}[0].PersonStreet${row}[0]`, sanitizeText(entry.personAndAddress?.value), fontRegular, { size: 8 });
    fillTextFields(pages, fl105aFieldMap, `${tablePrefix}.Row${row}[0].Relationship${row}[0]`, sanitizeText(entry.relationship?.value), fontRegular, { size: 8 });
  });
}

async function appendFl105AdditionalChildAttachmentPages(
  output: PDFDocument,
  fl105aTemplate: PDFDocument,
  fl105aFieldMap: Map<string, TemplateField[]>,
  fontRegular: PDFFont,
  workspace: StarterPacketWorkspace,
  shortTitle: string,
  caseNumber: string,
) {
  const sections = buildFl105AdditionalChildSections(workspace);
  if (sections.length === 0) {
    return 0;
  }

  const pageCount = Math.ceil(sections.length / 2);

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const [page] = await output.copyPages(fl105aTemplate, [0]);
    output.addPage(page);
    const pages = [page];

    fillTextFields(pages, fl105aFieldMap, 'FL-105A[0].Page1[0].P1Caption[0].Parties[0].ShortTitle_ft[0]', shortTitle, fontRegular, { size: 8 });
    fillTextFields(pages, fl105aFieldMap, 'FL-105A[0].Page1[0].P1Caption[0].CaseNumber[0].CaseNumber_ft[0]', caseNumber, fontRegular, { size: 8 });
    fillTextFields(pages, fl105aFieldMap, 'FL-105A[0].Page1[0].PageXofX_sf[0].PageX[0]', String(pageIndex + 1), fontRegular, { size: 8 });
    fillTextFields(pages, fl105aFieldMap, 'FL-105A[0].Page1[0].PageXofX_sf[0].OfX[0]', String(pageCount), fontRegular, { size: 8 });

    sections.slice(pageIndex * 2, pageIndex * 2 + 2).forEach((section, slotIndex) => {
      fillFl105AdditionalChildSection(page, fl105aFieldMap, fontRegular, slotIndex, section);
    });
  }

  return pageCount;
}

async function appendFl311AttachmentPages(
  output: PDFDocument,
  fl311Template: PDFDocument,
  fl311FieldMap: Map<string, TemplateField[]>,
  fontRegular: PDFFont,
  workspace: StarterPacketWorkspace,
  petitionerName: string,
  respondentName: string,
  caseNumber: string,
) {
  const [fl311Page1, fl311Page2, fl311Page3, fl311Page4, fl311Page5] = await output.copyPages(fl311Template, [0, 1, 2, 3, 4]);
  const fl311Pages = [fl311Page1, fl311Page2, fl311Page3, fl311Page4, fl311Page5];
  fl311Pages.forEach((page) => output.addPage(page));

  const legalCustodyTo = workspace.fl100?.childCustodyVisitation?.legalCustodyTo?.value ?? 'none';
  const physicalCustodyTo = workspace.fl100?.childCustodyVisitation?.physicalCustodyTo?.value ?? 'none';
  const visitationTo = workspace.fl100?.childCustodyVisitation?.visitationTo?.value ?? 'none';
  const custodyRequested = legalCustodyTo !== 'none' || physicalCustodyTo !== 'none' || Boolean(workspace.requests?.childCustody?.value);
  const visitationRequested = visitationTo !== 'none' || Boolean(workspace.requests?.visitation?.value);
  const fl311 = workspace.fl100?.childCustodyVisitation?.fl311;
  const filingPartyOtherName = sanitizeText(fl311?.filingPartyOtherName?.value);
  const visitationPlanMode = fl311?.visitationPlanMode?.value ?? 'unspecified';
  const visitationAttachmentPageCount = parseAttachmentPageCount(fl311?.visitationAttachmentPageCount?.value);
  const visitationAttachmentDate = formatDateForCourt(fl311?.visitationAttachmentDate?.value);

  const pageCaptionTargets = [
    {
      petitioner: 'FL-311[0].Page1[0].PxCaption_sf[0].PartySub[0].Parties[0].Petitioner_ft[0]',
      respondent: 'FL-311[0].Page1[0].PxCaption_sf[0].PartySub[0].Parties[0].Respondent_ft[0]',
      caseNumber: 'FL-311[0].Page1[0].PxCaption_sf[0].CaseSub[0].CaseNumber[0].CaseNumber_ft[0]',
    },
    {
      petitioner: 'FL-311[0].Page2[0].PxCaption_sf[0].PartySub[0].Parties[0].Petitioner_ft[0]',
      respondent: 'FL-311[0].Page2[0].PxCaption_sf[0].PartySub[0].Parties[0].Respondent_ft[0]',
      caseNumber: 'FL-311[0].Page2[0].PxCaption_sf[0].CaseSub[0].CaseNumber[0].CaseNumber_ft[0]',
    },
    {
      petitioner: 'FL-311[0].Page3[0].PartySub[0].Parties[0].Petitioner_ft[0]',
      respondent: 'FL-311[0].Page3[0].PartySub[0].Parties[0].Respondent_ft[0]',
      caseNumber: 'FL-311[0].Page3[0].CaseSub[0].CaseNumber[0].CaseNumber_ft[0]',
    },
    {
      petitioner: 'FL-311[0].Page4[0].PxCaption_sf[0].PartySub[0].Parties[0].Petitioner_ft[0]',
      respondent: 'FL-311[0].Page4[0].PxCaption_sf[0].PartySub[0].Parties[0].Respondent_ft[0]',
      caseNumber: 'FL-311[0].Page4[0].PxCaption_sf[0].CaseSub[0].CaseNumber[0].CaseNumber_ft[0]',
    },
    {
      petitioner: 'FL-311[0].Page5[0].PxCaption_sf[0].PartySub[0].Parties[0].Petitioner_ft[0]',
      respondent: 'FL-311[0].Page5[0].PxCaption_sf[0].PartySub[0].Parties[0].Respondent_ft[0]',
      caseNumber: 'FL-311[0].Page5[0].PxCaption_sf[0].CaseSub[0].CaseNumber[0].CaseNumber_ft[0]',
    },
  ];

  for (const target of pageCaptionTargets) {
    fillTextFields(fl311Pages, fl311FieldMap, target.petitioner, petitionerName, fontRegular, { size: 8 });
    fillTextFields(fl311Pages, fl311FieldMap, target.respondent, respondentName, fontRegular, { size: 8 });
    fillTextFields(fl311Pages, fl311FieldMap, target.caseNumber, caseNumber, fontRegular, { size: 8 });
  }

  fillTextFields(fl311Pages, fl311FieldMap, 'FL-311[0].Page1[0].PxCaption_sf[0].PartySub[0].Parties[0].OtherParentParty_ft[0]', filingPartyOtherName, fontRegular, { size: 8 });
  fillCheckbox(fl311Pages, fl311FieldMap, 'FL-311[0].Page1[0].TitleSub[0].Petition_cb[0]', true);

  workspace.children.slice(0, 4).forEach((child, index) => {
    const row = index + 1;
    const birthdateField = row === 3
      ? `FL-311[0].Page1[0].List1[0].Li1[0].tblMinorChildren[0].child${row}[0].Child${row}Date_dt[0]`
      : `FL-311[0].Page1[0].List1[0].Li1[0].tblMinorChildren[0].child${row}[0].Child${row}Birthdate_dt[0]`;
    fillTextFields(fl311Pages, fl311FieldMap, `FL-311[0].Page1[0].List1[0].Li1[0].tblMinorChildren[0].child${row}[0].Child${row}Name[0]`, sanitizeText(child.fullName?.value), fontRegular, { size: 8 });
    fillTextFields(fl311Pages, fl311FieldMap, birthdateField, formatDateForCourt(child.birthDate?.value), fontRegular, { size: 8 });
    fillTextFields(fl311Pages, fl311FieldMap, `FL-311[0].Page1[0].List1[0].Li1[0].tblMinorChildren[0].child${row}[0].Child${row}Age[0]`, formatChildAge(child.birthDate?.value), fontRegular, { size: 8 });
  });

  fillCheckbox(fl311Pages, fl311FieldMap, 'FL-311[0].Page1[0].List2[0].Custody_cb[0]', custodyRequested);
  if (custodyRequested) {
    fillCheckbox(fl311Pages, fl311FieldMap, 'FL-311[0].Page1[0].List2[0].Li1[0].ToPetitioner_cb[0]', legalCustodyTo === 'petitioner');
    fillCheckbox(fl311Pages, fl311FieldMap, 'FL-311[0].Page1[0].List2[0].Li1[0].ToRespondent_cb[0]', legalCustodyTo === 'respondent');
    fillCheckbox(fl311Pages, fl311FieldMap, 'FL-311[0].Page1[0].List2[0].Li1[0].ToBothJointly_cb[0]', legalCustodyTo === 'joint');
    fillCheckbox(fl311Pages, fl311FieldMap, 'FL-311[0].Page1[0].List2[0].Li1[0].ToOther_cb[0]', legalCustodyTo === 'other');
    fillCheckbox(fl311Pages, fl311FieldMap, 'FL-311[0].Page1[0].List2[0].Li2[0].ToPetitioner_cb[0]', physicalCustodyTo === 'petitioner');
    fillCheckbox(fl311Pages, fl311FieldMap, 'FL-311[0].Page1[0].List2[0].Li2[0].ToRespondent_cb[0]', physicalCustodyTo === 'respondent');
    fillCheckbox(fl311Pages, fl311FieldMap, 'FL-311[0].Page1[0].List2[0].Li2[0].ToBothJointly_cb[0]', physicalCustodyTo === 'joint');
    fillCheckbox(fl311Pages, fl311FieldMap, 'FL-311[0].Page1[0].List2[0].Li2[0].ToOther_cb[0]', physicalCustodyTo === 'other');
  }

  fillCheckbox(fl311Pages, fl311FieldMap, 'FL-311[0].Page1[0].List3[0].Visitation_cb[0]', visitationRequested);
  if (visitationRequested) {
    fillCheckbox(fl311Pages, fl311FieldMap, 'FL-311[0].Page2[0].List4[0].PetitionerVisits_cb[0]', visitationTo === 'petitioner');
    fillCheckbox(fl311Pages, fl311FieldMap, 'FL-311[0].Page2[0].List4[0].RespondentVisits_cb[0]', visitationTo === 'respondent');
    fillCheckbox(fl311Pages, fl311FieldMap, 'FL-311[0].Page2[0].List4[0].OtherParentPartyVisits_cb[0]', visitationTo === 'other');
    fillCheckbox(
      fl311Pages,
      fl311FieldMap,
      'FL-311[0].Page1[0].List3[0].Li1[0].ReasonableRightOfVisitation_cb[0]',
      visitationPlanMode === 'reasonable_right_of_visitation',
    );
    fillCheckbox(
      fl311Pages,
      fl311FieldMap,
      'FL-311[0].Page1[0].List3[0].Li2[0].SeeAttachedDocumentForVisitationPlan_cb[0]',
      visitationPlanMode === 'attachment_on_file',
    );
    fillTextFields(
      fl311Pages,
      fl311FieldMap,
      'FL-311[0].Page1[0].List3[0].Li2[0].SpecifyNumberPagesAttached_ft[0]',
      visitationPlanMode === 'attachment_on_file' && visitationAttachmentPageCount > 0 ? String(visitationAttachmentPageCount) : '',
      fontRegular,
      { size: 8 },
    );
    fillTextFields(
      fl311Pages,
      fl311FieldMap,
      'FL-311[0].Page1[0].List3[0].Li2[0].DateOfAttachment_tf[0]',
      visitationPlanMode === 'attachment_on_file' ? visitationAttachmentDate : '',
      fontRegular,
      { size: 8 },
    );
  }

  return fl311Pages.length;
}

async function appendFl312AttachmentPages(
  output: PDFDocument,
  fl312Template: PDFDocument,
  fl312FieldMap: Map<string, TemplateField[]>,
  fontRegular: PDFFont,
  workspace: StarterPacketWorkspace,
  petitionerName: string,
  respondentName: string,
  caseNumber: string,
) {
  const [fl312Page1, fl312Page2] = await output.copyPages(fl312Template, [0, 1]);
  const fl312Pages = [fl312Page1, fl312Page2];
  fl312Pages.forEach((page) => output.addPage(page));

  const fl312 = workspace.fl100?.childCustodyVisitation?.fl312;
  const otherParentParty = sanitizeText(fl312?.filingPartyOtherName?.value);
  const requestingPartyName = sanitizeText(fl312?.requestingPartyName?.value);

  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].PxCaption_sf[0].Parties[0].Petitioner_ft[0]', petitionerName, fontRegular, { size: 8 });
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].PxCaption_sf[0].Parties[0].Respondent_ft[0]', respondentName, fontRegular, { size: 8 });
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].PxCaption_sf[0].Parties[0].OtherParentParty_ft[0]', otherParentParty, fontRegular, { size: 8 });
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].PxCaption_sf[0].CaseNumber[0].CaseNumber_ft[0]', caseNumber, fontRegular, { size: 8 });
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].PxCaption_sf[0].Parties[0].Petitioner_ft[0]', petitionerName, fontRegular, { size: 8 });
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].PxCaption_sf[0].Parties[0].Respondent_ft[0]', respondentName, fontRegular, { size: 8 });
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].PxCaption_sf[0].Parties[0].OtherParentParty_ft[0]', otherParentParty, fontRegular, { size: 8 });
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].PxCaption_sf[0].CaseNumber[0].CaseNumber_ft[0]', caseNumber, fontRegular, { size: 8 });

  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].Form_Sub[0].Petition_cb[0]', true);
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List1[0].LI1[0].YourName_ft[0]', requestingPartyName, fontRegular, { size: 8 });
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List2[0].LI1[0].NoAbductionByPetitioner_cb[0]', Boolean(fl312?.abductionBy?.petitioner?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List2[0].LI1[0].NoAbductionByRespondent_cb[0]', Boolean(fl312?.abductionBy?.respondent?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List2[0].LI1[0].NoAbductionByOtherParentParty_cb[0]', Boolean(fl312?.abductionBy?.otherParentParty?.value));

  const anotherCounty = Boolean(fl312?.riskDestinations?.anotherCaliforniaCounty?.value);
  const anotherState = Boolean(fl312?.riskDestinations?.anotherState?.value);
  const foreignCountry = Boolean(fl312?.riskDestinations?.foreignCountry?.value);
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List3[0].LI1[0].AnotherCountyInCalifornia_cb[0]', anotherCounty);
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List3[0].LI1[0].AnotherCounty_ft[0]', anotherCounty ? sanitizeText(fl312?.riskDestinations?.anotherCaliforniaCountyName?.value) : '', fontRegular, { size: 8 });
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List3[0].LI2[0].AnotherState_cb[0]', anotherState);
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List3[0].LI2[0].SpecifyOtherState_ft[0]', anotherState ? sanitizeText(fl312?.riskDestinations?.anotherStateName?.value) : '', fontRegular, { size: 8 });
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List3[0].LI3[0].ForeignCountry_cb[0]', foreignCountry);
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List3[0].LI3[0].SpecifyForeignCountry_ft[0]', foreignCountry ? sanitizeText(fl312?.riskDestinations?.foreignCountryName?.value) : '', fontRegular, { size: 8 });
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List3[0].LI3[0].List1[0].LI1[0].CitizenOfThatCountry_cb[0]', foreignCountry && Boolean(fl312?.riskDestinations?.foreignCountryCitizen?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List3[0].LI3[0].List1[0].LI2[0].TiesToThatCountry_cb[0]', foreignCountry && Boolean(fl312?.riskDestinations?.foreignCountryHasTies?.value));
  fillTextFields(
    fl312Pages,
    fl312FieldMap,
    'FL-312[0].Page1[0].List3[0].LI3[0].List1[0].LI2[0].SpecifyTiesToThatCountry_ft[0]',
    foreignCountry ? sanitizeText(fl312?.riskDestinations?.foreignCountryTiesDetails?.value) : '',
    fontRegular,
    { size: 8 },
  );

  const riskFactors = fl312?.riskFactors;
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List4[0].LI1[0].QuitJob_cb[0]', Boolean(riskFactors?.custodyOrderViolationThreat?.value));
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List4[0].LI1[0].TextField1[0]', sanitizeText(riskFactors?.custodyOrderViolationThreatDetails?.value), fontRegular, { size: 8, multiline: true });
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List4[0].LI1[0].SpecifyExplain[0]', sanitizeText(riskFactors?.custodyOrderViolationThreatDetails?.value), fontRegular, { size: 8, multiline: true });
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List4[0].LI2[0].QuitJob_cb[0]', Boolean(riskFactors?.weakCaliforniaTies?.value));
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List4[0].LI2[0].SpecifyWhyEasyForPartyToLeaveCalifornia_ft[0]', sanitizeText(riskFactors?.weakCaliforniaTiesDetails?.value), fontRegular, { size: 8, multiline: true });
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List4[0].LI3[0].QuitJob_cb[0]', Boolean(riskFactors?.recentAbductionPlanningActions?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List4[0].LI3[0].#area[0].QuitJob_cb1[0]', Boolean(riskFactors?.recentActionQuitJob?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List4[0].LI3[0].#area[1].SoldHome_cb[0]', Boolean(riskFactors?.recentActionSoldHome?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List4[0].LI3[0].#area[2].ClosedBankAccount_cb[0]', Boolean(riskFactors?.recentActionClosedBankAccount?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List4[0].LI3[0].#area[3].EndedLease_cb[0]', Boolean(riskFactors?.recentActionEndedLease?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List4[0].LI3[0].#area[4].SoldAssets_cb[0]', Boolean(riskFactors?.recentActionSoldAssets?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List4[0].LI3[0].#area[5].HidOrDestroyedDocuments_cb[0]', Boolean(riskFactors?.recentActionHidOrDestroyedDocuments?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List4[0].LI3[0].#area[6].CheckBox1[0]', Boolean(riskFactors?.recentActionAppliedForTravelDocuments?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List4[0].LI3[0].#area[7].CheckBox61[0]', Boolean(riskFactors?.recentActionOther?.value));
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List4[0].LI3[0].OtherSpecify_ft[0]', sanitizeText(riskFactors?.recentActionOtherDetails?.value), fontRegular, { size: 8, multiline: true });
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List4[0].LI4[0].#area[0].CheckBox1[0]', Boolean(riskFactors?.historyOfRiskBehaviors?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List4[0].LI4[0].#area[1].CheckBox2[0]', Boolean(riskFactors?.historyDomesticViolence?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List4[0].LI4[0].#area[2].CheckBox3[0]', Boolean(riskFactors?.historyChildAbuse?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List4[0].LI4[0].#area[3].CheckBox4[0]', Boolean(riskFactors?.historyParentingNonCooperation?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List4[0].LI4[0].#area[4].CheckBox5[0]', Boolean(riskFactors?.historyChildTakingWithoutPermission?.value));
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List4[0].LI4[0].TextField2[0]', sanitizeText(riskFactors?.historyDetails?.value), fontRegular, { size: 8, multiline: true });
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List4[0].LI5[0].CheckBox1[0]', Boolean(riskFactors?.criminalRecord?.value));
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page1[0].List4[0].LI5[0].ExplainCriminalRecord_ft[0]', sanitizeText(riskFactors?.criminalRecordDetails?.value), fontRegular, { size: 8, multiline: true });

  const requestedOrdersAgainst = fl312?.requestedOrdersAgainst;
  const requestedOrders = fl312?.requestedOrders;
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].Request_Sub[0].CheckBox1[0]', Boolean(requestedOrdersAgainst?.petitioner?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].Request_Sub[0].CheckBox2[0]', Boolean(requestedOrdersAgainst?.respondent?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].Request_Sub[0].CheckBox3[0]', Boolean(requestedOrdersAgainst?.otherParentParty?.value));

  const supervisedVisitation = Boolean(requestedOrders?.supervisedVisitation?.value);
  const supervisedTermsMode = requestedOrders?.supervisedVisitationTermsMode?.value ?? 'unspecified';
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List5[0].LI1[0].#area[0].CheckBox1[0]', supervisedVisitation);
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List5[0].LI1[0].#area[1].CheckBox2[0]', supervisedVisitation && supervisedTermsMode === 'fl311');
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List5[0].LI1[0].#area[2].CheckBox3[0]', supervisedVisitation && supervisedTermsMode === 'as_follows');
  fillTextFields(
    fl312Pages,
    fl312FieldMap,
    'FL-312[0].Page2[0].List5[0].LI1[0].TextField3[0]',
    supervisedVisitation && supervisedTermsMode === 'as_follows' ? sanitizeText(requestedOrders?.supervisedVisitationTermsDetails?.value) : '',
    fontRegular,
    { size: 8, multiline: true },
  );

  const postBond = Boolean(requestedOrders?.postBond?.value);
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List6[0].LI1[0].CheckBox1[0]', postBond);
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List6[0].LI1[0].TotalOrderAmount_dc[0]', postBond ? sanitizeText(requestedOrders?.postBondAmount?.value) : '', fontRegular, { size: 8 });

  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List7[0].LI1[0].#area[0].CheckBox1[0]', Boolean(requestedOrders?.noMoveWithoutWrittenPermissionOrCourtOrder?.value));

  const noTravel = Boolean(requestedOrders?.noTravelWithoutWrittenPermissionOrCourtOrder?.value);
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List8[0].LI1[0].#area[0].CheckBox1[0]', noTravel);
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List8[0].LI1[0].CheckBox2[0]', noTravel && Boolean(requestedOrders?.travelRestrictionThisCounty?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List8[0].LI1[0].CheckBox3[0]', noTravel && Boolean(requestedOrders?.travelRestrictionUnitedStates?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List8[0].LI1[0].CheckBox4[0]', noTravel && Boolean(requestedOrders?.travelRestrictionCalifornia?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List8[0].LI1[0].CheckBox5[0]', noTravel && Boolean(requestedOrders?.travelRestrictionOther?.value));
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List8[0].LI1[0].SpeicifyOtherTravelRestrictions_ft[0]', noTravel ? sanitizeText(requestedOrders?.travelRestrictionOtherDetails?.value) : '', fontRegular, { size: 8 });

  const registerState = Boolean(requestedOrders?.registerOrderInOtherState?.value);
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List9[0].LI1[0].#area[0].CheckBox1[0]', registerState);
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List9[0].LI1[0].SpecifyStateToRegisterOrder_ft[0]', registerState ? sanitizeText(requestedOrders?.registerOrderStateName?.value) : '', fontRegular, { size: 8 });

  const turnInDocs = Boolean(requestedOrders?.turnInPassportsAndTravelDocuments?.value);
  const noNewDocs = Boolean(requestedOrders?.doNotApplyForNewPassportsOrDocuments?.value);
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List10[0].LI1[0].#area[0].CheckBox1[0]', turnInDocs || noNewDocs);
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List10[0].LI1[0].CheckBox2[0]', turnInDocs);
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List10[0].LI1[0].CheckBox3[0]', noNewDocs);

  const providesAnyTravelDocs = Boolean(requestedOrders?.provideTravelItinerary?.value)
    || Boolean(requestedOrders?.provideRoundTripAirlineTickets?.value)
    || Boolean(requestedOrders?.provideAddressesAndTelephone?.value)
    || Boolean(requestedOrders?.provideOpenReturnTicketForRequestingParty?.value)
    || Boolean(requestedOrders?.provideOtherTravelDocuments?.value);
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List11[0].LI1[0].#area[0].CheckBox1[0]', providesAnyTravelDocs);
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List11[0].LI1[0].#area[1].CheckBox2[0]', Boolean(requestedOrders?.provideTravelItinerary?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List11[0].LI1[0].#area[2].CheckBox3[0]', Boolean(requestedOrders?.provideRoundTripAirlineTickets?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List11[0].LI1[0].#area[3].CheckBox4[0]', Boolean(requestedOrders?.provideAddressesAndTelephone?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List11[0].LI1[0].#area[4].CheckBox5[0]', Boolean(requestedOrders?.provideOpenReturnTicketForRequestingParty?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List11[0].LI1[0].#area[5].CheckBox6[0]', Boolean(requestedOrders?.provideOtherTravelDocuments?.value));
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List11[0].LI1[0].OtherSpecify_tf[0]', sanitizeText(requestedOrders?.provideOtherTravelDocumentsDetails?.value), fontRegular, { size: 8 });
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List11[0].LI1[0].OtherSpecify_tfCont[0]', sanitizeText(requestedOrders?.provideOtherTravelDocumentsDetails?.value), fontRegular, { size: 8 });

  const notifyEmbassy = Boolean(requestedOrders?.notifyForeignEmbassyOrConsulate?.value);
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List12[0].LI1[0].#area[0].CheckBox1[0]', notifyEmbassy);
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List12[0].LI1[0].IdentifyEmbassyOrConsulate_ft[0]', notifyEmbassy ? sanitizeText(requestedOrders?.embassyOrConsulateCountry?.value) : '', fontRegular, { size: 8 });
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List12[0].LI1[0].FillText1[0]', notifyEmbassy ? sanitizeText(requestedOrders?.embassyNotificationWithinDays?.value) : '', fontRegular, { size: 8 });

  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List13[0].LI1[0].#area[0].CheckBox1[0]', Boolean(requestedOrders?.obtainForeignCustodyAndVisitationOrderBeforeTravel?.value));
  fillCheckbox(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List14[0].LI1[0].CheckBox1[0]', Boolean(requestedOrders?.otherOrdersRequested?.value));
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].List14[0].LI1[0].OtherSpecify_ft[0]', sanitizeText(requestedOrders?.otherOrdersDetails?.value), fontRegular, { size: 8, multiline: true });
  fillTextFields(fl312Pages, fl312FieldMap, 'FL-312[0].Page2[0].Sig_Sub[0].SigDate[0]', formatDateForCourt(fl312?.signatureDate?.value), fontRegular, { size: 8 });

  return fl312Pages.length;
}

function formatFl341CustodyValue(value: 'none' | 'petitioner' | 'respondent' | 'joint' | 'other') {
  if (value === 'petitioner') return 'Petitioner';
  if (value === 'respondent') return 'Respondent';
  if (value === 'joint') return 'Joint';
  if (value === 'other') return 'Other';
  return '';
}

function fillCaptionForDraftFl341Form(
  pages: PDFPage[],
  fieldMap: Map<string, TemplateField[]>,
  formPrefix: 'FL-341A' | 'FL-341B' | 'FL-341C' | 'FL-341D' | 'FL-341E',
  petitionerName: string,
  respondentName: string,
  otherParentParty: string,
  caseNumber: string,
  fontRegular: PDFFont,
) {
  fillTextFields(pages, fieldMap, `${formPrefix}.caption.petitioner`, petitionerName, fontRegular, { size: 8 });
  fillTextFields(pages, fieldMap, `${formPrefix}.caption.respondent`, respondentName, fontRegular, { size: 8 });
  fillTextFields(pages, fieldMap, `${formPrefix}.caption.otherParentParty`, otherParentParty, fontRegular, { size: 8 });
  fillTextFields(pages, fieldMap, `${formPrefix}.caption.caseNumber`, caseNumber, fontRegular, { size: 8 });
}

function fillSourceOrderForDraftFl341Form(
  pages: PDFPage[],
  fieldMap: Map<string, TemplateField[]>,
  formPrefix: 'FL-341A' | 'FL-341B' | 'FL-341C' | 'FL-341D' | 'FL-341E',
  sourceOrder: 'unspecified' | 'fl340' | 'fl180' | 'fl250' | 'fl355' | 'other',
  otherText: string,
  fontRegular: PDFFont,
) {
  fillCheckbox(pages, fieldMap, `${formPrefix}.sourceOrder.fl340`, sourceOrder === 'fl340');
  fillCheckbox(pages, fieldMap, `${formPrefix}.sourceOrder.fl180`, sourceOrder === 'fl180');
  fillCheckbox(pages, fieldMap, `${formPrefix}.sourceOrder.fl250`, sourceOrder === 'fl250');
  fillCheckbox(pages, fieldMap, `${formPrefix}.sourceOrder.fl355`, sourceOrder === 'fl355');
  fillCheckbox(pages, fieldMap, `${formPrefix}.sourceOrder.other`, sourceOrder === 'other');
  fillTextFields(
    pages,
    fieldMap,
    `${formPrefix}.sourceOrder.otherText`,
    sourceOrder === 'other' ? sanitizeText(otherText) : '',
    fontRegular,
    { size: 8 },
  );
}

async function appendFl341CAttachmentPages(
  output: PDFDocument,
  fl341cTemplate: PDFDocument,
  fl341cFieldMap: Map<string, TemplateField[]>,
  fontRegular: PDFFont,
  workspace: StarterPacketWorkspace,
  petitionerName: string,
  respondentName: string,
  caseNumber: string,
) {
  const pageIndices = fl341cTemplate.getPageIndices();
  const pages = await output.copyPages(fl341cTemplate, pageIndices);
  pages.forEach((page) => output.addPage(page));

  const fl341 = workspace.fl100?.childCustodyVisitation?.fl341;
  const fl341c = fl341?.fl341c;
  const otherParentParty = sanitizeText(fl341?.otherParentPartyName?.value);
  const sourceOrder = fl341?.sourceOrder?.value ?? 'unspecified';

  fillCaptionForDraftFl341Form(pages, fl341cFieldMap, 'FL-341C', petitionerName, respondentName, otherParentParty, caseNumber, fontRegular);
  fillSourceOrderForDraftFl341Form(
    pages,
    fl341cFieldMap,
    'FL-341C',
    sourceOrder,
    sanitizeText(fl341?.sourceOrderOtherText?.value),
    fontRegular,
  );

  const rows = [
    ['newYearsDay', fl341c?.holidayRows?.newYearsDay],
    ['springBreak', fl341c?.holidayRows?.springBreak],
    ['thanksgiving', fl341c?.holidayRows?.thanksgivingDay],
    ['winterBreak', fl341c?.holidayRows?.winterBreak],
    ['childBirthday', fl341c?.holidayRows?.childBirthday],
  ] as const;
  for (const [key, row] of rows) {
    if (!row?.enabled?.value) continue;
    fillCheckbox(pages, fl341cFieldMap, `FL-341C.holiday.${key}.mode.every_year`, row.yearPattern?.value === 'every_year');
    fillCheckbox(pages, fl341cFieldMap, `FL-341C.holiday.${key}.mode.even_years`, row.yearPattern?.value === 'even_years');
    fillCheckbox(pages, fl341cFieldMap, `FL-341C.holiday.${key}.mode.odd_years`, row.yearPattern?.value === 'odd_years');
    fillCheckbox(pages, fl341cFieldMap, `FL-341C.holiday.${key}.party.petitioner`, row.assignedTo?.value === 'petitioner');
    fillCheckbox(pages, fl341cFieldMap, `FL-341C.holiday.${key}.party.respondent`, row.assignedTo?.value === 'respondent');
    fillCheckbox(pages, fl341cFieldMap, `FL-341C.holiday.${key}.party.other_parent_party`, row.assignedTo?.value === 'other_parent_party');
    fillTextFields(pages, fl341cFieldMap, `FL-341C.holiday.${key}.times`, sanitizeText(row.times?.value), fontRegular, { size: 8 });
  }

  fillTextFields(pages, fl341cFieldMap, 'FL-341C.holiday.additionalNotes', sanitizeMultilineText(fl341c?.additionalHolidayNotes?.value), fontRegular, { size: 8, multiline: true });
  fillCheckbox(pages, fl341cFieldMap, 'FL-341C.vacation.party.petitioner', fl341c?.vacation?.assignedTo?.value === 'petitioner');
  fillCheckbox(pages, fl341cFieldMap, 'FL-341C.vacation.party.respondent', fl341c?.vacation?.assignedTo?.value === 'respondent');
  fillCheckbox(pages, fl341cFieldMap, 'FL-341C.vacation.party.other_parent_party', fl341c?.vacation?.assignedTo?.value === 'other_parent_party');
  fillTextFields(pages, fl341cFieldMap, 'FL-341C.vacation.maxDuration', sanitizeText(fl341c?.vacation?.maxDuration?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl341cFieldMap, 'FL-341C.vacation.maxDurationUnit.days', fl341c?.vacation?.maxDurationUnit?.value === 'days');
  fillCheckbox(pages, fl341cFieldMap, 'FL-341C.vacation.maxDurationUnit.weeks', fl341c?.vacation?.maxDurationUnit?.value === 'weeks');
  fillTextFields(pages, fl341cFieldMap, 'FL-341C.vacation.timesPerYear', sanitizeText(fl341c?.vacation?.timesPerYear?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl341cFieldMap, 'FL-341C.vacation.noticeDays', sanitizeText(fl341c?.vacation?.noticeDays?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl341cFieldMap, 'FL-341C.vacation.responseDays', sanitizeText(fl341c?.vacation?.responseDays?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl341cFieldMap, 'FL-341C.vacation.outsideCalifornia', Boolean(fl341c?.vacation?.allowOutsideCalifornia?.value));
  fillCheckbox(pages, fl341cFieldMap, 'FL-341C.vacation.outsideUnitedStates', Boolean(fl341c?.vacation?.allowOutsideUnitedStates?.value));
  fillTextFields(pages, fl341cFieldMap, 'FL-341C.vacation.otherTerms', sanitizeMultilineText(fl341c?.vacation?.otherTerms?.value), fontRegular, { size: 8, multiline: true });

  return pages.length;
}

async function appendFl341AAttachmentPages(
  output: PDFDocument,
  fl341aTemplate: PDFDocument,
  fl341aFieldMap: Map<string, TemplateField[]>,
  fontRegular: PDFFont,
  workspace: StarterPacketWorkspace,
  petitionerName: string,
  respondentName: string,
  caseNumber: string,
) {
  const pageIndices = fl341aTemplate.getPageIndices();
  const pages = await output.copyPages(fl341aTemplate, pageIndices);
  pages.forEach((page) => output.addPage(page));

  const fl341 = workspace.fl100?.childCustodyVisitation?.fl341;
  const fl341a = fl341?.fl341a;
  const otherParentParty = sanitizeText(fl341?.otherParentPartyName?.value);
  const sourceOrder = fl341?.sourceOrder?.value ?? 'unspecified';

  fillCaptionForDraftFl341Form(pages, fl341aFieldMap, 'FL-341A', petitionerName, respondentName, otherParentParty, caseNumber, fontRegular);
  fillSourceOrderForDraftFl341Form(
    pages,
    fl341aFieldMap,
    'FL-341A',
    sourceOrder,
    sanitizeText(fl341?.sourceOrderOtherText?.value),
    fontRegular,
  );

  fillCheckbox(pages, fl341aFieldMap, 'FL-341A.supervisedParty.petitioner', Boolean(fl341a?.supervisedParty?.petitioner?.value));
  fillCheckbox(pages, fl341aFieldMap, 'FL-341A.supervisedParty.respondent', Boolean(fl341a?.supervisedParty?.respondent?.value));
  fillCheckbox(pages, fl341aFieldMap, 'FL-341A.supervisedParty.other_parent_party', Boolean(fl341a?.supervisedParty?.otherParentParty?.value));
  fillCheckbox(pages, fl341aFieldMap, 'FL-341A.supervisor.type.professional', fl341a?.supervisor?.type?.value === 'professional');
  fillCheckbox(pages, fl341aFieldMap, 'FL-341A.supervisor.type.nonprofessional', fl341a?.supervisor?.type?.value === 'nonprofessional');
  fillCheckbox(pages, fl341aFieldMap, 'FL-341A.supervisor.type.other', fl341a?.supervisor?.type?.value === 'other');
  fillTextFields(
    pages,
    fl341aFieldMap,
    'FL-341A.supervisor.type.otherText',
    fl341a?.supervisor?.type?.value === 'other' ? sanitizeText(fl341a?.supervisor?.otherTypeText?.value) : '',
    fontRegular,
    { size: 8 },
  );
  fillTextFields(pages, fl341aFieldMap, 'FL-341A.supervisor.name', sanitizeText(fl341a?.supervisor?.name?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl341aFieldMap, 'FL-341A.supervisor.contact', sanitizeText(fl341a?.supervisor?.contact?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl341aFieldMap, 'FL-341A.supervisor.fees.petitioner', fl341a?.supervisor?.feesPaidBy?.value === 'petitioner');
  fillCheckbox(pages, fl341aFieldMap, 'FL-341A.supervisor.fees.respondent', fl341a?.supervisor?.feesPaidBy?.value === 'respondent');
  fillCheckbox(pages, fl341aFieldMap, 'FL-341A.supervisor.fees.shared', fl341a?.supervisor?.feesPaidBy?.value === 'shared');
  fillCheckbox(pages, fl341aFieldMap, 'FL-341A.supervisor.fees.other', fl341a?.supervisor?.feesPaidBy?.value === 'other');
  fillTextFields(
    pages,
    fl341aFieldMap,
    'FL-341A.supervisor.fees.otherText',
    fl341a?.supervisor?.feesPaidBy?.value === 'other' ? sanitizeText(fl341a?.supervisor?.feesOtherText?.value) : '',
    fontRegular,
    { size: 8 },
  );
  fillCheckbox(pages, fl341aFieldMap, 'FL-341A.schedule.mode.fl311', fl341a?.schedule?.mode?.value === 'fl311');
  fillCheckbox(pages, fl341aFieldMap, 'FL-341A.schedule.mode.attachment', fl341a?.schedule?.mode?.value === 'attachment');
  fillCheckbox(pages, fl341aFieldMap, 'FL-341A.schedule.mode.text', fl341a?.schedule?.mode?.value === 'text');
  fillTextFields(
    pages,
    fl341aFieldMap,
    'FL-341A.schedule.attachmentPageCount',
    fl341a?.schedule?.mode?.value === 'attachment' ? sanitizeText(fl341a?.schedule?.attachmentPageCount?.value) : '',
    fontRegular,
    { size: 8 },
  );
  fillTextFields(
    pages,
    fl341aFieldMap,
    'FL-341A.schedule.text',
    fl341a?.schedule?.mode?.value === 'text' ? sanitizeMultilineText(fl341a?.schedule?.text?.value) : '',
    fontRegular,
    { size: 8, multiline: true },
  );
  fillTextFields(pages, fl341aFieldMap, 'FL-341A.restrictions', sanitizeMultilineText(fl341a?.restrictions?.value), fontRegular, { size: 8, multiline: true });
  fillTextFields(pages, fl341aFieldMap, 'FL-341A.otherTerms', sanitizeMultilineText(fl341a?.otherTerms?.value), fontRegular, { size: 8, multiline: true });

  return pages.length;
}

async function appendFl341BAttachmentPages(
  output: PDFDocument,
  fl341bTemplate: PDFDocument,
  fl341bFieldMap: Map<string, TemplateField[]>,
  fontRegular: PDFFont,
  workspace: StarterPacketWorkspace,
  petitionerName: string,
  respondentName: string,
  caseNumber: string,
) {
  const pageIndices = fl341bTemplate.getPageIndices();
  const pages = await output.copyPages(fl341bTemplate, pageIndices);
  pages.forEach((page) => output.addPage(page));

  const fl341 = workspace.fl100?.childCustodyVisitation?.fl341;
  const fl341b = fl341?.fl341b;
  const otherParentParty = sanitizeText(fl341?.otherParentPartyName?.value);
  const risk = fl341b?.risk;
  const prep = risk?.preparationActions;
  const history = risk?.history;
  const orders = fl341b?.orders;

  fillCaptionForDraftFl341Form(pages, fl341bFieldMap, 'FL-341B', petitionerName, respondentName, otherParentParty, caseNumber, fontRegular);
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.sourceOrder.fl341', true);
  fillTextFields(pages, fl341bFieldMap, 'FL-341B.restrainedPartyName', sanitizeText(fl341b?.restrainedPartyName?.value), fontRegular, { size: 8 });

  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.risk.violatedPastOrders', Boolean(risk?.violatedPastOrders?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.risk.noStrongCaliforniaTies', Boolean(risk?.noStrongCaliforniaTies?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.risk.preparationActions', Boolean(prep?.selected?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.risk.preparation.quitJob', Boolean(prep?.quitJob?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.risk.preparation.soldHome', Boolean(prep?.soldHome?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.risk.preparation.closedBankAccount', Boolean(prep?.closedBankAccount?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.risk.preparation.endedLease', Boolean(prep?.endedLease?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.risk.preparation.soldAssets', Boolean(prep?.soldAssets?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.risk.preparation.hiddenOrDestroyedDocuments', Boolean(prep?.hiddenOrDestroyedDocuments?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.risk.preparation.appliedForPassport', Boolean(prep?.appliedForPassport?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.risk.preparation.other', Boolean(prep?.other?.value));
  fillTextFields(pages, fl341bFieldMap, 'FL-341B.risk.preparation.otherDetails', sanitizeText(prep?.otherDetails?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.risk.history', Boolean(history?.selected?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.risk.history.domesticViolence', Boolean(history?.domesticViolence?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.risk.history.childAbuse', Boolean(history?.childAbuse?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.risk.history.nonCooperation', Boolean(history?.nonCooperation?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.risk.criminalRecord', Boolean(risk?.criminalRecord?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.risk.tiesToOtherJurisdiction', Boolean(risk?.tiesToOtherJurisdiction?.value));

  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.supervisedVisitation', Boolean(orders?.supervisedVisitation?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.supervisedVisitationTerms.fl341a', orders?.supervisedVisitationTermsMode?.value === 'fl341a');
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.supervisedVisitationTerms.asFollows', orders?.supervisedVisitationTermsMode?.value === 'as_follows');
  fillTextFields(pages, fl341bFieldMap, 'FL-341B.order.supervisedVisitationTerms.details', sanitizeMultilineText(orders?.supervisedVisitationTermsDetails?.value), fontRegular, { size: 8, multiline: true });
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.postBond', Boolean(orders?.postBond?.value));
  fillTextFields(pages, fl341bFieldMap, 'FL-341B.order.postBondAmount', sanitizeText(orders?.postBondAmount?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl341bFieldMap, 'FL-341B.order.postBondTerms', sanitizeMultilineText(orders?.postBondTerms?.value), fontRegular, { size: 8, multiline: true });
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.noMoveWithoutPermission', Boolean(orders?.noMoveWithoutPermission?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.noMove.currentResidence', Boolean(orders?.noMoveCurrentResidence?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.noMove.currentSchoolDistrict', Boolean(orders?.noMoveCurrentSchoolDistrict?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.noMove.otherPlace', Boolean(orders?.noMoveOtherPlace?.value));
  fillTextFields(pages, fl341bFieldMap, 'FL-341B.order.noMove.otherPlaceDetails', sanitizeText(orders?.noMoveOtherPlaceDetails?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.noTravelWithoutPermission', Boolean(orders?.noTravelWithoutPermission?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.noTravel.thisCounty', Boolean(orders?.travelRestrictionThisCounty?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.noTravel.california', Boolean(orders?.travelRestrictionCalifornia?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.noTravel.unitedStates', Boolean(orders?.travelRestrictionUnitedStates?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.noTravel.other', Boolean(orders?.travelRestrictionOther?.value));
  fillTextFields(pages, fl341bFieldMap, 'FL-341B.order.noTravel.otherDetails', sanitizeText(orders?.travelRestrictionOtherDetails?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.registerInOtherState', Boolean(orders?.registerInOtherState?.value));
  fillTextFields(pages, fl341bFieldMap, 'FL-341B.order.registerInOtherStateName', sanitizeText(orders?.registerInOtherStateName?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.noPassportApplications', Boolean(orders?.noPassportApplications?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.turnInPassportsAndVitalDocs', Boolean(orders?.turnInPassportsAndVitalDocs?.value));
  fillTextFields(pages, fl341bFieldMap, 'FL-341B.order.turnInPassportsAndVitalDocsList', sanitizeText(orders?.turnInPassportsAndVitalDocsList?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.provideTravelInfo', Boolean(orders?.provideTravelInfo?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.provideTravelItinerary', Boolean(orders?.provideTravelItinerary?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.provideRoundTripTickets', Boolean(orders?.provideRoundTripTickets?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.provideAddressesAndTelephone', Boolean(orders?.provideAddressesAndTelephone?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.provideOpenReturnTicket', Boolean(orders?.provideOpenReturnTicket?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.provideOtherTravelInfo', Boolean(orders?.provideOtherTravelInfo?.value));
  fillTextFields(pages, fl341bFieldMap, 'FL-341B.order.provideOtherTravelInfoDetails', sanitizeText(orders?.provideOtherTravelInfoDetails?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.notifyEmbassyOrConsulate', Boolean(orders?.notifyEmbassyOrConsulate?.value));
  fillTextFields(pages, fl341bFieldMap, 'FL-341B.order.notifyEmbassyOrConsulateCountry', sanitizeText(orders?.notifyEmbassyCountry?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl341bFieldMap, 'FL-341B.order.notifyEmbassyWithinDays', sanitizeText(orders?.notifyEmbassyWithinDays?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.obtainForeignOrderBeforeTravel', Boolean(orders?.obtainForeignOrderBeforeTravel?.value));
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.enforceOrder', Boolean(orders?.enforceOrder?.value));
  fillTextFields(pages, fl341bFieldMap, 'FL-341B.order.enforceOrderContactInfo', sanitizeText(orders?.enforceOrderContactInfo?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl341bFieldMap, 'FL-341B.order.other', Boolean(orders?.other?.value));
  fillTextFields(pages, fl341bFieldMap, 'FL-341B.order.otherDetails', sanitizeMultilineText(orders?.otherDetails?.value), fontRegular, { size: 8, multiline: true });

  return pages.length;
}

async function appendFl341DAttachmentPages(
  output: PDFDocument,
  fl341dTemplate: PDFDocument,
  fl341dFieldMap: Map<string, TemplateField[]>,
  fontRegular: PDFFont,
  workspace: StarterPacketWorkspace,
  petitionerName: string,
  respondentName: string,
  caseNumber: string,
) {
  const pageIndices = fl341dTemplate.getPageIndices();
  const pages = await output.copyPages(fl341dTemplate, pageIndices);
  pages.forEach((page) => output.addPage(page));

  const fl341 = workspace.fl100?.childCustodyVisitation?.fl341;
  const fl341d = fl341?.fl341d;
  const otherParentParty = sanitizeText(fl341?.otherParentPartyName?.value);
  const sourceOrder = fl341?.sourceOrder?.value ?? 'unspecified';

  fillCaptionForDraftFl341Form(pages, fl341dFieldMap, 'FL-341D', petitionerName, respondentName, otherParentParty, caseNumber, fontRegular);
  fillSourceOrderForDraftFl341Form(
    pages,
    fl341dFieldMap,
    'FL-341D',
    sourceOrder,
    sanitizeText(fl341?.sourceOrderOtherText?.value),
    fontRegular,
  );

  const provisions = [
    ['exchangeSchedule', fl341d?.provisions?.exchangeSchedule],
    ['transportation', fl341d?.provisions?.transportation],
    ['makeupTime', fl341d?.provisions?.makeupTime],
    ['communication', fl341d?.provisions?.communication],
    ['rightOfFirstRefusal', fl341d?.provisions?.rightOfFirstRefusal],
    ['temporaryChangesByAgreement', fl341d?.provisions?.temporaryChangesByAgreement],
    ['other', fl341d?.provisions?.other],
  ] as const;
  for (const [key, provision] of provisions) {
    fillCheckbox(pages, fl341dFieldMap, `FL-341D.provision.${key}.selected`, Boolean(provision?.selected?.value));
    fillTextFields(
      pages,
      fl341dFieldMap,
      `FL-341D.provision.${key}.details`,
      sanitizeMultilineText(provision?.details?.value),
      fontRegular,
      { size: 8, multiline: true },
    );
  }

  return pages.length;
}

async function appendFl341EAttachmentPages(
  output: PDFDocument,
  fl341eTemplate: PDFDocument,
  fl341eFieldMap: Map<string, TemplateField[]>,
  fontRegular: PDFFont,
  workspace: StarterPacketWorkspace,
  petitionerName: string,
  respondentName: string,
  caseNumber: string,
) {
  const pageIndices = fl341eTemplate.getPageIndices();
  const pages = await output.copyPages(fl341eTemplate, pageIndices);
  pages.forEach((page) => output.addPage(page));

  const fl341 = workspace.fl100?.childCustodyVisitation?.fl341;
  const fl341e = fl341?.fl341e;
  const otherParentParty = sanitizeText(fl341?.otherParentPartyName?.value);
  const sourceOrder = fl341?.sourceOrder?.value ?? 'unspecified';

  fillCaptionForDraftFl341Form(pages, fl341eFieldMap, 'FL-341E', petitionerName, respondentName, otherParentParty, caseNumber, fontRegular);
  fillSourceOrderForDraftFl341Form(
    pages,
    fl341eFieldMap,
    'FL-341E',
    sourceOrder,
    sanitizeText(fl341?.sourceOrderOtherText?.value),
    fontRegular,
  );

  fillCheckbox(pages, fl341eFieldMap, 'FL-341E.orderJointLegalCustody', Boolean(fl341e?.orderJointLegalCustody?.value));
  const decisions = [
    ['education', fl341e?.decisionMaking?.education?.value],
    ['nonEmergencyHealthcare', fl341e?.decisionMaking?.nonEmergencyHealthcare?.value],
    ['mentalHealth', fl341e?.decisionMaking?.mentalHealth?.value],
    ['extracurricular', fl341e?.decisionMaking?.extracurricular?.value],
  ] as const;
  for (const [key, value] of decisions) {
    fillCheckbox(pages, fl341eFieldMap, `FL-341E.decision.${key}.joint`, value === 'joint');
    fillCheckbox(pages, fl341eFieldMap, `FL-341E.decision.${key}.petitioner`, value === 'petitioner');
    fillCheckbox(pages, fl341eFieldMap, `FL-341E.decision.${key}.respondent`, value === 'respondent');
    fillCheckbox(pages, fl341eFieldMap, `FL-341E.decision.${key}.other_parent_party`, value === 'other_parent_party');
  }
  fillCheckbox(pages, fl341eFieldMap, 'FL-341E.term.recordsAccess', Boolean(fl341e?.terms?.recordsAccess?.value));
  fillCheckbox(pages, fl341eFieldMap, 'FL-341E.term.emergencyNotice', Boolean(fl341e?.terms?.emergencyNotice?.value));
  fillCheckbox(pages, fl341eFieldMap, 'FL-341E.term.portalAccess', Boolean(fl341e?.terms?.portalAccess?.value));
  fillCheckbox(pages, fl341eFieldMap, 'FL-341E.term.contactUpdates', Boolean(fl341e?.terms?.contactUpdates?.value));
  fillCheckbox(pages, fl341eFieldMap, 'FL-341E.dispute.meetAndConfer', Boolean(fl341e?.disputeResolution?.meetAndConfer?.value));
  fillCheckbox(pages, fl341eFieldMap, 'FL-341E.dispute.mediation', Boolean(fl341e?.disputeResolution?.mediation?.value));
  fillCheckbox(pages, fl341eFieldMap, 'FL-341E.dispute.court', Boolean(fl341e?.disputeResolution?.court?.value));
  fillCheckbox(pages, fl341eFieldMap, 'FL-341E.dispute.other', Boolean(fl341e?.disputeResolution?.other?.value));
  fillTextFields(pages, fl341eFieldMap, 'FL-341E.dispute.otherText', sanitizeText(fl341e?.disputeResolution?.otherText?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl341eFieldMap, 'FL-341E.additionalTerms', sanitizeMultilineText(fl341e?.additionalTerms?.value), fontRegular, { size: 8, multiline: true });

  return pages.length;
}

async function appendFl341AttachmentPages(
  output: PDFDocument,
  fl341Template: PDFDocument,
  fl341FieldMap: Map<string, TemplateField[]>,
  fontRegular: PDFFont,
  workspace: StarterPacketWorkspace,
  petitionerName: string,
  respondentName: string,
  caseNumber: string,
) {
  const fl341PageIndices = fl341Template.getPageIndices();
  const fl341Pages = await output.copyPages(fl341Template, fl341PageIndices);
  fl341Pages.forEach((page) => output.addPage(page));

  const fl341 = workspace.fl100?.childCustodyVisitation?.fl341;
  const attachments = workspace.fl100?.childCustodyVisitation?.attachments;
  const legalCustodyTo = workspace.fl100?.childCustodyVisitation?.legalCustodyTo?.value ?? 'none';
  const physicalCustodyTo = workspace.fl100?.childCustodyVisitation?.physicalCustodyTo?.value ?? 'none';
  const visitationTo = workspace.fl100?.childCustodyVisitation?.visitationTo?.value ?? 'none';
  const fl311Mode = workspace.fl100?.childCustodyVisitation?.fl311?.visitationPlanMode?.value ?? 'unspecified';
  const fl311AttachedPageCount = parseAttachmentPageCount(workspace.fl100?.childCustodyVisitation?.fl311?.visitationAttachmentPageCount?.value);
  const otherParentParty = sanitizeText(fl341?.otherParentPartyName?.value);
  const custodyRequested = Boolean(
    workspace.requests?.childCustody?.value
    || legalCustodyTo !== 'none'
    || physicalCustodyTo !== 'none',
  );
  const visitationRequested = Boolean(workspace.requests?.visitation?.value || visitationTo !== 'none');

  for (let pageNumber = 1; pageNumber <= 4; pageNumber += 1) {
    fillTextFields(
      fl341Pages,
      fl341FieldMap,
      `FL-341[0].Page${pageNumber}[0].PxCaption_sf[0].PartySub[0].TitlePartyName[0].Petitioner_ft[0]`,
      petitionerName,
      fontRegular,
      { size: 8 },
    );
    fillTextFields(
      fl341Pages,
      fl341FieldMap,
      `FL-341[0].Page${pageNumber}[0].PxCaption_sf[0].PartySub[0].TitlePartyName[0].Respondent_ft[0]`,
      respondentName,
      fontRegular,
      { size: 8 },
    );
    fillTextFields(
      fl341Pages,
      fl341FieldMap,
      `FL-341[0].Page${pageNumber}[0].PxCaption_sf[0].PartySub[0].TitlePartyName[0].OtherParentParty_ft[0]`,
      otherParentParty,
      fontRegular,
      { size: 8 },
    );
    fillTextFields(
      fl341Pages,
      fl341FieldMap,
      `FL-341[0].Page${pageNumber}[0].PxCaption_sf[0].CaseSub[0].CaseNumber[0].CaseNumber_ft[0]`,
      caseNumber,
      fontRegular,
      { size: 8 },
    );
  }

  const sourceOrder = fl341?.sourceOrder?.value ?? 'unspecified';
  fillCheckbox(fl341Pages, fl341FieldMap, 'FL-341[0].Page1[0].TitleSub[0].FindingsAndOrderAfterHearing_cb[0]', sourceOrder === 'fl340');
  fillCheckbox(fl341Pages, fl341FieldMap, 'FL-341[0].Page1[0].TitleSub[0].Response_cb1[0]', sourceOrder === 'fl180');
  fillCheckbox(fl341Pages, fl341FieldMap, 'FL-341[0].Page1[0].TitleSub[0].Response_cb2[0]', sourceOrder === 'fl250');
  fillCheckbox(fl341Pages, fl341FieldMap, 'FL-341[0].Page1[0].TitleSub[0].StipAndOrderForCustodyVisitation_cb[0]', sourceOrder === 'fl355');
  fillCheckbox(fl341Pages, fl341FieldMap, 'FL-341[0].Page1[0].TitleSub[0].Other_cb[0]', sourceOrder === 'other');
  fillTextFields(
    fl341Pages,
    fl341FieldMap,
    'FL-341[0].Page1[0].TitleSub[0].OtherSpecify_ft[0]',
    sourceOrder === 'other' ? sanitizeText(fl341?.sourceOrderOtherText?.value) : '',
    fontRegular,
    { size: 8 },
  );

  fillCheckbox(
    fl341Pages,
    fl341FieldMap,
    'FL-341[0].Page1[0].List5[0].Li1[0].ChildAbductionPrevention_cb[0]',
    Boolean(attachments?.formFl341b?.value),
  );

  fillCheckbox(fl341Pages, fl341FieldMap, 'FL-341[0].Page1[0].List7[0].Custody_cb[0]', custodyRequested);
  workspace.children.slice(0, 4).forEach((child, index) => {
    const row = index + 1;
    fillTextFields(
      fl341Pages,
      fl341FieldMap,
      `FL-341[0].Page1[0].List7[0].Li1[0].Child${row}Name_ft[0]`,
      sanitizeText(child.fullName?.value),
      fontRegular,
      { size: 8 },
    );
    fillTextFields(
      fl341Pages,
      fl341FieldMap,
      `FL-341[0].Page1[0].List7[0].Li1[0].Child${row}BirthDate_dt[0]`,
      formatDateForCourt(child.birthDate?.value),
      fontRegular,
      { size: 8 },
    );
    fillTextFields(
      fl341Pages,
      fl341FieldMap,
      `FL-341[0].Page1[0].List7[0].Li1[0].Child${row}LegalCustody_ft[0]`,
      formatFl341CustodyValue(legalCustodyTo),
      fontRegular,
      { size: 8 },
    );
    fillTextFields(
      fl341Pages,
      fl341FieldMap,
      `FL-341[0].Page1[0].List7[0].Li1[0].Child${row}PhysicalCustody_ft[0]`,
      formatFl341CustodyValue(physicalCustodyTo),
      fontRegular,
      { size: 8 },
    );
  });
  fillCheckbox(
    fl341Pages,
    fl341FieldMap,
    'FL-341[0].Page1[0].List7[0].Li2[0].ChildCustodyOrdersWithAllegationsofAbuseorSubstanceAbuse_cb[0]',
    Boolean(attachments?.formFl341e?.value),
  );
  fillCheckbox(
    fl341Pages,
    fl341FieldMap,
    'FL-341[0].Page1[0].List7[0].Li2[0].ChildCustodyOrdersWithAllegationsofAbuseorSubstanceAbuse_cb[1]',
    Boolean(attachments?.formFl341e?.value),
  );

  fillCheckbox(fl341Pages, fl341FieldMap, 'FL-341[0].Page2[0].List9[0].Visitation_cb[0]', visitationRequested);
  fillCheckbox(
    fl341Pages,
    fl341FieldMap,
    'FL-341[0].Page2[0].List9[0].Li1[0].ReasonableVisitation_cb[0]',
    visitationRequested && fl311Mode === 'reasonable_right_of_visitation',
  );
  fillCheckbox(
    fl341Pages,
    fl341FieldMap,
    'FL-341[0].Page2[0].List9[0].Li2[0].CheckBox2b[0]',
    visitationRequested && fl311Mode === 'attachment_on_file',
  );
  fillTextFields(
    fl341Pages,
    fl341FieldMap,
    'FL-341[0].Page2[0].List9[0].Li2[0].SpecifyNumberPagesAttached_ft[0]',
    visitationRequested && fl311Mode === 'attachment_on_file' && fl311AttachedPageCount > 0 ? String(fl311AttachedPageCount) : '',
    fontRegular,
    { size: 8 },
  );
  fillCheckbox(
    fl341Pages,
    fl341FieldMap,
    'FL-341[0].Page2[0].List9[0].Li4[0].NoVisitation_cb[0]',
    Boolean(attachments?.formFl341a?.value),
  );
  const visitationDirectedParty = visitationTo === 'petitioner' || visitationTo === 'respondent' || visitationTo === 'other';
  fillCheckbox(fl341Pages, fl341FieldMap, 'FL-341[0].Page2[0].List9[0].Li5[0].VisitationFor_cb[0]', visitationRequested && visitationDirectedParty);
  fillCheckbox(fl341Pages, fl341FieldMap, 'FL-341[0].Page2[0].List9[0].Li5[0].VisitsFor_cb[0]', visitationRequested && visitationTo === 'petitioner');
  fillCheckbox(fl341Pages, fl341FieldMap, 'FL-341[0].Page2[0].List9[0].Li5[0].VisitsFor_cb[1]', visitationRequested && visitationTo === 'respondent');
  fillCheckbox(fl341Pages, fl341FieldMap, 'FL-341[0].Page2[0].List9[0].Li5[0].VisitsFor_cb[2]', visitationRequested && visitationTo === 'other');
  fillTextFields(
    fl341Pages,
    fl341FieldMap,
    'FL-341[0].Page2[0].List9[0].Li5[0].SpecifyName_ft[0]',
    visitationRequested && visitationTo === 'other' ? otherParentParty : '',
    fontRegular,
    { size: 8 },
  );

  fillCheckbox(fl341Pages, fl341FieldMap, 'FL-341[0].Page4[0].List13[0].Li1[0].HolidaySchedule_cb[0]', Boolean(attachments?.formFl341c?.value));
  fillCheckbox(fl341Pages, fl341FieldMap, 'FL-341[0].Page4[0].List13[0].Li1[0].HolidayScheWhere_cb[1]', Boolean(attachments?.formFl341c?.value));
  fillCheckbox(fl341Pages, fl341FieldMap, 'FL-341[0].Page4[0].LIst14[0].Li1[0].AdditionalCustodyProvisions_cb[0]', Boolean(attachments?.formFl341d?.value));
  fillCheckbox(fl341Pages, fl341FieldMap, 'FL-341[0].Page4[0].LIst14[0].Li1[0].AddlProvWhere_cb[1]', Boolean(attachments?.formFl341d?.value));

  return fl341Pages.length;
}

function formatFl300CustodyParty(value: string | undefined | null) {
  switch (value) {
    case 'petitioner': return 'Petitioner';
    case 'respondent': return 'Respondent';
    case 'joint': return 'Joint';
    case 'other': return 'Other';
    default: return '';
  }
}


async function appendFl150IncomeExpensePages(
  output: PDFDocument,
  fl150Template: PDFDocument,
  fl150FieldMap: Map<string, TemplateField[]>,
  fontRegular: PDFFont,
  workspace: StarterPacketWorkspace,
  petitionerName: string,
  respondentName: string,
  caseNumber: string,
  captionAddress: ReturnType<typeof parseAddress>,
) {
  const pages = await output.copyPages(fl150Template, fl150Template.getPageIndices());
  pages.forEach((page) => output.addPage(page));

  const fl150 = workspace.fl150 ?? {};
  const attorneyOrPartyName = sanitizeText(workspace.petitionerAttorneyOrPartyName?.value) || petitionerName;
  const otherParentParty = sanitizeText(workspace.fl100?.childCustodyVisitation?.fl341?.otherParentPartyName?.value);
  const put = (name: string, value: unknown, size = 8) => fillTextFields(pages, fl150FieldMap, name, sanitizeText(String(value ?? '')), fontRegular, { size });
  const putMultiline = (name: string, value: unknown, size = 7) => fillTextFields(pages, fl150FieldMap, name, sanitizeMultilineText(String(value ?? '')), fontRegular, { size, multiline: true });
  const check = (name: string, checked: boolean) => fillCheckbox(pages, fl150FieldMap, name, checked);
  const amountPair = (base: string, pair: any) => {
    put(`FL-150.income.${base}.lastMonth`, pair?.lastMonth?.value);
    put(`FL-150.income.${base}.averageMonthly`, pair?.averageMonthly?.value);
  };

  ['petitioner', 'respondent', 'otherParentParty', 'caseNumber'].forEach((key) => {
    const value = key === 'petitioner' ? petitionerName : key === 'respondent' ? respondentName : key === 'caseNumber' ? caseNumber : otherParentParty;
    put(`FL-150.caption.${key}`, value);
  });
  put('FL-150.caption.barNumber', workspace.petitionerStateBarNumber?.value);
  put('FL-150.caption.name', attorneyOrPartyName);
  put('FL-150.caption.firm', workspace.petitionerFirmName?.value);
  put('FL-150.caption.street', captionAddress.street);
  put('FL-150.caption.city', captionAddress.city);
  put('FL-150.caption.state', captionAddress.state);
  put('FL-150.caption.zip', captionAddress.zip);
  put('FL-150.caption.phone', workspace.petitionerPhone?.value);
  put('FL-150.caption.fax', workspace.petitionerFax?.value);
  put('FL-150.caption.email', workspace.petitionerEmail?.value);
  put('FL-150.caption.attorneyFor', workspace.petitionerAttorneyFor?.value);
  put('FL-150.caption.courtCounty', workspace.filingCounty?.value);
  put('FL-150.caption.courtStreet', workspace.courtStreet?.value);
  put('FL-150.caption.courtMailing', workspace.courtMailingAddress?.value);
  put('FL-150.caption.courtCityZip', workspace.courtCityZip?.value);
  put('FL-150.caption.courtBranch', workspace.courtBranch?.value);

  const employment = fl150.employment ?? {};
  put('FL-150.employer', employment.employer?.value);
  putMultiline('FL-150.employerAddress', employment.employerAddress?.value);
  put('FL-150.employerPhone', employment.employerPhone?.value);
  put('FL-150.occupation', employment.occupation?.value);
  put('FL-150.jobStartDate', formatDateForCourt(employment.jobStartDate?.value));
  put('FL-150.jobEndDate', formatDateForCourt(employment.jobEndDate?.value));
  put('FL-150.hoursPerWeek', employment.hoursPerWeek?.value);
  put('FL-150.payAmount', employment.payAmount?.value);
  check('FL-150.payPeriod.month', employment.payPeriod?.value === 'month');
  check('FL-150.payPeriod.week', employment.payPeriod?.value === 'week');
  check('FL-150.payPeriod.hour', employment.payPeriod?.value === 'hour');

  const education = fl150.education ?? {};
  put('FL-150.age', education.age?.value);
  check('FL-150.highSchool.yes', education.highSchoolGraduated?.value === 'yes');
  check('FL-150.highSchool.no', education.highSchoolGraduated?.value === 'no');
  put('FL-150.highestGrade', education.highestGradeCompleted?.value);
  put('FL-150.collegeYears', education.collegeYears?.value);
  if (sanitizeText(education.collegeDegree?.value)) check('FL-150.collegeDegree.checked', true);
  put('FL-150.collegeDegree', education.collegeDegree?.value);
  put('FL-150.gradYears', education.graduateYears?.value);
  if (sanitizeText(education.graduateDegree?.value)) check('FL-150.gradDegree.checked', true);
  put('FL-150.gradDegree', education.graduateDegree?.value);
  if (sanitizeText(education.professionalLicense?.value)) check('FL-150.professionalLicense.checked', true);
  put('FL-150.licenseDetails', education.professionalLicense?.value);
  if (sanitizeText(education.vocationalTraining?.value)) check('FL-150.vocationalTraining.checked', true);
  put('FL-150.vocationalTraining', education.vocationalTraining?.value);

  const taxes = fl150.taxes ?? {};
  if (sanitizeText(taxes.taxYear?.value)) check('FL-150.taxesFiled.checked', true);
  put('FL-150.taxYear', taxes.taxYear?.value);
  check('FL-150.taxStatus.single', taxes.filingStatus?.value === 'single');
  check('FL-150.taxStatus.headOfHousehold', taxes.filingStatus?.value === 'head_of_household');
  check('FL-150.taxStatus.marriedSeparate', taxes.filingStatus?.value === 'married_separate');
  check('FL-150.taxStatus.marriedJoint', taxes.filingStatus?.value === 'married_joint');
  put('FL-150.taxJointName', taxes.jointFilerName?.value);
  check('FL-150.taxState.california', taxes.taxState?.value === 'california');
  check('FL-150.taxState.other', taxes.taxState?.value === 'other');
  put('FL-150.taxOtherState', taxes.otherState?.value);
  put('FL-150.taxExemptions', taxes.exemptions?.value);
  put('FL-150.otherPartyGrossMonthlyIncome', fl150.otherPartyIncome?.grossMonthlyEstimate?.value);
  putMultiline('FL-150.otherPartyIncomeBasis', fl150.otherPartyIncome?.basis?.value);
  put('FL-150.attachmentPageCount', fl150.attachmentPageCount?.value);
  put('FL-150.signatureDate', formatDateForCourt(fl150.signatureDate?.value));
  put('FL-150.typedName', fl150.typePrintName?.value || petitionerName);

  const income = fl150.income ?? {};
  ['salaryWages', 'overtime', 'commissionsBonuses', 'publicAssistance', 'spousalSupport', 'partnerSupport', 'pensionRetirement', 'socialSecurityDisability', 'unemploymentWorkersComp', 'otherIncome'].forEach((key) => amountPair(key, income[key]));
  check('FL-150.publicAssistance.currentlyReceiving', Boolean(income.publicAssistanceCurrentlyReceiving?.value));
  check('FL-150.spousalSupport.fromThisMarriage', Boolean(income.spousalSupportFromThisMarriage?.value));
  check('FL-150.spousalSupport.fromDifferentMarriage', Boolean(income.spousalSupportFromDifferentMarriage?.value));
  check('FL-150.spousalSupport.federallyTaxable', Boolean(income.spousalSupportFederallyTaxable?.value));
  check('FL-150.partnerSupport.fromThisPartnership', Boolean(income.partnerSupportFromThisPartnership?.value));
  check('FL-150.partnerSupport.fromDifferentPartnership', Boolean(income.partnerSupportFromDifferentPartnership?.value));
  check('FL-150.socialSecurityDisability.socialSecurity', Boolean(income.socialSecurity?.value));
  check('FL-150.socialSecurityDisability.stateDisability', Boolean(income.stateDisability?.value));
  check('FL-150.socialSecurityDisability.privateInsurance', Boolean(income.privateInsurance?.value));
  put('FL-150.otherIncome.description', income.otherIncomeDescription?.value);
  const selfEmployment = income.selfEmployment ?? {};
  check('FL-150.selfEmployment.owner', Boolean(selfEmployment.owner?.value));
  check('FL-150.selfEmployment.partner', Boolean(selfEmployment.partner?.value));
  check('FL-150.selfEmployment.other', Boolean(selfEmployment.other?.value));
  put('FL-150.selfEmployment.otherText', selfEmployment.otherText?.value);
  put('FL-150.selfEmployment.years', selfEmployment.years?.value);
  put('FL-150.selfEmployment.name', selfEmployment.businessName?.value);
  put('FL-150.selfEmployment.type', selfEmployment.businessType?.value);
  check('FL-150.additionalIncome.checked', Boolean(income.additionalIncome?.selected?.value));
  putMultiline('FL-150.additionalIncome.details', income.additionalIncome?.details?.value);
  check('FL-150.incomeChange.checked', Boolean(income.incomeChange?.selected?.value));
  putMultiline('FL-150.incomeChange.details', income.incomeChange?.details?.value);

  const deductions = fl150.deductions ?? {};
  put('FL-150.deductions.requiredUnionDues', deductions.requiredUnionDues?.value);
  put('FL-150.deductions.retirement', deductions.retirement?.value);
  put('FL-150.deductions.medicalInsurance', deductions.medicalInsurance?.value);
  put('FL-150.deductions.childSpousalSupportPaid', deductions.supportPaid?.value);
  put('FL-150.deductions.wageAssignment', deductions.wageAssignment?.value);
  put('FL-150.deductions.jobExpenses', deductions.jobExpenses?.value);
  put('FL-150.deductions.otherDeductions', deductions.otherDeductions?.value);
  put('FL-150.deductions.totalDeductions', deductions.totalDeductions?.value);
  const assets = fl150.assets ?? {};
  put('FL-150.assets.cashChecking', assets.cashChecking?.value);
  put('FL-150.assets.savingsCreditUnion', assets.savingsCreditUnion?.value);
  put('FL-150.assets.stocksBonds', assets.stocksBonds?.value);
  put('FL-150.assets.realProperty', assets.realProperty?.value);
  put('FL-150.assets.otherProperty', assets.otherProperty?.value);
  if (sanitizeText(assets.realProperty?.value)) check('FL-150.assets.realPropertyChecked', true);
  if (sanitizeText(assets.otherProperty?.value)) check('FL-150.assets.personalPropertyChecked', true);

  const household = fl150.household ?? {};
  put('FL-150.household.person1.name', household.person1Name?.value);
  put('FL-150.household.person1.age', household.person1Age?.value);
  put('FL-150.household.person1.relationship', household.person1Relationship?.value);
  put('FL-150.household.person1.grossMonthlyIncome', household.person1GrossMonthlyIncome?.value);
  const expenses = fl150.expenses ?? {};
  check('FL-150.expenses.estimated', expenses.basis?.value === 'estimated');
  check('FL-150.expenses.actual', expenses.basis?.value === 'actual');
  check('FL-150.expenses.proposed', expenses.basis?.value === 'proposed');
  check('FL-150.housing.rent', !expenses.housingIsMortgage?.value && Boolean(sanitizeText(expenses.rentOrMortgage?.value)));
  check('FL-150.housing.mortgage', Boolean(expenses.housingIsMortgage?.value));
  const expenseMap: Record<string, unknown> = {
    rentOrMortgage: expenses.rentOrMortgage?.value,
    mortgagePrincipal: expenses.mortgagePrincipal?.value,
    mortgageInterest: expenses.mortgageInterest?.value,
    propertyTax: expenses.propertyTax?.value,
    homeInsurance: expenses.insurance?.value,
    maintenance: expenses.maintenance?.value,
    healthCosts: expenses.healthCosts?.value,
    groceriesHousehold: expenses.groceriesHousehold?.value,
    eatingOut: expenses.eatingOut?.value,
    utilities: expenses.utilities?.value,
    telephone: expenses.phone?.value,
    laundryCleaning: expenses.laundryCleaning?.value,
    clothes: expenses.clothes?.value,
    education: expenses.education?.value,
    entertainment: expenses.entertainmentGiftsVacation?.value,
    auto: expenses.auto?.value,
    autoInsurance: expenses.autoInsurance?.value,
    savingsInvestments: expenses.savingsInvestments?.value,
    charitable: expenses.charitable?.value,
    monthlyDebtPayments: expenses.monthlyDebtPayments?.value,
    otherDescription: expenses.otherDescription?.value,
    other: expenses.otherExpenses?.value,
    total: expenses.totalExpenses?.value,
  };
  Object.entries(expenseMap).forEach(([key, value]) => put(`FL-150.expenses.${key}`, value));

  const childSupport = fl150.childrenSupport ?? {};
  check('FL-150.childrenHealthInsurance.has', childSupport.hasChildrenHealthInsurance?.value === 'yes');
  check('FL-150.childrenHealthInsurance.none', childSupport.hasChildrenHealthInsurance?.value === 'no');
  put('FL-150.childrenHealthInsurance.companyName', childSupport.insuranceCompanyName?.value);
  putMultiline('FL-150.childrenHealthInsurance.companyAddress', childSupport.insuranceCompanyAddress?.value);
  put('FL-150.childrenHealthInsurance.monthlyCost', childSupport.insuranceMonthlyCost?.value);
  put('FL-150.children.numberOfChildren', childSupport.numberOfChildren?.value);
  put('FL-150.children.timeshareMePercent', childSupport.timeshareMePercent?.value);
  put('FL-150.children.timeshareOtherPercent', childSupport.timeshareOtherParentPercent?.value);
  putMultiline('FL-150.children.parentingScheduleDescription', childSupport.parentingScheduleDescription?.value);
  put('FL-150.children.childCareCosts', childSupport.childCareCosts?.value);
  put('FL-150.children.healthCareCosts', childSupport.healthCareCostsNotCovered?.value);
  putMultiline('FL-150.children.specialNeedsDescription', childSupport.specialNeedsDescription?.value);
  put('FL-150.children.specialNeedsAmount', childSupport.specialNeedsAmount?.value);
  const hardships = fl150.hardships ?? {};
  put('FL-150.hardship.healthExpenses', hardships.healthExpensesAmount?.value);
  put('FL-150.hardship.healthExpensesMonths', hardships.healthExpensesMonths?.value);
  put('FL-150.hardship.losses', hardships.uninsuredLossesAmount?.value);
  put('FL-150.hardship.lossesMonths', hardships.uninsuredLossesMonths?.value);
  put('FL-150.hardship.other', hardships.otherHardshipAmount?.value);
  put('FL-150.hardship.otherMonths', hardships.otherHardshipMonths?.value);
  putMultiline('FL-150.hardship.childrenNamesAges', hardships.childrenNamesAges?.value);
  put('FL-150.hardship.childrenMonthlyExpense', hardships.childrenMonthlyExpense?.value);
  putMultiline('FL-150.hardship.explanation', hardships.explanation?.value);
  putMultiline('FL-150.supportOtherInformation', fl150.supportOtherInformation?.value);

  return pages.length;
}

async function appendFl300RequestForOrderPages(
  output: PDFDocument,
  fl300Template: PDFDocument,
  fl300FieldMap: Map<string, TemplateField[]>,
  fontRegular: PDFFont,
  workspace: StarterPacketWorkspace,
  petitionerName: string,
  respondentName: string,
  caseNumber: string,
  captionAddress: ReturnType<typeof parseAddress>,
) {
  const pages = await output.copyPages(fl300Template, fl300Template.getPageIndices());
  pages.forEach((page) => output.addPage(page));

  const fl300 = workspace.fl300 ?? {};
  const requestTypes = fl300.requestTypes ?? {};
  const against = fl300.requestedAgainst ?? {};
  const hearing = fl300.hearing ?? {};
  const service = fl300.service ?? {};
  const mediation = fl300.custodyMediation ?? {};
  const restraining = fl300.restrainingOrderInfo ?? {};
  const custody = fl300.custodyRequests ?? {};
  const support = fl300.supportRequests ?? {};
  const property = fl300.propertyControl ?? {};
  const attorneyFees = fl300.attorneyFees ?? {};
  const petitionerAttorneyOrPartyName = sanitizeText(workspace.petitionerAttorneyOrPartyName?.value) || petitionerName;
  const otherParentParty = sanitizeText(workspace.fl100?.childCustodyVisitation?.fl341?.otherParentPartyName?.value);

  const captionTargets = ['Page1', 'Page2', 'Page3', 'Page4'] as const;
  for (const pageName of captionTargets) {
    fillTextFields(pages, fl300FieldMap, `FL-300[0].${pageName}[0].Parties[0].Petitioner_1_ft[0]`, petitionerName, fontRegular, { size: 8 });
    fillTextFields(pages, fl300FieldMap, `FL-300[0].${pageName}[0].Parties[0].Respondent_ft[0]`, respondentName, fontRegular, { size: 8 });
    fillTextFields(pages, fl300FieldMap, `FL-300[0].${pageName}[0].Parties[0].OtherParentPart_ft[0]`, otherParentParty, fontRegular, { size: 8 });
    fillTextFields(pages, fl300FieldMap, `FL-300[0].${pageName}[0].CaseNumber[0].CaseNumber_ft[0]`, caseNumber, fontRegular, { size: 8 });
  }
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].TitlePartyName[0].Petitioner_1_ft[0]', petitionerName, fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].TitlePartyName[0].Respondent_ft[0]', respondentName, fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].TitlePartyName[0].OtherParentPart_ft[0]', otherParentParty, fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].CaseNumber[0].CaseNumber_ft[0]', caseNumber, fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].AttyInfo[0].AttyName_ft[0]', petitionerAttorneyOrPartyName, fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].AttyInfo[0].AttyFirm_ft[0]', sanitizeText(workspace.petitionerFirmName?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].AttyInfo[0].BarNo_ft[0]', sanitizeText(workspace.petitionerStateBarNumber?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].AttyInfo[0].AttyStreet_ft[0]', captionAddress.street, fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].AttyInfo[0].AttyCity_ft[0]', captionAddress.city, fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].AttyInfo[0].AttyState_ft[0]', captionAddress.state, fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].AttyInfo[0].AttyZip_ft[0]', captionAddress.zip, fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].AttyInfo[0].Phone_ft[0]', sanitizeText(workspace.petitionerPhone?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].AttyInfo[0].Fax_ft[0]', sanitizeText(workspace.petitionerFax?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].AttyInfo[0].Email_ft[0]', sanitizeText(workspace.petitionerEmail?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].AttyInfo[0].AttyFor_ft[0]', sanitizeText(workspace.petitionerAttorneyFor?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].CourtInfo[0].CrtCounty_ft[0]', sanitizeText(workspace.filingCounty?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].CourtInfo[0].Street_ft[0]', sanitizeText(workspace.courtStreet?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].CourtInfo[0].MailingAdd_ft[0]', sanitizeText(workspace.courtMailingAddress?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].CourtInfo[0].CityZip_ft[0]', sanitizeText(workspace.courtCityZip?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].CourtInfo[0].Branch_ft[0]', sanitizeText(workspace.courtBranch?.value), fontRegular, { size: 8 });

  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].FormTitle[0].tempemergency_cb[0]', Boolean(requestTypes.temporaryEmergencyOrders?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].FormTitle[0].modify_cb[0]', Boolean(requestTypes.changeModify?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].FormTitle[0].ChildCustody_cb[0]', Boolean(requestTypes.childCustody?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].FormTitle[0].ChildCustody_cb[1]', Boolean(requestTypes.visitation?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].FormTitle[0].spousalpartnersupport_cb[0]', Boolean(requestTypes.childSupport?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].FormTitle[0].childsupport_cb[0]', Boolean(requestTypes.spousalSupport?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].FormTitle[0].spousalpartnersupport_cb[1]', Boolean(requestTypes.propertyControl?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].FormTitle[0].Prptycontrol_cb[0]', Boolean(requestTypes.attorneyFeesCosts?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].FormTitle[0].other_cb[0]', Boolean(requestTypes.other?.value));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].FormTitle[0].OtherSpecify_ft[0]', sanitizeText(fl300.otherOrdersRequested?.value), fontRegular, { size: 8 });

  const namesTo = [against.petitioner?.value ? petitionerName : '', against.respondent?.value ? respondentName : '', against.otherParentParty?.value ? otherParentParty : '', against.other?.value ? sanitizeText(against.otherName?.value) : ''].filter(Boolean).join('; ');
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].List1[0].Li1[0].NameOfParty_ft[0]', namesTo, fontRegular, { size: 8 });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].List1[0].Li1[0].Petitioner_cb1[0]', Boolean(against.petitioner?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].List1[0].Li1[0].Petitioner_cb2[0]', Boolean(against.respondent?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].List1[0].Li1[0].Petitioner_cb3[0]', Boolean(against.otherParentParty?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].List1[0].Li1[0].other_cb[0]', Boolean(against.other?.value));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].List1[0].Li1[0].Other[0]', sanitizeText(against.otherName?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].List2[0].Li1[0].DateofHearing_dt[0]', formatDateForCourt(hearing.date?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].List2[0].Li1[0].TimeofHearing_tf[0]', sanitizeText(hearing.time?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].List2[0].Li1[0].dept[0]', Boolean(sanitizeText(hearing.department?.value)));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].List2[0].Li1[0].DepartmentNo_tf[0]', sanitizeText(hearing.department?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].List2[0].Li1[0].room[0]', Boolean(sanitizeText(hearing.room?.value)));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].List2[0].Li1[0].Courtroom_tf[0]', sanitizeText(hearing.room?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].List2[0].Li1[0].same_cb[0]', hearing.locationMode?.value === 'same_as_above');
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].List2[0].Li1[0].other_cb[0]', hearing.locationMode?.value === 'other');
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].List2[0].Li1[0].Otherspecify_ft[0]', sanitizeText(hearing.otherLocation?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].List4[0].Li1[0].CheckBoxTime[0]', Boolean(service.timeShortened?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].List4[0].Li1[0].CheckBoxService[0]', Boolean(service.serviceDate?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].List4[0].Li1[0].CheckBoxHearing[0]', Boolean(service.serviceDate?.value));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].List4[0].Li1[0].ServiceDate_dt[0]', formatDateForCourt(service.serviceDate?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].List5[0].Li1[0].CheckBoxRespDec[0]', Boolean(service.responsiveDeclarationDueDate?.value));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].List5[0].Li1[0].RDdate_dt[0]', formatDateForCourt(service.responsiveDeclarationDueDate?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].List6[0].Li1[0].CheckBox61[0]', Boolean(mediation.required?.value));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].List6[0].Li1[0].MediationCounselingInfo_ft[0]', sanitizeMultilineText(mediation.details?.value), fontRegular, { size: 8, multiline: true });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].List7[0].Li1[0].CheckBox61[0]', Boolean(fl300.temporaryEmergencyFl305Applies?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page1[0].List8[0].Li1[0].CheckBox61[0]', Boolean(sanitizeText(fl300.otherCourtOrders?.value)));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].List8[0].Li1[0].OtherCourtOrders_ft[0]', sanitizeMultilineText(fl300.otherCourtOrders?.value), fontRegular, { size: 8, multiline: true });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page1[0].signsub[0].SigDate[0]', formatDateForCourt(fl300.signatureDate?.value), fontRegular, { size: 8 });

  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List1[0].CheckBox1[0]', Boolean(restraining.include?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List1[0].CheckBox2[0]', Boolean(restraining.againstPetitioner?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List1[0].CheckBox3[0]', Boolean(restraining.againstRespondent?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List1[0].CheckBox61[0]', Boolean(restraining.againstOtherParentParty?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List1[0].Li1[0].CheckBox61[0]', Boolean(restraining.criminalCountyState?.value));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page2[0].List1[0].Li1[0].CriminalProtectiveOrders_CountyState_ft[0]', sanitizeText(restraining.criminalCountyState?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page2[0].List1[0].Li1[0].CriminalProtectiveOrders_CaseNo_ft[0]', sanitizeText(restraining.criminalCaseNumber?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List1[0].Li2[0].CheckBox61[0]', Boolean(restraining.familyCountyState?.value));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page2[0].List1[0].Li2[0].FamilyCourtRestrainingOrders_CountyState_ft[0]', sanitizeText(restraining.familyCountyState?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page2[0].List1[0].Li2[0].FamilyCourtRestrainingOrders_CaseNo_ft[0]', sanitizeText(restraining.familyCaseNumber?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List1[0].Li3[0].CheckBox61[0]', Boolean(restraining.juvenileCountyState?.value));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page2[0].List1[0].Li3[0].JuvenileCourtRestrainingOrders_CountyState_ft[0]', sanitizeText(restraining.juvenileCountyState?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page2[0].List1[0].Li3[0].JuvenileCourtRestrainingOrders_CaseNo_ft[0]', sanitizeText(restraining.juvenileCaseNumber?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List1[0].Li4[0].CheckBox61[0]', Boolean(restraining.otherCountyState?.value));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page2[0].List1[0].Li4[0].OtherCourtRestrainingOrders_CountyState_ft[0]', sanitizeText(restraining.otherCountyState?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page2[0].List1[0].Li4[0].OtherCourtRestrainingOrders_CaseNo_ft[0]', sanitizeText(restraining.otherCaseNumber?.value), fontRegular, { size: 8 });

  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List2[0].CheckBoxCC[0]', Boolean(requestTypes.childCustody?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List2[0].CheckBoxtemp[0]', Boolean(requestTypes.temporaryEmergencyOrders?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List2[0].CheckBoxvisit[0]', Boolean(requestTypes.visitation?.value));
  if (custody.useChildRows?.value) {
    workspace.children.slice(0, 4).forEach((child, index) => {
      const row = index + 1;
      fillTextFields(pages, fl300FieldMap, `FL-300[0].Page2[0].List2[0].Li1[0].Child${row}Name_ft[0]`, sanitizeText(child.fullName?.value), fontRegular, { size: 8 });
      fillTextFields(pages, fl300FieldMap, `FL-300[0].Page2[0].List2[0].Li1[0].Child${row}BirthDate_dt[0]`, formatDateForCourt(child.birthDate?.value), fontRegular, { size: 8 });
      fillTextFields(pages, fl300FieldMap, `FL-300[0].Page2[0].List2[0].Li1[0].Child${row}LegalCustody_ft[0]`, sanitizeText(custody.legalCustodyToText?.value) || formatFl300CustodyParty(workspace.fl100?.childCustodyVisitation?.legalCustodyTo?.value), fontRegular, { size: 8 });
      const physicalField = row === 4 ? 'Child5PhysicalCustody_ft[0]' : `Child${row}PhysicalCustody_ft[0]`;
      fillTextFields(pages, fl300FieldMap, `FL-300[0].Page2[0].List2[0].Li1[0].${physicalField}`, sanitizeText(custody.physicalCustodyToText?.value) || formatFl300CustodyParty(workspace.fl100?.childCustodyVisitation?.physicalCustodyTo?.value), fontRegular, { size: 8 });
    });
    fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List2[0].Li1[0].LegalCustody_cb[0]', Boolean(custody.legalCustodyToText?.value));
    fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List2[0].Li1[0].PhysicalCustody_cb[0]', Boolean(custody.physicalCustodyToText?.value));
  }
  const anyCustodyAttachment = Boolean(custody.useCustodyAttachments?.value || custody.useFl305?.value || custody.useFl311?.value || custody.useFl312?.value || custody.useFl341c?.value || custody.useFl341d?.value || custody.useFl341e?.value || sanitizeText(custody.otherAttachmentText?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List2[0].Li2[0].CheckBox2b[0]', anyCustodyAttachment);
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List2[0].Li2[0].CheckBoxCC[0]', anyCustodyAttachment && Boolean(requestTypes.childCustody?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List2[0].Li2[0].CheckBox61[0]', anyCustodyAttachment && Boolean(requestTypes.visitation?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List2[0].Li2[0].List[0].Li1[0].fl305_cb[0]', Boolean(custody.useFl305?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List2[0].Li2[0].List[0].Li1[0].fl311_cb[0]', Boolean(custody.useFl311?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List2[0].Li2[0].List[0].Li1[0].fl312_cb[0]', Boolean(custody.useFl312?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List2[0].Li2[0].List[0].Li1[0].fl341c_cb[0]', Boolean(custody.useFl341c?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List2[0].Li2[0].List[0].Li1[0].fl341d_cb[0]', Boolean(custody.useFl341d?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List2[0].Li2[0].List[0].Li1[0].fl341e_cb[0]', Boolean(custody.useFl341e?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List2[0].Li2[0].List[0].Li1[0].CheckBoxother[0]', Boolean(sanitizeText(custody.otherAttachmentText?.value)));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page2[0].List2[0].Li2[0].List[0].Li1[0].Otherspecify_tf[0]', sanitizeText(custody.otherAttachmentText?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page2[0].List2[0].Li2[0].List[0].Li2[0].CheckBoxfollow[0]', Boolean(sanitizeText(custody.asFollowsText?.value)));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page2[0].List2[0].Li2[0].List[0].Li2[0].ReasonForOrders_ft[0]', sanitizeMultilineText(custody.asFollowsText?.value), fontRegular, { size: 8, multiline: true });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page2[0].List2[0].Li3[0].ReasonForOrders_ft[0]', sanitizeMultilineText(custody.bestInterestReasons?.value), fontRegular, { size: 8, multiline: true });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page3[0].List2Cont[0].Li1[0].CheckBoxchangeorder[0]', Boolean(requestTypes.changeModify?.value && (requestTypes.childCustody?.value || requestTypes.visitation?.value)));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page3[0].List2Cont[0].Li1[0].CheckBoxCC[0]', Boolean(requestTypes.childCustody?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page3[0].List2Cont[0].Li1[0].CheckBoxVisit[0]', Boolean(requestTypes.visitation?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page3[0].List2Cont[0].Li1[0].List[0].Li1[0].CheckBox61[0]', Boolean(custody.currentCustodyOrderDate?.value || custody.currentCustodyOrderDetails?.value));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page3[0].List2Cont[0].Li1[0].List[0].Li1[0].FileDateChildCustodyOrderFiled\.dt[0]', formatDateForCourt(custody.currentCustodyOrderDate?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page3[0].List2Cont[0].Li1[0].List[0].Li1[0].ChildCustodyOrderDetails_ft[0]', sanitizeMultilineText(custody.currentCustodyOrderDetails?.value), fontRegular, { size: 8, multiline: true });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page3[0].List2Cont[0].Li1[0].List[0].Li2[0].CheckBox61[0]', Boolean(custody.currentVisitationOrderDate?.value || custody.currentVisitationOrderDetails?.value));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page3[0].List2Cont[0].Li1[0].List[0].Li2[0].VisitaionOrderFileDate_dt[0]', formatDateForCourt(custody.currentVisitationOrderDate?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page3[0].List2Cont[0].Li1[0].List[0].Li2[0].VisitationOrderDetails_ft[0]', sanitizeMultilineText(custody.currentVisitationOrderDetails?.value), fontRegular, { size: 8, multiline: true });

  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page3[0].List3[0].CheckBox61[0]', Boolean(requestTypes.childSupport?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page3[0].List3[0].Li1[0].CheckBoxrequest[0]', Boolean(support.childSupportGuideline?.value));
  workspace.children.slice(0, 4).forEach((child, index) => {
    const row = index + 1;
    fillTextFields(pages, fl300FieldMap, `FL-300[0].Page3[0].List3[0].Li1[0].Child${row}Name_ft[0]`, [sanitizeText(child.fullName?.value), formatChildAge(child.birthDate?.value)].filter(Boolean).join(', age '), fontRegular, { size: 8 });
    fillTextFields(pages, fl300FieldMap, `FL-300[0].Page3[0].List3[0].Li1[0].Child${row}LegalCustody_ft[0]`, support.childSupportGuideline?.value ? 'Guideline' : '', fontRegular, { size: 8 });
  });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page3[0].List3[0].Li1[0].Child1PhysicalCustody_ft[0]', sanitizeText(support.childSupportMonthlyAmountText?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page3[0].List3[0].Li2[0].CheckBox61[0]', Boolean(support.currentChildSupportOrderDate?.value || support.currentChildSupportOrderDetails?.value));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page3[0].List3[0].Li2[0].FileDateofChildupportOrder_dt[0]', formatDateForCourt(support.currentChildSupportOrderDate?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page3[0].List3[0].Li2[0].order[0]', sanitizeMultilineText(support.currentChildSupportOrderDetails?.value), fontRegular, { size: 8, multiline: true });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page3[0].List3[0].Li4[0].ExplainChangeorEndOrders_ft[0]', sanitizeMultilineText(support.childSupportChangeReasons?.value), fontRegular, { size: 8, multiline: true });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page3[0].List4[0].CheckBoxitem4[0]', Boolean(requestTypes.spousalSupport?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page3[0].List4[0].Li1[0].CheckBox61[0]', Boolean(support.spousalSupportAmount?.value));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page3[0].List4[0].Li1[0].AmountofSpousalPartnerSupportRequested_nu[0]', sanitizeText(support.spousalSupportAmount?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page3[0].List4[0].Li2[0].CheckBox61[0]', Boolean(support.changeSpousalSupport?.value || support.endSpousalSupport?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page3[0].List4[0].Li2[0].ChangeEndCurrOrder[0]', Boolean(support.changeSpousalSupport?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page3[0].List4[0].Li2[0].ChangeEndCurrOrder1[0]', Boolean(support.endSpousalSupport?.value));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page3[0].List4[0].Li2[0].FileDateofSpousalPartnerSupportOrder_dt[0]', formatDateForCourt(support.currentSpousalSupportOrderDate?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page3[0].List4[0].Li2[0].AmountofSpousalPartnerSupportOrdered_nu[0]', sanitizeText(support.currentSpousalSupportAmount?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page3[0].List4[0].Li5[0].ExplainChangeorEndOrders_ft[0]', sanitizeMultilineText(support.spousalSupportChangeReasons?.value), fontRegular, { size: 8, multiline: true });

  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page4[0].List5[0].CheckBox62[0]', Boolean(requestTypes.propertyControl?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page4[0].List5[0].CheckBox61[0]', Boolean(property.temporaryEmergency?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page4[0].List5[0].Li1[0].CheckBox1[0]', property.exclusiveUseTo?.value === 'petitioner');
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page4[0].List5[0].Li1[0].CheckBox2[0]', property.exclusiveUseTo?.value === 'respondent');
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page4[0].List5[0].Li1[0].CheckBox3[0]', property.exclusiveUseTo?.value === 'other_parent_party');
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page4[0].List5[0].Li1[0].ListPropertyforExclusiveUseandControl_ft[0]', sanitizeMultilineText(property.propertyDescription?.value), fontRegular, { size: 8, multiline: true });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page4[0].List5[0].Li1[0].CheckBox4[0]', Boolean(property.ownedOrBuying?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page4[0].List5[0].Li1[0].CheckBox61[0]', Boolean(property.leasedOrRented?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page4[0].List5[0].Li2[0].CheckBox1[0]', property.debtPaymentBy?.value === 'petitioner');
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page4[0].List5[0].Li2[0].CheckBox2[0]', property.debtPaymentBy?.value === 'respondent');
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page4[0].List5[0].Li2[0].CheckBox3[0]', property.debtPaymentBy?.value === 'other_parent_party');
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page4[0].List5[0].Li2[0].Debt1_PayTo_ft[0]', sanitizeText(property.debtPayTo?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page4[0].List5[0].Li2[0].Debt1_For_ft[0]', sanitizeText(property.debtFor?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page4[0].List5[0].Li2[0].Debt1_Amount_nu[0]', sanitizeText(property.debtAmount?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page4[0].List5[0].Li2[0].Debt1_DueDate_dt[0]', formatDateForCourt(property.debtDueDate?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page4[0].List5[0].Li3[0].CheckBox61[0]', Boolean(property.currentOrderDate?.value));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page4[0].List5[0].Li3[0].FileDateofSpousalPartnerSupportOrder_dt[0]', formatDateForCourt(property.currentOrderDate?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page4[0].List6[0].Attorneysfeesandcosts_cb[0]', Boolean(requestTypes.attorneyFeesCosts?.value));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page4[0].List6[0].AmountOfAttorneyFeesCosts_nu[0]', sanitizeText(attorneyFees.amount?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page4[0].List7[0].Li1[0].CheckBox1[0]', Boolean(requestTypes.other?.value));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page4[0].List7[0].Li1[0].OtherRelief_ft[0]', sanitizeMultilineText(fl300.otherOrdersRequested?.value), fontRegular, { size: 8, multiline: true });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page4[0].List8[0].CheckBox1[0]', Boolean(service.courtDaysBeforeHearing?.value || service.orderShorterServiceReason?.value));
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page4[0].List8[0].Li1[0].CheckBox61[0]', Boolean(service.courtDaysBeforeHearing?.value));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page4[0].List8[0].Li1[0].SpecifyServiceDetails_CourtDaysBeforeHearing_tf[0]', sanitizeText(service.courtDaysBeforeHearing?.value), fontRegular, { size: 8 });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page4[0].List8[0].Li2[0].CheckBox61[0]', Boolean(service.orderShorterServiceReason?.value));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page4[0].List8[0].Li3[0].ReasonforOST_ft[0]', sanitizeMultilineText(service.orderShorterServiceReason?.value), fontRegular, { size: 8, multiline: true });
  fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page4[0].List9[0].Li1[0].CheckBox1[0]', Boolean(fl300.facts?.value));
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page4[0].List9[0].Li1[0].ReasonForChange_ft[0]', sanitizeMultilineText(fl300.facts?.value), fontRegular, { size: 8, multiline: true });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page4[0].signsub[0].SigDate[0]', formatDateForCourt(fl300.signatureDate?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fl300FieldMap, 'FL-300[0].Page4[0].signsub[0].TypePrintName_ft[0]', sanitizeText(fl300.typePrintName?.value) || petitionerName, fontRegular, { size: 8 });

  const facts = sanitizeMultilineText(fl300.facts?.value);
  if (facts.length > 900) {
    appendAttachmentTextPages(output, fontRegular, await output.embedFont(StandardFonts.HelveticaBold), 'FL-300 Attachment 9 — Facts to Support Request', buildShortTitle(petitionerName, respondentName), caseNumber, [{ paragraphs: [facts] }]);
    fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page4[0].List9[0].Li1[0].CheckBox61[0]', true);
    fillCheckbox(pages, fl300FieldMap, 'FL-300[0].Page4[0].List9[0].Li1[0].att2c[0]', true);
  }

  return pages.length;
}

async function appendFw001FeeWaiverPages(
  output: PDFDocument,
  fw001Template: PDFDocument,
  fw001FieldMap: Map<string, TemplateField[]>,
  fontRegular: PDFFont,
  workspace: StarterPacketWorkspace,
  petitionerName: string,
  respondentName: string,
  caseNumber: string,
  address: ReturnType<typeof parseAddress>,
) {
  const pages = await output.copyPages(fw001Template, fw001Template.getPageIndices());
  pages.forEach((page) => output.addPage(page));

  const filingCounty = sanitizeText(workspace.filingCounty?.value);
  const courtLines = [
    filingCounty ? `Superior Court of California, County of ${filingCounty}` : '',
    sanitizeText(workspace.courtStreet?.value),
    sanitizeText(workspace.courtMailingAddress?.value),
    sanitizeText(workspace.courtCityZip?.value),
    sanitizeText(workspace.courtBranch?.value),
  ].filter(Boolean).join('\n');
  const caseName = [petitionerName, respondentName].filter(Boolean).join(' v. ');
  const signatureDate = formatDateForCourt(workspace.fl100?.signatureDate?.value) || formatDateForCourt(new Date().toISOString());

  fillTextFields(pages, fw001FieldMap, 'CourtInfo[0]', courtLines, fontRegular, { size: 8, multiline: true });
  fillTextFields(pages, fw001FieldMap, 'CaseNumber[0]', caseNumber, fontRegular, { size: 9 });
  fillTextFields(pages, fw001FieldMap, 'CaseName[0]', caseName, fontRegular, { size: 9 });
  fillTextFields(pages, fw001FieldMap, 'PetitionerName1[0]', petitionerName, fontRegular, { size: 9 });
  fillTextFields(pages, fw001FieldMap, 'PetitionerStrAddress[0]', address.street, fontRegular, { size: 8 });
  fillTextFields(pages, fw001FieldMap, 'PetitionerCity[0]', address.city, fontRegular, { size: 8 });
  fillTextFields(pages, fw001FieldMap, 'PetitionerState[0]', address.state, fontRegular, { size: 8 });
  fillTextFields(pages, fw001FieldMap, 'PetitionerZip[0]', address.zip, fontRegular, { size: 8 });
  fillTextFields(pages, fw001FieldMap, 'PetitionerTel[0]', sanitizeText(workspace.petitionerPhone?.value), fontRegular, { size: 8 });
  fillTextFields(pages, fw001FieldMap, 'PetitionerName[0]', petitionerName, fontRegular, { size: 9 });
  fillTextFields(pages, fw001FieldMap, 'SigDate[0]', signatureDate, fontRegular, { size: 9 });

  // Safe defaults for a family-law starter packet: request Superior Court fee waiver
  // and ask to waive all court fees/costs. The financial qualification section stays
  // blank for the user to complete/review before filing.
  fillCheckbox(pages, fw001FieldMap, 'PetLawyerAdvanceFeesY[1]', true);
  fillCheckbox(pages, fw001FieldMap, 'WaiveSuperiorCrtFee[0]', true);
  fillCheckbox(pages, fw001FieldMap, 'FeeRequestDef[0]', true);

  return pages.length;
}

export async function generateOfficialStarterPacketPdf(workspace: StarterPacketWorkspace): Promise<Uint8Array> {
  const {
    fl100Bytes,
    fl110Bytes,
    fl105Bytes,
    fl105aBytes,
    fl150Bytes,
    fl300Bytes,
    fl311Bytes,
    fl312Bytes,
    fl341Bytes,
    fl341aBytes,
    fl341bBytes,
    fl341cBytes,
    fl341dBytes,
    fl341eBytes,
    fw001Bytes,
    fl100Fields,
    fl110Fields,
    fl105Fields,
    fl105aFields,
    fl150Fields,
    fl300Fields,
    fl311Fields,
    fl312Fields,
    fl341Fields,
    fl341aFields,
    fl341bFields,
    fl341cFields,
    fl341dFields,
    fl341eFields,
    fw001Fields,
  } = await loadTemplates();
  const output = await PDFDocument.create();
  const fontRegular = await output.embedFont(StandardFonts.Helvetica);
  const fontBold = await output.embedFont(StandardFonts.HelveticaBold);

  const fl100Template = await PDFDocument.load(fl100Bytes);
  const fl110Template = await PDFDocument.load(fl110Bytes);
  const fl105Template = await PDFDocument.load(fl105Bytes);
  const fl105aTemplate = await PDFDocument.load(fl105aBytes);
  const fl150Template = await PDFDocument.load(fl150Bytes, { ignoreEncryption: true });
  const fl300Template = await PDFDocument.load(fl300Bytes, { ignoreEncryption: true });
  const fl311Template = await PDFDocument.load(fl311Bytes);
  const fl312Template = await PDFDocument.load(fl312Bytes);
  const fl341Template = await PDFDocument.load(fl341Bytes, { ignoreEncryption: true });
  const fl341aTemplate = await PDFDocument.load(fl341aBytes, { ignoreEncryption: true });
  const fl341bTemplate = await PDFDocument.load(fl341bBytes, { ignoreEncryption: true });
  const fl341cTemplate = await PDFDocument.load(fl341cBytes, { ignoreEncryption: true });
  const fl341dTemplate = await PDFDocument.load(fl341dBytes, { ignoreEncryption: true });
  const fl341eTemplate = await PDFDocument.load(fl341eBytes, { ignoreEncryption: true });
  const fw001Template = await PDFDocument.load(fw001Bytes, { ignoreEncryption: true });
  const fl100Pages = await output.copyPages(fl100Template, fl100Template.getPageIndices());
  fl100Pages.forEach((page) => output.addPage(page));
  const fl110Pages = await output.copyPages(fl110Template, fl110Template.getPageIndices());
  const fl105Pages = await output.copyPages(fl105Template, fl105Template.getPageIndices());

  const fl100FieldMap = mapFields(fl100Fields);
  const fl110FieldMap = mapFields(fl110Fields);
  const fl105FieldMap = mapFields(fl105Fields);
  const fl105aFieldMap = mapFields(fl105aFields);
  const fl150FieldMap = mapFields(fl150Fields);
  const fl300FieldMap = mapFields(fl300Fields);
  const fl311FieldMap = mapFields(fl311Fields);
  const fl312FieldMap = mapFields(fl312Fields);
  const fl341FieldMap = mapFields(fl341Fields);
  const fl341aFieldMap = mapFields(fl341aFields);
  const fl341bFieldMap = mapFields(fl341bFields);
  const fl341cFieldMap = mapFields(fl341cFields);
  const fl341dFieldMap = mapFields(fl341dFields);
  const fl341eFieldMap = mapFields(fl341eFields);
  const fw001FieldMap = mapFields(fw001Fields);

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
  const petitionerFax = sanitizeText(workspace.petitionerFax?.value);
  const petitionerAttorneyOrPartyName = sanitizeText(workspace.petitionerAttorneyOrPartyName?.value) || petitionerName;
  const petitionerFirmName = sanitizeText(workspace.petitionerFirmName?.value);
  const petitionerStateBarNumber = sanitizeText(workspace.petitionerStateBarNumber?.value);
  const petitionerAttorneyFor = sanitizeText(workspace.petitionerAttorneyFor?.value);
  const petitionerAddress = sanitizeMultilineText(workspace.petitionerAddress?.value);
  const address = parseAddress(petitionerAddress);
  const fl100SignatureDateRaw = workspace.fl100?.signatureDate?.value;
  const fl100SignatureDate = formatDateForCourt(fl100SignatureDateRaw);
  const relationshipTypeValue = workspace.fl100?.relationshipType?.value ?? 'marriage';
  const marriageDateRaw = workspace.marriageDate?.value;
  const separationDateRaw = workspace.separationDate?.value;
  const domesticPartnershipRegistrationDateRaw = workspace.fl100?.domesticPartnership?.registrationDate?.value;
  const domesticPartnershipSeparationDateRaw = workspace.fl100?.domesticPartnership?.partnerSeparationDate?.value;
  const marriageDate = formatDateForCourt(marriageDateRaw);
  const separationDate = formatDateForCourt(separationDateRaw);
  const domesticPartnershipRegistrationDate = formatDateForCourt(domesticPartnershipRegistrationDateRaw);
  const domesticPartnershipSeparationDate = formatDateForCourt(domesticPartnershipSeparationDateRaw);
  const marriageDuration = calculateCourtDuration(marriageDateRaw, separationDateRaw);
  const domesticPartnershipDuration = calculateCourtDuration(domesticPartnershipRegistrationDateRaw, domesticPartnershipSeparationDateRaw);
  const proceedingType = workspace.fl100?.proceedingType?.value ?? 'dissolution';
  const isAmendedPetition = Boolean(workspace.fl100?.isAmended?.value);
  const relationshipType = relationshipTypeValue;
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
  const hasOverflowMinorChildren = workspace.children.length > 4;
  const hasUnbornChild = Boolean(workspace.fl100?.minorChildren?.hasUnbornChild?.value);
  const childListContinuedOnAttachment4b = Boolean(workspace.fl100?.minorChildren?.detailsOnAttachment4b?.value);
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
    formFl341a: Boolean(workspace.fl100?.childCustodyVisitation?.attachments?.formFl341a?.value),
    formFl341b: Boolean(workspace.fl100?.childCustodyVisitation?.attachments?.formFl341b?.value),
    formFl341c: Boolean(workspace.fl100?.childCustodyVisitation?.attachments?.formFl341c?.value),
    formFl341d: Boolean(workspace.fl100?.childCustodyVisitation?.attachments?.formFl341d?.value),
    formFl341e: Boolean(workspace.fl100?.childCustodyVisitation?.attachments?.formFl341e?.value),
    attachment6c1: Boolean(workspace.fl100?.childCustodyVisitation?.attachments?.attachment6c1?.value),
  };
  const fl311VisitationPlanMode = workspace.fl100?.childCustodyVisitation?.fl311?.visitationPlanMode?.value ?? 'unspecified';
  const fl311VisitationAttachmentPageCount = parseAttachmentPageCount(
    workspace.fl100?.childCustodyVisitation?.fl311?.visitationAttachmentPageCount?.value,
  );
  const fl311VisitationAttachmentDate = sanitizeText(workspace.fl100?.childCustodyVisitation?.fl311?.visitationAttachmentDate?.value);
  const fl311Selected = custodyAttachments.formFl311;
  const fl311ShouldGenerate = fl311Selected && (custodyRequested || visitationRequested);
  const fl312Selected = custodyAttachments.formFl312;
  const fl312ShouldGenerate = fl312Selected && (custodyRequested || visitationRequested);
  const fl341Selected = custodyAttachments.formFl341a || custodyAttachments.formFl341b || custodyAttachments.formFl341c || custodyAttachments.formFl341d || custodyAttachments.formFl341e;
  const fl341ShouldGenerate = fl341Selected && (custodyRequested || visitationRequested);
  const fl341 = workspace.fl100?.childCustodyVisitation?.fl341;
  const fl341SourceOrder = fl341?.sourceOrder?.value ?? 'unspecified';
  const fl341SourceOrderOtherText = sanitizeText(fl341?.sourceOrderOtherText?.value);
  const fl341a = fl341?.fl341a;
  const fl341b = fl341?.fl341b;
  const fl341c = fl341?.fl341c;
  const fl341d = fl341?.fl341d;
  const fl341e = fl341?.fl341e;
  const fl312 = workspace.fl100?.childCustodyVisitation?.fl312;
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
  const petitionerResidenceLocation = sanitizeText(workspace.fl100?.residency?.petitionerResidenceLocation?.value);
  const respondentResidenceLocation = sanitizeText(workspace.fl100?.residency?.respondentResidenceLocation?.value);
  const communityPropertyDetails = sanitizeMultilineText(workspace.fl100?.propertyDeclarations?.communityAndQuasiCommunityDetails?.value);
  const separatePropertyDetails = sanitizeMultilineText(workspace.fl100?.propertyDeclarations?.separatePropertyDetails?.value);
  const separatePropertyAwardedTo = sanitizeMultilineText(workspace.fl100?.propertyDeclarations?.separatePropertyAwardedTo?.value);
  const communityPropertyWhereListed = workspace.fl100?.propertyDeclarations?.communityAndQuasiCommunityWhereListed?.value ?? 'unspecified';
  const separatePropertyWhereListed = workspace.fl100?.propertyDeclarations?.separatePropertyWhereListed?.value ?? 'unspecified';
  const separatePropertyEntries = splitNonEmptyLines(separatePropertyDetails);
  const separatePropertyAwardTargets = splitNonEmptyLines(separatePropertyAwardedTo);
  const communityPropertyAttachmentEntries = splitNonEmptyLines(communityPropertyDetails);
  const wantsFormerNameRestore = Boolean(workspace.requests?.restoreFormerName?.value);
  const shortTitle = buildShortTitle(petitionerName, respondentName);
  const fl105 = workspace.fl105;
  const fl150 = workspace.fl150;
  const fl150ShouldGenerate = Boolean(fl150?.includeForm?.value);
  const fl300 = workspace.fl300;
  const fl300ShouldGenerate = Boolean(fl300?.includeForm?.value);

  if (fl150ShouldGenerate) {
    const hasIncome = [
      fl150?.income?.salaryWages?.lastMonth?.value,
      fl150?.income?.salaryWages?.averageMonthly?.value,
      fl150?.income?.overtime?.averageMonthly?.value,
      fl150?.income?.commissionsBonuses?.averageMonthly?.value,
      fl150?.income?.publicAssistance?.averageMonthly?.value,
      fl150?.income?.spousalSupport?.averageMonthly?.value,
      fl150?.income?.partnerSupport?.averageMonthly?.value,
      fl150?.income?.pensionRetirement?.averageMonthly?.value,
      fl150?.income?.socialSecurityDisability?.averageMonthly?.value,
      fl150?.income?.unemploymentWorkersComp?.averageMonthly?.value,
      fl150?.income?.otherIncome?.averageMonthly?.value,
    ].some((value) => sanitizeText(value).length > 0);
    const hasExpense = [
      fl150?.expenses?.rentOrMortgage?.value,
      fl150?.expenses?.propertyTax?.value,
      fl150?.expenses?.insurance?.value,
      fl150?.expenses?.groceriesHousehold?.value,
      fl150?.expenses?.utilities?.value,
      fl150?.expenses?.phone?.value,
      fl150?.expenses?.auto?.value,
      fl150?.expenses?.monthlyDebtPayments?.value,
      fl150?.expenses?.totalExpenses?.value,
    ].some((value) => sanitizeText(value).length > 0);
    if (!hasIncome) throw new Error('FL-150 is selected but no explicit income amount was entered. Enter amounts explicitly or leave FL-150 unselected.');
    if (!hasExpense) throw new Error('FL-150 is selected but no explicit monthly expense amount was entered.');
    if (sanitizeText(fl150?.employment?.payAmount?.value) && fl150?.employment?.payPeriod?.value === 'unspecified') throw new Error('FL-150 pay period is required when pay amount is entered.');
    if (fl150?.taxes?.filingStatus?.value === 'married_joint' && !sanitizeText(fl150?.taxes?.jointFilerName?.value)) throw new Error('FL-150 joint filer name is required for married filing jointly.');
    if (fl150?.taxes?.taxState?.value === 'other' && !sanitizeText(fl150?.taxes?.otherState?.value)) throw new Error('FL-150 other tax state is required when selected.');
    if (fl150?.childrenSupport?.hasChildrenHealthInsurance?.value === 'yes' && !sanitizeText(fl150?.childrenSupport?.insuranceCompanyName?.value)) throw new Error('FL-150 children health-insurance company name is required when insurance is selected.');
    if (!sanitizeText(fl150?.signatureDate?.value)) throw new Error('FL-150 signature date is required.');
    if (!sanitizeText(fl150?.typePrintName?.value)) throw new Error('FL-150 typed/printed name is required.');
  }

  if (fl300ShouldGenerate) {
    const rt = fl300?.requestTypes ?? {};
    const against = fl300?.requestedAgainst ?? {};
    const hasRequestType = Boolean(rt.childCustody?.value || rt.visitation?.value || rt.childSupport?.value || rt.spousalSupport?.value || rt.propertyControl?.value || rt.attorneyFeesCosts?.value || rt.other?.value || rt.changeModify?.value || rt.temporaryEmergencyOrders?.value);
    const hasAgainst = Boolean(against.petitioner?.value || against.respondent?.value || against.otherParentParty?.value || against.other?.value);
    if (!hasRequestType) throw new Error('FL-300 is selected but no request type is selected.');
    if (!hasAgainst) throw new Error('FL-300 is selected but no served/responding party is selected.');
    if (against.other?.value && !sanitizeText(against.otherName?.value)) throw new Error('FL-300 other served/responding party name is required.');
    if (fl300.hearing?.locationMode?.value === 'other' && !sanitizeText(fl300.hearing?.otherLocation?.value)) throw new Error('FL-300 hearing location is set to other, but no location was provided.');
    if (fl300.custodyMediation?.required?.value && !sanitizeText(fl300.custodyMediation?.details?.value)) throw new Error('FL-300 custody mediation/counseling details are required when selected.');
    if (rt.temporaryEmergencyOrders?.value && !fl300.temporaryEmergencyFl305Applies?.value && !sanitizeText(fl300.service?.orderShorterServiceReason?.value)) throw new Error('FL-300 temporary emergency orders require explicit FL-305 applies or a shorter-service/order reason.');
    if ((rt.childCustody?.value || rt.visitation?.value) && !fl300.custodyRequests?.useChildRows?.value && !fl300.custodyRequests?.useCustodyAttachments?.value && !sanitizeText(fl300.custodyRequests?.asFollowsText?.value)) throw new Error('FL-300 custody/visitation requires child rows, attachment references, or as-follows terms.');
    if (rt.childCustody?.value && fl300.custodyRequests?.useChildRows?.value && workspace.children.length > BASE_CHILD_VISIBLE_ROWS) throw new Error(`FL-300 child rows v1 supports only the first ${BASE_CHILD_VISIBLE_ROWS} children.`);
    if (rt.childCustody?.value && fl300.custodyRequests?.useChildRows?.value && !sanitizeText(fl300.custodyRequests?.legalCustodyToText?.value) && (workspace.fl100?.childCustodyVisitation?.legalCustodyTo?.value ?? 'none') === 'none') throw new Error('FL-300 child custody rows need legal custody text or FL-100 legal custody direction.');
    if (rt.childCustody?.value && fl300.custodyRequests?.useChildRows?.value && !sanitizeText(fl300.custodyRequests?.physicalCustodyToText?.value) && (workspace.fl100?.childCustodyVisitation?.physicalCustodyTo?.value ?? 'none') === 'none') throw new Error('FL-300 child custody rows need physical custody text or FL-100 physical custody direction.');
    if (rt.childSupport?.value && !fl300.supportRequests?.childSupportGuideline?.value && !sanitizeText(fl300.supportRequests?.childSupportMonthlyAmountText?.value) && !sanitizeText(fl300.supportRequests?.childSupportChangeReasons?.value)) throw new Error('FL-300 child support needs guideline selection, amount text, or change reasons.');
    if (rt.spousalSupport?.value && !sanitizeText(fl300.supportRequests?.spousalSupportAmount?.value) && !fl300.supportRequests?.changeSpousalSupport?.value && !fl300.supportRequests?.endSpousalSupport?.value && !sanitizeText(fl300.supportRequests?.spousalSupportChangeReasons?.value)) throw new Error('FL-300 spousal support needs amount, change/end selection, or reasons.');
    if (rt.propertyControl?.value && !sanitizeText(fl300.propertyControl?.propertyDescription?.value) && !sanitizeText(fl300.propertyControl?.debtPayTo?.value)) throw new Error('FL-300 property control needs property or debt-payment details.');
    if (rt.attorneyFeesCosts?.value && !sanitizeText(fl300.attorneyFees?.amount?.value)) throw new Error('FL-300 attorney fees/costs amount is required for v1.');
    if (rt.other?.value && !sanitizeText(fl300.otherOrdersRequested?.value)) throw new Error('FL-300 other orders text is required when other is selected.');
    if (!sanitizeText(fl300.facts?.value)) throw new Error('FL-300 facts to support requested orders are required.');
    if (!sanitizeText(fl300.signatureDate?.value)) throw new Error('FL-300 signature date is required.');
  }

  if (hasMinorChildren) {
    assertLegalAssertionReviewed(fl105?.childrenResidenceAssertionReviewed, 'FL-105 item 3 residence-history assertion');
    assertLegalAssertionReviewed(fl105?.otherProceedingsAssertionReviewed, 'FL-105 item 4 other-proceedings assertion');
    assertLegalAssertionReviewed(fl105?.domesticViolenceOrdersAssertionReviewed, 'FL-105 item 5 protective-order assertion');
    assertLegalAssertionReviewed(fl105?.otherClaimantsAssertionReviewed, 'FL-105 item 6 other-claimants assertion');

    if (!fl105?.childrenLivedTogetherPastFiveYears?.value && workspace.children.length > 1) {
      for (const attachment of fl105?.additionalChildrenAttachments ?? []) {
        if (attachment.sameResidenceAsChildA?.value) {
          assertLegalAssertionReviewed(attachment.sameResidenceReviewed, 'FL-105(A)/GC-120(A) same-residence assertion');
        }
      }
    }
  }

  if (fl311ShouldGenerate) {
    if (!hasMinorChildren) {
      throw new Error('FL-311 is selected, but minor children are not enabled.');
    }
    if (workspace.children.length > BASE_CHILD_VISIBLE_ROWS) {
      throw new Error(`FL-311 v1 currently supports only the first ${BASE_CHILD_VISIBLE_ROWS} child rows.`);
    }
    if (visitationRequested && fl311VisitationPlanMode === 'unspecified') {
      throw new Error('FL-311 visitation is requested, but item 2 visitation-plan mode is not selected.');
    }
    if (visitationRequested && fl311VisitationPlanMode === 'attachment_on_file') {
      if (fl311VisitationAttachmentPageCount <= 0) {
        throw new Error('FL-311 attached visitation-plan page count is required when item 2b is selected.');
      }
      if (!fl311VisitationAttachmentDate) {
        throw new Error('FL-311 attached visitation-plan date is required when item 2b is selected.');
      }
    }
  }

  if (fl312ShouldGenerate) {
    if (!hasMinorChildren) {
      throw new Error('FL-312 is selected, but minor children are not enabled.');
    }

    const hasAbductionBySelection = Boolean(fl312?.abductionBy?.petitioner?.value)
      || Boolean(fl312?.abductionBy?.respondent?.value)
      || Boolean(fl312?.abductionBy?.otherParentParty?.value);
    const hasDestinationRiskSelection = Boolean(fl312?.riskDestinations?.anotherCaliforniaCounty?.value)
      || Boolean(fl312?.riskDestinations?.anotherState?.value)
      || Boolean(fl312?.riskDestinations?.foreignCountry?.value);
    const hasBehaviorRiskSelection = Boolean(fl312?.riskFactors?.custodyOrderViolationThreat?.value)
      || Boolean(fl312?.riskFactors?.weakCaliforniaTies?.value)
      || Boolean(fl312?.riskFactors?.recentAbductionPlanningActions?.value)
      || Boolean(fl312?.riskFactors?.historyOfRiskBehaviors?.value)
      || Boolean(fl312?.riskFactors?.criminalRecord?.value);
    const hasOrdersAgainstSelection = Boolean(fl312?.requestedOrdersAgainst?.petitioner?.value)
      || Boolean(fl312?.requestedOrdersAgainst?.respondent?.value)
      || Boolean(fl312?.requestedOrdersAgainst?.otherParentParty?.value);
    const hasRequestedOrder = Boolean(fl312?.requestedOrders?.supervisedVisitation?.value)
      || Boolean(fl312?.requestedOrders?.postBond?.value)
      || Boolean(fl312?.requestedOrders?.noMoveWithoutWrittenPermissionOrCourtOrder?.value)
      || Boolean(fl312?.requestedOrders?.noTravelWithoutWrittenPermissionOrCourtOrder?.value)
      || Boolean(fl312?.requestedOrders?.registerOrderInOtherState?.value)
      || Boolean(fl312?.requestedOrders?.turnInPassportsAndTravelDocuments?.value)
      || Boolean(fl312?.requestedOrders?.doNotApplyForNewPassportsOrDocuments?.value)
      || Boolean(fl312?.requestedOrders?.provideTravelItinerary?.value)
      || Boolean(fl312?.requestedOrders?.provideRoundTripAirlineTickets?.value)
      || Boolean(fl312?.requestedOrders?.provideAddressesAndTelephone?.value)
      || Boolean(fl312?.requestedOrders?.provideOpenReturnTicketForRequestingParty?.value)
      || Boolean(fl312?.requestedOrders?.provideOtherTravelDocuments?.value)
      || Boolean(fl312?.requestedOrders?.notifyForeignEmbassyOrConsulate?.value)
      || Boolean(fl312?.requestedOrders?.obtainForeignCustodyAndVisitationOrderBeforeTravel?.value)
      || Boolean(fl312?.requestedOrders?.otherOrdersRequested?.value);

    if (!sanitizeText(fl312?.requestingPartyName?.value)) {
      throw new Error('FL-312 item 1 requesting party name is required.');
    }
    if (!hasAbductionBySelection) {
      throw new Error('FL-312 item 2 requires selecting at least one party the abduction-prevention orders are requested against.');
    }
    if (!hasDestinationRiskSelection && !hasBehaviorRiskSelection) {
      throw new Error('FL-312 requires at least one risk basis in item 3 or item 4.');
    }
    if (fl312?.riskDestinations?.anotherCaliforniaCounty?.value && !sanitizeText(fl312?.riskDestinations?.anotherCaliforniaCountyName?.value)) {
      throw new Error('FL-312 item 3a requires the county name.');
    }
    if (fl312?.riskDestinations?.anotherState?.value && !sanitizeText(fl312?.riskDestinations?.anotherStateName?.value)) {
      throw new Error('FL-312 item 3b requires the state name.');
    }
    if (fl312?.riskDestinations?.foreignCountry?.value && !sanitizeText(fl312?.riskDestinations?.foreignCountryName?.value)) {
      throw new Error('FL-312 item 3c requires the foreign country name.');
    }
    if (fl312?.riskDestinations?.foreignCountryHasTies?.value && !sanitizeText(fl312?.riskDestinations?.foreignCountryTiesDetails?.value)) {
      throw new Error('FL-312 item 3c(2) requires ties details.');
    }
    if (fl312?.riskFactors?.custodyOrderViolationThreat?.value && !sanitizeText(fl312?.riskFactors?.custodyOrderViolationThreatDetails?.value)) {
      throw new Error('FL-312 item 4a requires an explanation.');
    }
    if (fl312?.riskFactors?.weakCaliforniaTies?.value && !sanitizeText(fl312?.riskFactors?.weakCaliforniaTiesDetails?.value)) {
      throw new Error('FL-312 item 4b requires an explanation.');
    }
    if (fl312?.riskFactors?.recentActionOther?.value && !sanitizeText(fl312?.riskFactors?.recentActionOtherDetails?.value)) {
      throw new Error('FL-312 item 4c other action requires details.');
    }
    if (fl312?.riskFactors?.historyOfRiskBehaviors?.value && !sanitizeText(fl312?.riskFactors?.historyDetails?.value)) {
      throw new Error('FL-312 item 4d requires an explanation.');
    }
    if (fl312?.riskFactors?.criminalRecord?.value && !sanitizeText(fl312?.riskFactors?.criminalRecordDetails?.value)) {
      throw new Error('FL-312 item 4e requires an explanation.');
    }
    if (!hasOrdersAgainstSelection) {
      throw new Error('FL-312 page 2 requires selecting who the requested orders are against.');
    }
    if (!hasRequestedOrder) {
      throw new Error('FL-312 requires at least one requested order in items 5 through 14.');
    }
    if (fl312?.requestedOrders?.supervisedVisitation?.value) {
      const termsMode = fl312?.requestedOrders?.supervisedVisitationTermsMode?.value ?? 'unspecified';
      if (termsMode === 'unspecified') {
        throw new Error('FL-312 item 5 requires selecting the supervised-visitation terms mode.');
      }
      if (termsMode === 'fl311' && !fl311Selected) {
        throw new Error('FL-312 item 5 is set to FL-311 terms, but FL-311 is not selected.');
      }
      if (termsMode === 'as_follows' && !sanitizeText(fl312?.requestedOrders?.supervisedVisitationTermsDetails?.value)) {
        throw new Error('FL-312 item 5 "as follows" terms are required.');
      }
    }
    if (fl312?.requestedOrders?.postBond?.value && !sanitizeText(fl312?.requestedOrders?.postBondAmount?.value)) {
      throw new Error('FL-312 item 6 requires a bond amount.');
    }
    if (
      fl312?.requestedOrders?.noTravelWithoutWrittenPermissionOrCourtOrder?.value
      && !fl312?.requestedOrders?.travelRestrictionThisCounty?.value
      && !fl312?.requestedOrders?.travelRestrictionCalifornia?.value
      && !fl312?.requestedOrders?.travelRestrictionUnitedStates?.value
      && !fl312?.requestedOrders?.travelRestrictionOther?.value
    ) {
      throw new Error('FL-312 item 8 requires selecting at least one travel restriction.');
    }
    if (fl312?.requestedOrders?.travelRestrictionOther?.value && !sanitizeText(fl312?.requestedOrders?.travelRestrictionOtherDetails?.value)) {
      throw new Error('FL-312 item 8 other travel restriction requires details.');
    }
    if (fl312?.requestedOrders?.registerOrderInOtherState?.value && !sanitizeText(fl312?.requestedOrders?.registerOrderStateName?.value)) {
      throw new Error('FL-312 item 9 requires the registration state.');
    }
    if (fl312?.requestedOrders?.provideOtherTravelDocuments?.value && !sanitizeText(fl312?.requestedOrders?.provideOtherTravelDocumentsDetails?.value)) {
      throw new Error('FL-312 item 11 other travel documents requires details.');
    }
    if (fl312?.requestedOrders?.notifyForeignEmbassyOrConsulate?.value && !sanitizeText(fl312?.requestedOrders?.embassyOrConsulateCountry?.value)) {
      throw new Error('FL-312 item 12 requires the embassy/consulate country.');
    }
    if (fl312?.requestedOrders?.notifyForeignEmbassyOrConsulate?.value && !sanitizeText(fl312?.requestedOrders?.embassyNotificationWithinDays?.value)) {
      throw new Error('FL-312 item 12 requires notification days.');
    }
    if (fl312?.requestedOrders?.otherOrdersRequested?.value && !sanitizeText(fl312?.requestedOrders?.otherOrdersDetails?.value)) {
      throw new Error('FL-312 item 14 requires details.');
    }
    if (!sanitizeText(fl312?.signatureDate?.value)) {
      throw new Error('FL-312 signature date is required.');
    }
  }

  if (fl341ShouldGenerate) {
    if (!hasMinorChildren) {
      throw new Error('FL-341 is selected, but minor children are not enabled.');
    }
    if (workspace.children.length === 0) {
      throw new Error('FL-341 is selected, but no child rows were entered.');
    }
    if (workspace.children.length > BASE_CHILD_VISIBLE_ROWS) {
      throw new Error(`FL-341 v1 currently supports only the first ${BASE_CHILD_VISIBLE_ROWS} child rows.`);
    }
    if (fl341SourceOrder === 'unspecified') {
      throw new Error('FL-341 requires selecting the source order form (FL-340/FL-180/FL-250/FL-355/other).');
    }
    if (fl341SourceOrder === 'other' && !fl341SourceOrderOtherText) {
      throw new Error('FL-341 source order is set to other, but details were not provided.');
    }
    if (custodyAttachments.formFl341a) {
      const supervisedPartySelected = Boolean(fl341a?.supervisedParty?.petitioner?.value)
        || Boolean(fl341a?.supervisedParty?.respondent?.value)
        || Boolean(fl341a?.supervisedParty?.otherParentParty?.value);
      if (!supervisedPartySelected) {
        throw new Error('FL-341(A) requires selecting at least one supervised party.');
      }
      if ((fl341a?.supervisor?.type?.value ?? 'unspecified') === 'unspecified') {
        throw new Error('FL-341(A) requires selecting the supervisor type.');
      }
      if (fl341a?.supervisor?.type?.value === 'other' && !sanitizeText(fl341a?.supervisor?.otherTypeText?.value)) {
        throw new Error('FL-341(A) supervisor type is "other," but details were not provided.');
      }
      if (!sanitizeText(fl341a?.supervisor?.name?.value)) {
        throw new Error('FL-341(A) supervisor name is required.');
      }
      if (!sanitizeText(fl341a?.supervisor?.contact?.value)) {
        throw new Error('FL-341(A) supervisor contact is required.');
      }
      if ((fl341a?.supervisor?.feesPaidBy?.value ?? 'unspecified') === 'unspecified') {
        throw new Error('FL-341(A) requires selecting who pays supervisor fees.');
      }
      if (fl341a?.supervisor?.feesPaidBy?.value === 'other' && !sanitizeText(fl341a?.supervisor?.feesOtherText?.value)) {
        throw new Error('FL-341(A) supervisor fee payer is "other," but details were not provided.');
      }
      const scheduleMode = fl341a?.schedule?.mode?.value ?? 'unspecified';
      if (scheduleMode === 'unspecified') {
        throw new Error('FL-341(A) requires selecting a schedule mode.');
      }
      if (scheduleMode === 'fl311' && !fl311Selected) {
        throw new Error('FL-341(A) schedule mode is FL-311, but FL-311 is not selected.');
      }
      if (scheduleMode === 'attachment' && !sanitizeText(fl341a?.schedule?.attachmentPageCount?.value)) {
        throw new Error('FL-341(A) attached schedule page count is required when attachment mode is selected.');
      }
      if (scheduleMode === 'text' && !sanitizeText(fl341a?.schedule?.text?.value)) {
        throw new Error('FL-341(A) "as follows" schedule terms are required.');
      }
    }
    if (custodyAttachments.formFl341b) {
      const risk = fl341b?.risk;
      const prep = risk?.preparationActions;
      const history = risk?.history;
      const orders = fl341b?.orders;
      const hasRisk = Boolean(risk?.violatedPastOrders?.value)
        || Boolean(risk?.noStrongCaliforniaTies?.value)
        || Boolean(prep?.selected?.value)
        || Boolean(history?.selected?.value)
        || Boolean(risk?.criminalRecord?.value)
        || Boolean(risk?.tiesToOtherJurisdiction?.value);
      const hasPreparationDetail = Boolean(prep?.quitJob?.value)
        || Boolean(prep?.soldHome?.value)
        || Boolean(prep?.closedBankAccount?.value)
        || Boolean(prep?.endedLease?.value)
        || Boolean(prep?.soldAssets?.value)
        || Boolean(prep?.hiddenOrDestroyedDocuments?.value)
        || Boolean(prep?.appliedForPassport?.value)
        || Boolean(prep?.other?.value);
      const hasHistoryDetail = Boolean(history?.domesticViolence?.value)
        || Boolean(history?.childAbuse?.value)
        || Boolean(history?.nonCooperation?.value);
      const hasOrder = Boolean(orders?.supervisedVisitation?.value)
        || Boolean(orders?.postBond?.value)
        || Boolean(orders?.noMoveWithoutPermission?.value)
        || Boolean(orders?.noTravelWithoutPermission?.value)
        || Boolean(orders?.registerInOtherState?.value)
        || Boolean(orders?.noPassportApplications?.value)
        || Boolean(orders?.turnInPassportsAndVitalDocs?.value)
        || Boolean(orders?.provideTravelInfo?.value)
        || Boolean(orders?.notifyEmbassyOrConsulate?.value)
        || Boolean(orders?.obtainForeignOrderBeforeTravel?.value)
        || Boolean(orders?.enforceOrder?.value)
        || Boolean(orders?.other?.value);

      if (!sanitizeText(fl341b?.restrainedPartyName?.value)) {
        throw new Error('FL-341(B) restrained party name is required.');
      }
      if (!hasRisk) {
        throw new Error('FL-341(B) requires at least one explicit child-abduction risk factor.');
      }
      if (prep?.selected?.value && !hasPreparationDetail) {
        throw new Error('FL-341(B) preparation-actions risk requires selecting at least one action.');
      }
      if (prep?.other?.value && !sanitizeText(prep?.otherDetails?.value)) {
        throw new Error('FL-341(B) other preparation action requires details.');
      }
      if (history?.selected?.value && !hasHistoryDetail) {
        throw new Error('FL-341(B) history risk requires selecting at least one history item.');
      }
      if (!hasOrder) {
        throw new Error('FL-341(B) requires at least one explicit abduction-prevention order.');
      }
      if (orders?.supervisedVisitation?.value) {
        const termsMode = orders?.supervisedVisitationTermsMode?.value ?? 'unspecified';
        if (termsMode === 'unspecified') {
          throw new Error('FL-341(B) supervised visitation requires selecting terms mode.');
        }
        if (termsMode === 'fl341a' && !custodyAttachments.formFl341a) {
          throw new Error('FL-341(B) supervised visitation references FL-341(A), but FL-341(A) is not selected.');
        }
        if (termsMode === 'as_follows' && !sanitizeText(orders?.supervisedVisitationTermsDetails?.value)) {
          throw new Error('FL-341(B) supervised visitation as-follows terms are required.');
        }
      }
      if (orders?.postBond?.value && !sanitizeText(orders?.postBondAmount?.value)) {
        throw new Error('FL-341(B) bond amount is required.');
      }
      if (orders?.noMoveWithoutPermission?.value
        && !orders?.noMoveCurrentResidence?.value
        && !orders?.noMoveCurrentSchoolDistrict?.value
        && !orders?.noMoveOtherPlace?.value) {
        throw new Error('FL-341(B) no-move order requires at least one place restriction.');
      }
      if (orders?.noMoveOtherPlace?.value && !sanitizeText(orders?.noMoveOtherPlaceDetails?.value)) {
        throw new Error('FL-341(B) other no-move place requires details.');
      }
      if (orders?.noTravelWithoutPermission?.value
        && !orders?.travelRestrictionThisCounty?.value
        && !orders?.travelRestrictionCalifornia?.value
        && !orders?.travelRestrictionUnitedStates?.value
        && !orders?.travelRestrictionOther?.value) {
        throw new Error('FL-341(B) no-travel order requires at least one travel restriction.');
      }
      if (orders?.travelRestrictionOther?.value && !sanitizeText(orders?.travelRestrictionOtherDetails?.value)) {
        throw new Error('FL-341(B) other travel restriction requires details.');
      }
      if (orders?.registerInOtherState?.value && !sanitizeText(orders?.registerInOtherStateName?.value)) {
        throw new Error('FL-341(B) registration state is required.');
      }
      if (orders?.provideOtherTravelInfo?.value && !sanitizeText(orders?.provideOtherTravelInfoDetails?.value)) {
        throw new Error('FL-341(B) other travel information requires details.');
      }
      if (orders?.notifyEmbassyOrConsulate?.value && !sanitizeText(orders?.notifyEmbassyCountry?.value)) {
        throw new Error('FL-341(B) embassy/consulate country is required.');
      }
      if (orders?.notifyEmbassyOrConsulate?.value && !sanitizeText(orders?.notifyEmbassyWithinDays?.value)) {
        throw new Error('FL-341(B) embassy/consulate notification days are required.');
      }
      if (orders?.enforceOrder?.value && !sanitizeText(orders?.enforceOrderContactInfo?.value)) {
        throw new Error('FL-341(B) enforcement contact information is required.');
      }
      if (orders?.other?.value && !sanitizeText(orders?.otherDetails?.value)) {
        throw new Error('FL-341(B) other order requires details.');
      }
    }
    if (custodyAttachments.formFl341c) {
      const fl341cRows = [
        { label: "New Year's Day", row: fl341c?.holidayRows?.newYearsDay },
        { label: 'Spring Break', row: fl341c?.holidayRows?.springBreak },
        { label: 'Thanksgiving Day', row: fl341c?.holidayRows?.thanksgivingDay },
        { label: 'Winter Break', row: fl341c?.holidayRows?.winterBreak },
        { label: "Child's Birthday", row: fl341c?.holidayRows?.childBirthday },
      ];
      const enabledRows = fl341cRows.filter(({ row }) => Boolean(row?.enabled?.value));
      const hasAnyFl341cDetail = enabledRows.length > 0
        || Boolean(sanitizeText(fl341c?.additionalHolidayNotes?.value))
        || (fl341c?.vacation?.assignedTo?.value ?? 'unspecified') !== 'unspecified'
        || Boolean(sanitizeText(fl341c?.vacation?.maxDuration?.value))
        || Boolean(sanitizeText(fl341c?.vacation?.timesPerYear?.value))
        || Boolean(sanitizeText(fl341c?.vacation?.noticeDays?.value))
        || Boolean(sanitizeText(fl341c?.vacation?.responseDays?.value))
        || Boolean(fl341c?.vacation?.allowOutsideCalifornia?.value)
        || Boolean(fl341c?.vacation?.allowOutsideUnitedStates?.value)
        || Boolean(sanitizeText(fl341c?.vacation?.otherTerms?.value));
      if (!hasAnyFl341cDetail) {
        throw new Error('FL-341(C) is selected but no explicit holiday or vacation terms were provided.');
      }
      for (const { label, row } of enabledRows) {
        if ((row?.yearPattern?.value ?? 'unspecified') === 'unspecified') {
          throw new Error(`FL-341(C) ${label} requires selecting every year / even years / odd years.`);
        }
        if ((row?.assignedTo?.value ?? 'unspecified') === 'unspecified') {
          throw new Error(`FL-341(C) ${label} requires selecting petitioner/respondent/other parent-party.`);
        }
      }
      if (sanitizeText(fl341c?.vacation?.maxDuration?.value) && (fl341c?.vacation?.maxDurationUnit?.value ?? 'unspecified') === 'unspecified') {
        throw new Error('FL-341(C) vacation max duration unit (days/weeks) is required when max duration is entered.');
      }
      if (fl341c?.vacation?.allowOutsideUnitedStates?.value && !fl341c?.vacation?.allowOutsideCalifornia?.value) {
        throw new Error('FL-341(C) outside-U.S. vacation requires outside-California vacation to also be selected.');
      }
    }

    if (custodyAttachments.formFl341d) {
      const provisions = [
        { label: 'exchange schedule', value: fl341d?.provisions?.exchangeSchedule },
        { label: 'transportation', value: fl341d?.provisions?.transportation },
        { label: 'make-up parenting time', value: fl341d?.provisions?.makeupTime },
        { label: 'communication', value: fl341d?.provisions?.communication },
        { label: 'right of first refusal', value: fl341d?.provisions?.rightOfFirstRefusal },
        { label: 'temporary changes by agreement', value: fl341d?.provisions?.temporaryChangesByAgreement },
        { label: 'other physical-custody provisions', value: fl341d?.provisions?.other },
      ];
      const selected = provisions.filter(({ value }) => Boolean(value?.selected?.value));
      if (selected.length === 0) {
        throw new Error('FL-341(D) is selected but no additional physical-custody provisions were selected.');
      }
      for (const item of selected) {
        if (!sanitizeText(item.value?.details?.value)) {
          throw new Error(`FL-341(D) ${item.label} requires details.`);
        }
      }
    }

    if (custodyAttachments.formFl341e) {
      if (!fl341e?.orderJointLegalCustody?.value) {
        throw new Error('FL-341(E) is selected, so joint legal custody must be explicitly confirmed.');
      }
      if ((fl341e?.decisionMaking?.education?.value ?? 'unspecified') === 'unspecified') {
        throw new Error('FL-341(E) must specify who makes education decisions.');
      }
      if ((fl341e?.decisionMaking?.nonEmergencyHealthcare?.value ?? 'unspecified') === 'unspecified') {
        throw new Error('FL-341(E) must specify who makes non-emergency healthcare decisions.');
      }
      if ((fl341e?.decisionMaking?.mentalHealth?.value ?? 'unspecified') === 'unspecified') {
        throw new Error('FL-341(E) must specify who makes mental-health counseling decisions.');
      }
      if ((fl341e?.decisionMaking?.extracurricular?.value ?? 'unspecified') === 'unspecified') {
        throw new Error('FL-341(E) must specify who makes extracurricular decisions.');
      }
      const hasOperatingTerm = Boolean(fl341e?.terms?.recordsAccess?.value)
        || Boolean(fl341e?.terms?.emergencyNotice?.value)
        || Boolean(fl341e?.terms?.portalAccess?.value)
        || Boolean(fl341e?.terms?.contactUpdates?.value);
      const hasDisputePath = Boolean(fl341e?.disputeResolution?.meetAndConfer?.value)
        || Boolean(fl341e?.disputeResolution?.mediation?.value)
        || Boolean(fl341e?.disputeResolution?.court?.value)
        || Boolean(fl341e?.disputeResolution?.other?.value);
      if (!hasOperatingTerm && !hasDisputePath && !sanitizeText(fl341e?.additionalTerms?.value)) {
        throw new Error('FL-341(E) requires at least one operating term, dispute path, or additional term.');
      }
      if (fl341e?.disputeResolution?.other?.value && !sanitizeText(fl341e?.disputeResolution?.otherText?.value)) {
        throw new Error('FL-341(E) dispute-resolution other option requires details.');
      }
    }
  }

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
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].AttyName_ft[0]', petitionerAttorneyOrPartyName, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].AttyFirm_ft[0]', petitionerFirmName, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].BarNo_ft[0]', petitionerStateBarNumber, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].AttyStreet_ft[0]', address.street, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].AttyCity_ft[0]', address.city, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].AttyState_ft[0]', address.state, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].AttyZip_ft[0]', address.zip, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].Phone_ft[0]', petitionerPhone, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].Fax_ft[0]', petitionerFax, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].Email_ft[0]', petitionerEmail, fontRegular, { size: 8 });
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].AttyFor_ft[0]', petitionerAttorneyFor, fontRegular, { size: 8 });
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].PetitionersResidence_tf[0]', petitionerResidenceLocation, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].RespondentsResidence_tf[0]', respondentResidenceLocation, fontRegular);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CheckBox61[0]', isMarriageProceeding);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CheckBox61[1]', isDomesticPartnershipProceeding);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].DateOfMarriage_dt[0]', marriageDate, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].DateOfSeparation_dt[0]', separationDate, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].DateTimeField1[0]', domesticPartnershipRegistrationDate, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].DatePartnersSeparated_dt[0]', domesticPartnershipSeparationDate, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].MonthsSeparated_tf[0]', isMarriageProceeding ? marriageDuration.years : '', fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].MonthsSeparated_tf[1]', isMarriageProceeding ? marriageDuration.months : '', fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].MonthsSeparated_tf[3]', isDomesticPartnershipProceeding ? domesticPartnershipDuration.years : '', fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].MonthsSeparated_tf[2]', isDomesticPartnershipProceeding ? domesticPartnershipDuration.months : '', fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].SigDate[0]', fl100SignatureDate, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].SigDate[1]', fl100SignatureDate, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].PrintPetitionerName_tf[0]', petitionerName, fontRegular);
  fillTextFields(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].PrintPetitionerAttorneyName_tf[0]', petitionerAttorneyOrPartyName, fontRegular);

  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].DissolutionOf_cb[0]', isDissolutionProceeding);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].LegalSeparationOf_cb[0]', isLegalSeparationProceeding);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].NullityOf_cb[0]', isNullityProceeding);
  fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].Amended_cb[0]', isAmendedPetition);
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
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page1[0].MinorChildren_sf[0].UnbornChild_cb[0]', hasUnbornChild);
    fillCheckbox(
      fl100Pages,
      fl100FieldMap,
      'FL-100[0].Page1[0].MinorChildren_sf[0].Attachment4b[0]',
      childListContinuedOnAttachment4b,
    );
    workspace.children.slice(0, 4).forEach((child, index) => {
      const number = index + 1;
      const childBirthdateField = number === 3
        ? 'FL-100[0].Page1[0].MinorChildren_sf[0].Child3Date_dt[0]'
        : `FL-100[0].Page1[0].MinorChildren_sf[0].Child${number}Birthdate_dt[0]`;
      fillTextFields(fl100Pages, fl100FieldMap, `FL-100[0].Page1[0].MinorChildren_sf[0].Child${number}Name_tf[0]`, sanitizeText(child.fullName?.value), fontRegular, { size: 8 });
      fillTextFields(fl100Pages, fl100FieldMap, childBirthdateField, formatDateForCourt(child.birthDate?.value), fontRegular, { size: 8 });
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
    if (communityPropertyWhereListed === 'unspecified') {
      throw new Error('FL-100 community/quasi-community property is selected, but list location is not specified.');
    }
    if (communityPropertyWhereListed === 'attachment' && communityPropertyAttachmentEntries.length === 0) {
      throw new Error('FL-100 community/quasi-community attachment 10b is selected, but no attachment details were provided.');
    }
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].CommQuasiProperty_sf[0].PropertyListed_cb[0]', true);
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].CommQuasiProperty_sf[0].WhereCPListed_cb[0]', communityPropertyWhereListed === 'attachment');
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].CommQuasiProperty_sf[0].WhereCPListed_cb[1]', communityPropertyWhereListed === 'fl160');
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].CommQuasiProperty_sf[0].WhereCPListed_cb[2]', communityPropertyWhereListed === 'inline_list');
    if (communityPropertyWhereListed === 'inline_list') {
      fillTextFields(
        fl100Pages,
        fl100FieldMap,
        'FL-100[0].Page3[0].CommQuasiProperty_sf[0].ListProperty_ft[0]',
        communityPropertyDetails,
        fontRegular,
        { size: 8 },
      );
    }
  } else {
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].NoCommOrQuasiCommProperty_cb[0]', true);
  }

  if (wantsSeparateProperty) {
    if (separatePropertyWhereListed === 'unspecified') {
      throw new Error('FL-100 separate property is selected, but list location is not specified.');
    }
    if (separatePropertyWhereListed === 'attachment' && separatePropertyEntries.length === 0) {
      throw new Error('FL-100 separate property attachment 9b is selected, but no attachment details were provided.');
    }
    if (separatePropertyWhereListed === 'attachment' && separatePropertyAwardTargets.length === 0) {
      throw new Error('FL-100 separate property attachment 9b needs at least one "confirmed to" value.');
    }
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].ConfirmSeparateProperty_cb[0]', true);
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].WhereSPListed_cb[0]', separatePropertyWhereListed === 'attachment');
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].WhereSPListed_cb[1]', separatePropertyWhereListed === 'fl160');
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].WhereSPListed_cb[2]', separatePropertyWhereListed === 'inline_list');
    if (separatePropertyWhereListed === 'inline_list') {
      if (separatePropertyEntries.length === 0) {
        throw new Error('FL-100 separate property is set to inline list, but no list entries were provided.');
      }
      if (separatePropertyEntries.length > FL100_SEPARATE_PROPERTY_VISIBLE_ROWS) {
        throw new Error(
          `FL-100 separate property inline list has ${separatePropertyEntries.length} entries but only ${FL100_SEPARATE_PROPERTY_VISIBLE_ROWS} visible rows. Choose FL-160 or attachment 9b.`,
        );
      }
      if (separatePropertyAwardTargets.length === 0) {
        throw new Error('FL-100 separate property inline list needs at least one "confirmed to" value.');
      }

      const listFieldNames = [
        'FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].SeparatePropertyList1_tf[0]',
        'FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].SeparatePropertyList2_tf[0]',
        'FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].SeparatePropertyList3_tf[0]',
        'FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].SeparatePropertyList4_tf[0]',
        'FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].SeparatePropertyList4_tf[1]',
      ];
      const awardFieldNames = [
        'FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].ConfirmPropertyList1To_tf[0]',
        'FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].ConfirmPropertyList2To_tf[0]',
        'FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].ConfirmPropertyList3To_tf[0]',
        'FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].ConfirmPropertyList4To_tf[0]',
        'FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].ConfirmPropertyList4To_tf[1]',
      ];

      separatePropertyEntries.forEach((entry, index) => {
        const awardTarget = separatePropertyAwardTargets[index] ?? separatePropertyAwardTargets[0] ?? '';
        fillTextFields(fl100Pages, fl100FieldMap, listFieldNames[index], entry, fontRegular, { size: 8 });
        fillTextFields(fl100Pages, fl100FieldMap, awardFieldNames[index], awardTarget, fontRegular, { size: 8 });
      });
    }
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
    if (otherRequestsContinuedOnAttachment && !otherRequestsDetails) {
      throw new Error('FL-100 other requests are marked as continued on attachment, but no attachment details were provided.');
    }
    fillTextFields(
      fl100Pages,
      fl100FieldMap,
      'FL-100[0].Page3[0].SpecifyOtherRequests_tf[0]',
      otherRequestsContinuedOnAttachment ? 'See attachment 11c.' : otherRequestsDetails,
      fontRegular,
      { size: 8, multiline: true },
    );
    fillCheckbox(fl100Pages, fl100FieldMap, 'FL-100[0].Page3[0].ContinuedOnAttachment_cb[0]', otherRequestsContinuedOnAttachment);
  }

  const overflowChildren = workspace.children.slice(BASE_CHILD_VISIBLE_ROWS);
  if (overflowChildren.length > 0 && hasMinorChildren && workspace.fl100?.minorChildren?.detailsOnAttachment4b?.value) {
    appendChildAttachmentPages(
      output,
      fontRegular,
      fontBold,
      'FL-100 Attachment 4b — Additional Minor Children',
      shortTitle,
      caseNumber,
      overflowChildren,
      { includeAge: true },
    );
  }

  if (wantsSeparateProperty && separatePropertyWhereListed === 'attachment') {
    appendAttachmentTextPages(
      output,
      fontRegular,
      fontBold,
      'FL-100 Attachment 9b — Separate Property',
      shortTitle,
      caseNumber,
      [
        {
          heading: 'Separate property items and requested confirmation',
          paragraphs: separatePropertyEntries.map((entry, index) => {
            const awardTarget = separatePropertyAwardTargets[index] ?? separatePropertyAwardTargets[0] ?? '';
            return awardTarget
              ? `${index + 1}. ${entry}\nRequested confirmation to: ${awardTarget}`
              : `${index + 1}. ${entry}`;
          }),
        },
      ],
    );
  }

  if (wantsCommunityProperty && communityPropertyWhereListed === 'attachment') {
    appendAttachmentTextPages(
      output,
      fontRegular,
      fontBold,
      'FL-100 Attachment 10b — Community / Quasi-Community Property',
      shortTitle,
      caseNumber,
      [
        {
          heading: 'Community / quasi-community property items',
          paragraphs: communityPropertyAttachmentEntries.map((entry, index) => `${index + 1}. ${entry}`),
        },
      ],
    );
  }

  if (wantsOtherRequests && otherRequestsContinuedOnAttachment) {
    appendAttachmentTextPages(
      output,
      fontRegular,
      fontBold,
      'FL-100 Attachment 11c — Other Requests Continuation',
      shortTitle,
      caseNumber,
      [
        {
          heading: 'Continued other relief request',
          paragraphs: [otherRequestsDetails],
        },
      ],
    );
  }

  if (fl311ShouldGenerate) {
    await appendFl311AttachmentPages(
      output,
      fl311Template,
      fl311FieldMap,
      fontRegular,
      workspace,
      petitionerName,
      respondentName,
      caseNumber,
    );
  }

  if (fl312ShouldGenerate) {
    await appendFl312AttachmentPages(
      output,
      fl312Template,
      fl312FieldMap,
      fontRegular,
      workspace,
      petitionerName,
      respondentName,
      caseNumber,
    );
  }

  if (fl341ShouldGenerate) {
    await appendFl341AttachmentPages(
      output,
      fl341Template,
      fl341FieldMap,
      fontRegular,
      workspace,
      petitionerName,
      respondentName,
      caseNumber,
    );
    if (custodyAttachments.formFl341a) {
      await appendFl341AAttachmentPages(
        output,
        fl341aTemplate,
        fl341aFieldMap,
        fontRegular,
        workspace,
        petitionerName,
        respondentName,
        caseNumber,
      );
    }
    if (custodyAttachments.formFl341b) {
      await appendFl341BAttachmentPages(
        output,
        fl341bTemplate,
        fl341bFieldMap,
        fontRegular,
        workspace,
        petitionerName,
        respondentName,
        caseNumber,
      );
    }
    if (custodyAttachments.formFl341c) {
      await appendFl341CAttachmentPages(
        output,
        fl341cTemplate,
        fl341cFieldMap,
        fontRegular,
        workspace,
        petitionerName,
        respondentName,
        caseNumber,
      );
    }
    if (custodyAttachments.formFl341d) {
      await appendFl341DAttachmentPages(
        output,
        fl341dTemplate,
        fl341dFieldMap,
        fontRegular,
        workspace,
        petitionerName,
        respondentName,
        caseNumber,
      );
    }
    if (custodyAttachments.formFl341e) {
      await appendFl341EAttachmentPages(
        output,
        fl341eTemplate,
        fl341eFieldMap,
        fontRegular,
        workspace,
        petitionerName,
        respondentName,
        caseNumber,
      );
    }
  }

  if (fl150ShouldGenerate) {
    await appendFl150IncomeExpensePages(
      output,
      fl150Template,
      fl150FieldMap,
      fontRegular,
      workspace,
      petitionerName,
      respondentName,
      caseNumber,
      address,
    );
  }

  if (fl300ShouldGenerate) {
    await appendFl300RequestForOrderPages(
      output,
      fl300Template,
      fl300FieldMap,
      fontRegular,
      workspace,
      petitionerName,
      respondentName,
      caseNumber,
      address,
    );
  }

  fl110Pages.forEach((page) => output.addPage(page));

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

  await appendFw001FeeWaiverPages(
    output,
    fw001Template,
    fw001FieldMap,
    fontRegular,
    workspace,
    petitionerName,
    respondentName,
    caseNumber,
    address,
  );

  if (hasMinorChildren) {
    fl105Pages.forEach((page) => output.addPage(page));

    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].AttyName_ft[0]', petitionerAttorneyOrPartyName, fontRegular);
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].AttyFirm_ft[0]', petitionerFirmName, fontRegular, { size: 8 });
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].BarNo_ft[0]', petitionerStateBarNumber, fontRegular, { size: 8 });
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].AttyStreet_ft[0]', address.street, fontRegular, { size: 8 });
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].AttyCity_ft[0]', address.city, fontRegular, { size: 8 });
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].AttyState_ft[0]', address.state, fontRegular, { size: 8 });
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].AttyZip_ft[0]', address.zip, fontRegular, { size: 8 });
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].Phone[0]', petitionerPhone, fontRegular, { size: 8 });
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].Fax[0]', petitionerFax, fontRegular, { size: 8 });
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].Email[0]', petitionerEmail, fontRegular, { size: 8 });
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].Name[0]', petitionerAttorneyFor, fontRegular, { size: 8 });

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

    const fl105RepresentationRole = fl105?.representationRole?.value ?? 'party';
    const isFl105AuthorizedRepresentative = fl105RepresentationRole === 'authorized_representative';
    const fl105AuthorizedRepresentativeAgencyName = sanitizeText(fl105?.authorizedRepresentativeAgencyName?.value);
    fillCheckbox(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].List1[0].Li1[0].Party[0].PartyRepCB[0]', !isFl105AuthorizedRepresentative);
    fillCheckbox(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].List1[0].Li1[0].AuthRep[0].PartyRepCB[0]', isFl105AuthorizedRepresentative);
    fillTextFields(
      fl105Pages,
      fl105FieldMap,
      'FL-105[0].Page1[0].List1[0].Li1[0].Agencyname[0]',
      isFl105AuthorizedRepresentative ? fl105AuthorizedRepresentativeAgencyName : '',
      fontRegular,
      { size: 8 },
    );
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].List2[0].Li1[0].NumChildren[0]', String(workspace.children.length), fontRegular);

    workspace.children.slice(0, 4).forEach((child, index) => {
      const row = index + 1;
      const childNameField = row === 1
        ? `FL-105[0].Page1[0].List2[0].Li1[0].Table[0].Row1[0].TextField7[0]`
        : `FL-105[0].Page1[0].List2[0].Li1[0].Table[0].Row${row}[0].TextField8[0]`;
      fillTextFields(fl105Pages, fl105FieldMap, childNameField, sanitizeText(child.fullName?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page1[0].List2[0].Li1[0].Table[0].Row${row}[0].TextField1[0]`, formatDateForCourt(child.birthDate?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page1[0].List2[0].Li1[0].Table[0].Row${row}[0].TextField2[0]`, sanitizeText(child.placeOfBirth?.value), fontRegular, { size: 8 });
    });

    fillCheckbox(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].List2[0].Li1[0].CheckBox19[0]', hasOverflowMinorChildren);
    const generatedFl105ChildAttachmentPages = hasOverflowMinorChildren
      ? appendChildAttachmentPages(
        output,
        fontRegular,
        fontBold,
        'FL-105, Attachment 2, Additional Children',
        shortTitle,
        caseNumber,
        overflowChildren,
      )
      : 0;
    fillCheckbox(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].List3[0].Li1[0].OneManyCB[0]', Boolean(fl105?.childrenLivedTogetherPastFiveYears?.value));
    fillCheckbox(fl105Pages, fl105FieldMap, 'FL-105[0].Page1[0].List3[0].Li2[0].KidsLiveApart[0].OneManyCB[0]', !fl105?.childrenLivedTogetherPastFiveYears?.value);

    const residenceHistoryEntries = (fl105?.residenceHistory ?? []).filter((entry) => {
      return Boolean(
        sanitizeText(entry.fromDate?.value)
        || sanitizeText(entry.toDate?.value)
        || sanitizeText(entry.residence?.value)
        || sanitizeText(entry.personAndAddress?.value)
        || sanitizeText(entry.relationship?.value),
      );
    });

    const visibleResidenceHistoryEntries = residenceHistoryEntries.slice(0, FL105_RESIDENCE_HISTORY_VISIBLE_ROWS);
    const overflowResidenceHistoryEntries = residenceHistoryEntries.slice(FL105_RESIDENCE_HISTORY_VISIBLE_ROWS);

    visibleResidenceHistoryEntries.forEach((entry, index) => {
      const row = index + 1;
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page1[0].List3[0].Li1[0].Table3a[0].Row${row}[0].From${row}[0]`, formatDateForCourt(entry.fromDate?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page1[0].List3[0].Li1[0].Table3a[0].Row${row}[0].To${row}[0]`, formatDateForCourt(entry.toDate?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page1[0].List3[0].Li1[0].Table3a[0].Row${row}[0].Residence${row}[0]`, sanitizeText(entry.residence?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page1[0].List3[0].Li1[0].Table3a[0].Row${row}[0].PersonStreet${row}[0]`, sanitizeText(entry.personAndAddress?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page1[0].List3[0].Li1[0].Table3a[0].Row${row}[0].Relationship${row}[0]`, sanitizeText(entry.relationship?.value), fontRegular, { size: 8 });
    });
    fillCheckbox(
      fl105Pages,
      fl105FieldMap,
      'FL-105[0].Page1[0].List3[0].Li1[0].Table3a[0].Row1a[0].Confidential1a3[0].ConfidentialCB[0]',
      Boolean(fl105?.residenceAddressConfidentialStateOnly?.value),
    );
    fillCheckbox(
      fl105Pages,
      fl105FieldMap,
      'FL-105[0].Page1[0].List3[0].Li1[0].Table3a[0].Row1a[0].Confidential1a4[0].ConfidentialCB[0]',
      Boolean(fl105?.personAddressConfidentialStateOnly?.value),
    );
    fillCheckbox(
      fl105Pages,
      fl105FieldMap,
      'FL-105[0].Page1[0].List3[0].Li1[0].AddlAddyCB[0]',
      Boolean(fl105?.additionalResidenceAddressesOnAttachment3a?.value) || overflowResidenceHistoryEntries.length > 0,
    );

    const shouldGenerateFl105ResidenceAttachment = Boolean(fl105?.additionalResidenceAddressesOnAttachment3a?.value) || overflowResidenceHistoryEntries.length > 0;
    const residenceAttachmentEntries = fl105?.additionalResidenceAddressesOnAttachment3a?.value
      ? residenceHistoryEntries
      : overflowResidenceHistoryEntries;
    if (shouldGenerateFl105ResidenceAttachment && residenceAttachmentEntries.length === 0) {
      throw new Error('FL-105 attachment 3a is selected, but no residence-history details were provided.');
    }
    const generatedFl105ResidenceAttachmentPages = shouldGenerateFl105ResidenceAttachment
      ? appendAttachmentTextPages(
        output,
        fontRegular,
        fontBold,
        'FL-105 Attachment 3a — Additional Residence Addresses',
        shortTitle,
        caseNumber,
        [
          {
            heading: 'Residence-history address details',
            paragraphs: residenceAttachmentEntries.map((entry, index) => [
              `${index + 1}. From: ${formatDateForCourt(entry.fromDate?.value) || 'Not provided'}${sanitizeText(entry.toDate?.value) ? `  To: ${formatDateForCourt(entry.toDate?.value)}` : ''}`,
              `Residence: ${sanitizeText(entry.residence?.value) || 'Not provided'}`,
              `Person / address: ${sanitizeText(entry.personAndAddress?.value) || 'Not provided'}`,
              `Relationship: ${sanitizeText(entry.relationship?.value) || 'Not provided'}`,
            ].join('\n')),
          },
        ],
      )
      : 0;
    const generatedFl105AdditionalChildAttachmentPages = await appendFl105AdditionalChildAttachmentPages(
      output,
      fl105aTemplate,
      fl105aFieldMap,
      fontRegular,
      workspace,
      shortTitle,
      caseNumber,
    );

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
    const { visibleByType: visibleProceedingsByType, overflow: overflowProceedings } = partitionFl105Proceedings(proceedings);
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

    for (const slot of proceedingSlots) {
      const entry = visibleProceedingsByType.get(slot.key);
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
    const generatedFl105ProceedingsAttachmentPages = overflowProceedings.length > 0
      ? appendAttachmentTextPages(
        output,
        fontRegular,
        fontBold,
        'FL-105 Attachment 4 — Additional Proceedings',
        shortTitle,
        caseNumber,
        [
          {
            heading: 'Additional custody / parentage / adoption proceedings',
            paragraphs: overflowProceedings.map((entry, index) => [
              `${index + 1}. Type: ${sanitizeText(entry.proceedingType?.value) || 'Not provided'}`,
              `Case number: ${sanitizeText(entry.caseNumber?.value) || 'Not provided'}`,
              `Court: ${sanitizeText(entry.court?.value) || 'Not provided'}`,
              `Order date: ${formatDateForCourt(entry.orderDate?.value) || 'Not provided'}`,
              `Child(ren): ${sanitizeText(entry.childNames?.value) || 'Not provided'}`,
              `Your role / connection: ${sanitizeText(entry.connection?.value) || 'Not provided'}`,
              `Status: ${sanitizeText(entry.status?.value) || 'Not provided'}`,
            ].join('\n')),
          },
        ],
      )
      : 0;

    const restrainingOrders = (fl105?.domesticViolenceOrders ?? []).filter((entry) => {
      return Boolean(
        sanitizeText(entry.orderType?.value) ||
        sanitizeText(entry.county?.value) ||
        sanitizeText(entry.stateOrTribe?.value) ||
        sanitizeText(entry.caseNumber?.value) ||
        sanitizeText(entry.expirationDate?.value),
      );
    });
    const { visibleByType: visibleOrdersByType, overflow: overflowOrders } = partitionFl105Orders(restrainingOrders);
    const restrainingKnown = Boolean(fl105?.domesticViolenceOrdersExist?.value || restrainingOrders.length > 0);
    fillCheckbox(fl105Pages, fl105FieldMap, 'FL-105[0].Page2[0].Item5subformset[0].List5[0].Li1[0].DVROCB[0].DVRO_CB[0]', restrainingKnown);

    const orderRows = [
      { key: 'criminal' as const, row: '5a', checkbox: 'FL-105[0].Page2[0].Item5subformset[0].List5[0].Li1[0].Table5[0].Row5a[0].ROCell5a[0].CrimPO_CB5a[0]' },
      { key: 'family' as const, row: '5b', checkbox: 'FL-105[0].Page2[0].Item5subformset[0].List5[0].Li1[0].Table5[0].Row5b[0].ROCell5b[0].FamRO_CB5b[0]' },
      { key: 'juvenile' as const, row: '5c', checkbox: 'FL-105[0].Page2[0].Item5subformset[0].List5[0].Li1[0].Table5[0].Row5c[0].ROCell5c[0].JuvRO_CB5c[0]' },
      { key: 'other' as const, row: '5d', checkbox: 'FL-105[0].Page2[0].Item5subformset[0].List5[0].Li1[0].Table5[0].Row5d[0].ROCell5d[0].OtherRO_CB5d[0]' },
    ];
    for (const slot of orderRows) {
      const entry = visibleOrdersByType.get(slot.key);
      if (!entry) continue;

      fillCheckbox(fl105Pages, fl105FieldMap, slot.checkbox, true);
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].Item5subformset[0].List5[0].Li1[0].Table5[0].Row${slot.row}[0].County${slot.row}[0]`, sanitizeText(entry.county?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].Item5subformset[0].List5[0].Li1[0].Table5[0].Row${slot.row}[0].StateTribe${slot.row}[0]`, sanitizeText(entry.stateOrTribe?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].Item5subformset[0].List5[0].Li1[0].Table5[0].Row${slot.row}[0].CaseNo${slot.row}[0]`, sanitizeText(entry.caseNumber?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].Item5subformset[0].List5[0].Li1[0].Table5[0].Row${slot.row}[0].ExpDate${slot.row}[0]`, formatDateForCourt(entry.expirationDate?.value), fontRegular, { size: 8 });
    }
    const generatedFl105OrdersAttachmentPages = overflowOrders.length > 0
      ? appendAttachmentTextPages(
        output,
        fontRegular,
        fontBold,
        'FL-105 Attachment 5 — Additional Restraining / Protective Orders',
        shortTitle,
        caseNumber,
        [
          {
            heading: 'Additional protective / restraining orders',
            paragraphs: overflowOrders.map((entry, index) => [
              `${index + 1}. Type: ${sanitizeText(entry.orderType?.value) || 'Not provided'}`,
              `County: ${sanitizeText(entry.county?.value) || 'Not provided'}`,
              `State / tribe: ${sanitizeText(entry.stateOrTribe?.value) || 'Not provided'}`,
              `Case number: ${sanitizeText(entry.caseNumber?.value) || 'Not provided'}`,
              `Expiration date: ${formatDateForCourt(entry.expirationDate?.value) || 'Not provided'}`,
            ].join('\n')),
          },
        ],
      )
      : 0;

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

    const visibleClaimants = claimants.slice(0, FL105_OTHER_CLAIMANTS_VISIBLE_ROWS);
    const overflowClaimants = claimants.slice(FL105_OTHER_CLAIMANTS_VISIBLE_ROWS);

    visibleClaimants.forEach((entry, index) => {
      const row = ['a', 'b', 'c'][index];
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].List6[0].Li${index + 1}[0].Name6${row}[0]`, sanitizeText(entry.nameAndAddress?.value), fontRegular, { size: 8 });
      fillTextFields(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].List6[0].Li${index + 1}[0].Child6${row}[0]`, sanitizeText(entry.childNames?.value), fontRegular, { size: 8 });
      fillCheckbox(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].List6[0].Li${index + 1}[0].CheckBox6${row}1[0]`, Boolean(entry.hasPhysicalCustody?.value));
      fillCheckbox(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].List6[0].Li${index + 1}[0].CheckBox6${row}2[0]`, Boolean(entry.claimsCustodyRights?.value));
      fillCheckbox(fl105Pages, fl105FieldMap, `FL-105[0].Page2[0].List6[0].Li${index + 1}[0].CheckBox6${row}3[0]`, Boolean(entry.claimsVisitationRights?.value));
    });
    const generatedFl105ClaimantsAttachmentPages = overflowClaimants.length > 0
      ? appendAttachmentTextPages(
        output,
        fontRegular,
        fontBold,
        'FL-105 Attachment 6 — Additional Other Claimants',
        shortTitle,
        caseNumber,
        [
          {
            heading: 'Additional other custody / visitation claimants',
            paragraphs: overflowClaimants.map((entry, index) => [
              `${index + 1}. Name and address: ${sanitizeText(entry.nameAndAddress?.value) || 'Not provided'}`,
              `Child names: ${sanitizeText(entry.childNames?.value) || 'Not provided'}`,
              `Has physical custody: ${entry.hasPhysicalCustody?.value ? 'Yes' : 'No'}`,
              `Claims custody rights: ${entry.claimsCustodyRights?.value ? 'Yes' : 'No'}`,
              `Claims visitation rights: ${entry.claimsVisitationRights?.value ? 'Yes' : 'No'}`,
            ].join('\n')),
          },
        ],
      )
      : 0;

    const declarantName = sanitizeText(fl105?.declarantName?.value || petitionerName);
    const declarantSignatureDate = formatDateForCourt(fl105?.signatureDate?.value);
    const manualFl105AttachmentPageCount = parseAttachmentPageCount(fl105?.attachmentPageCount?.value);
    const totalFl105AttachmentPageCount = manualFl105AttachmentPageCount
      + generatedFl105ChildAttachmentPages
      + generatedFl105ResidenceAttachmentPages
      + generatedFl105AdditionalChildAttachmentPages
      + generatedFl105ProceedingsAttachmentPages
      + generatedFl105OrdersAttachmentPages
      + generatedFl105ClaimantsAttachmentPages;
    const hasFl105Attachments = Boolean(fl105?.attachmentsIncluded?.value) || totalFl105AttachmentPageCount > 0;
    fillCheckbox(fl105Pages, fl105FieldMap, 'FL-105[0].Page2[0].List7[0].Li1[0].Checkbox[0]', hasFl105Attachments);
    fillTextFields(
      fl105Pages,
      fl105FieldMap,
      'FL-105[0].Page2[0].List7[0].Li1[0].PPAttached[0]',
      totalFl105AttachmentPageCount > 0 ? String(totalFl105AttachmentPageCount) : '',
      fontRegular,
      { size: 8 },
    );
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page2[0].PoPDec[0].PrintName[0]', declarantName, fontRegular);
    fillTextFields(fl105Pages, fl105FieldMap, 'FL-105[0].Page2[0].PoPDec[0].SigDate[0]', declarantSignatureDate, fontRegular);
  }

  return output.save();
}
