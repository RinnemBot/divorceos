import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage, User } from '@/services/auth';
import type { SupportScenario } from '@/services/savedFiles';

const FORM_DRAFTS_KEY = 'divorceos_form_drafts';
const FORM_DRAFTS_CHAT_HANDOFF_KEY = 'divorceos_form_drafts_latest_chat_handoff';

export type DraftFieldSourceType = 'chat' | 'upload' | 'profile' | 'manual' | 'support-snapshot';
export type DraftFieldConfidence = 'high' | 'medium' | 'low';
export type DraftWorkspaceStatus = 'not_started' | 'in_review' | 'ready';
export type DraftPacketPresetId = 'custom' | 'start_divorce' | 'respond_divorce' | 'default_uncontested_judgment' | 'rfo_support_fees' | 'dvro';

export const DRAFT_PACKET_PRESET_LABELS: Record<DraftPacketPresetId, string> = {
  custom: 'Custom packet',
  start_divorce: 'Start divorce',
  respond_divorce: 'Respond to divorce',
  default_uncontested_judgment: 'Default / uncontested judgment',
  rfo_support_fees: 'RFO support / fees',
  dvro: 'DVRO',
};
export type DraftFl100PropertyListLocation = 'unspecified' | 'fl160' | 'attachment' | 'inline_list';

export interface DraftField<T> {
  value: T;
  sourceType?: DraftFieldSourceType;
  sourceLabel?: string;
  confidence?: DraftFieldConfidence;
  needsReview?: boolean;
}

export interface DraftIntakeFact {
  id: string;
  path: string[];
  label: string;
  value: string | boolean;
  sourceType: DraftFieldSourceType;
  sourceLabel: string;
  confidence: DraftFieldConfidence;
  status: 'pending' | 'applied' | 'dismissed';
  createdAt: string;
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

export interface DraftFl105AdditionalChildAttachment {
  id: string;
  childId: string;
  sameResidenceAsChildA: DraftField<boolean>;
  sameResidenceReviewed: DraftField<boolean>;
  residenceHistory: DraftFl105ResidenceHistoryEntry[];
  residenceAddressConfidentialStateOnly: DraftField<boolean>;
  personAddressConfidentialStateOnly: DraftField<boolean>;
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
  representationRole: DraftField<'party' | 'authorized_representative'>;
  authorizedRepresentativeAgencyName: DraftField<string>;
  childrenLivedTogetherPastFiveYears: DraftField<boolean>;
  childrenResidenceAssertionReviewed: DraftField<boolean>;
  residenceHistory: DraftFl105ResidenceHistoryEntry[];
  additionalChildrenAttachments: DraftFl105AdditionalChildAttachment[];
  residenceAddressConfidentialStateOnly: DraftField<boolean>;
  personAddressConfidentialStateOnly: DraftField<boolean>;
  additionalResidenceAddressesOnAttachment3a: DraftField<boolean>;
  otherProceedingsKnown: DraftField<boolean>;
  otherProceedingsAssertionReviewed: DraftField<boolean>;
  otherProceedings: DraftFl105OtherProceeding[];
  domesticViolenceOrdersExist: DraftField<boolean>;
  domesticViolenceOrdersAssertionReviewed: DraftField<boolean>;
  domesticViolenceOrders: DraftFl105RestrainingOrder[];
  otherClaimantsKnown: DraftField<boolean>;
  otherClaimantsAssertionReviewed: DraftField<boolean>;
  otherClaimants: DraftFl105OtherClaimant[];
  attachmentsIncluded: DraftField<boolean>;
  attachmentPageCount: DraftField<string>;
  declarantName: DraftField<string>;
  signatureDate: DraftField<string>;
}

export interface DraftFl311Section {
  filingPartyOtherName: DraftField<string>;
  visitationPlanMode: DraftField<'unspecified' | 'reasonable_right_of_visitation' | 'attachment_on_file'>;
  visitationAttachmentPageCount: DraftField<string>;
  visitationAttachmentDate: DraftField<string>;
}

export interface DraftFl312Section {
  filingPartyOtherName: DraftField<string>;
  requestingPartyName: DraftField<string>;
  abductionBy: {
    petitioner: DraftField<boolean>;
    respondent: DraftField<boolean>;
    otherParentParty: DraftField<boolean>;
  };
  riskDestinations: {
    anotherCaliforniaCounty: DraftField<boolean>;
    anotherCaliforniaCountyName: DraftField<string>;
    anotherState: DraftField<boolean>;
    anotherStateName: DraftField<string>;
    foreignCountry: DraftField<boolean>;
    foreignCountryName: DraftField<string>;
    foreignCountryCitizen: DraftField<boolean>;
    foreignCountryHasTies: DraftField<boolean>;
    foreignCountryTiesDetails: DraftField<string>;
  };
  riskFactors: {
    custodyOrderViolationThreat: DraftField<boolean>;
    custodyOrderViolationThreatDetails: DraftField<string>;
    weakCaliforniaTies: DraftField<boolean>;
    weakCaliforniaTiesDetails: DraftField<string>;
    recentAbductionPlanningActions: DraftField<boolean>;
    recentActionQuitJob: DraftField<boolean>;
    recentActionSoldHome: DraftField<boolean>;
    recentActionClosedBankAccount: DraftField<boolean>;
    recentActionEndedLease: DraftField<boolean>;
    recentActionSoldAssets: DraftField<boolean>;
    recentActionHidOrDestroyedDocuments: DraftField<boolean>;
    recentActionAppliedForTravelDocuments: DraftField<boolean>;
    recentActionOther: DraftField<boolean>;
    recentActionOtherDetails: DraftField<string>;
    historyOfRiskBehaviors: DraftField<boolean>;
    historyDomesticViolence: DraftField<boolean>;
    historyChildAbuse: DraftField<boolean>;
    historyParentingNonCooperation: DraftField<boolean>;
    historyChildTakingWithoutPermission: DraftField<boolean>;
    historyDetails: DraftField<string>;
    criminalRecord: DraftField<boolean>;
    criminalRecordDetails: DraftField<string>;
  };
  requestedOrdersAgainst: {
    petitioner: DraftField<boolean>;
    respondent: DraftField<boolean>;
    otherParentParty: DraftField<boolean>;
  };
  requestedOrders: {
    supervisedVisitation: DraftField<boolean>;
    supervisedVisitationTermsMode: DraftField<'unspecified' | 'fl311' | 'as_follows'>;
    supervisedVisitationTermsDetails: DraftField<string>;
    postBond: DraftField<boolean>;
    postBondAmount: DraftField<string>;
    noMoveWithoutWrittenPermissionOrCourtOrder: DraftField<boolean>;
    noTravelWithoutWrittenPermissionOrCourtOrder: DraftField<boolean>;
    travelRestrictionThisCounty: DraftField<boolean>;
    travelRestrictionCalifornia: DraftField<boolean>;
    travelRestrictionUnitedStates: DraftField<boolean>;
    travelRestrictionOther: DraftField<boolean>;
    travelRestrictionOtherDetails: DraftField<string>;
    registerOrderInOtherState: DraftField<boolean>;
    registerOrderStateName: DraftField<string>;
    turnInPassportsAndTravelDocuments: DraftField<boolean>;
    doNotApplyForNewPassportsOrDocuments: DraftField<boolean>;
    provideTravelItinerary: DraftField<boolean>;
    provideRoundTripAirlineTickets: DraftField<boolean>;
    provideAddressesAndTelephone: DraftField<boolean>;
    provideOpenReturnTicketForRequestingParty: DraftField<boolean>;
    provideOtherTravelDocuments: DraftField<boolean>;
    provideOtherTravelDocumentsDetails: DraftField<string>;
    notifyForeignEmbassyOrConsulate: DraftField<boolean>;
    embassyOrConsulateCountry: DraftField<string>;
    embassyNotificationWithinDays: DraftField<string>;
    obtainForeignCustodyAndVisitationOrderBeforeTravel: DraftField<boolean>;
    otherOrdersRequested: DraftField<boolean>;
    otherOrdersDetails: DraftField<string>;
  };
  signatureDate: DraftField<string>;
}

export type DraftFl341SourceOrder = 'unspecified' | 'fl340' | 'fl180' | 'fl250' | 'fl355' | 'other';
export type DraftFl341HolidayYearPattern = 'unspecified' | 'every_year' | 'even_years' | 'odd_years';
export type DraftFl341PartyAssignment = 'unspecified' | 'petitioner' | 'respondent' | 'other_parent_party';
export type DraftFl341DecisionAssignment = 'unspecified' | 'joint' | 'petitioner' | 'respondent' | 'other_parent_party';
export type DraftFl341ASupervisorType = 'unspecified' | 'professional' | 'nonprofessional' | 'other';
export type DraftFl341AScheduleMode = 'unspecified' | 'fl311' | 'attachment' | 'text';
export type DraftFl341AFeePayer = 'unspecified' | 'petitioner' | 'respondent' | 'shared' | 'other';
export type DraftFl300PartyRole = 'petitioner' | 'respondent' | 'other_parent_party';
export type DraftFl300LocationMode = 'unspecified' | 'same_as_above' | 'other';

export interface DraftFl341CHolidayRow {
  enabled: DraftField<boolean>;
  yearPattern: DraftField<DraftFl341HolidayYearPattern>;
  assignedTo: DraftField<DraftFl341PartyAssignment>;
  times: DraftField<string>;
}

export interface DraftFl341DProvision {
  selected: DraftField<boolean>;
  details: DraftField<string>;
}

export interface DraftFl341ASection {
  supervisedParty: {
    petitioner: DraftField<boolean>;
    respondent: DraftField<boolean>;
    otherParentParty: DraftField<boolean>;
  };
  supervisor: {
    type: DraftField<DraftFl341ASupervisorType>;
    otherTypeText: DraftField<string>;
    name: DraftField<string>;
    contact: DraftField<string>;
    feesPaidBy: DraftField<DraftFl341AFeePayer>;
    feesOtherText: DraftField<string>;
  };
  schedule: {
    mode: DraftField<DraftFl341AScheduleMode>;
    attachmentPageCount: DraftField<string>;
    text: DraftField<string>;
  };
  restrictions: DraftField<string>;
  otherTerms: DraftField<string>;
}

export interface DraftFl341BSection {
  restrainedPartyName: DraftField<string>;
  risk: {
    violatedPastOrders: DraftField<boolean>;
    noStrongCaliforniaTies: DraftField<boolean>;
    preparationActions: {
      selected: DraftField<boolean>;
      quitJob: DraftField<boolean>;
      soldHome: DraftField<boolean>;
      closedBankAccount: DraftField<boolean>;
      endedLease: DraftField<boolean>;
      soldAssets: DraftField<boolean>;
      hiddenOrDestroyedDocuments: DraftField<boolean>;
      appliedForPassport: DraftField<boolean>;
      other: DraftField<boolean>;
      otherDetails: DraftField<string>;
    };
    history: {
      selected: DraftField<boolean>;
      domesticViolence: DraftField<boolean>;
      childAbuse: DraftField<boolean>;
      nonCooperation: DraftField<boolean>;
    };
    criminalRecord: DraftField<boolean>;
    tiesToOtherJurisdiction: DraftField<boolean>;
  };
  orders: {
    supervisedVisitation: DraftField<boolean>;
    supervisedVisitationTermsMode: DraftField<'unspecified' | 'fl341a' | 'as_follows'>;
    supervisedVisitationTermsDetails: DraftField<string>;
    postBond: DraftField<boolean>;
    postBondAmount: DraftField<string>;
    postBondTerms: DraftField<string>;
    noMoveWithoutPermission: DraftField<boolean>;
    noMoveCurrentResidence: DraftField<boolean>;
    noMoveCurrentSchoolDistrict: DraftField<boolean>;
    noMoveOtherPlace: DraftField<boolean>;
    noMoveOtherPlaceDetails: DraftField<string>;
    noTravelWithoutPermission: DraftField<boolean>;
    travelRestrictionThisCounty: DraftField<boolean>;
    travelRestrictionCalifornia: DraftField<boolean>;
    travelRestrictionUnitedStates: DraftField<boolean>;
    travelRestrictionOther: DraftField<boolean>;
    travelRestrictionOtherDetails: DraftField<string>;
    registerInOtherState: DraftField<boolean>;
    registerInOtherStateName: DraftField<string>;
    noPassportApplications: DraftField<boolean>;
    turnInPassportsAndVitalDocs: DraftField<boolean>;
    turnInPassportsAndVitalDocsList: DraftField<string>;
    provideTravelInfo: DraftField<boolean>;
    provideTravelItinerary: DraftField<boolean>;
    provideRoundTripTickets: DraftField<boolean>;
    provideAddressesAndTelephone: DraftField<boolean>;
    provideOpenReturnTicket: DraftField<boolean>;
    provideOtherTravelInfo: DraftField<boolean>;
    provideOtherTravelInfoDetails: DraftField<string>;
    notifyEmbassyOrConsulate: DraftField<boolean>;
    notifyEmbassyCountry: DraftField<string>;
    notifyEmbassyWithinDays: DraftField<string>;
    obtainForeignOrderBeforeTravel: DraftField<boolean>;
    enforceOrder: DraftField<boolean>;
    enforceOrderContactInfo: DraftField<string>;
    other: DraftField<boolean>;
    otherDetails: DraftField<string>;
  };
}

export interface DraftFl341Section {
  sourceOrder: DraftField<DraftFl341SourceOrder>;
  sourceOrderOtherText: DraftField<string>;
  otherParentPartyName: DraftField<string>;
  fl341a: DraftFl341ASection;
  fl341b: DraftFl341BSection;
  fl341c: {
    holidayRows: {
      newYearsDay: DraftFl341CHolidayRow;
      springBreak: DraftFl341CHolidayRow;
      thanksgivingDay: DraftFl341CHolidayRow;
      winterBreak: DraftFl341CHolidayRow;
      childBirthday: DraftFl341CHolidayRow;
    };
    additionalHolidayNotes: DraftField<string>;
    vacation: {
      assignedTo: DraftField<DraftFl341PartyAssignment>;
      maxDuration: DraftField<string>;
      maxDurationUnit: DraftField<'unspecified' | 'days' | 'weeks'>;
      timesPerYear: DraftField<string>;
      noticeDays: DraftField<string>;
      responseDays: DraftField<string>;
      allowOutsideCalifornia: DraftField<boolean>;
      allowOutsideUnitedStates: DraftField<boolean>;
      otherTerms: DraftField<string>;
    };
  };
  fl341d: {
    provisions: {
      exchangeSchedule: DraftFl341DProvision;
      transportation: DraftFl341DProvision;
      makeupTime: DraftFl341DProvision;
      communication: DraftFl341DProvision;
      rightOfFirstRefusal: DraftFl341DProvision;
      temporaryChangesByAgreement: DraftFl341DProvision;
      other: DraftFl341DProvision;
    };
  };
  fl341e: {
    orderJointLegalCustody: DraftField<boolean>;
    decisionMaking: {
      education: DraftField<DraftFl341DecisionAssignment>;
      nonEmergencyHealthcare: DraftField<DraftFl341DecisionAssignment>;
      mentalHealth: DraftField<DraftFl341DecisionAssignment>;
      extracurricular: DraftField<DraftFl341DecisionAssignment>;
    };
    terms: {
      recordsAccess: DraftField<boolean>;
      emergencyNotice: DraftField<boolean>;
      portalAccess: DraftField<boolean>;
      contactUpdates: DraftField<boolean>;
    };
    disputeResolution: {
      meetAndConfer: DraftField<boolean>;
      mediation: DraftField<boolean>;
      court: DraftField<boolean>;
      other: DraftField<boolean>;
      otherText: DraftField<string>;
    };
    additionalTerms: DraftField<string>;
  };
}

export interface DraftFl100Section {
  includeForm: DraftField<boolean>;
  proceedingType: DraftField<'dissolution' | 'legal_separation' | 'nullity'>;
  isAmended: DraftField<boolean>;
  relationshipType: DraftField<'marriage' | 'domestic_partnership' | 'both'>;
  domesticPartnership: {
    establishment: DraftField<'unspecified' | 'established_in_california' | 'not_established_in_california'>;
    californiaResidencyException: DraftField<boolean>;
    sameSexMarriageJurisdictionException: DraftField<boolean>;
    registrationDate: DraftField<string>;
    partnerSeparationDate: DraftField<string>;
  };
  nullity: {
    basedOnIncest: DraftField<boolean>;
    basedOnBigamy: DraftField<boolean>;
    basedOnAge: DraftField<boolean>;
    basedOnPriorExistingMarriageOrPartnership: DraftField<boolean>;
    basedOnUnsoundMind: DraftField<boolean>;
    basedOnFraud: DraftField<boolean>;
    basedOnForce: DraftField<boolean>;
    basedOnPhysicalIncapacity: DraftField<boolean>;
  };
  residency: {
    petitionerCaliforniaMonths: DraftField<string>;
    petitionerCountyMonths: DraftField<string>;
    petitionerResidenceLocation: DraftField<string>;
    respondentCaliforniaMonths: DraftField<string>;
    respondentCountyMonths: DraftField<string>;
    respondentResidenceLocation: DraftField<string>;
  };
  legalGrounds: {
    irreconcilableDifferences: DraftField<boolean>;
    permanentLegalIncapacity: DraftField<boolean>;
  };
  propertyDeclarations: {
    communityAndQuasiCommunity: DraftField<boolean>;
    communityAndQuasiCommunityWhereListed: DraftField<DraftFl100PropertyListLocation>;
    communityAndQuasiCommunityDetails: DraftField<string>;
    separateProperty: DraftField<boolean>;
    separatePropertyWhereListed: DraftField<DraftFl100PropertyListLocation>;
    separatePropertyDetails: DraftField<string>;
    separatePropertyAwardedTo: DraftField<string>;
  };
  spousalSupport: {
    supportOrderDirection: DraftField<'none' | 'petitioner_to_respondent' | 'respondent_to_petitioner'>;
    reserveJurisdictionFor: DraftField<'none' | 'petitioner' | 'respondent' | 'both'>;
    terminateJurisdictionFor: DraftField<'none' | 'petitioner' | 'respondent' | 'both'>;
    details: DraftField<string>;
    voluntaryDeclarationOfParentageSigned: DraftField<boolean>;
  };
  childSupport: {
    requestAdditionalOrders: DraftField<boolean>;
    additionalOrdersDetails: DraftField<string>;
  };
  minorChildren: {
    hasUnbornChild: DraftField<boolean>;
    detailsOnAttachment4b: DraftField<boolean>;
  };
  childCustodyVisitation: {
    legalCustodyTo: DraftField<'none' | 'petitioner' | 'respondent' | 'joint' | 'other'>;
    physicalCustodyTo: DraftField<'none' | 'petitioner' | 'respondent' | 'joint' | 'other'>;
    visitationTo: DraftField<'none' | 'petitioner' | 'respondent' | 'other'>;
    fl311: DraftFl311Section;
    fl312: DraftFl312Section;
    fl341: DraftFl341Section;
    attachments: {
      formFl311: DraftField<boolean>;
      formFl312: DraftField<boolean>;
      formFl341a: DraftField<boolean>;
      formFl341b: DraftField<boolean>;
      formFl341c: DraftField<boolean>;
      formFl341d: DraftField<boolean>;
      formFl341e: DraftField<boolean>;
      attachment6c1: DraftField<boolean>;
    };
  };
  attorneyFeesAndCosts: {
    requestAward: DraftField<boolean>;
    payableBy: DraftField<'none' | 'petitioner' | 'respondent' | 'both'>;
  };
  otherRequests: {
    requestOtherRelief: DraftField<boolean>;
    details: DraftField<string>;
    continuedOnAttachment: DraftField<boolean>;
  };
  signatureDate: DraftField<string>;
  formerName: DraftField<string>;
}

export interface DraftFl300Section {
  includeForm: DraftField<boolean>;
  requestTypes: {
    childCustody: DraftField<boolean>;
    visitation: DraftField<boolean>;
    childSupport: DraftField<boolean>;
    spousalSupport: DraftField<boolean>;
    propertyControl: DraftField<boolean>;
    attorneyFeesCosts: DraftField<boolean>;
    other: DraftField<boolean>;
    changeModify: DraftField<boolean>;
    temporaryEmergencyOrders: DraftField<boolean>;
  };
  requestedAgainst: {
    petitioner: DraftField<boolean>;
    respondent: DraftField<boolean>;
    otherParentParty: DraftField<boolean>;
    other: DraftField<boolean>;
    otherName: DraftField<string>;
  };
  hearing: {
    date: DraftField<string>;
    time: DraftField<string>;
    department: DraftField<string>;
    room: DraftField<string>;
    locationMode: DraftField<DraftFl300LocationMode>;
    otherLocation: DraftField<string>;
  };
  service: {
    timeShortened: DraftField<boolean>;
    serviceDate: DraftField<string>;
    responsiveDeclarationDueDate: DraftField<string>;
    courtDaysBeforeHearing: DraftField<string>;
    orderShorterServiceReason: DraftField<string>;
  };
  custodyMediation: {
    required: DraftField<boolean>;
    details: DraftField<string>;
  };
  temporaryEmergencyFl305Applies: DraftField<boolean>;
  otherCourtOrders: DraftField<string>;
  restrainingOrderInfo: {
    include: DraftField<boolean>;
    againstPetitioner: DraftField<boolean>;
    againstRespondent: DraftField<boolean>;
    againstOtherParentParty: DraftField<boolean>;
    criminalCountyState: DraftField<string>;
    criminalCaseNumber: DraftField<string>;
    familyCountyState: DraftField<string>;
    familyCaseNumber: DraftField<string>;
    juvenileCountyState: DraftField<string>;
    juvenileCaseNumber: DraftField<string>;
    otherCountyState: DraftField<string>;
    otherCaseNumber: DraftField<string>;
  };
  custodyRequests: {
    useChildRows: DraftField<boolean>;
    legalCustodyToText: DraftField<string>;
    physicalCustodyToText: DraftField<string>;
    useCustodyAttachments: DraftField<boolean>;
    useFl305: DraftField<boolean>;
    useFl311: DraftField<boolean>;
    useFl312: DraftField<boolean>;
    useFl341c: DraftField<boolean>;
    useFl341d: DraftField<boolean>;
    useFl341e: DraftField<boolean>;
    otherAttachmentText: DraftField<string>;
    asFollowsText: DraftField<string>;
    bestInterestReasons: DraftField<string>;
    currentCustodyOrderDate: DraftField<string>;
    currentCustodyOrderDetails: DraftField<string>;
    currentVisitationOrderDate: DraftField<string>;
    currentVisitationOrderDetails: DraftField<string>;
  };
  supportRequests: {
    childSupportGuideline: DraftField<boolean>;
    childSupportMonthlyAmountText: DraftField<string>;
    currentChildSupportOrderDate: DraftField<string>;
    currentChildSupportOrderDetails: DraftField<string>;
    childSupportChangeReasons: DraftField<string>;
    spousalSupportAmount: DraftField<string>;
    changeSpousalSupport: DraftField<boolean>;
    endSpousalSupport: DraftField<boolean>;
    currentSpousalSupportOrderDate: DraftField<string>;
    currentSpousalSupportAmount: DraftField<string>;
    spousalSupportChangeReasons: DraftField<string>;
  };
  propertyControl: {
    temporaryEmergency: DraftField<boolean>;
    exclusiveUseTo: DraftField<'unspecified' | 'petitioner' | 'respondent' | 'other_parent_party'>;
    propertyDescription: DraftField<string>;
    ownedOrBuying: DraftField<boolean>;
    leasedOrRented: DraftField<boolean>;
    debtPaymentBy: DraftField<'unspecified' | 'petitioner' | 'respondent' | 'other_parent_party'>;
    debtPayTo: DraftField<string>;
    debtFor: DraftField<string>;
    debtAmount: DraftField<string>;
    debtDueDate: DraftField<string>;
    currentOrderDate: DraftField<string>;
  };
  attorneyFees: {
    amount: DraftField<string>;
    includeFl319: DraftField<boolean>;
    feesRequestedAmount: DraftField<string>;
    costsRequestedAmount: DraftField<string>;
    incurredToDateAmount: DraftField<string>;
    estimatedFutureAmount: DraftField<string>;
    limitedScopeAmount: DraftField<string>;
    paymentRequestedFrom: DraftField<'unspecified' | 'petitioner' | 'respondent' | 'other'>;
    paymentRequestedFromOtherName: DraftField<string>;
    priorFeeOrderExists: DraftField<'unspecified' | 'no' | 'yes'>;
    priorFeeOrderPayor: DraftField<'unspecified' | 'petitioner' | 'respondent' | 'other'>;
    priorFeeOrderAmount: DraftField<string>;
    priorFeeOrderDate: DraftField<string>;
    paymentSources: DraftField<string>;
    priorPaymentsStatus: DraftField<'unspecified' | 'made' | 'not_made' | 'partial'>;
    additionalInformation: DraftField<string>;
    freeLegalServices: DraftField<boolean>;
    pagesAttached: DraftField<string>;
  };
  otherOrdersRequested: DraftField<string>;
  facts: DraftField<string>;
  signatureDate: DraftField<string>;
  typePrintName: DraftField<string>;
}

export type DraftFl150PayPeriod = 'unspecified' | 'month' | 'week' | 'hour';
export type DraftFl150TaxStatus = 'unspecified' | 'single' | 'head_of_household' | 'married_separate' | 'married_joint';
export type DraftFl150TaxState = 'unspecified' | 'california' | 'other';
export type DraftFl150ExpenseBasis = 'unspecified' | 'estimated' | 'actual' | 'proposed';

export interface DraftFl150AmountPair {
  lastMonth: DraftField<string>;
  averageMonthly: DraftField<string>;
}

export interface DraftFl150Section {
  includeForm: DraftField<boolean>;
  employment: {
    employer: DraftField<string>;
    employerAddress: DraftField<string>;
    employerPhone: DraftField<string>;
    occupation: DraftField<string>;
    jobStartDate: DraftField<string>;
    jobEndDate: DraftField<string>;
    hoursPerWeek: DraftField<string>;
    payAmount: DraftField<string>;
    payPeriod: DraftField<DraftFl150PayPeriod>;
  };
  education: {
    age: DraftField<string>;
    highSchoolGraduated: DraftField<'unspecified' | 'yes' | 'no'>;
    highestGradeCompleted: DraftField<string>;
    collegeYears: DraftField<string>;
    collegeDegree: DraftField<string>;
    graduateYears: DraftField<string>;
    graduateDegree: DraftField<string>;
    professionalLicense: DraftField<string>;
    vocationalTraining: DraftField<string>;
  };
  taxes: {
    taxYear: DraftField<string>;
    filingStatus: DraftField<DraftFl150TaxStatus>;
    jointFilerName: DraftField<string>;
    taxState: DraftField<DraftFl150TaxState>;
    otherState: DraftField<string>;
    exemptions: DraftField<string>;
  };
  otherPartyIncome: {
    grossMonthlyEstimate: DraftField<string>;
    basis: DraftField<string>;
  };
  income: {
    salaryWages: DraftFl150AmountPair;
    overtime: DraftFl150AmountPair;
    commissionsBonuses: DraftFl150AmountPair;
    publicAssistance: DraftFl150AmountPair;
    publicAssistanceCurrentlyReceiving: DraftField<boolean>;
    spousalSupport: DraftFl150AmountPair;
    spousalSupportFromThisMarriage: DraftField<boolean>;
    spousalSupportFromDifferentMarriage: DraftField<boolean>;
    spousalSupportFederallyTaxable: DraftField<boolean>;
    partnerSupport: DraftFl150AmountPair;
    partnerSupportFromThisPartnership: DraftField<boolean>;
    partnerSupportFromDifferentPartnership: DraftField<boolean>;
    pensionRetirement: DraftFl150AmountPair;
    socialSecurityDisability: DraftFl150AmountPair;
    socialSecurity: DraftField<boolean>;
    stateDisability: DraftField<boolean>;
    privateInsurance: DraftField<boolean>;
    unemploymentWorkersComp: DraftFl150AmountPair;
    otherIncome: DraftFl150AmountPair;
    otherIncomeDescription: DraftField<string>;
    selfEmployment: {
      owner: DraftField<boolean>;
      partner: DraftField<boolean>;
      other: DraftField<boolean>;
      otherText: DraftField<string>;
      years: DraftField<string>;
      businessName: DraftField<string>;
      businessType: DraftField<string>;
    };
    additionalIncome: { selected: DraftField<boolean>; details: DraftField<string> };
    incomeChange: { selected: DraftField<boolean>; details: DraftField<string> };
  };
  deductions: {
    requiredUnionDues: DraftField<string>;
    retirement: DraftField<string>;
    medicalInsurance: DraftField<string>;
    supportPaid: DraftField<string>;
    wageAssignment: DraftField<string>;
    jobExpenses: DraftField<string>;
    otherDeductions: DraftField<string>;
    totalDeductions: DraftField<string>;
  };
  assets: {
    cashChecking: DraftField<string>;
    savingsCreditUnion: DraftField<string>;
    stocksBonds: DraftField<string>;
    realProperty: DraftField<string>;
    otherProperty: DraftField<string>;
  };
  household: {
    person1Name: DraftField<string>;
    person1Age: DraftField<string>;
    person1Relationship: DraftField<string>;
    person1GrossMonthlyIncome: DraftField<string>;
  };
  expenses: {
    basis: DraftField<DraftFl150ExpenseBasis>;
    rentOrMortgage: DraftField<string>;
    housingIsMortgage: DraftField<boolean>;
    mortgagePrincipal: DraftField<string>;
    mortgageInterest: DraftField<string>;
    propertyTax: DraftField<string>;
    insurance: DraftField<string>;
    maintenance: DraftField<string>;
    healthCosts: DraftField<string>;
    groceriesHousehold: DraftField<string>;
    eatingOut: DraftField<string>;
    utilities: DraftField<string>;
    phone: DraftField<string>;
    laundryCleaning: DraftField<string>;
    clothes: DraftField<string>;
    education: DraftField<string>;
    entertainmentGiftsVacation: DraftField<string>;
    auto: DraftField<string>;
    autoInsurance: DraftField<string>;
    savingsInvestments: DraftField<string>;
    charitable: DraftField<string>;
    monthlyDebtPayments: DraftField<string>;
    otherDescription: DraftField<string>;
    otherExpenses: DraftField<string>;
    totalExpenses: DraftField<string>;
  };
  childrenSupport: {
    hasChildrenHealthInsurance: DraftField<'unspecified' | 'yes' | 'no'>;
    insuranceCompanyName: DraftField<string>;
    insuranceCompanyAddress: DraftField<string>;
    insuranceMonthlyCost: DraftField<string>;
    numberOfChildren: DraftField<string>;
    timeshareMePercent: DraftField<string>;
    timeshareOtherParentPercent: DraftField<string>;
    parentingScheduleDescription: DraftField<string>;
    childCareCosts: DraftField<string>;
    healthCareCostsNotCovered: DraftField<string>;
    specialNeedsDescription: DraftField<string>;
    specialNeedsAmount: DraftField<string>;
  };
  hardships: {
    healthExpensesAmount: DraftField<string>;
    healthExpensesMonths: DraftField<string>;
    uninsuredLossesAmount: DraftField<string>;
    uninsuredLossesMonths: DraftField<string>;
    otherHardshipAmount: DraftField<string>;
    otherHardshipMonths: DraftField<string>;
    childrenNamesAges: DraftField<string>;
    childrenMonthlyExpense: DraftField<string>;
    explanation: DraftField<string>;
  };
  supportOtherInformation: DraftField<string>;
  attachmentPageCount: DraftField<string>;
  signatureDate: DraftField<string>;
  typePrintName: DraftField<string>;
}

export interface DraftFl140Section {
  includeForm: DraftField<boolean>;
  declarantRole: DraftField<'petitioner' | 'respondent'>;
  disclosureType: DraftField<'preliminary' | 'final'>;
  servedScheduleOrPropertyDeclaration: DraftField<boolean>;
  scheduleIncludesCommunityProperty: DraftField<boolean>;
  scheduleIncludesSeparateProperty: DraftField<boolean>;
  servedIncomeExpenseDeclaration: DraftField<boolean>;
  servedTaxReturns: DraftField<boolean>;
  noTaxReturnsFiled: DraftField<boolean>;
  materialFactsStatement: DraftField<string>;
  servedObligationsStatement: DraftField<boolean>;
  obligationsStatement: DraftField<string>;
  servedInvestmentOpportunityStatement: DraftField<boolean>;
  investmentOpportunityStatement: DraftField<string>;
  signatureDate: DraftField<string>;
  typePrintName: DraftField<string>;
}

export interface DraftFl141Section {
  includeForm: DraftField<boolean>;
  disclosureType: DraftField<'preliminary' | 'final'>;
  servingParty: DraftField<'petitioner' | 'respondent'>;
  servedOnParty: DraftField<'petitioner' | 'respondent'>;
  serviceMethod: DraftField<'personal' | 'mail'>;
  serviceDate: DraftField<string>;
  otherDocuments: DraftField<string>;
  waiveFinalDeclaration: DraftField<boolean>;
  finalIncomeExpenseServed: DraftField<boolean>;
  waiveReceipt: DraftField<boolean>;
  signatureDate: DraftField<string>;
  typePrintName: DraftField<string>;
}

export interface DraftFl142AssetRow {
  description: DraftField<string>;
  separateProperty: DraftField<string>;
  dateAcquired: DraftField<string>;
  grossValue: DraftField<string>;
  amountOwed: DraftField<string>;
}

export interface DraftFl142DebtRow {
  description: DraftField<string>;
  separateProperty: DraftField<string>;
  totalOwing: DraftField<string>;
  dateAcquired: DraftField<string>;
}

export interface DraftFl142Section {
  includeForm: DraftField<boolean>;
  partyRole: DraftField<'petitioner' | 'respondent'>;
  assets: Record<string, DraftFl142AssetRow>;
  debts: Record<string, DraftFl142DebtRow>;
  assetTotalGrossValue: DraftField<string>;
  assetTotalAmountOwed: DraftField<string>;
  debtTotalOwing: DraftField<string>;
  continuationPagesAttached: DraftField<string>;
  signatureDate: DraftField<string>;
  typePrintName: DraftField<string>;
}

export interface DraftFl117Section {
  includeForm: DraftField<boolean>;
  personServedName: DraftField<string>;
  dateMailed: DraftField<string>;
  petitionerPrintedName: DraftField<string>;
  acknowledgmentDateSigned: DraftField<string>;
  acknowledgmentPrintedName: DraftField<string>;
}

export type DraftFl115ServiceMethod = 'personal' | 'mail_acknowledgment';

export interface DraftFl115Section {
  includeForm: DraftField<boolean>;
  serviceMethod: DraftField<DraftFl115ServiceMethod>;
  addressWhereServed: DraftField<string>;
  serviceDate: DraftField<string>;
  serviceTime: DraftField<string>;
  dateMailed: DraftField<string>;
  cityMailedFrom: DraftField<string>;
  serverName: DraftField<string>;
  serverAddress: DraftField<string>;
  serverPhone: DraftField<string>;
  signatureDate: DraftField<string>;
}

export interface DraftFl120Section {
  includeForm: DraftField<boolean>;
  denyPetitionGrounds: DraftField<boolean>;
  respondentPrintedName: DraftField<string>;
  signatureDate: DraftField<string>;
}

export interface DraftFl160Section {
  includeForm: DraftField<boolean>;
  partyRole: DraftField<'petitioner' | 'respondent'>;
  propertyType: DraftField<'community' | 'separate'>;
  itemDescription: DraftField<string>;
  dateAcquired: DraftField<string>;
  grossFairMarketValue: DraftField<string>;
  debtAmount: DraftField<string>;
  netFairMarketValue: DraftField<string>;
  proposedAwardPetitioner: DraftField<string>;
  proposedAwardRespondent: DraftField<string>;
  signatureDate: DraftField<string>;
  typePrintName: DraftField<string>;
}

export interface DraftFl342Section {
  includeForm: DraftField<boolean>;
  attachTo: DraftField<'fl300' | 'fl340' | 'fl350' | 'fl355' | 'judgment' | 'other'>;
  attachToOther: DraftField<string>;
  petitionerGrossIncome: DraftField<string>;
  petitionerNetIncome: DraftField<string>;
  respondentGrossIncome: DraftField<string>;
  respondentNetIncome: DraftField<string>;
  otherPartyGrossIncome: DraftField<string>;
  otherPartyNetIncome: DraftField<string>;
  baseMonthlyChildSupport: DraftField<string>;
  childCareCosts: DraftField<string>;
  healthCareCosts: DraftField<string>;
  otherAddOnCosts: DraftField<string>;
  paymentStartDate: DraftField<string>;
  payableTo: DraftField<string>;
  guidelineTotal: DraftField<string>;
  otherOrders: DraftField<string>;
}

export interface DraftFl343Section {
  includeForm: DraftField<boolean>;
  supportType: DraftField<'spousal' | 'domestic_partner' | 'family'>;
  payor: DraftField<'petitioner' | 'respondent'>;
  payee: DraftField<'petitioner' | 'respondent'>;
  monthlyAmount: DraftField<string>;
  paymentStartDate: DraftField<string>;
  paymentEndDate: DraftField<string>;
  paymentFrequency: DraftField<'monthly' | 'twice_monthly' | 'biweekly' | 'weekly' | 'other'>;
  frequencyOther: DraftField<string>;
  wageAssignment: DraftField<boolean>;
  terminateOnDeathOrRemarriage: DraftField<boolean>;
  otherOrders: DraftField<string>;
}

export interface DraftFl130Section {
  includeForm: DraftField<boolean>;
  appearanceBy: DraftField<'petitioner' | 'respondent' | 'both'>;
  agreementSummary: DraftField<string>;
  petitionerSignatureDate: DraftField<string>;
  petitionerPrintedName: DraftField<string>;
  respondentSignatureDate: DraftField<string>;
  respondentPrintedName: DraftField<string>;
}

export interface DraftFl144Section {
  includeForm: DraftField<boolean>;
  thirdPartyName: DraftField<string>;
  stipulationText: DraftField<string>;
  signatureDate: DraftField<string>;
  petitionerPrintedName: DraftField<string>;
  respondentPrintedName: DraftField<string>;
}

export interface DraftFl170Section {
  includeForm: DraftField<boolean>;
  isDefaultOrUncontested: DraftField<boolean>;
  agreementDate: DraftField<string>;
  declarationText: DraftField<string>;
  signatureDate: DraftField<string>;
  printedName: DraftField<string>;
}

export interface DraftFl180Section {
  includeForm: DraftField<boolean>;
  judgmentType: DraftField<'dissolution' | 'legal_separation' | 'nullity'>;
  statusTerminationDate: DraftField<string>;
  judgmentEnteredDate: DraftField<string>;
  agreementDate: DraftField<string>;
  propertyDebtOrders: DraftField<string>;
  childSupportAmount: DraftField<string>;
  spousalSupportAmount: DraftField<string>;
}

export interface DraftFl190Section {
  includeForm: DraftField<boolean>;
  noticeDate: DraftField<string>;
  judgmentEnteredDate: DraftField<string>;
  noticeText: DraftField<string>;
  clerkMailingDate: DraftField<string>;
}

export interface DraftFl345Section {
  includeForm: DraftField<boolean>;
  attachTo: DraftField<'fl180' | 'other'>;
  attachToOther: DraftField<string>;
  propertyAwardSummary: DraftField<string>;
  debtAllocationSummary: DraftField<string>;
  equalizationPayment: DraftField<string>;
  otherOrders: DraftField<string>;
}

export interface DraftFl348Section {
  includeForm: DraftField<boolean>;
  employeePartyName: DraftField<string>;
  retirementPlanName: DraftField<string>;
  claimantPartyName: DraftField<string>;
  orderSummary: DraftField<string>;
  signatureDate: DraftField<string>;
}


export type DraftRemainingFlFormId = 'fl165' | 'fl182' | 'fl191' | 'fl195' | 'fl272' | 'fl342a' | 'fl346' | 'fl347' | 'fl435' | 'fl460' | 'fl830';
export type DraftDvFormId = 'dv100' | 'dv101' | 'dv105' | 'dv108' | 'dv109' | 'dv110' | 'dv120' | 'dv130' | 'dv140' | 'dv200';

export interface DraftRemainingFlFormSection {
  includeForm: DraftField<boolean>;
  primaryParty: DraftField<'petitioner' | 'respondent' | 'both' | 'other'>;
  attachTo: DraftField<'fl180' | 'fl300' | 'fl340' | 'fl350' | 'fl355' | 'other'>;
  amount: DraftField<string>;
  date: DraftField<string>;
  otherPartyName: DraftField<string>;
  details: DraftField<string>;
  signatureDate: DraftField<string>;
  printedName: DraftField<string>;
}

export interface DraftDvFormSection {
  includeForm: DraftField<boolean>;
  protectedPartyName: DraftField<string>;
  restrainedPartyName: DraftField<string>;
  relationship: DraftField<string>;
  restrainedPersonDescription: DraftField<string>;
  otherProtectedPeople: DraftField<string>;
  childNames: DraftField<string>;
  hearingDate: DraftField<string>;
  hearingTime: DraftField<string>;
  hearingDepartment: DraftField<string>;
  hearingRoom: DraftField<string>;
  serviceDate: DraftField<string>;
  serviceTime: DraftField<string>;
  servedByName: DraftField<string>;
  requestSummary: DraftField<string>;
  orderSummary: DraftField<string>;
  responseSummary: DraftField<string>;
  signatureDate: DraftField<string>;
  printedName: DraftField<string>;
}

export interface DraftFormsWorkspace {
  id: string;
  userId: string;
  title: string;
  packetType: 'starter_packet_v1';
  selectedPreset: DraftField<DraftPacketPresetId>;
  status: DraftWorkspaceStatus;
  createdAt: string;
  updatedAt: string;
  sourceSessionId?: string;
  sourceAssistantMessageId?: string;
  intake: {
    userRequest?: string;
    mariaSummary?: string;
    attachmentNames: string[];
    extractedFacts?: DraftIntakeFact[];
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
  petitionerFax: DraftField<string>;
  petitionerAttorneyOrPartyName: DraftField<string>;
  petitionerFirmName: DraftField<string>;
  petitionerStateBarNumber: DraftField<string>;
  petitionerAttorneyFor: DraftField<string>;
  respondentName: DraftField<string>;
  marriageDate: DraftField<string>;
  separationDate: DraftField<string>;
  hasMinorChildren: DraftField<boolean>;
  children: DraftChild[];
  fl100: DraftFl100Section;
  fl110: { includeForm: DraftField<boolean> };
  fl300: DraftFl300Section;
  fl140: DraftFl140Section;
  fl141: DraftFl141Section;
  fl142: DraftFl142Section;
  fl115: DraftFl115Section;
  fl117: DraftFl117Section;
  fl120: DraftFl120Section;
  fl160: DraftFl160Section;
  fl342: DraftFl342Section;
  fl343: DraftFl343Section;
  fl130: DraftFl130Section;
  fl144: DraftFl144Section;
  fl170: DraftFl170Section;
  fl180: DraftFl180Section;
  fl190: DraftFl190Section;
  fl345: DraftFl345Section;
  fl348: DraftFl348Section;
  fl165: DraftRemainingFlFormSection;
  fl182: DraftRemainingFlFormSection;
  fl191: DraftRemainingFlFormSection;
  fl195: DraftRemainingFlFormSection;
  fl272: DraftRemainingFlFormSection;
  fl342a: DraftRemainingFlFormSection;
  fl346: DraftRemainingFlFormSection;
  fl347: DraftRemainingFlFormSection;
  fl435: DraftRemainingFlFormSection;
  fl460: DraftRemainingFlFormSection;
  fl830: DraftRemainingFlFormSection;
  fw001: DraftRemainingFlFormSection;
  fw003: DraftRemainingFlFormSection;
  fw010: DraftRemainingFlFormSection;
  dv100: DraftDvFormSection;
  dv101: DraftDvFormSection;
  dv105: DraftDvFormSection;
  dv108: DraftDvFormSection;
  dv109: DraftDvFormSection;
  dv110: DraftDvFormSection;
  dv120: DraftDvFormSection;
  dv130: DraftDvFormSection;
  dv140: DraftDvFormSection;
  dv200: DraftDvFormSection;
  fl150: DraftFl150Section;
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

const FL100_SEPARATE_PROPERTY_VISIBLE_ROWS = 5;
const GENERATED_CHILD_ATTACHMENT_ENTRIES_PER_PAGE = 6;

function getGeneratedChildAttachmentPageCount(extraChildrenCount: number) {
  if (extraChildrenCount <= 0) return 0;
  return Math.ceil(extraChildrenCount / GENERATED_CHILD_ATTACHMENT_ENTRIES_PER_PAGE);
}

function hasFl105ProceedingData(entry: DraftFl105OtherProceeding) {
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

function hasFl105ResidenceHistoryData(entry: DraftFl105ResidenceHistoryEntry) {
  return [
    entry.fromDate.value,
    entry.toDate.value,
    entry.residence.value,
    entry.personAndAddress.value,
    entry.relationship.value,
  ].some((value) => value.trim().length > 0);
}

function getFl105AdditionalChildSectionCount(entries: DraftFl105AdditionalChildAttachment[]) {
  return entries.reduce((count, entry) => {
    if (entry.sameResidenceAsChildA.value) {
      return count + 1;
    }

    const historyRows = entry.residenceHistory.filter(hasFl105ResidenceHistoryData).length;
    return count + Math.max(Math.ceil(historyRows / FL105_FORM_CAPACITY.residenceHistoryRows), 1);
  }, 0);
}

function getFl105AdditionalChildAttachmentPageCount(entries: DraftFl105AdditionalChildAttachment[]) {
  const sectionCount = getFl105AdditionalChildSectionCount(entries);
  return sectionCount > 0 ? Math.ceil(sectionCount / 2) : 0;
}

function hasFl105OrderData(entry: DraftFl105RestrainingOrder) {
  return [
    entry.orderType.value,
    entry.county.value,
    entry.stateOrTribe.value,
    entry.caseNumber.value,
    entry.expirationDate.value,
  ].some((value) => value.trim().length > 0);
}

function hasFl105ClaimantData(entry: DraftFl105OtherClaimant) {
  return Boolean(
    entry.nameAndAddress.value.trim()
    || entry.childNames.value.trim()
    || entry.hasPhysicalCustody.value
    || entry.claimsCustodyRights.value
    || entry.claimsVisitationRights.value,
  );
}

function getFl105ProceedingOverflowCount(entries: DraftFl105OtherProceeding[]) {
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

function getFl105OrderOverflowCount(entries: DraftFl105RestrainingOrder[]) {
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

function getFl105ClaimantOverflowCount(entries: DraftFl105OtherClaimant[]) {
  return Math.max(entries.filter(hasFl105ClaimantData).length - FL105_FORM_CAPACITY.otherClaimantsRows, 0);
}

function getFl105ResidenceHistoryOverflowCount(entries: DraftFl105ResidenceHistoryEntry[]) {
  return Math.max(entries.filter(hasFl105ResidenceHistoryData).length - FL105_FORM_CAPACITY.residenceHistoryRows, 0);
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

async function requestFormDrafts<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'same-origin',
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Form draft request failed');
  }

  return payload as T;
}

function mergeWorkspaces(local: DraftFormsWorkspace[], remote: DraftFormsWorkspace[]) {
  const byId = new Map<string, DraftFormsWorkspace>();
  [...local, ...remote].forEach((workspace) => {
    const existing = byId.get(workspace.id);
    if (!existing || new Date(workspace.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
      byId.set(workspace.id, workspace);
    }
  });

  return Array.from(byId.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function syncDraftWorkspacesFromServer(userId: string) {
  const result = await requestFormDrafts<{ drafts: DraftFormsWorkspace[] }>({ action: 'form-drafts-list' });
  const remote = Array.isArray(result.drafts)
    ? result.drafts.filter((draft) => draft?.userId === userId).map((draft) => normalizeWorkspace(draft))
    : [];
  const merged = mergeWorkspaces(readWorkspaces().filter((workspace) => workspace.userId === userId), remote);
  const others = readWorkspaces().filter((workspace) => workspace.userId !== userId);
  writeWorkspaces([...merged, ...others]);
  return merged;
}

export async function saveDraftWorkspaceToServer(workspace: DraftFormsWorkspace) {
  const result = await requestFormDrafts<{ draft: DraftFormsWorkspace }>({
    action: 'form-drafts-save',
    workspace,
  });
  return normalizeWorkspace(result.draft);
}

function sanitizeHandoffMessage(message: ChatMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    draftContext: message.draftContext,
    timestamp: message.timestamp,
    attachments: message.attachments,
  };
}

export function cacheLatestDraftFormsChatHandoff(userId: string, messages: ChatMessage[], sessionId?: string) {
  const storage = getStorage();
  if (!storage || !userId || messages.length === 0) return;

  const cache: DraftFormsChatHandoffCache = {
    userId,
    sessionId,
    updatedAt: new Date().toISOString(),
    messages: messages.slice(-60).map(sanitizeHandoffMessage),
  };

  storage.setItem(FORM_DRAFTS_CHAT_HANDOFF_KEY, JSON.stringify(cache));
}

export function getLatestDraftFormsChatHandoff(userId: string): DraftFormsChatHandoffCache | null {
  const storage = getStorage();
  if (!storage || !userId) return null;

  try {
    const raw = storage.getItem(FORM_DRAFTS_CHAT_HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DraftFormsChatHandoffCache>;
    if (parsed.userId !== userId || !Array.isArray(parsed.messages)) return null;
    return {
      userId,
      sessionId: typeof parsed.sessionId === 'string' ? parsed.sessionId : undefined,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      messages: parsed.messages.filter(Boolean) as ChatMessage[],
    };
  } catch {
    return null;
  }
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

function createDefaultFl341HolidayRow(): DraftFl341CHolidayRow {
  return {
    enabled: createField(false, {
      sourceType: 'manual',
      sourceLabel: 'FL-341(C) explicit selection required',
      confidence: 'low',
      needsReview: true,
    }),
    yearPattern: createField('unspecified', {
      sourceType: 'manual',
      sourceLabel: 'FL-341(C) explicit year pattern required',
      confidence: 'low',
      needsReview: true,
    }),
    assignedTo: createField('unspecified', {
      sourceType: 'manual',
      sourceLabel: 'FL-341(C) explicit party assignment required',
      confidence: 'low',
      needsReview: true,
    }),
    times: createField('', { needsReview: false }),
  };
}

function createDefaultFl341DProvision(): DraftFl341DProvision {
  return {
    selected: createField(false, {
      sourceType: 'manual',
      sourceLabel: 'FL-341(D) explicit provision selection required',
      confidence: 'low',
      needsReview: true,
    }),
    details: createField('', { needsReview: false }),
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
    includeForm: createField(true, { sourceType: 'manual', sourceLabel: 'Default starter packet form', confidence: 'medium', needsReview: false }),
    proceedingType: createField('dissolution', {
      sourceType: 'manual',
      sourceLabel: 'Default starter packet assumption',
      confidence: 'medium',
      needsReview: true,
    }),
    isAmended: createField(false, {
      ...assumptionFieldConfig,
    }),
    relationshipType: createField('marriage', {
      sourceType: 'manual',
      sourceLabel: 'Default starter packet assumption',
      confidence: 'medium',
      needsReview: true,
    }),
    domesticPartnership: {
      establishment: createField('unspecified', {
        sourceType: 'manual',
        sourceLabel: 'Default FL-100 assumption',
        confidence: 'low',
        needsReview: true,
      }),
      californiaResidencyException: createField(false, {
        ...assumptionFieldConfig,
      }),
      sameSexMarriageJurisdictionException: createField(false, {
        ...assumptionFieldConfig,
      }),
      registrationDate: createField('', { needsReview: true }),
      partnerSeparationDate: createField('', { needsReview: true }),
    },
    nullity: {
      basedOnIncest: createField(false, { ...assumptionFieldConfig }),
      basedOnBigamy: createField(false, { ...assumptionFieldConfig }),
      basedOnAge: createField(false, { ...assumptionFieldConfig }),
      basedOnPriorExistingMarriageOrPartnership: createField(false, { ...assumptionFieldConfig }),
      basedOnUnsoundMind: createField(false, { ...assumptionFieldConfig }),
      basedOnFraud: createField(false, { ...assumptionFieldConfig }),
      basedOnForce: createField(false, { ...assumptionFieldConfig }),
      basedOnPhysicalIncapacity: createField(false, { ...assumptionFieldConfig }),
    },
    residency: {
      petitionerCaliforniaMonths: createField('', { needsReview: true }),
      petitionerCountyMonths: createField('', { needsReview: true }),
      petitionerResidenceLocation: createField('', { needsReview: true }),
      respondentCaliforniaMonths: createField('', { needsReview: true }),
      respondentCountyMonths: createField('', { needsReview: true }),
      respondentResidenceLocation: createField('', { needsReview: true }),
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
      communityAndQuasiCommunityWhereListed: createField('unspecified', {
        ...assumptionFieldConfig,
      }),
      communityAndQuasiCommunityDetails: createField('', { needsReview: true }),
      separateProperty: createField(false, {
        ...assumptionFieldConfig,
      }),
      separatePropertyWhereListed: createField('unspecified', {
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
      terminateJurisdictionFor: createField('none', {
        ...assumptionFieldConfig,
      }),
      details: createField('', { needsReview: true }),
      voluntaryDeclarationOfParentageSigned: createField(false, {
        ...assumptionFieldConfig,
      }),
    },
    childSupport: {
      requestAdditionalOrders: createField(false, {
        ...assumptionFieldConfig,
      }),
      additionalOrdersDetails: createField('', { needsReview: true }),
    },
    minorChildren: {
      hasUnbornChild: createField(false, { ...assumptionFieldConfig }),
      detailsOnAttachment4b: createField(false, { ...assumptionFieldConfig }),
    },
    childCustodyVisitation: {
      legalCustodyTo: createField('none', {
        ...assumptionFieldConfig,
      }),
      physicalCustodyTo: createField('none', {
        ...assumptionFieldConfig,
      }),
      visitationTo: createField('none', {
        ...assumptionFieldConfig,
      }),
      fl311: {
        filingPartyOtherName: createField('', { needsReview: false }),
        visitationPlanMode: createField('unspecified', {
          sourceType: 'manual',
          sourceLabel: 'FL-311 requires explicit visitation-plan choice',
          confidence: 'low',
          needsReview: true,
        }),
        visitationAttachmentPageCount: createField('', { needsReview: false }),
        visitationAttachmentDate: createField('', { needsReview: false }),
      },
      fl312: {
        filingPartyOtherName: createField('', { needsReview: false }),
        requestingPartyName: createField('', { needsReview: true }),
        abductionBy: {
          petitioner: createField(false, { ...assumptionFieldConfig }),
          respondent: createField(false, { ...assumptionFieldConfig }),
          otherParentParty: createField(false, { ...assumptionFieldConfig }),
        },
        riskDestinations: {
          anotherCaliforniaCounty: createField(false, { ...assumptionFieldConfig }),
          anotherCaliforniaCountyName: createField('', { needsReview: false }),
          anotherState: createField(false, { ...assumptionFieldConfig }),
          anotherStateName: createField('', { needsReview: false }),
          foreignCountry: createField(false, { ...assumptionFieldConfig }),
          foreignCountryName: createField('', { needsReview: false }),
          foreignCountryCitizen: createField(false, { ...assumptionFieldConfig }),
          foreignCountryHasTies: createField(false, { ...assumptionFieldConfig }),
          foreignCountryTiesDetails: createField('', { needsReview: false }),
        },
        riskFactors: {
          custodyOrderViolationThreat: createField(false, { ...assumptionFieldConfig }),
          custodyOrderViolationThreatDetails: createField('', { needsReview: false }),
          weakCaliforniaTies: createField(false, { ...assumptionFieldConfig }),
          weakCaliforniaTiesDetails: createField('', { needsReview: false }),
          recentAbductionPlanningActions: createField(false, { ...assumptionFieldConfig }),
          recentActionQuitJob: createField(false, { ...assumptionFieldConfig }),
          recentActionSoldHome: createField(false, { ...assumptionFieldConfig }),
          recentActionClosedBankAccount: createField(false, { ...assumptionFieldConfig }),
          recentActionEndedLease: createField(false, { ...assumptionFieldConfig }),
          recentActionSoldAssets: createField(false, { ...assumptionFieldConfig }),
          recentActionHidOrDestroyedDocuments: createField(false, { ...assumptionFieldConfig }),
          recentActionAppliedForTravelDocuments: createField(false, { ...assumptionFieldConfig }),
          recentActionOther: createField(false, { ...assumptionFieldConfig }),
          recentActionOtherDetails: createField('', { needsReview: false }),
          historyOfRiskBehaviors: createField(false, { ...assumptionFieldConfig }),
          historyDomesticViolence: createField(false, { ...assumptionFieldConfig }),
          historyChildAbuse: createField(false, { ...assumptionFieldConfig }),
          historyParentingNonCooperation: createField(false, { ...assumptionFieldConfig }),
          historyChildTakingWithoutPermission: createField(false, { ...assumptionFieldConfig }),
          historyDetails: createField('', { needsReview: false }),
          criminalRecord: createField(false, { ...assumptionFieldConfig }),
          criminalRecordDetails: createField('', { needsReview: false }),
        },
        requestedOrdersAgainst: {
          petitioner: createField(false, { ...assumptionFieldConfig }),
          respondent: createField(false, { ...assumptionFieldConfig }),
          otherParentParty: createField(false, { ...assumptionFieldConfig }),
        },
        requestedOrders: {
          supervisedVisitation: createField(false, { ...assumptionFieldConfig }),
          supervisedVisitationTermsMode: createField('unspecified', {
            sourceType: 'manual',
            sourceLabel: 'FL-312 supervised visitation terms require explicit choice',
            confidence: 'low',
            needsReview: true,
          }),
          supervisedVisitationTermsDetails: createField('', { needsReview: false }),
          postBond: createField(false, { ...assumptionFieldConfig }),
          postBondAmount: createField('', { needsReview: false }),
          noMoveWithoutWrittenPermissionOrCourtOrder: createField(false, { ...assumptionFieldConfig }),
          noTravelWithoutWrittenPermissionOrCourtOrder: createField(false, { ...assumptionFieldConfig }),
          travelRestrictionThisCounty: createField(false, { ...assumptionFieldConfig }),
          travelRestrictionCalifornia: createField(false, { ...assumptionFieldConfig }),
          travelRestrictionUnitedStates: createField(false, { ...assumptionFieldConfig }),
          travelRestrictionOther: createField(false, { ...assumptionFieldConfig }),
          travelRestrictionOtherDetails: createField('', { needsReview: false }),
          registerOrderInOtherState: createField(false, { ...assumptionFieldConfig }),
          registerOrderStateName: createField('', { needsReview: false }),
          turnInPassportsAndTravelDocuments: createField(false, { ...assumptionFieldConfig }),
          doNotApplyForNewPassportsOrDocuments: createField(false, { ...assumptionFieldConfig }),
          provideTravelItinerary: createField(false, { ...assumptionFieldConfig }),
          provideRoundTripAirlineTickets: createField(false, { ...assumptionFieldConfig }),
          provideAddressesAndTelephone: createField(false, { ...assumptionFieldConfig }),
          provideOpenReturnTicketForRequestingParty: createField(false, { ...assumptionFieldConfig }),
          provideOtherTravelDocuments: createField(false, { ...assumptionFieldConfig }),
          provideOtherTravelDocumentsDetails: createField('', { needsReview: false }),
          notifyForeignEmbassyOrConsulate: createField(false, { ...assumptionFieldConfig }),
          embassyOrConsulateCountry: createField('', { needsReview: false }),
          embassyNotificationWithinDays: createField('', { needsReview: false }),
          obtainForeignCustodyAndVisitationOrderBeforeTravel: createField(false, { ...assumptionFieldConfig }),
          otherOrdersRequested: createField(false, { ...assumptionFieldConfig }),
          otherOrdersDetails: createField('', { needsReview: false }),
        },
        signatureDate: createField('', { needsReview: true }),
      },
      fl341: {
        sourceOrder: createField('unspecified', {
          sourceType: 'manual',
          sourceLabel: 'FL-341 requires explicit source-order selection',
          confidence: 'low',
          needsReview: true,
        }),
        sourceOrderOtherText: createField('', { needsReview: false }),
        otherParentPartyName: createField('', { needsReview: false }),
        fl341a: {
          supervisedParty: {
            petitioner: createField(false, { ...assumptionFieldConfig }),
            respondent: createField(false, { ...assumptionFieldConfig }),
            otherParentParty: createField(false, { ...assumptionFieldConfig }),
          },
          supervisor: {
            type: createField('unspecified', {
              sourceType: 'manual',
              sourceLabel: 'FL-341(A) supervisor type requires explicit choice',
              confidence: 'low',
              needsReview: true,
            }),
            otherTypeText: createField('', { needsReview: false }),
            name: createField('', { needsReview: true }),
            contact: createField('', { needsReview: true }),
            feesPaidBy: createField('unspecified', {
              sourceType: 'manual',
              sourceLabel: 'FL-341(A) supervisor fee allocation requires explicit choice',
              confidence: 'low',
              needsReview: true,
            }),
            feesOtherText: createField('', { needsReview: false }),
          },
          schedule: {
            mode: createField('unspecified', {
              sourceType: 'manual',
              sourceLabel: 'FL-341(A) schedule mode requires explicit choice',
              confidence: 'low',
              needsReview: true,
            }),
            attachmentPageCount: createField('', { needsReview: false }),
            text: createField('', { needsReview: false }),
          },
          restrictions: createField('', { needsReview: false }),
          otherTerms: createField('', { needsReview: false }),
        },
        fl341b: {
          restrainedPartyName: createField('', { needsReview: true }),
          risk: {
            violatedPastOrders: createField(false, { ...assumptionFieldConfig }),
            noStrongCaliforniaTies: createField(false, { ...assumptionFieldConfig }),
            preparationActions: {
              selected: createField(false, { ...assumptionFieldConfig }),
              quitJob: createField(false, { ...assumptionFieldConfig }),
              soldHome: createField(false, { ...assumptionFieldConfig }),
              closedBankAccount: createField(false, { ...assumptionFieldConfig }),
              endedLease: createField(false, { ...assumptionFieldConfig }),
              soldAssets: createField(false, { ...assumptionFieldConfig }),
              hiddenOrDestroyedDocuments: createField(false, { ...assumptionFieldConfig }),
              appliedForPassport: createField(false, { ...assumptionFieldConfig }),
              other: createField(false, { ...assumptionFieldConfig }),
              otherDetails: createField('', { needsReview: false }),
            },
            history: {
              selected: createField(false, { ...assumptionFieldConfig }),
              domesticViolence: createField(false, { ...assumptionFieldConfig }),
              childAbuse: createField(false, { ...assumptionFieldConfig }),
              nonCooperation: createField(false, { ...assumptionFieldConfig }),
            },
            criminalRecord: createField(false, { ...assumptionFieldConfig }),
            tiesToOtherJurisdiction: createField(false, { ...assumptionFieldConfig }),
          },
          orders: {
            supervisedVisitation: createField(false, { ...assumptionFieldConfig }),
            supervisedVisitationTermsMode: createField('unspecified', {
              sourceType: 'manual',
              sourceLabel: 'FL-341(B) supervised-visitation terms require explicit choice',
              confidence: 'low',
              needsReview: true,
            }),
            supervisedVisitationTermsDetails: createField('', { needsReview: false }),
            postBond: createField(false, { ...assumptionFieldConfig }),
            postBondAmount: createField('', { needsReview: false }),
            postBondTerms: createField('', { needsReview: false }),
            noMoveWithoutPermission: createField(false, { ...assumptionFieldConfig }),
            noMoveCurrentResidence: createField(false, { ...assumptionFieldConfig }),
            noMoveCurrentSchoolDistrict: createField(false, { ...assumptionFieldConfig }),
            noMoveOtherPlace: createField(false, { ...assumptionFieldConfig }),
            noMoveOtherPlaceDetails: createField('', { needsReview: false }),
            noTravelWithoutPermission: createField(false, { ...assumptionFieldConfig }),
            travelRestrictionThisCounty: createField(false, { ...assumptionFieldConfig }),
            travelRestrictionCalifornia: createField(false, { ...assumptionFieldConfig }),
            travelRestrictionUnitedStates: createField(false, { ...assumptionFieldConfig }),
            travelRestrictionOther: createField(false, { ...assumptionFieldConfig }),
            travelRestrictionOtherDetails: createField('', { needsReview: false }),
            registerInOtherState: createField(false, { ...assumptionFieldConfig }),
            registerInOtherStateName: createField('', { needsReview: false }),
            noPassportApplications: createField(false, { ...assumptionFieldConfig }),
            turnInPassportsAndVitalDocs: createField(false, { ...assumptionFieldConfig }),
            turnInPassportsAndVitalDocsList: createField('', { needsReview: false }),
            provideTravelInfo: createField(false, { ...assumptionFieldConfig }),
            provideTravelItinerary: createField(false, { ...assumptionFieldConfig }),
            provideRoundTripTickets: createField(false, { ...assumptionFieldConfig }),
            provideAddressesAndTelephone: createField(false, { ...assumptionFieldConfig }),
            provideOpenReturnTicket: createField(false, { ...assumptionFieldConfig }),
            provideOtherTravelInfo: createField(false, { ...assumptionFieldConfig }),
            provideOtherTravelInfoDetails: createField('', { needsReview: false }),
            notifyEmbassyOrConsulate: createField(false, { ...assumptionFieldConfig }),
            notifyEmbassyCountry: createField('', { needsReview: false }),
            notifyEmbassyWithinDays: createField('', { needsReview: false }),
            obtainForeignOrderBeforeTravel: createField(false, { ...assumptionFieldConfig }),
            enforceOrder: createField(false, { ...assumptionFieldConfig }),
            enforceOrderContactInfo: createField('', { needsReview: false }),
            other: createField(false, { ...assumptionFieldConfig }),
            otherDetails: createField('', { needsReview: false }),
          },
        },
        fl341c: {
          holidayRows: {
            newYearsDay: createDefaultFl341HolidayRow(),
            springBreak: createDefaultFl341HolidayRow(),
            thanksgivingDay: createDefaultFl341HolidayRow(),
            winterBreak: createDefaultFl341HolidayRow(),
            childBirthday: createDefaultFl341HolidayRow(),
          },
          additionalHolidayNotes: createField('', { needsReview: false }),
          vacation: {
            assignedTo: createField('unspecified', {
              sourceType: 'manual',
              sourceLabel: 'FL-341(C) explicit vacation holder required',
              confidence: 'low',
              needsReview: true,
            }),
            maxDuration: createField('', { needsReview: false }),
            maxDurationUnit: createField('unspecified', {
              sourceType: 'manual',
              sourceLabel: 'FL-341(C) explicit vacation duration unit required when duration is entered',
              confidence: 'low',
              needsReview: true,
            }),
            timesPerYear: createField('', { needsReview: false }),
            noticeDays: createField('', { needsReview: false }),
            responseDays: createField('', { needsReview: false }),
            allowOutsideCalifornia: createField(false, { ...assumptionFieldConfig }),
            allowOutsideUnitedStates: createField(false, { ...assumptionFieldConfig }),
            otherTerms: createField('', { needsReview: false }),
          },
        },
        fl341d: {
          provisions: {
            exchangeSchedule: createDefaultFl341DProvision(),
            transportation: createDefaultFl341DProvision(),
            makeupTime: createDefaultFl341DProvision(),
            communication: createDefaultFl341DProvision(),
            rightOfFirstRefusal: createDefaultFl341DProvision(),
            temporaryChangesByAgreement: createDefaultFl341DProvision(),
            other: createDefaultFl341DProvision(),
          },
        },
        fl341e: {
          orderJointLegalCustody: createField(false, {
            sourceType: 'manual',
            sourceLabel: 'FL-341(E) requires explicit joint legal custody selection',
            confidence: 'low',
            needsReview: true,
          }),
          decisionMaking: {
            education: createField('unspecified', {
              sourceType: 'manual',
              sourceLabel: 'FL-341(E) education decision-maker requires explicit choice',
              confidence: 'low',
              needsReview: true,
            }),
            nonEmergencyHealthcare: createField('unspecified', {
              sourceType: 'manual',
              sourceLabel: 'FL-341(E) healthcare decision-maker requires explicit choice',
              confidence: 'low',
              needsReview: true,
            }),
            mentalHealth: createField('unspecified', {
              sourceType: 'manual',
              sourceLabel: 'FL-341(E) mental-health decision-maker requires explicit choice',
              confidence: 'low',
              needsReview: true,
            }),
            extracurricular: createField('unspecified', {
              sourceType: 'manual',
              sourceLabel: 'FL-341(E) extracurricular decision-maker requires explicit choice',
              confidence: 'low',
              needsReview: true,
            }),
          },
          terms: {
            recordsAccess: createField(false, { ...assumptionFieldConfig }),
            emergencyNotice: createField(false, { ...assumptionFieldConfig }),
            portalAccess: createField(false, { ...assumptionFieldConfig }),
            contactUpdates: createField(false, { ...assumptionFieldConfig }),
          },
          disputeResolution: {
            meetAndConfer: createField(false, { ...assumptionFieldConfig }),
            mediation: createField(false, { ...assumptionFieldConfig }),
            court: createField(false, { ...assumptionFieldConfig }),
            other: createField(false, { ...assumptionFieldConfig }),
            otherText: createField('', { needsReview: false }),
          },
          additionalTerms: createField('', { needsReview: false }),
        },
      },
      attachments: {
        formFl311: createField(false, { ...assumptionFieldConfig }),
        formFl312: createField(false, { ...assumptionFieldConfig }),
        formFl341a: createField(false, { ...assumptionFieldConfig }),
        formFl341b: createField(false, { ...assumptionFieldConfig }),
        formFl341c: createField(false, { ...assumptionFieldConfig }),
        formFl341d: createField(false, { ...assumptionFieldConfig }),
        formFl341e: createField(false, { ...assumptionFieldConfig }),
        attachment6c1: createField(false, { ...assumptionFieldConfig }),
      },
    },
    attorneyFeesAndCosts: {
      requestAward: createField(false, {
        ...assumptionFieldConfig,
      }),
      payableBy: createField('none', {
        ...assumptionFieldConfig,
      }),
    },
    otherRequests: {
      requestOtherRelief: createField(false, {
        ...assumptionFieldConfig,
      }),
      details: createField('', { needsReview: true }),
      continuedOnAttachment: createField(false, {
        ...assumptionFieldConfig,
      }),
    },
    signatureDate: createField('', { needsReview: true }),
    formerName: createField('', { needsReview: false }),
  };
}

function createDefaultFl300Section(petitionerName = ''): DraftFl300Section {
  const explicitRequired = {
    sourceType: 'manual' as const,
    sourceLabel: 'FL-300 explicit Draft Forms choice required',
    confidence: 'low' as const,
    needsReview: true,
  };

  return {
    includeForm: createField(false, explicitRequired),
    requestTypes: {
      childCustody: createField(false, explicitRequired),
      visitation: createField(false, explicitRequired),
      childSupport: createField(false, explicitRequired),
      spousalSupport: createField(false, explicitRequired),
      propertyControl: createField(false, explicitRequired),
      attorneyFeesCosts: createField(false, explicitRequired),
      other: createField(false, explicitRequired),
      changeModify: createField(false, explicitRequired),
      temporaryEmergencyOrders: createField(false, explicitRequired),
    },
    requestedAgainst: {
      petitioner: createField(false, explicitRequired),
      respondent: createField(false, explicitRequired),
      otherParentParty: createField(false, explicitRequired),
      other: createField(false, explicitRequired),
      otherName: createField('', { needsReview: false }),
    },
    hearing: {
      date: createField('', { needsReview: false }),
      time: createField('', { needsReview: false }),
      department: createField('', { needsReview: false }),
      room: createField('', { needsReview: false }),
      locationMode: createField('unspecified', explicitRequired),
      otherLocation: createField('', { needsReview: false }),
    },
    service: {
      timeShortened: createField(false, explicitRequired),
      serviceDate: createField('', { needsReview: false }),
      responsiveDeclarationDueDate: createField('', { needsReview: false }),
      courtDaysBeforeHearing: createField('', { needsReview: false }),
      orderShorterServiceReason: createField('', { needsReview: false }),
    },
    custodyMediation: {
      required: createField(false, explicitRequired),
      details: createField('', { needsReview: false }),
    },
    temporaryEmergencyFl305Applies: createField(false, explicitRequired),
    otherCourtOrders: createField('', { needsReview: false }),
    restrainingOrderInfo: {
      include: createField(false, explicitRequired),
      againstPetitioner: createField(false, explicitRequired),
      againstRespondent: createField(false, explicitRequired),
      againstOtherParentParty: createField(false, explicitRequired),
      criminalCountyState: createField('', { needsReview: false }),
      criminalCaseNumber: createField('', { needsReview: false }),
      familyCountyState: createField('', { needsReview: false }),
      familyCaseNumber: createField('', { needsReview: false }),
      juvenileCountyState: createField('', { needsReview: false }),
      juvenileCaseNumber: createField('', { needsReview: false }),
      otherCountyState: createField('', { needsReview: false }),
      otherCaseNumber: createField('', { needsReview: false }),
    },
    custodyRequests: {
      useChildRows: createField(false, explicitRequired),
      legalCustodyToText: createField('', { needsReview: false }),
      physicalCustodyToText: createField('', { needsReview: false }),
      useCustodyAttachments: createField(false, explicitRequired),
      useFl305: createField(false, explicitRequired),
      useFl311: createField(false, explicitRequired),
      useFl312: createField(false, explicitRequired),
      useFl341c: createField(false, explicitRequired),
      useFl341d: createField(false, explicitRequired),
      useFl341e: createField(false, explicitRequired),
      otherAttachmentText: createField('', { needsReview: false }),
      asFollowsText: createField('', { needsReview: false }),
      bestInterestReasons: createField('', { needsReview: false }),
      currentCustodyOrderDate: createField('', { needsReview: false }),
      currentCustodyOrderDetails: createField('', { needsReview: false }),
      currentVisitationOrderDate: createField('', { needsReview: false }),
      currentVisitationOrderDetails: createField('', { needsReview: false }),
    },
    supportRequests: {
      childSupportGuideline: createField(false, explicitRequired),
      childSupportMonthlyAmountText: createField('', { needsReview: false }),
      currentChildSupportOrderDate: createField('', { needsReview: false }),
      currentChildSupportOrderDetails: createField('', { needsReview: false }),
      childSupportChangeReasons: createField('', { needsReview: false }),
      spousalSupportAmount: createField('', { needsReview: false }),
      changeSpousalSupport: createField(false, explicitRequired),
      endSpousalSupport: createField(false, explicitRequired),
      currentSpousalSupportOrderDate: createField('', { needsReview: false }),
      currentSpousalSupportAmount: createField('', { needsReview: false }),
      spousalSupportChangeReasons: createField('', { needsReview: false }),
    },
    propertyControl: {
      temporaryEmergency: createField(false, explicitRequired),
      exclusiveUseTo: createField('unspecified', explicitRequired),
      propertyDescription: createField('', { needsReview: false }),
      ownedOrBuying: createField(false, explicitRequired),
      leasedOrRented: createField(false, explicitRequired),
      debtPaymentBy: createField('unspecified', explicitRequired),
      debtPayTo: createField('', { needsReview: false }),
      debtFor: createField('', { needsReview: false }),
      debtAmount: createField('', { needsReview: false }),
      debtDueDate: createField('', { needsReview: false }),
      currentOrderDate: createField('', { needsReview: false }),
    },
    attorneyFees: {
      amount: createField('', { needsReview: false }),
      includeFl319: createField(false, explicitRequired),
      feesRequestedAmount: createField('', { needsReview: false }),
      costsRequestedAmount: createField('', { needsReview: false }),
      incurredToDateAmount: createField('', { needsReview: false }),
      estimatedFutureAmount: createField('', { needsReview: false }),
      limitedScopeAmount: createField('', { needsReview: false }),
      paymentRequestedFrom: createField('unspecified', explicitRequired),
      paymentRequestedFromOtherName: createField('', { needsReview: false }),
      priorFeeOrderExists: createField('unspecified', explicitRequired),
      priorFeeOrderPayor: createField('unspecified', explicitRequired),
      priorFeeOrderAmount: createField('', { needsReview: false }),
      priorFeeOrderDate: createField('', { needsReview: false }),
      paymentSources: createField('', { needsReview: false }),
      priorPaymentsStatus: createField('unspecified', explicitRequired),
      additionalInformation: createField('', { needsReview: false }),
      freeLegalServices: createField(false, explicitRequired),
      pagesAttached: createField('', { needsReview: false }),
    },
    otherOrdersRequested: createField('', { needsReview: false }),
    facts: createField('', { needsReview: true }),
    signatureDate: createField('', { needsReview: true }),
    typePrintName: createField(petitionerName, {
      sourceType: petitionerName ? 'profile' : undefined,
      sourceLabel: petitionerName ? 'Account profile' : undefined,
      confidence: petitionerName ? 'high' : undefined,
      needsReview: petitionerName.length === 0,
    }),
  };
}

function createDefaultFl150AmountPair(): DraftFl150AmountPair {
  return {
    lastMonth: createField('', { needsReview: false }),
    averageMonthly: createField('', { needsReview: false }),
  };
}

function createDefaultFl140Section(petitionerName = ''): DraftFl140Section {
  const explicitRequired = {
    sourceType: 'manual' as const,
    sourceLabel: 'FL-140 explicit Draft Forms data required',
    confidence: 'low' as const,
    needsReview: true,
  };

  return {
    includeForm: createField(false, explicitRequired),
    declarantRole: createField('petitioner', explicitRequired),
    disclosureType: createField('preliminary', explicitRequired),
    servedScheduleOrPropertyDeclaration: createField(true, explicitRequired),
    scheduleIncludesCommunityProperty: createField(true, explicitRequired),
    scheduleIncludesSeparateProperty: createField(true, explicitRequired),
    servedIncomeExpenseDeclaration: createField(false, explicitRequired),
    servedTaxReturns: createField(true, explicitRequired),
    noTaxReturnsFiled: createField(false, explicitRequired),
    materialFactsStatement: createField('Included with disclosure packet.', { needsReview: true }),
    servedObligationsStatement: createField(true, explicitRequired),
    obligationsStatement: createField('Included with disclosure packet.', { needsReview: true }),
    servedInvestmentOpportunityStatement: createField(true, explicitRequired),
    investmentOpportunityStatement: createField('Included with disclosure packet.', { needsReview: true }),
    signatureDate: createField('', { needsReview: true }),
    typePrintName: createField(petitionerName, { needsReview: true }),
  };
}

function createDefaultFl141Section(petitionerName = ''): DraftFl141Section {
  const explicitRequired = {
    sourceType: 'manual' as const,
    sourceLabel: 'FL-141 explicit Draft Forms data required',
    confidence: 'low' as const,
    needsReview: true,
  };

  return {
    includeForm: createField(false, explicitRequired),
    disclosureType: createField('preliminary', explicitRequired),
    servingParty: createField('petitioner', explicitRequired),
    servedOnParty: createField('respondent', explicitRequired),
    serviceMethod: createField('mail', explicitRequired),
    serviceDate: createField('', { needsReview: true }),
    otherDocuments: createField('', { needsReview: false }),
    waiveFinalDeclaration: createField(false, explicitRequired),
    finalIncomeExpenseServed: createField(false, explicitRequired),
    waiveReceipt: createField(false, explicitRequired),
    signatureDate: createField('', { needsReview: true }),
    typePrintName: createField(petitionerName, { needsReview: true }),
  };
}

function createDefaultFl142AssetRow(): DraftFl142AssetRow {
  return {
    description: createField('', { needsReview: false }),
    separateProperty: createField('', { needsReview: false }),
    dateAcquired: createField('', { needsReview: false }),
    grossValue: createField('', { needsReview: false }),
    amountOwed: createField('', { needsReview: false }),
  };
}

function createDefaultFl142DebtRow(): DraftFl142DebtRow {
  return {
    description: createField('', { needsReview: false }),
    separateProperty: createField('', { needsReview: false }),
    totalOwing: createField('', { needsReview: false }),
    dateAcquired: createField('', { needsReview: false }),
  };
}

function createDefaultFl142Section(petitionerName = ''): DraftFl142Section {
  const explicitRequired = {
    sourceType: 'manual' as const,
    sourceLabel: 'FL-142 explicit Draft Forms data required',
    confidence: 'low' as const,
    needsReview: true,
  };
  const assetKeys = ['realEstate', 'household', 'jewelryArt', 'vehicles', 'savings', 'checking', 'creditUnion', 'cash', 'taxRefund', 'lifeInsurance', 'stocksBonds', 'retirement', 'profitSharingIra', 'accountsReceivable', 'businessInterests', 'otherAssets'];
  const debtKeys = ['studentLoans', 'taxes', 'supportArrearages', 'unsecuredLoans', 'creditCards', 'otherDebts'];

  return {
    includeForm: createField(false, explicitRequired),
    partyRole: createField('petitioner', explicitRequired),
    assets: Object.fromEntries(assetKeys.map((key) => [key, createDefaultFl142AssetRow()])),
    debts: Object.fromEntries(debtKeys.map((key) => [key, createDefaultFl142DebtRow()])),
    assetTotalGrossValue: createField('', { needsReview: false }),
    assetTotalAmountOwed: createField('', { needsReview: false }),
    debtTotalOwing: createField('', { needsReview: false }),
    continuationPagesAttached: createField('', { needsReview: false }),
    signatureDate: createField('', { needsReview: true }),
    typePrintName: createField(petitionerName, { needsReview: true }),
  };
}

function createDefaultFl117Section(petitionerName = '', respondentName = ''): DraftFl117Section {
  const explicitRequired = {
    sourceType: 'manual' as const,
    sourceLabel: 'FL-117 explicit Draft Forms data required',
    confidence: 'low' as const,
    needsReview: true,
  };

  return {
    includeForm: createField(false, explicitRequired),
    personServedName: createField(respondentName, { needsReview: true }),
    dateMailed: createField('', { needsReview: true }),
    petitionerPrintedName: createField(petitionerName, { needsReview: true }),
    acknowledgmentDateSigned: createField('', { needsReview: false }),
    acknowledgmentPrintedName: createField('', { needsReview: false }),
  };
}


function createDefaultFl115Section(): DraftFl115Section {
  const explicitRequired = {
    sourceType: 'manual' as const,
    sourceLabel: 'FL-115 explicit Draft Forms data required',
    confidence: 'low' as const,
    needsReview: true,
  };
  return {
    includeForm: createField(false, explicitRequired),
    serviceMethod: createField('personal', explicitRequired),
    addressWhereServed: createField('', explicitRequired),
    serviceDate: createField('', explicitRequired),
    serviceTime: createField('', { needsReview: false }),
    dateMailed: createField('', { needsReview: false }),
    cityMailedFrom: createField('', { needsReview: false }),
    serverName: createField('', explicitRequired),
    serverAddress: createField('', explicitRequired),
    serverPhone: createField('', { needsReview: false }),
    signatureDate: createField('', explicitRequired),
  };
}

function createDefaultFl120Section(respondentName = ''): DraftFl120Section {
  const explicitRequired = {
    sourceType: 'manual' as const,
    sourceLabel: 'FL-120 explicit Draft Forms data required',
    confidence: 'low' as const,
    needsReview: true,
  };
  return {
    includeForm: createField(false, explicitRequired),
    denyPetitionGrounds: createField(false, { needsReview: false }),
    respondentPrintedName: createField(respondentName, { needsReview: respondentName.length === 0 }),
    signatureDate: createField('', explicitRequired),
  };
}

function createDefaultFl160Section(petitionerName = ''): DraftFl160Section {
  const explicitRequired = {
    sourceType: 'manual' as const,
    sourceLabel: 'FL-160 explicit Draft Forms data required',
    confidence: 'low' as const,
    needsReview: true,
  };
  return {
    includeForm: createField(false, explicitRequired),
    partyRole: createField('petitioner', explicitRequired),
    propertyType: createField('community', explicitRequired),
    itemDescription: createField('', explicitRequired),
    dateAcquired: createField('', { needsReview: false }),
    grossFairMarketValue: createField('', explicitRequired),
    debtAmount: createField('', { needsReview: false }),
    netFairMarketValue: createField('', { needsReview: false }),
    proposedAwardPetitioner: createField('', { needsReview: false }),
    proposedAwardRespondent: createField('', { needsReview: false }),
    signatureDate: createField('', explicitRequired),
    typePrintName: createField(petitionerName, { needsReview: petitionerName.length === 0 }),
  };
}

function createDefaultFl342Section(): DraftFl342Section {
  const explicitRequired = {
    sourceType: 'manual' as const,
    sourceLabel: 'FL-342 explicit Draft Forms data required',
    confidence: 'low' as const,
    needsReview: true,
  };
  return {
    includeForm: createField(false, explicitRequired),
    attachTo: createField('fl300', explicitRequired),
    attachToOther: createField('', { needsReview: false }),
    petitionerGrossIncome: createField('', { needsReview: false }),
    petitionerNetIncome: createField('', { needsReview: false }),
    respondentGrossIncome: createField('', { needsReview: false }),
    respondentNetIncome: createField('', { needsReview: false }),
    otherPartyGrossIncome: createField('', { needsReview: false }),
    otherPartyNetIncome: createField('', { needsReview: false }),
    baseMonthlyChildSupport: createField('', explicitRequired),
    childCareCosts: createField('', { needsReview: false }),
    healthCareCosts: createField('', { needsReview: false }),
    otherAddOnCosts: createField('', { needsReview: false }),
    paymentStartDate: createField('', explicitRequired),
    payableTo: createField('', explicitRequired),
    guidelineTotal: createField('', { needsReview: false }),
    otherOrders: createField('', { needsReview: false }),
  };
}

function createDefaultFl343Section(): DraftFl343Section {
  const explicitRequired = {
    sourceType: 'manual' as const,
    sourceLabel: 'FL-343 explicit Draft Forms data required',
    confidence: 'low' as const,
    needsReview: true,
  };
  return {
    includeForm: createField(false, explicitRequired),
    supportType: createField('spousal', explicitRequired),
    payor: createField('respondent', explicitRequired),
    payee: createField('petitioner', explicitRequired),
    monthlyAmount: createField('', explicitRequired),
    paymentStartDate: createField('', explicitRequired),
    paymentEndDate: createField('', { needsReview: false }),
    paymentFrequency: createField('monthly', explicitRequired),
    frequencyOther: createField('', { needsReview: false }),
    wageAssignment: createField(false, { needsReview: false }),
    terminateOnDeathOrRemarriage: createField(true, { needsReview: false }),
    otherOrders: createField('', { needsReview: false }),
  };
}


function createJudgmentPropertyExplicitRequired(formName: string) {
  return {
    sourceType: 'manual' as const,
    sourceLabel: `${formName} explicit Draft Forms data required`,
    confidence: 'low' as const,
    needsReview: true,
  };
}

function createDefaultFl130Section(petitionerName = '', respondentName = ''): DraftFl130Section {
  const explicitRequired = createJudgmentPropertyExplicitRequired('FL-130');
  return {
    includeForm: createField(false, explicitRequired),
    appearanceBy: createField('respondent', explicitRequired),
    agreementSummary: createField('', { needsReview: false }),
    petitionerSignatureDate: createField('', { needsReview: false }),
    petitionerPrintedName: createField(petitionerName, { needsReview: petitionerName.length === 0 }),
    respondentSignatureDate: createField('', explicitRequired),
    respondentPrintedName: createField(respondentName, { needsReview: respondentName.length === 0 }),
  };
}

function createDefaultFl144Section(petitionerName = '', respondentName = ''): DraftFl144Section {
  const explicitRequired = createJudgmentPropertyExplicitRequired('FL-144');
  return {
    includeForm: createField(false, explicitRequired),
    thirdPartyName: createField('', { needsReview: false }),
    stipulationText: createField('The parties stipulate to waive final declarations of disclosure as permitted by Family Code section 2105(d).', explicitRequired),
    signatureDate: createField('', explicitRequired),
    petitionerPrintedName: createField(petitionerName, { needsReview: petitionerName.length === 0 }),
    respondentPrintedName: createField(respondentName, { needsReview: respondentName.length === 0 }),
  };
}

function createDefaultFl170Section(petitionerName = ''): DraftFl170Section {
  const explicitRequired = createJudgmentPropertyExplicitRequired('FL-170');
  return {
    includeForm: createField(false, explicitRequired),
    isDefaultOrUncontested: createField(true, explicitRequired),
    agreementDate: createField('', { needsReview: false }),
    declarationText: createField('', { needsReview: false }),
    signatureDate: createField('', explicitRequired),
    printedName: createField(petitionerName, { needsReview: petitionerName.length === 0 }),
  };
}

function createDefaultFl180Section(): DraftFl180Section {
  const explicitRequired = createJudgmentPropertyExplicitRequired('FL-180');
  return {
    includeForm: createField(false, explicitRequired),
    judgmentType: createField('dissolution', explicitRequired),
    statusTerminationDate: createField('', explicitRequired),
    judgmentEnteredDate: createField('', { needsReview: false }),
    agreementDate: createField('', { needsReview: false }),
    propertyDebtOrders: createField('', { needsReview: false }),
    childSupportAmount: createField('', { needsReview: false }),
    spousalSupportAmount: createField('', { needsReview: false }),
  };
}

function createDefaultFl190Section(): DraftFl190Section {
  const explicitRequired = createJudgmentPropertyExplicitRequired('FL-190');
  return {
    includeForm: createField(false, explicitRequired),
    noticeDate: createField('', explicitRequired),
    judgmentEnteredDate: createField('', { needsReview: false }),
    noticeText: createField('', { needsReview: false }),
    clerkMailingDate: createField('', { needsReview: false }),
  };
}

function createDefaultFl345Section(): DraftFl345Section {
  const explicitRequired = createJudgmentPropertyExplicitRequired('FL-345');
  return {
    includeForm: createField(false, explicitRequired),
    attachTo: createField('fl180', explicitRequired),
    attachToOther: createField('', { needsReview: false }),
    propertyAwardSummary: createField('', explicitRequired),
    debtAllocationSummary: createField('', { needsReview: false }),
    equalizationPayment: createField('', { needsReview: false }),
    otherOrders: createField('', { needsReview: false }),
  };
}

function createDefaultFl348Section(): DraftFl348Section {
  const explicitRequired = createJudgmentPropertyExplicitRequired('FL-348');
  return {
    includeForm: createField(false, explicitRequired),
    employeePartyName: createField('', explicitRequired),
    retirementPlanName: createField('', explicitRequired),
    claimantPartyName: createField('', { needsReview: false }),
    orderSummary: createField('', { needsReview: false }),
    signatureDate: createField('', { needsReview: false }),
  };
}


function createDefaultRemainingFlFormSection(formName: string, petitionerName = ''): DraftRemainingFlFormSection {
  const explicitRequired = createJudgmentPropertyExplicitRequired(formName);
  return {
    includeForm: createField(false, explicitRequired),
    primaryParty: createField('petitioner', explicitRequired),
    attachTo: createField('fl180', { needsReview: false }),
    amount: createField('', { needsReview: false }),
    date: createField('', { needsReview: false }),
    otherPartyName: createField('', { needsReview: false }),
    details: createField('', { needsReview: false }),
    signatureDate: createField('', { needsReview: false }),
    printedName: createField(petitionerName, { needsReview: petitionerName.length === 0 }),
  };
}

function createDefaultDvFormSection(formName: string, petitionerName = '', respondentName = ''): DraftDvFormSection {
  return {
    includeForm: createField(false, {
      sourceType: 'manual',
      sourceLabel: `Optional ${formName} toggle`,
      confidence: 'low',
      needsReview: false,
    }),
    protectedPartyName: createField(petitionerName, {
      sourceType: petitionerName ? 'profile' : undefined,
      sourceLabel: petitionerName ? 'Account profile' : undefined,
      confidence: petitionerName ? 'high' : undefined,
      needsReview: true,
    }),
    restrainedPartyName: createField(respondentName, {
      sourceType: respondentName ? 'chat' : undefined,
      sourceLabel: respondentName ? 'Maria chat intake' : undefined,
      confidence: respondentName ? 'low' : undefined,
      needsReview: true,
    }),
    relationship: createField('', { needsReview: true }),
    restrainedPersonDescription: createField('', { needsReview: false }),
    otherProtectedPeople: createField('', { needsReview: false }),
    childNames: createField('', { needsReview: false }),
    hearingDate: createField('', { needsReview: false }),
    hearingTime: createField('', { needsReview: false }),
    hearingDepartment: createField('', { needsReview: false }),
    hearingRoom: createField('', { needsReview: false }),
    serviceDate: createField('', { needsReview: false }),
    serviceTime: createField('', { needsReview: false }),
    servedByName: createField('', { needsReview: false }),
    requestSummary: createField('', { needsReview: false }),
    orderSummary: createField('', { needsReview: false }),
    responseSummary: createField('', { needsReview: false }),
    signatureDate: createField('', { needsReview: true }),
    printedName: createField(petitionerName, {
      sourceType: petitionerName ? 'profile' : undefined,
      sourceLabel: petitionerName ? 'Account profile' : undefined,
      confidence: petitionerName ? 'high' : undefined,
      needsReview: true,
    }),
  };
}

function createDefaultFl150Section(petitionerName = ''): DraftFl150Section {
  const explicitRequired = {
    sourceType: 'manual' as const,
    sourceLabel: 'FL-150 explicit Draft Forms data required',
    confidence: 'low' as const,
    needsReview: true,
  };
  const explicitOptional = { needsReview: false };

  return {
    includeForm: createField(false, explicitRequired),
    employment: {
      employer: createField('', explicitOptional),
      employerAddress: createField('', explicitOptional),
      employerPhone: createField('', explicitOptional),
      occupation: createField('', explicitOptional),
      jobStartDate: createField('', explicitOptional),
      jobEndDate: createField('', explicitOptional),
      hoursPerWeek: createField('', explicitOptional),
      payAmount: createField('', explicitOptional),
      payPeriod: createField('unspecified', explicitRequired),
    },
    education: {
      age: createField('', explicitOptional),
      highSchoolGraduated: createField('unspecified', explicitRequired),
      highestGradeCompleted: createField('', explicitOptional),
      collegeYears: createField('', explicitOptional),
      collegeDegree: createField('', explicitOptional),
      graduateYears: createField('', explicitOptional),
      graduateDegree: createField('', explicitOptional),
      professionalLicense: createField('', explicitOptional),
      vocationalTraining: createField('', explicitOptional),
    },
    taxes: {
      taxYear: createField('', explicitOptional),
      filingStatus: createField('unspecified', explicitRequired),
      jointFilerName: createField('', explicitOptional),
      taxState: createField('unspecified', explicitRequired),
      otherState: createField('', explicitOptional),
      exemptions: createField('', explicitOptional),
    },
    otherPartyIncome: {
      grossMonthlyEstimate: createField('', explicitOptional),
      basis: createField('', explicitOptional),
    },
    income: {
      salaryWages: createDefaultFl150AmountPair(),
      overtime: createDefaultFl150AmountPair(),
      commissionsBonuses: createDefaultFl150AmountPair(),
      publicAssistance: createDefaultFl150AmountPair(),
      publicAssistanceCurrentlyReceiving: createField(false, explicitRequired),
      spousalSupport: createDefaultFl150AmountPair(),
      spousalSupportFromThisMarriage: createField(false, explicitRequired),
      spousalSupportFromDifferentMarriage: createField(false, explicitRequired),
      spousalSupportFederallyTaxable: createField(false, explicitRequired),
      partnerSupport: createDefaultFl150AmountPair(),
      partnerSupportFromThisPartnership: createField(false, explicitRequired),
      partnerSupportFromDifferentPartnership: createField(false, explicitRequired),
      pensionRetirement: createDefaultFl150AmountPair(),
      socialSecurityDisability: createDefaultFl150AmountPair(),
      socialSecurity: createField(false, explicitRequired),
      stateDisability: createField(false, explicitRequired),
      privateInsurance: createField(false, explicitRequired),
      unemploymentWorkersComp: createDefaultFl150AmountPair(),
      otherIncome: createDefaultFl150AmountPair(),
      otherIncomeDescription: createField('', explicitOptional),
      selfEmployment: {
        owner: createField(false, explicitRequired),
        partner: createField(false, explicitRequired),
        other: createField(false, explicitRequired),
        otherText: createField('', explicitOptional),
        years: createField('', explicitOptional),
        businessName: createField('', explicitOptional),
        businessType: createField('', explicitOptional),
      },
      additionalIncome: { selected: createField(false, explicitRequired), details: createField('', explicitOptional) },
      incomeChange: { selected: createField(false, explicitRequired), details: createField('', explicitOptional) },
    },
    deductions: {
      requiredUnionDues: createField('', explicitOptional),
      retirement: createField('', explicitOptional),
      medicalInsurance: createField('', explicitOptional),
      supportPaid: createField('', explicitOptional),
      wageAssignment: createField('', explicitOptional),
      jobExpenses: createField('', explicitOptional),
      otherDeductions: createField('', explicitOptional),
      totalDeductions: createField('', explicitOptional),
    },
    assets: {
      cashChecking: createField('', explicitOptional),
      savingsCreditUnion: createField('', explicitOptional),
      stocksBonds: createField('', explicitOptional),
      realProperty: createField('', explicitOptional),
      otherProperty: createField('', explicitOptional),
    },
    household: {
      person1Name: createField('', explicitOptional),
      person1Age: createField('', explicitOptional),
      person1Relationship: createField('', explicitOptional),
      person1GrossMonthlyIncome: createField('', explicitOptional),
    },
    expenses: {
      basis: createField('unspecified', explicitRequired),
      rentOrMortgage: createField('', explicitOptional),
      housingIsMortgage: createField(false, explicitRequired),
      mortgagePrincipal: createField('', explicitOptional),
      mortgageInterest: createField('', explicitOptional),
      propertyTax: createField('', explicitOptional),
      insurance: createField('', explicitOptional),
      maintenance: createField('', explicitOptional),
      healthCosts: createField('', explicitOptional),
      groceriesHousehold: createField('', explicitOptional),
      eatingOut: createField('', explicitOptional),
      utilities: createField('', explicitOptional),
      phone: createField('', explicitOptional),
      laundryCleaning: createField('', explicitOptional),
      clothes: createField('', explicitOptional),
      education: createField('', explicitOptional),
      entertainmentGiftsVacation: createField('', explicitOptional),
      auto: createField('', explicitOptional),
      autoInsurance: createField('', explicitOptional),
      savingsInvestments: createField('', explicitOptional),
      charitable: createField('', explicitOptional),
      monthlyDebtPayments: createField('', explicitOptional),
      otherDescription: createField('', explicitOptional),
      otherExpenses: createField('', explicitOptional),
      totalExpenses: createField('', explicitOptional),
    },
    childrenSupport: {
      hasChildrenHealthInsurance: createField('unspecified', explicitRequired),
      insuranceCompanyName: createField('', explicitOptional),
      insuranceCompanyAddress: createField('', explicitOptional),
      insuranceMonthlyCost: createField('', explicitOptional),
      numberOfChildren: createField('', explicitOptional),
      timeshareMePercent: createField('', explicitOptional),
      timeshareOtherParentPercent: createField('', explicitOptional),
      parentingScheduleDescription: createField('', explicitOptional),
      childCareCosts: createField('', explicitOptional),
      healthCareCostsNotCovered: createField('', explicitOptional),
      specialNeedsDescription: createField('', explicitOptional),
      specialNeedsAmount: createField('', explicitOptional),
    },
    hardships: {
      healthExpensesAmount: createField('', explicitOptional),
      healthExpensesMonths: createField('', explicitOptional),
      uninsuredLossesAmount: createField('', explicitOptional),
      uninsuredLossesMonths: createField('', explicitOptional),
      otherHardshipAmount: createField('', explicitOptional),
      otherHardshipMonths: createField('', explicitOptional),
      childrenNamesAges: createField('', explicitOptional),
      childrenMonthlyExpense: createField('', explicitOptional),
      explanation: createField('', explicitOptional),
    },
    supportOtherInformation: createField('', explicitOptional),
    attachmentPageCount: createField('', explicitOptional),
    signatureDate: createField('', { needsReview: true }),
    typePrintName: createField(petitionerName, {
      sourceType: petitionerName ? 'profile' : undefined,
      sourceLabel: petitionerName ? 'Account profile' : undefined,
      confidence: petitionerName ? 'high' : undefined,
      needsReview: petitionerName.length === 0,
    }),
  };
}

function mergeFl150Section(section: DraftFl150Section | undefined, defaults: DraftFl150Section): DraftFl150Section {
  return {
    ...defaults,
    ...(section ?? {}),
    employment: { ...defaults.employment, ...(section?.employment ?? {}) },
    education: { ...defaults.education, ...(section?.education ?? {}) },
    taxes: { ...defaults.taxes, ...(section?.taxes ?? {}) },
    otherPartyIncome: { ...defaults.otherPartyIncome, ...(section?.otherPartyIncome ?? {}) },
    income: {
      ...defaults.income,
      ...(section?.income ?? {}),
      salaryWages: { ...defaults.income.salaryWages, ...(section?.income?.salaryWages ?? {}) },
      overtime: { ...defaults.income.overtime, ...(section?.income?.overtime ?? {}) },
      commissionsBonuses: { ...defaults.income.commissionsBonuses, ...(section?.income?.commissionsBonuses ?? {}) },
      publicAssistance: { ...defaults.income.publicAssistance, ...(section?.income?.publicAssistance ?? {}) },
      spousalSupport: { ...defaults.income.spousalSupport, ...(section?.income?.spousalSupport ?? {}) },
      partnerSupport: { ...defaults.income.partnerSupport, ...(section?.income?.partnerSupport ?? {}) },
      pensionRetirement: { ...defaults.income.pensionRetirement, ...(section?.income?.pensionRetirement ?? {}) },
      socialSecurityDisability: { ...defaults.income.socialSecurityDisability, ...(section?.income?.socialSecurityDisability ?? {}) },
      unemploymentWorkersComp: { ...defaults.income.unemploymentWorkersComp, ...(section?.income?.unemploymentWorkersComp ?? {}) },
      otherIncome: { ...defaults.income.otherIncome, ...(section?.income?.otherIncome ?? {}) },
      selfEmployment: { ...defaults.income.selfEmployment, ...(section?.income?.selfEmployment ?? {}) },
      additionalIncome: { ...defaults.income.additionalIncome, ...(section?.income?.additionalIncome ?? {}) },
      incomeChange: { ...defaults.income.incomeChange, ...(section?.income?.incomeChange ?? {}) },
    },
    deductions: { ...defaults.deductions, ...(section?.deductions ?? {}) },
    assets: { ...defaults.assets, ...(section?.assets ?? {}) },
    household: { ...defaults.household, ...(section?.household ?? {}) },
    expenses: { ...defaults.expenses, ...(section?.expenses ?? {}) },
    childrenSupport: { ...defaults.childrenSupport, ...(section?.childrenSupport ?? {}) },
    hardships: { ...defaults.hardships, ...(section?.hardships ?? {}) },
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

function createBlankAdditionalChildAttachment(childId = ''): DraftFl105AdditionalChildAttachment {
  return {
    id: uuidv4(),
    childId,
    sameResidenceAsChildA: createField(true, {
      sourceType: 'manual',
      sourceLabel: 'Default FL-105(A) assumption',
      confidence: 'low',
      needsReview: true,
    }),
    sameResidenceReviewed: createField(false, {
      sourceType: 'manual',
      sourceLabel: 'Legal assertion review gate',
      confidence: 'low',
      needsReview: true,
    }),
    residenceHistory: [createBlankResidenceHistoryEntry()],
    residenceAddressConfidentialStateOnly: createField(false, {
      sourceType: 'manual',
      sourceLabel: 'Default FL-105(A) assumption',
      confidence: 'low',
      needsReview: true,
    }),
    personAddressConfidentialStateOnly: createField(false, {
      sourceType: 'manual',
      sourceLabel: 'Default FL-105(A) assumption',
      confidence: 'low',
      needsReview: true,
    }),
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
    representationRole: createField('party', {
      sourceType: 'manual',
      sourceLabel: 'Default FL-105 assumption',
      confidence: 'low',
      needsReview: true,
    }),
    authorizedRepresentativeAgencyName: createField('', {
      needsReview: false,
    }),
    childrenLivedTogetherPastFiveYears: createField(true, {
      sourceType: 'manual',
      sourceLabel: 'Default FL-105 assumption',
      confidence: 'low',
      needsReview: true,
    }),
    childrenResidenceAssertionReviewed: createField(false, {
      sourceType: 'manual',
      sourceLabel: 'Legal assertion review gate',
      confidence: 'low',
      needsReview: true,
    }),
    residenceHistory: [createBlankResidenceHistoryEntry()],
    additionalChildrenAttachments: [],
    residenceAddressConfidentialStateOnly: createField(false, {
      sourceType: 'manual',
      sourceLabel: 'Default FL-105 assumption',
      confidence: 'low',
      needsReview: true,
    }),
    personAddressConfidentialStateOnly: createField(false, {
      sourceType: 'manual',
      sourceLabel: 'Default FL-105 assumption',
      confidence: 'low',
      needsReview: true,
    }),
    additionalResidenceAddressesOnAttachment3a: createField(false, {
      sourceType: 'manual',
      sourceLabel: 'Default FL-105 assumption',
      confidence: 'low',
      needsReview: true,
    }),
    otherProceedingsKnown: createField(false, {
      sourceType: 'manual',
      sourceLabel: 'Default FL-105 assumption',
      confidence: 'low',
      needsReview: true,
    }),
    otherProceedingsAssertionReviewed: createField(false, {
      sourceType: 'manual',
      sourceLabel: 'Legal assertion review gate',
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
    domesticViolenceOrdersAssertionReviewed: createField(false, {
      sourceType: 'manual',
      sourceLabel: 'Legal assertion review gate',
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
    otherClaimantsAssertionReviewed: createField(false, {
      sourceType: 'manual',
      sourceLabel: 'Legal assertion review gate',
      confidence: 'low',
      needsReview: true,
    }),
    otherClaimants: [],
    attachmentsIncluded: createField(false, {
      sourceType: 'manual',
      sourceLabel: 'Default FL-105 assumption',
      confidence: 'low',
      needsReview: true,
    }),
    attachmentPageCount: createField('', {
      needsReview: false,
    }),
    declarantName: createField(petitionerName, {
      sourceType: petitionerName ? 'profile' : undefined,
      sourceLabel: petitionerName ? 'Account profile' : undefined,
      confidence: petitionerName ? 'high' : undefined,
      needsReview: petitionerName.length === 0,
    }),
    signatureDate: createField('', {
      needsReview: true,
    }),
  };
}

function normalizeWorkspace(workspace: DraftFormsWorkspace): DraftFormsWorkspace {
  const defaultFl100 = createDefaultFl100Section();
  const petitionerName = workspace.petitionerName?.value ?? '';
  const respondentName = workspace.respondentName?.value ?? '';
  const defaultFl300 = createDefaultFl300Section(petitionerName);
  const defaultFl140 = createDefaultFl140Section(petitionerName);
  const defaultFl141 = createDefaultFl141Section(petitionerName);
  const defaultFl142 = createDefaultFl142Section(petitionerName);
  const defaultFl115 = createDefaultFl115Section();
  const defaultFl117 = createDefaultFl117Section(petitionerName, respondentName);
  const defaultFl120 = createDefaultFl120Section(respondentName);
  const defaultFl160 = createDefaultFl160Section(petitionerName);
  const defaultFl342 = createDefaultFl342Section();
  const defaultFl343 = createDefaultFl343Section();
  const defaultFl130 = createDefaultFl130Section(petitionerName, respondentName);
  const defaultFl144 = createDefaultFl144Section(petitionerName, respondentName);
  const defaultFl170 = createDefaultFl170Section(petitionerName);
  const defaultFl180 = createDefaultFl180Section();
  const defaultFl190 = createDefaultFl190Section();
  const defaultFl345 = createDefaultFl345Section();
  const defaultFl348 = createDefaultFl348Section();
  const defaultFl165 = createDefaultRemainingFlFormSection('FL-165', petitionerName);
  const defaultFl182 = createDefaultRemainingFlFormSection('FL-182', petitionerName);
  const defaultFl191 = createDefaultRemainingFlFormSection('FL-191', petitionerName);
  const defaultFl195 = createDefaultRemainingFlFormSection('FL-195', petitionerName);
  const defaultFl272 = createDefaultRemainingFlFormSection('FL-272', petitionerName);
  const defaultFl342a = createDefaultRemainingFlFormSection('FL-342(A)', petitionerName);
  const defaultFl346 = createDefaultRemainingFlFormSection('FL-346', petitionerName);
  const defaultFl347 = createDefaultRemainingFlFormSection('FL-347', petitionerName);
  const defaultFl435 = createDefaultRemainingFlFormSection('FL-435', petitionerName);
  const defaultFl460 = createDefaultRemainingFlFormSection('FL-460', petitionerName);
  const defaultFl830 = createDefaultRemainingFlFormSection('FL-830', petitionerName);
  const defaultFw001 = createDefaultRemainingFlFormSection('FW-001', petitionerName);
  const defaultFw003 = createDefaultRemainingFlFormSection('FW-003', petitionerName);
  const defaultFw010 = createDefaultRemainingFlFormSection('FW-010', petitionerName);
  const defaultDv100 = createDefaultDvFormSection('DV-100', petitionerName, respondentName);
  const defaultDv101 = createDefaultDvFormSection('DV-101', petitionerName, respondentName);
  const defaultDv105 = createDefaultDvFormSection('DV-105', petitionerName, respondentName);
  const defaultDv108 = createDefaultDvFormSection('DV-108', petitionerName, respondentName);
  const defaultDv109 = createDefaultDvFormSection('DV-109', petitionerName, respondentName);
  const defaultDv110 = createDefaultDvFormSection('DV-110', petitionerName, respondentName);
  const defaultDv120 = createDefaultDvFormSection('DV-120', petitionerName, respondentName);
  const defaultDv130 = createDefaultDvFormSection('DV-130', petitionerName, respondentName);
  const defaultDv140 = createDefaultDvFormSection('DV-140', petitionerName, respondentName);
  const defaultDv200 = createDefaultDvFormSection('DV-200', petitionerName, respondentName);
  const defaultFl150 = createDefaultFl150Section(petitionerName);
  const defaultFl105 = createDefaultFl105Section(petitionerName);
  const normalizedChildren = Array.isArray(workspace.children)
    ? workspace.children.map((child) => ({
      id: child.id ?? uuidv4(),
      fullName: child.fullName ?? createField('', { needsReview: true }),
      birthDate: child.birthDate ?? createField('', { needsReview: true }),
      placeOfBirth: child.placeOfBirth ?? createField('', { needsReview: true }),
    }))
    : [];
  const additionalChildrenAttachmentByChildId = new Map(
    (Array.isArray(workspace.fl105?.additionalChildrenAttachments)
      ? workspace.fl105.additionalChildrenAttachments.filter((entry): entry is DraftFl105AdditionalChildAttachment => Boolean(entry?.childId))
      : []
    ).map((entry) => [entry.childId, entry]),
  );

  return {
    ...workspace,
    packetType: 'starter_packet_v1',
    selectedPreset: workspace.selectedPreset ?? createField('custom', { needsReview: false }),
    intake: {
      userRequest: workspace.intake?.userRequest,
      mariaSummary: workspace.intake?.mariaSummary,
      attachmentNames: workspace.intake?.attachmentNames ?? [],
      extractedFacts: workspace.intake?.extractedFacts ?? [],
    },
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
    petitionerFax: workspace.petitionerFax ?? createField('', { needsReview: false }),
    petitionerAttorneyOrPartyName: workspace.petitionerAttorneyOrPartyName ?? createField(workspace.petitionerName?.value ?? '', {
      sourceType: 'manual',
      sourceLabel: 'Default FL-100 assumption',
      confidence: 'low',
      needsReview: true,
    }),
    petitionerFirmName: workspace.petitionerFirmName ?? createField('', { needsReview: false }),
    petitionerStateBarNumber: workspace.petitionerStateBarNumber ?? createField('', { needsReview: false }),
    petitionerAttorneyFor: workspace.petitionerAttorneyFor ?? createField('Petitioner in pro per', {
      sourceType: 'manual',
      sourceLabel: 'Default FL-100 assumption',
      confidence: 'low',
      needsReview: true,
    }),
    respondentName: workspace.respondentName ?? createField('', { needsReview: true }),
    marriageDate: workspace.marriageDate ?? createField('', { needsReview: true }),
    separationDate: workspace.separationDate ?? createField('', { needsReview: true }),
    hasMinorChildren: workspace.hasMinorChildren ?? createField(false, { needsReview: true }),
    children: normalizedChildren,
    fl100: {
      includeForm: workspace.fl100?.includeForm ?? defaultFl100.includeForm,
      proceedingType: workspace.fl100?.proceedingType ?? defaultFl100.proceedingType,
      isAmended: workspace.fl100?.isAmended ?? defaultFl100.isAmended,
      relationshipType: workspace.fl100?.relationshipType ?? defaultFl100.relationshipType,
      domesticPartnership: {
        establishment: workspace.fl100?.domesticPartnership?.establishment ?? defaultFl100.domesticPartnership.establishment,
        californiaResidencyException: workspace.fl100?.domesticPartnership?.californiaResidencyException ?? defaultFl100.domesticPartnership.californiaResidencyException,
        sameSexMarriageJurisdictionException: workspace.fl100?.domesticPartnership?.sameSexMarriageJurisdictionException ?? defaultFl100.domesticPartnership.sameSexMarriageJurisdictionException,
        registrationDate: workspace.fl100?.domesticPartnership?.registrationDate ?? defaultFl100.domesticPartnership.registrationDate,
        partnerSeparationDate: workspace.fl100?.domesticPartnership?.partnerSeparationDate
          ?? defaultFl100.domesticPartnership.partnerSeparationDate,
      },
      nullity: {
        basedOnIncest: workspace.fl100?.nullity?.basedOnIncest ?? defaultFl100.nullity.basedOnIncest,
        basedOnBigamy: workspace.fl100?.nullity?.basedOnBigamy ?? defaultFl100.nullity.basedOnBigamy,
        basedOnAge: workspace.fl100?.nullity?.basedOnAge ?? defaultFl100.nullity.basedOnAge,
        basedOnPriorExistingMarriageOrPartnership: workspace.fl100?.nullity?.basedOnPriorExistingMarriageOrPartnership ?? defaultFl100.nullity.basedOnPriorExistingMarriageOrPartnership,
        basedOnUnsoundMind: workspace.fl100?.nullity?.basedOnUnsoundMind ?? defaultFl100.nullity.basedOnUnsoundMind,
        basedOnFraud: workspace.fl100?.nullity?.basedOnFraud ?? defaultFl100.nullity.basedOnFraud,
        basedOnForce: workspace.fl100?.nullity?.basedOnForce ?? defaultFl100.nullity.basedOnForce,
        basedOnPhysicalIncapacity: workspace.fl100?.nullity?.basedOnPhysicalIncapacity ?? defaultFl100.nullity.basedOnPhysicalIncapacity,
      },
      residency: {
        petitionerCaliforniaMonths: workspace.fl100?.residency?.petitionerCaliforniaMonths ?? defaultFl100.residency.petitionerCaliforniaMonths,
        petitionerCountyMonths: workspace.fl100?.residency?.petitionerCountyMonths ?? defaultFl100.residency.petitionerCountyMonths,
        petitionerResidenceLocation: workspace.fl100?.residency?.petitionerResidenceLocation ?? defaultFl100.residency.petitionerResidenceLocation,
        respondentCaliforniaMonths: workspace.fl100?.residency?.respondentCaliforniaMonths ?? defaultFl100.residency.respondentCaliforniaMonths,
        respondentCountyMonths: workspace.fl100?.residency?.respondentCountyMonths ?? defaultFl100.residency.respondentCountyMonths,
        respondentResidenceLocation: workspace.fl100?.residency?.respondentResidenceLocation ?? defaultFl100.residency.respondentResidenceLocation,
      },
      legalGrounds: {
        irreconcilableDifferences: workspace.fl100?.legalGrounds?.irreconcilableDifferences ?? defaultFl100.legalGrounds.irreconcilableDifferences,
        permanentLegalIncapacity: workspace.fl100?.legalGrounds?.permanentLegalIncapacity ?? defaultFl100.legalGrounds.permanentLegalIncapacity,
      },
      propertyDeclarations: {
        communityAndQuasiCommunity: workspace.fl100?.propertyDeclarations?.communityAndQuasiCommunity ?? defaultFl100.propertyDeclarations.communityAndQuasiCommunity,
        communityAndQuasiCommunityWhereListed: workspace.fl100?.propertyDeclarations?.communityAndQuasiCommunityWhereListed ?? defaultFl100.propertyDeclarations.communityAndQuasiCommunityWhereListed,
        communityAndQuasiCommunityDetails: workspace.fl100?.propertyDeclarations?.communityAndQuasiCommunityDetails ?? defaultFl100.propertyDeclarations.communityAndQuasiCommunityDetails,
        separateProperty: workspace.fl100?.propertyDeclarations?.separateProperty ?? defaultFl100.propertyDeclarations.separateProperty,
        separatePropertyWhereListed: workspace.fl100?.propertyDeclarations?.separatePropertyWhereListed ?? defaultFl100.propertyDeclarations.separatePropertyWhereListed,
        separatePropertyDetails: workspace.fl100?.propertyDeclarations?.separatePropertyDetails ?? defaultFl100.propertyDeclarations.separatePropertyDetails,
        separatePropertyAwardedTo: workspace.fl100?.propertyDeclarations?.separatePropertyAwardedTo ?? defaultFl100.propertyDeclarations.separatePropertyAwardedTo,
      },
      spousalSupport: {
        supportOrderDirection: workspace.fl100?.spousalSupport?.supportOrderDirection ?? defaultFl100.spousalSupport.supportOrderDirection,
        reserveJurisdictionFor: workspace.fl100?.spousalSupport?.reserveJurisdictionFor ?? defaultFl100.spousalSupport.reserveJurisdictionFor,
        terminateJurisdictionFor: workspace.fl100?.spousalSupport?.terminateJurisdictionFor ?? defaultFl100.spousalSupport.terminateJurisdictionFor,
        details: workspace.fl100?.spousalSupport?.details ?? defaultFl100.spousalSupport.details,
        voluntaryDeclarationOfParentageSigned: workspace.fl100?.spousalSupport?.voluntaryDeclarationOfParentageSigned ?? defaultFl100.spousalSupport.voluntaryDeclarationOfParentageSigned,
      },
      childSupport: {
        requestAdditionalOrders: workspace.fl100?.childSupport?.requestAdditionalOrders ?? defaultFl100.childSupport.requestAdditionalOrders,
        additionalOrdersDetails: workspace.fl100?.childSupport?.additionalOrdersDetails ?? defaultFl100.childSupport.additionalOrdersDetails,
      },
      minorChildren: {
        hasUnbornChild: workspace.fl100?.minorChildren?.hasUnbornChild ?? defaultFl100.minorChildren.hasUnbornChild,
        detailsOnAttachment4b: workspace.fl100?.minorChildren?.detailsOnAttachment4b ?? defaultFl100.minorChildren.detailsOnAttachment4b,
      },
      childCustodyVisitation: {
        legalCustodyTo: workspace.fl100?.childCustodyVisitation?.legalCustodyTo ?? defaultFl100.childCustodyVisitation.legalCustodyTo,
        physicalCustodyTo: workspace.fl100?.childCustodyVisitation?.physicalCustodyTo ?? defaultFl100.childCustodyVisitation.physicalCustodyTo,
        visitationTo: workspace.fl100?.childCustodyVisitation?.visitationTo ?? defaultFl100.childCustodyVisitation.visitationTo,
        fl311: {
          filingPartyOtherName: workspace.fl100?.childCustodyVisitation?.fl311?.filingPartyOtherName
            ?? defaultFl100.childCustodyVisitation.fl311.filingPartyOtherName,
          visitationPlanMode: workspace.fl100?.childCustodyVisitation?.fl311?.visitationPlanMode
            ?? defaultFl100.childCustodyVisitation.fl311.visitationPlanMode,
          visitationAttachmentPageCount: workspace.fl100?.childCustodyVisitation?.fl311?.visitationAttachmentPageCount
            ?? defaultFl100.childCustodyVisitation.fl311.visitationAttachmentPageCount,
          visitationAttachmentDate: workspace.fl100?.childCustodyVisitation?.fl311?.visitationAttachmentDate
            ?? defaultFl100.childCustodyVisitation.fl311.visitationAttachmentDate,
        },
        fl312: {
          filingPartyOtherName: workspace.fl100?.childCustodyVisitation?.fl312?.filingPartyOtherName
            ?? defaultFl100.childCustodyVisitation.fl312.filingPartyOtherName,
          requestingPartyName: workspace.fl100?.childCustodyVisitation?.fl312?.requestingPartyName
            ?? defaultFl100.childCustodyVisitation.fl312.requestingPartyName,
          abductionBy: {
            petitioner: workspace.fl100?.childCustodyVisitation?.fl312?.abductionBy?.petitioner
              ?? defaultFl100.childCustodyVisitation.fl312.abductionBy.petitioner,
            respondent: workspace.fl100?.childCustodyVisitation?.fl312?.abductionBy?.respondent
              ?? defaultFl100.childCustodyVisitation.fl312.abductionBy.respondent,
            otherParentParty: workspace.fl100?.childCustodyVisitation?.fl312?.abductionBy?.otherParentParty
              ?? defaultFl100.childCustodyVisitation.fl312.abductionBy.otherParentParty,
          },
          riskDestinations: {
            anotherCaliforniaCounty: workspace.fl100?.childCustodyVisitation?.fl312?.riskDestinations?.anotherCaliforniaCounty
              ?? defaultFl100.childCustodyVisitation.fl312.riskDestinations.anotherCaliforniaCounty,
            anotherCaliforniaCountyName: workspace.fl100?.childCustodyVisitation?.fl312?.riskDestinations?.anotherCaliforniaCountyName
              ?? defaultFl100.childCustodyVisitation.fl312.riskDestinations.anotherCaliforniaCountyName,
            anotherState: workspace.fl100?.childCustodyVisitation?.fl312?.riskDestinations?.anotherState
              ?? defaultFl100.childCustodyVisitation.fl312.riskDestinations.anotherState,
            anotherStateName: workspace.fl100?.childCustodyVisitation?.fl312?.riskDestinations?.anotherStateName
              ?? defaultFl100.childCustodyVisitation.fl312.riskDestinations.anotherStateName,
            foreignCountry: workspace.fl100?.childCustodyVisitation?.fl312?.riskDestinations?.foreignCountry
              ?? defaultFl100.childCustodyVisitation.fl312.riskDestinations.foreignCountry,
            foreignCountryName: workspace.fl100?.childCustodyVisitation?.fl312?.riskDestinations?.foreignCountryName
              ?? defaultFl100.childCustodyVisitation.fl312.riskDestinations.foreignCountryName,
            foreignCountryCitizen: workspace.fl100?.childCustodyVisitation?.fl312?.riskDestinations?.foreignCountryCitizen
              ?? defaultFl100.childCustodyVisitation.fl312.riskDestinations.foreignCountryCitizen,
            foreignCountryHasTies: workspace.fl100?.childCustodyVisitation?.fl312?.riskDestinations?.foreignCountryHasTies
              ?? defaultFl100.childCustodyVisitation.fl312.riskDestinations.foreignCountryHasTies,
            foreignCountryTiesDetails: workspace.fl100?.childCustodyVisitation?.fl312?.riskDestinations?.foreignCountryTiesDetails
              ?? defaultFl100.childCustodyVisitation.fl312.riskDestinations.foreignCountryTiesDetails,
          },
          riskFactors: {
            custodyOrderViolationThreat: workspace.fl100?.childCustodyVisitation?.fl312?.riskFactors?.custodyOrderViolationThreat
              ?? defaultFl100.childCustodyVisitation.fl312.riskFactors.custodyOrderViolationThreat,
            custodyOrderViolationThreatDetails: workspace.fl100?.childCustodyVisitation?.fl312?.riskFactors?.custodyOrderViolationThreatDetails
              ?? defaultFl100.childCustodyVisitation.fl312.riskFactors.custodyOrderViolationThreatDetails,
            weakCaliforniaTies: workspace.fl100?.childCustodyVisitation?.fl312?.riskFactors?.weakCaliforniaTies
              ?? defaultFl100.childCustodyVisitation.fl312.riskFactors.weakCaliforniaTies,
            weakCaliforniaTiesDetails: workspace.fl100?.childCustodyVisitation?.fl312?.riskFactors?.weakCaliforniaTiesDetails
              ?? defaultFl100.childCustodyVisitation.fl312.riskFactors.weakCaliforniaTiesDetails,
            recentAbductionPlanningActions: workspace.fl100?.childCustodyVisitation?.fl312?.riskFactors?.recentAbductionPlanningActions
              ?? defaultFl100.childCustodyVisitation.fl312.riskFactors.recentAbductionPlanningActions,
            recentActionQuitJob: workspace.fl100?.childCustodyVisitation?.fl312?.riskFactors?.recentActionQuitJob
              ?? defaultFl100.childCustodyVisitation.fl312.riskFactors.recentActionQuitJob,
            recentActionSoldHome: workspace.fl100?.childCustodyVisitation?.fl312?.riskFactors?.recentActionSoldHome
              ?? defaultFl100.childCustodyVisitation.fl312.riskFactors.recentActionSoldHome,
            recentActionClosedBankAccount: workspace.fl100?.childCustodyVisitation?.fl312?.riskFactors?.recentActionClosedBankAccount
              ?? defaultFl100.childCustodyVisitation.fl312.riskFactors.recentActionClosedBankAccount,
            recentActionEndedLease: workspace.fl100?.childCustodyVisitation?.fl312?.riskFactors?.recentActionEndedLease
              ?? defaultFl100.childCustodyVisitation.fl312.riskFactors.recentActionEndedLease,
            recentActionSoldAssets: workspace.fl100?.childCustodyVisitation?.fl312?.riskFactors?.recentActionSoldAssets
              ?? defaultFl100.childCustodyVisitation.fl312.riskFactors.recentActionSoldAssets,
            recentActionHidOrDestroyedDocuments: workspace.fl100?.childCustodyVisitation?.fl312?.riskFactors?.recentActionHidOrDestroyedDocuments
              ?? defaultFl100.childCustodyVisitation.fl312.riskFactors.recentActionHidOrDestroyedDocuments,
            recentActionAppliedForTravelDocuments: workspace.fl100?.childCustodyVisitation?.fl312?.riskFactors?.recentActionAppliedForTravelDocuments
              ?? defaultFl100.childCustodyVisitation.fl312.riskFactors.recentActionAppliedForTravelDocuments,
            recentActionOther: workspace.fl100?.childCustodyVisitation?.fl312?.riskFactors?.recentActionOther
              ?? defaultFl100.childCustodyVisitation.fl312.riskFactors.recentActionOther,
            recentActionOtherDetails: workspace.fl100?.childCustodyVisitation?.fl312?.riskFactors?.recentActionOtherDetails
              ?? defaultFl100.childCustodyVisitation.fl312.riskFactors.recentActionOtherDetails,
            historyOfRiskBehaviors: workspace.fl100?.childCustodyVisitation?.fl312?.riskFactors?.historyOfRiskBehaviors
              ?? defaultFl100.childCustodyVisitation.fl312.riskFactors.historyOfRiskBehaviors,
            historyDomesticViolence: workspace.fl100?.childCustodyVisitation?.fl312?.riskFactors?.historyDomesticViolence
              ?? defaultFl100.childCustodyVisitation.fl312.riskFactors.historyDomesticViolence,
            historyChildAbuse: workspace.fl100?.childCustodyVisitation?.fl312?.riskFactors?.historyChildAbuse
              ?? defaultFl100.childCustodyVisitation.fl312.riskFactors.historyChildAbuse,
            historyParentingNonCooperation: workspace.fl100?.childCustodyVisitation?.fl312?.riskFactors?.historyParentingNonCooperation
              ?? defaultFl100.childCustodyVisitation.fl312.riskFactors.historyParentingNonCooperation,
            historyChildTakingWithoutPermission: workspace.fl100?.childCustodyVisitation?.fl312?.riskFactors?.historyChildTakingWithoutPermission
              ?? defaultFl100.childCustodyVisitation.fl312.riskFactors.historyChildTakingWithoutPermission,
            historyDetails: workspace.fl100?.childCustodyVisitation?.fl312?.riskFactors?.historyDetails
              ?? defaultFl100.childCustodyVisitation.fl312.riskFactors.historyDetails,
            criminalRecord: workspace.fl100?.childCustodyVisitation?.fl312?.riskFactors?.criminalRecord
              ?? defaultFl100.childCustodyVisitation.fl312.riskFactors.criminalRecord,
            criminalRecordDetails: workspace.fl100?.childCustodyVisitation?.fl312?.riskFactors?.criminalRecordDetails
              ?? defaultFl100.childCustodyVisitation.fl312.riskFactors.criminalRecordDetails,
          },
          requestedOrdersAgainst: {
            petitioner: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrdersAgainst?.petitioner
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrdersAgainst.petitioner,
            respondent: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrdersAgainst?.respondent
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrdersAgainst.respondent,
            otherParentParty: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrdersAgainst?.otherParentParty
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrdersAgainst.otherParentParty,
          },
          requestedOrders: {
            supervisedVisitation: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.supervisedVisitation
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.supervisedVisitation,
            supervisedVisitationTermsMode: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.supervisedVisitationTermsMode
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.supervisedVisitationTermsMode,
            supervisedVisitationTermsDetails: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.supervisedVisitationTermsDetails
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.supervisedVisitationTermsDetails,
            postBond: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.postBond
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.postBond,
            postBondAmount: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.postBondAmount
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.postBondAmount,
            noMoveWithoutWrittenPermissionOrCourtOrder: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.noMoveWithoutWrittenPermissionOrCourtOrder
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.noMoveWithoutWrittenPermissionOrCourtOrder,
            noTravelWithoutWrittenPermissionOrCourtOrder: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.noTravelWithoutWrittenPermissionOrCourtOrder
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.noTravelWithoutWrittenPermissionOrCourtOrder,
            travelRestrictionThisCounty: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.travelRestrictionThisCounty
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.travelRestrictionThisCounty,
            travelRestrictionCalifornia: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.travelRestrictionCalifornia
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.travelRestrictionCalifornia,
            travelRestrictionUnitedStates: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.travelRestrictionUnitedStates
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.travelRestrictionUnitedStates,
            travelRestrictionOther: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.travelRestrictionOther
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.travelRestrictionOther,
            travelRestrictionOtherDetails: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.travelRestrictionOtherDetails
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.travelRestrictionOtherDetails,
            registerOrderInOtherState: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.registerOrderInOtherState
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.registerOrderInOtherState,
            registerOrderStateName: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.registerOrderStateName
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.registerOrderStateName,
            turnInPassportsAndTravelDocuments: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.turnInPassportsAndTravelDocuments
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.turnInPassportsAndTravelDocuments,
            doNotApplyForNewPassportsOrDocuments: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.doNotApplyForNewPassportsOrDocuments
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.doNotApplyForNewPassportsOrDocuments,
            provideTravelItinerary: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.provideTravelItinerary
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.provideTravelItinerary,
            provideRoundTripAirlineTickets: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.provideRoundTripAirlineTickets
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.provideRoundTripAirlineTickets,
            provideAddressesAndTelephone: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.provideAddressesAndTelephone
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.provideAddressesAndTelephone,
            provideOpenReturnTicketForRequestingParty: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.provideOpenReturnTicketForRequestingParty
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.provideOpenReturnTicketForRequestingParty,
            provideOtherTravelDocuments: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.provideOtherTravelDocuments
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.provideOtherTravelDocuments,
            provideOtherTravelDocumentsDetails: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.provideOtherTravelDocumentsDetails
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.provideOtherTravelDocumentsDetails,
            notifyForeignEmbassyOrConsulate: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.notifyForeignEmbassyOrConsulate
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.notifyForeignEmbassyOrConsulate,
            embassyOrConsulateCountry: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.embassyOrConsulateCountry
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.embassyOrConsulateCountry,
            embassyNotificationWithinDays: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.embassyNotificationWithinDays
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.embassyNotificationWithinDays,
            obtainForeignCustodyAndVisitationOrderBeforeTravel: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.obtainForeignCustodyAndVisitationOrderBeforeTravel
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.obtainForeignCustodyAndVisitationOrderBeforeTravel,
            otherOrdersRequested: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.otherOrdersRequested
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.otherOrdersRequested,
            otherOrdersDetails: workspace.fl100?.childCustodyVisitation?.fl312?.requestedOrders?.otherOrdersDetails
              ?? defaultFl100.childCustodyVisitation.fl312.requestedOrders.otherOrdersDetails,
          },
          signatureDate: workspace.fl100?.childCustodyVisitation?.fl312?.signatureDate
            ?? defaultFl100.childCustodyVisitation.fl312.signatureDate,
        },
        fl341: {
          sourceOrder: workspace.fl100?.childCustodyVisitation?.fl341?.sourceOrder
            ?? defaultFl100.childCustodyVisitation.fl341.sourceOrder,
          sourceOrderOtherText: workspace.fl100?.childCustodyVisitation?.fl341?.sourceOrderOtherText
            ?? defaultFl100.childCustodyVisitation.fl341.sourceOrderOtherText,
          otherParentPartyName: workspace.fl100?.childCustodyVisitation?.fl341?.otherParentPartyName
            ?? defaultFl100.childCustodyVisitation.fl341.otherParentPartyName,
          fl341a: {
            supervisedParty: {
              petitioner: workspace.fl100?.childCustodyVisitation?.fl341?.fl341a?.supervisedParty?.petitioner
                ?? defaultFl100.childCustodyVisitation.fl341.fl341a.supervisedParty.petitioner,
              respondent: workspace.fl100?.childCustodyVisitation?.fl341?.fl341a?.supervisedParty?.respondent
                ?? defaultFl100.childCustodyVisitation.fl341.fl341a.supervisedParty.respondent,
              otherParentParty: workspace.fl100?.childCustodyVisitation?.fl341?.fl341a?.supervisedParty?.otherParentParty
                ?? defaultFl100.childCustodyVisitation.fl341.fl341a.supervisedParty.otherParentParty,
            },
            supervisor: {
              type: workspace.fl100?.childCustodyVisitation?.fl341?.fl341a?.supervisor?.type
                ?? defaultFl100.childCustodyVisitation.fl341.fl341a.supervisor.type,
              otherTypeText: workspace.fl100?.childCustodyVisitation?.fl341?.fl341a?.supervisor?.otherTypeText
                ?? defaultFl100.childCustodyVisitation.fl341.fl341a.supervisor.otherTypeText,
              name: workspace.fl100?.childCustodyVisitation?.fl341?.fl341a?.supervisor?.name
                ?? defaultFl100.childCustodyVisitation.fl341.fl341a.supervisor.name,
              contact: workspace.fl100?.childCustodyVisitation?.fl341?.fl341a?.supervisor?.contact
                ?? defaultFl100.childCustodyVisitation.fl341.fl341a.supervisor.contact,
              feesPaidBy: workspace.fl100?.childCustodyVisitation?.fl341?.fl341a?.supervisor?.feesPaidBy
                ?? defaultFl100.childCustodyVisitation.fl341.fl341a.supervisor.feesPaidBy,
              feesOtherText: workspace.fl100?.childCustodyVisitation?.fl341?.fl341a?.supervisor?.feesOtherText
                ?? defaultFl100.childCustodyVisitation.fl341.fl341a.supervisor.feesOtherText,
            },
            schedule: {
              mode: workspace.fl100?.childCustodyVisitation?.fl341?.fl341a?.schedule?.mode
                ?? defaultFl100.childCustodyVisitation.fl341.fl341a.schedule.mode,
              attachmentPageCount: workspace.fl100?.childCustodyVisitation?.fl341?.fl341a?.schedule?.attachmentPageCount
                ?? defaultFl100.childCustodyVisitation.fl341.fl341a.schedule.attachmentPageCount,
              text: workspace.fl100?.childCustodyVisitation?.fl341?.fl341a?.schedule?.text
                ?? defaultFl100.childCustodyVisitation.fl341.fl341a.schedule.text,
            },
            restrictions: workspace.fl100?.childCustodyVisitation?.fl341?.fl341a?.restrictions
              ?? defaultFl100.childCustodyVisitation.fl341.fl341a.restrictions,
            otherTerms: workspace.fl100?.childCustodyVisitation?.fl341?.fl341a?.otherTerms
              ?? defaultFl100.childCustodyVisitation.fl341.fl341a.otherTerms,
          },
          fl341b: workspace.fl100?.childCustodyVisitation?.fl341?.fl341b
            ?? defaultFl100.childCustodyVisitation.fl341.fl341b,
          fl341c: {
            holidayRows: {
              newYearsDay: workspace.fl100?.childCustodyVisitation?.fl341?.fl341c?.holidayRows?.newYearsDay
                ?? defaultFl100.childCustodyVisitation.fl341.fl341c.holidayRows.newYearsDay,
              springBreak: workspace.fl100?.childCustodyVisitation?.fl341?.fl341c?.holidayRows?.springBreak
                ?? defaultFl100.childCustodyVisitation.fl341.fl341c.holidayRows.springBreak,
              thanksgivingDay: workspace.fl100?.childCustodyVisitation?.fl341?.fl341c?.holidayRows?.thanksgivingDay
                ?? defaultFl100.childCustodyVisitation.fl341.fl341c.holidayRows.thanksgivingDay,
              winterBreak: workspace.fl100?.childCustodyVisitation?.fl341?.fl341c?.holidayRows?.winterBreak
                ?? defaultFl100.childCustodyVisitation.fl341.fl341c.holidayRows.winterBreak,
              childBirthday: workspace.fl100?.childCustodyVisitation?.fl341?.fl341c?.holidayRows?.childBirthday
                ?? defaultFl100.childCustodyVisitation.fl341.fl341c.holidayRows.childBirthday,
            },
            additionalHolidayNotes: workspace.fl100?.childCustodyVisitation?.fl341?.fl341c?.additionalHolidayNotes
              ?? defaultFl100.childCustodyVisitation.fl341.fl341c.additionalHolidayNotes,
            vacation: {
              assignedTo: workspace.fl100?.childCustodyVisitation?.fl341?.fl341c?.vacation?.assignedTo
                ?? defaultFl100.childCustodyVisitation.fl341.fl341c.vacation.assignedTo,
              maxDuration: workspace.fl100?.childCustodyVisitation?.fl341?.fl341c?.vacation?.maxDuration
                ?? defaultFl100.childCustodyVisitation.fl341.fl341c.vacation.maxDuration,
              maxDurationUnit: workspace.fl100?.childCustodyVisitation?.fl341?.fl341c?.vacation?.maxDurationUnit
                ?? defaultFl100.childCustodyVisitation.fl341.fl341c.vacation.maxDurationUnit,
              timesPerYear: workspace.fl100?.childCustodyVisitation?.fl341?.fl341c?.vacation?.timesPerYear
                ?? defaultFl100.childCustodyVisitation.fl341.fl341c.vacation.timesPerYear,
              noticeDays: workspace.fl100?.childCustodyVisitation?.fl341?.fl341c?.vacation?.noticeDays
                ?? defaultFl100.childCustodyVisitation.fl341.fl341c.vacation.noticeDays,
              responseDays: workspace.fl100?.childCustodyVisitation?.fl341?.fl341c?.vacation?.responseDays
                ?? defaultFl100.childCustodyVisitation.fl341.fl341c.vacation.responseDays,
              allowOutsideCalifornia: workspace.fl100?.childCustodyVisitation?.fl341?.fl341c?.vacation?.allowOutsideCalifornia
                ?? defaultFl100.childCustodyVisitation.fl341.fl341c.vacation.allowOutsideCalifornia,
              allowOutsideUnitedStates: workspace.fl100?.childCustodyVisitation?.fl341?.fl341c?.vacation?.allowOutsideUnitedStates
                ?? defaultFl100.childCustodyVisitation.fl341.fl341c.vacation.allowOutsideUnitedStates,
              otherTerms: workspace.fl100?.childCustodyVisitation?.fl341?.fl341c?.vacation?.otherTerms
                ?? defaultFl100.childCustodyVisitation.fl341.fl341c.vacation.otherTerms,
            },
          },
          fl341d: {
            provisions: {
              exchangeSchedule: workspace.fl100?.childCustodyVisitation?.fl341?.fl341d?.provisions?.exchangeSchedule
                ?? defaultFl100.childCustodyVisitation.fl341.fl341d.provisions.exchangeSchedule,
              transportation: workspace.fl100?.childCustodyVisitation?.fl341?.fl341d?.provisions?.transportation
                ?? defaultFl100.childCustodyVisitation.fl341.fl341d.provisions.transportation,
              makeupTime: workspace.fl100?.childCustodyVisitation?.fl341?.fl341d?.provisions?.makeupTime
                ?? defaultFl100.childCustodyVisitation.fl341.fl341d.provisions.makeupTime,
              communication: workspace.fl100?.childCustodyVisitation?.fl341?.fl341d?.provisions?.communication
                ?? defaultFl100.childCustodyVisitation.fl341.fl341d.provisions.communication,
              rightOfFirstRefusal: workspace.fl100?.childCustodyVisitation?.fl341?.fl341d?.provisions?.rightOfFirstRefusal
                ?? defaultFl100.childCustodyVisitation.fl341.fl341d.provisions.rightOfFirstRefusal,
              temporaryChangesByAgreement: workspace.fl100?.childCustodyVisitation?.fl341?.fl341d?.provisions?.temporaryChangesByAgreement
                ?? defaultFl100.childCustodyVisitation.fl341.fl341d.provisions.temporaryChangesByAgreement,
              other: workspace.fl100?.childCustodyVisitation?.fl341?.fl341d?.provisions?.other
                ?? defaultFl100.childCustodyVisitation.fl341.fl341d.provisions.other,
            },
          },
          fl341e: {
            orderJointLegalCustody: workspace.fl100?.childCustodyVisitation?.fl341?.fl341e?.orderJointLegalCustody
              ?? defaultFl100.childCustodyVisitation.fl341.fl341e.orderJointLegalCustody,
            decisionMaking: {
              education: workspace.fl100?.childCustodyVisitation?.fl341?.fl341e?.decisionMaking?.education
                ?? defaultFl100.childCustodyVisitation.fl341.fl341e.decisionMaking.education,
              nonEmergencyHealthcare: workspace.fl100?.childCustodyVisitation?.fl341?.fl341e?.decisionMaking?.nonEmergencyHealthcare
                ?? defaultFl100.childCustodyVisitation.fl341.fl341e.decisionMaking.nonEmergencyHealthcare,
              mentalHealth: workspace.fl100?.childCustodyVisitation?.fl341?.fl341e?.decisionMaking?.mentalHealth
                ?? defaultFl100.childCustodyVisitation.fl341.fl341e.decisionMaking.mentalHealth,
              extracurricular: workspace.fl100?.childCustodyVisitation?.fl341?.fl341e?.decisionMaking?.extracurricular
                ?? defaultFl100.childCustodyVisitation.fl341.fl341e.decisionMaking.extracurricular,
            },
            terms: {
              recordsAccess: workspace.fl100?.childCustodyVisitation?.fl341?.fl341e?.terms?.recordsAccess
                ?? defaultFl100.childCustodyVisitation.fl341.fl341e.terms.recordsAccess,
              emergencyNotice: workspace.fl100?.childCustodyVisitation?.fl341?.fl341e?.terms?.emergencyNotice
                ?? defaultFl100.childCustodyVisitation.fl341.fl341e.terms.emergencyNotice,
              portalAccess: workspace.fl100?.childCustodyVisitation?.fl341?.fl341e?.terms?.portalAccess
                ?? defaultFl100.childCustodyVisitation.fl341.fl341e.terms.portalAccess,
              contactUpdates: workspace.fl100?.childCustodyVisitation?.fl341?.fl341e?.terms?.contactUpdates
                ?? defaultFl100.childCustodyVisitation.fl341.fl341e.terms.contactUpdates,
            },
            disputeResolution: {
              meetAndConfer: workspace.fl100?.childCustodyVisitation?.fl341?.fl341e?.disputeResolution?.meetAndConfer
                ?? defaultFl100.childCustodyVisitation.fl341.fl341e.disputeResolution.meetAndConfer,
              mediation: workspace.fl100?.childCustodyVisitation?.fl341?.fl341e?.disputeResolution?.mediation
                ?? defaultFl100.childCustodyVisitation.fl341.fl341e.disputeResolution.mediation,
              court: workspace.fl100?.childCustodyVisitation?.fl341?.fl341e?.disputeResolution?.court
                ?? defaultFl100.childCustodyVisitation.fl341.fl341e.disputeResolution.court,
              other: workspace.fl100?.childCustodyVisitation?.fl341?.fl341e?.disputeResolution?.other
                ?? defaultFl100.childCustodyVisitation.fl341.fl341e.disputeResolution.other,
              otherText: workspace.fl100?.childCustodyVisitation?.fl341?.fl341e?.disputeResolution?.otherText
                ?? defaultFl100.childCustodyVisitation.fl341.fl341e.disputeResolution.otherText,
            },
            additionalTerms: workspace.fl100?.childCustodyVisitation?.fl341?.fl341e?.additionalTerms
              ?? defaultFl100.childCustodyVisitation.fl341.fl341e.additionalTerms,
          },
        },
        attachments: {
          formFl311: workspace.fl100?.childCustodyVisitation?.attachments?.formFl311 ?? defaultFl100.childCustodyVisitation.attachments.formFl311,
          formFl312: workspace.fl100?.childCustodyVisitation?.attachments?.formFl312 ?? defaultFl100.childCustodyVisitation.attachments.formFl312,
          formFl341a: workspace.fl100?.childCustodyVisitation?.attachments?.formFl341a ?? defaultFl100.childCustodyVisitation.attachments.formFl341a,
          formFl341b: workspace.fl100?.childCustodyVisitation?.attachments?.formFl341b ?? defaultFl100.childCustodyVisitation.attachments.formFl341b,
          formFl341c: workspace.fl100?.childCustodyVisitation?.attachments?.formFl341c ?? defaultFl100.childCustodyVisitation.attachments.formFl341c,
          formFl341d: workspace.fl100?.childCustodyVisitation?.attachments?.formFl341d ?? defaultFl100.childCustodyVisitation.attachments.formFl341d,
          formFl341e: workspace.fl100?.childCustodyVisitation?.attachments?.formFl341e ?? defaultFl100.childCustodyVisitation.attachments.formFl341e,
          attachment6c1: workspace.fl100?.childCustodyVisitation?.attachments?.attachment6c1 ?? defaultFl100.childCustodyVisitation.attachments.attachment6c1,
        },
      },
      attorneyFeesAndCosts: {
        requestAward: workspace.fl100?.attorneyFeesAndCosts?.requestAward ?? defaultFl100.attorneyFeesAndCosts.requestAward,
        payableBy: workspace.fl100?.attorneyFeesAndCosts?.payableBy ?? defaultFl100.attorneyFeesAndCosts.payableBy,
      },
      otherRequests: {
        requestOtherRelief: workspace.fl100?.otherRequests?.requestOtherRelief ?? defaultFl100.otherRequests.requestOtherRelief,
        details: workspace.fl100?.otherRequests?.details ?? defaultFl100.otherRequests.details,
        continuedOnAttachment: workspace.fl100?.otherRequests?.continuedOnAttachment ?? defaultFl100.otherRequests.continuedOnAttachment,
      },
      signatureDate: workspace.fl100?.signatureDate ?? defaultFl100.signatureDate,
      formerName: workspace.fl100?.formerName ?? defaultFl100.formerName,
    },
    fl110: { includeForm: workspace.fl110?.includeForm ?? createField(true, { sourceType: 'manual', sourceLabel: 'Default starter packet form', confidence: 'medium', needsReview: false }) },
    fl300: {
      includeForm: workspace.fl300?.includeForm ?? defaultFl300.includeForm,
      requestTypes: { ...defaultFl300.requestTypes, ...(workspace.fl300?.requestTypes ?? {}) },
      requestedAgainst: { ...defaultFl300.requestedAgainst, ...(workspace.fl300?.requestedAgainst ?? {}) },
      hearing: { ...defaultFl300.hearing, ...(workspace.fl300?.hearing ?? {}) },
      service: { ...defaultFl300.service, ...(workspace.fl300?.service ?? {}) },
      custodyMediation: { ...defaultFl300.custodyMediation, ...(workspace.fl300?.custodyMediation ?? {}) },
      temporaryEmergencyFl305Applies: workspace.fl300?.temporaryEmergencyFl305Applies ?? defaultFl300.temporaryEmergencyFl305Applies,
      otherCourtOrders: workspace.fl300?.otherCourtOrders ?? defaultFl300.otherCourtOrders,
      restrainingOrderInfo: { ...defaultFl300.restrainingOrderInfo, ...(workspace.fl300?.restrainingOrderInfo ?? {}) },
      custodyRequests: { ...defaultFl300.custodyRequests, ...(workspace.fl300?.custodyRequests ?? {}) },
      supportRequests: { ...defaultFl300.supportRequests, ...(workspace.fl300?.supportRequests ?? {}) },
      propertyControl: { ...defaultFl300.propertyControl, ...(workspace.fl300?.propertyControl ?? {}) },
      attorneyFees: { ...defaultFl300.attorneyFees, ...(workspace.fl300?.attorneyFees ?? {}) },
      otherOrdersRequested: workspace.fl300?.otherOrdersRequested ?? defaultFl300.otherOrdersRequested,
      facts: workspace.fl300?.facts ?? defaultFl300.facts,
      signatureDate: workspace.fl300?.signatureDate ?? defaultFl300.signatureDate,
      typePrintName: workspace.fl300?.typePrintName ?? defaultFl300.typePrintName,
    },
    fl140: { ...defaultFl140, ...(workspace.fl140 ?? {}) },
    fl141: { ...defaultFl141, ...(workspace.fl141 ?? {}) },
    fl142: {
      ...defaultFl142,
      ...(workspace.fl142 ?? {}),
      assets: { ...defaultFl142.assets, ...(workspace.fl142?.assets ?? {}) },
      debts: { ...defaultFl142.debts, ...(workspace.fl142?.debts ?? {}) },
    },
    fl115: { ...defaultFl115, ...(workspace.fl115 ?? {}) },
    fl117: { ...defaultFl117, ...(workspace.fl117 ?? {}) },
    fl120: { ...defaultFl120, ...(workspace.fl120 ?? {}) },
    fl160: { ...defaultFl160, ...(workspace.fl160 ?? {}) },
    fl342: { ...defaultFl342, ...(workspace.fl342 ?? {}) },
    fl343: { ...defaultFl343, ...(workspace.fl343 ?? {}) },
    fl130: { ...defaultFl130, ...(workspace.fl130 ?? {}) },
    fl144: { ...defaultFl144, ...(workspace.fl144 ?? {}) },
    fl170: { ...defaultFl170, ...(workspace.fl170 ?? {}) },
    fl180: { ...defaultFl180, ...(workspace.fl180 ?? {}) },
    fl190: { ...defaultFl190, ...(workspace.fl190 ?? {}) },
    fl345: { ...defaultFl345, ...(workspace.fl345 ?? {}) },
    fl348: { ...defaultFl348, ...(workspace.fl348 ?? {}) },
    fl165: { ...defaultFl165, ...(workspace.fl165 ?? {}) },
    fl182: { ...defaultFl182, ...(workspace.fl182 ?? {}) },
    fl191: { ...defaultFl191, ...(workspace.fl191 ?? {}) },
    fl195: { ...defaultFl195, ...(workspace.fl195 ?? {}) },
    fl272: { ...defaultFl272, ...(workspace.fl272 ?? {}) },
    fl342a: { ...defaultFl342a, ...(workspace.fl342a ?? {}) },
    fl346: { ...defaultFl346, ...(workspace.fl346 ?? {}) },
    fl347: { ...defaultFl347, ...(workspace.fl347 ?? {}) },
    fl435: { ...defaultFl435, ...(workspace.fl435 ?? {}) },
    fl460: { ...defaultFl460, ...(workspace.fl460 ?? {}) },
    fl830: { ...defaultFl830, ...(workspace.fl830 ?? {}) },
    fw001: { ...defaultFw001, ...(workspace.fw001 ?? {}) },
    fw003: { ...defaultFw003, ...(workspace.fw003 ?? {}) },
    fw010: { ...defaultFw010, ...(workspace.fw010 ?? {}) },
    dv100: { ...defaultDv100, ...(workspace.dv100 ?? {}) },
    dv101: { ...defaultDv101, ...(workspace.dv101 ?? {}) },
    dv105: { ...defaultDv105, ...(workspace.dv105 ?? {}) },
    dv108: { ...defaultDv108, ...(workspace.dv108 ?? {}) },
    dv109: { ...defaultDv109, ...(workspace.dv109 ?? {}) },
    dv110: { ...defaultDv110, ...(workspace.dv110 ?? {}) },
    dv120: { ...defaultDv120, ...(workspace.dv120 ?? {}) },
    dv130: { ...defaultDv130, ...(workspace.dv130 ?? {}) },
    dv140: { ...defaultDv140, ...(workspace.dv140 ?? {}) },
    dv200: { ...defaultDv200, ...(workspace.dv200 ?? {}) },
    fl150: mergeFl150Section(workspace.fl150, defaultFl150),
    fl105: {
      representationRole: workspace.fl105?.representationRole ?? defaultFl105.representationRole,
      authorizedRepresentativeAgencyName: workspace.fl105?.authorizedRepresentativeAgencyName
        ?? defaultFl105.authorizedRepresentativeAgencyName,
      childrenLivedTogetherPastFiveYears: workspace.fl105?.childrenLivedTogetherPastFiveYears ?? defaultFl105.childrenLivedTogetherPastFiveYears,
      childrenResidenceAssertionReviewed: workspace.fl105?.childrenResidenceAssertionReviewed
        ?? defaultFl105.childrenResidenceAssertionReviewed,
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
      additionalChildrenAttachments: normalizedChildren.slice(1).map((child) => {
        const existing = additionalChildrenAttachmentByChildId.get(child.id);
        const fallback = createBlankAdditionalChildAttachment(child.id);

        return {
          id: existing?.id ?? fallback.id,
          childId: child.id,
          sameResidenceAsChildA: existing?.sameResidenceAsChildA ?? fallback.sameResidenceAsChildA,
          sameResidenceReviewed: existing?.sameResidenceReviewed ?? fallback.sameResidenceReviewed,
          residenceHistory: Array.isArray(existing?.residenceHistory) && existing.residenceHistory.length > 0
            ? existing.residenceHistory.map((entry) => ({
              id: entry.id ?? uuidv4(),
              fromDate: entry.fromDate ?? createField('', { needsReview: true }),
              toDate: entry.toDate ?? createField('', { needsReview: false }),
              residence: entry.residence ?? createField('', { needsReview: true }),
              personAndAddress: entry.personAndAddress ?? createField('', { needsReview: true }),
              relationship: entry.relationship ?? createField('', { needsReview: true }),
            }))
            : fallback.residenceHistory,
          residenceAddressConfidentialStateOnly:
            existing?.residenceAddressConfidentialStateOnly ?? fallback.residenceAddressConfidentialStateOnly,
          personAddressConfidentialStateOnly:
            existing?.personAddressConfidentialStateOnly ?? fallback.personAddressConfidentialStateOnly,
        };
      }),
      residenceAddressConfidentialStateOnly: workspace.fl105?.residenceAddressConfidentialStateOnly
        ?? defaultFl105.residenceAddressConfidentialStateOnly,
      personAddressConfidentialStateOnly: workspace.fl105?.personAddressConfidentialStateOnly
        ?? defaultFl105.personAddressConfidentialStateOnly,
      additionalResidenceAddressesOnAttachment3a: workspace.fl105?.additionalResidenceAddressesOnAttachment3a
        ?? defaultFl105.additionalResidenceAddressesOnAttachment3a,
      otherProceedingsKnown: workspace.fl105?.otherProceedingsKnown ?? defaultFl105.otherProceedingsKnown,
      otherProceedingsAssertionReviewed: workspace.fl105?.otherProceedingsAssertionReviewed
        ?? defaultFl105.otherProceedingsAssertionReviewed,
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
      domesticViolenceOrdersAssertionReviewed: workspace.fl105?.domesticViolenceOrdersAssertionReviewed
        ?? defaultFl105.domesticViolenceOrdersAssertionReviewed,
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
      otherClaimantsAssertionReviewed: workspace.fl105?.otherClaimantsAssertionReviewed
        ?? defaultFl105.otherClaimantsAssertionReviewed,
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
      attachmentsIncluded: workspace.fl105?.attachmentsIncluded ?? defaultFl105.attachmentsIncluded,
      attachmentPageCount: workspace.fl105?.attachmentPageCount ?? defaultFl105.attachmentPageCount,
      declarantName: workspace.fl105?.declarantName ?? defaultFl105.declarantName,
      signatureDate: workspace.fl105?.signatureDate ?? defaultFl105.signatureDate,
    },
  };
}

function getPetitionerName(user: User) {
  const first = user.profile?.firstName?.trim();
  const last = user.profile?.lastName?.trim();
  const combined = [first, last].filter(Boolean).join(' ').trim();
  return combined || user.name?.trim() || '';
}

const CHAT_PREFILL_SOURCE = Object.freeze({
  sourceType: 'chat' as const,
  sourceLabel: 'Maria chat intake',
  confidence: 'low' as const,
  needsReview: true,
});

const CALIFORNIA_COUNTIES = [
  'Alameda', 'Alpine', 'Amador', 'Butte', 'Calaveras', 'Colusa', 'Contra Costa', 'Del Norte', 'El Dorado',
  'Fresno', 'Glenn', 'Humboldt', 'Imperial', 'Inyo', 'Kern', 'Kings', 'Lake', 'Lassen', 'Los Angeles',
  'Madera', 'Marin', 'Mariposa', 'Mendocino', 'Merced', 'Modoc', 'Mono', 'Monterey', 'Napa', 'Nevada',
  'Orange', 'Placer', 'Plumas', 'Riverside', 'Sacramento', 'San Benito', 'San Bernardino', 'San Diego',
  'San Francisco', 'San Joaquin', 'San Luis Obispo', 'San Mateo', 'Santa Barbara', 'Santa Clara', 'Santa Cruz',
  'Shasta', 'Sierra', 'Siskiyou', 'Solano', 'Sonoma', 'Stanislaus', 'Sutter', 'Tehama', 'Trinity', 'Tulare',
  'Tuolumne', 'Ventura', 'Yolo', 'Yuba',
];

interface DraftFormsChatHandoffCache {
  userId: string;
  sessionId?: string;
  updatedAt: string;
  messages: ChatMessage[];
}

interface ChatIntakePrefill {
  caseNumber?: string;
  filingCounty?: string;
  petitionerName?: string;
  petitionerAddress?: string;
  petitionerPhone?: string;
  petitionerEmail?: string;
  respondentName?: string;
  marriageDate?: string;
  separationDate?: string;
  hasMinorChildren?: boolean;
  children: Array<{ fullName?: string; age?: string }>;
  fl150: {
    employer?: string;
    employerAddress?: string;
    employerPhone?: string;
    occupation?: string;
    hoursPerWeek?: string;
    payAmount?: string;
    payPeriod?: DraftFl150PayPeriod;
    salaryAverageMonthly?: string;
    otherPartyIncome?: string;
    rentOrMortgage?: string;
    groceriesHousehold?: string;
    utilities?: string;
    phoneExpense?: string;
    auto?: string;
    autoInsurance?: string;
    childCareCosts?: string;
    healthCareCostsNotCovered?: string;
    medicalInsuranceDeduction?: string;
    cashChecking?: string;
    savingsCreditUnion?: string;
    monthlyDebtPayments?: string;
  };
}

function truncateIntakeText(text: string, maxLength = 16000) {
  const trimmed = text.trim();
  return trimmed.length <= maxLength ? trimmed : trimmed.slice(trimmed.length - maxLength).trim();
}

function formatChatHandoffMessages(messages: ChatMessage[]) {
  const transcript = messages
    .filter((message) => message.content.trim() || (message.attachments?.length ?? 0) > 0)
    .map((message) => {
      const speaker = message.role === 'assistant' ? 'Maria' : 'User';
      const attachments = message.attachments?.length
        ? `\nAttachments: ${message.attachments.map((attachment) => attachment.name).join(', ')}`
        : '';
      const draftContext = message.draftContext?.trim()
        ? `\nUploaded/extracted form context:\n${message.draftContext.trim()}`
        : '';
      return `${speaker}: ${message.content.trim()}${attachments}${draftContext}`.trim();
    })
    .join('\n\n---\n\n');

  return truncateIntakeText(transcript);
}

function cleanExtractedValue(value?: string) {
  return (value ?? '')
    .replace(/^[\s:"'“”]+|[\s,"'“”]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractLabelValue(text: string, labels: string[]) {
  for (const label of labels) {
    const expression = new RegExp(`(?:^|[\\n.;,:])\\s*(?:${label})(?:\\s*\\([^\\n)]{1,80}\\))?\\s*(?:is|are|:|=|-)\\s*([^\\n.;]+)`, 'i');
    const match = text.match(expression);
    const value = cleanExtractedValue(match?.[1]);
    if (value) return value;

    const nextLineExpression = new RegExp(`(?:^|[\\n.;,:])\\s*(?:${label})\\s*\\n\\s*([^\\n.;]+)`, 'i');
    const nextLineMatch = text.match(nextLineExpression);
    const nextLineValue = cleanExtractedValue(nextLineMatch?.[1]);
    if (nextLineValue) return nextLineValue;
  }
  return '';
}

function extractDateByLabel(text: string, labels: string[]) {
  const datePattern = '([A-Za-z]+\\s+\\d{1,2},?\\s+\\d{4}|\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}|\\d{4}-\\d{2}-\\d{2})';
  for (const label of labels) {
    const expression = new RegExp(`(?:${label})[^\\n.]{0,40}?${datePattern}`, 'i');
    const match = text.match(expression);
    const normalized = normalizeDateInput(match?.[1]);
    if (normalized) return normalized;
  }
  return '';
}

function normalizeDateInput(raw?: string) {
  const value = cleanExtractedValue(raw);
  if (!value) return '';
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return value;

  const slashMatch = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slashMatch) {
    const [, monthRaw, dayRaw, yearRaw] = slashMatch;
    const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
    const month = monthRaw.padStart(2, '0');
    const day = dayRaw.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(value.replace(/(\d)(st|nd|rd|th)\b/i, '$1'));
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return '';
}

function extractCounty(text: string) {
  const explicit = text.match(/\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})\s+County\b/);
  if (explicit?.[1]) return cleanExtractedValue(explicit[1]);
  const lowerText = text.toLowerCase();
  return CALIFORNIA_COUNTIES.find((county) => lowerText.includes(county.toLowerCase())) ?? '';
}

function extractEmail(text: string) {
  return cleanExtractedValue(text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0]);
}

function extractPhoneByLabel(text: string) {
  const labelled = extractLabelValue(text, ['(?:my\\s+)?phone(?:\\s+number)?', 'petitioner\\s+phone(?:\\s+number)?']);
  const fromLabel = labelled.match(/(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/)?.[0];
  if (fromLabel) return cleanExtractedValue(fromLabel);
  return cleanExtractedValue(text.match(/\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/)?.[0]);
}

function cleanMoney(value?: string) {
  return cleanExtractedValue(value).replace(/^\$/, '').trim();
}

function inferPayPeriod(text: string): DraftFl150PayPeriod | undefined {
  if (/\b(?:per|a|each)\s+month\b|\bmonthly\b/i.test(text)) return 'month';
  if (/\b(?:per|a|each)\s+week\b|\bweekly\b/i.test(text)) return 'week';
  if (/\b(?:per|an|each)\s+hour\b|\bhourly\b/i.test(text)) return 'hour';
  return undefined;
}

function extractMoneyByPatterns(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = cleanMoney(match?.[1]);
    if (value) return value;
  }
  return '';
}

function extractAnswerAfterMariaPrompt(text: string, questionPatterns: RegExp[]) {
  const blocks = text
    .split(/\n\n---\n\n/g)
    .map((block) => block.trim())
    .filter(Boolean);

  for (let index = blocks.length - 2; index >= 0; index -= 1) {
    const mariaBlock = blocks[index];
    const userBlock = blocks[index + 1];
    if (!/^Maria:/i.test(mariaBlock) || !/^User:/i.test(userBlock)) continue;
    if (!questionPatterns.some((pattern) => pattern.test(mariaBlock))) continue;
    const answer = cleanExtractedValue(userBlock.replace(/^User:\s*/i, ''));
    if (answer) return answer;
  }

  return '';
}

function extractMoneyAfterMariaPrompt(text: string, questionPatterns: RegExp[]) {
  const answer = extractAnswerAfterMariaPrompt(text, questionPatterns);
  if (!answer) return '';
  const money = answer.match(/\$?([\d,]+(?:\.\d{2})?)/)?.[1];
  return cleanMoney(money);
}

function extractEmployer(text: string) {
  const answer = extractAnswerAfterMariaPrompt(text, [/employer/i, /where\s+do\s+you\s+work/i, /who\s+do\s+you\s+work\s+(?:for|at)/i]);
  if (answer) return answer;
  const match = text.match(/\b(?:my\s+)?(?:employer\s*(?:is|:)|I\s+work\s+(?:at|for))\s+([^\n.;]+?)(?:\s+(?:as|doing|making|earning)\b|[\n.;]|$)/i);
  return cleanExtractedValue(match?.[1]);
}

function extractOccupation(text: string) {
  const answer = extractAnswerAfterMariaPrompt(text, [/occupation/i, /job\s+title/i, /what\s+kind\s+of\s+work/i, /what\s+do\s+you\s+do/i]);
  if (answer) return answer;
  return extractLabelValue(text, ['occupation', 'job(?:\s+title)?', 'work'])
    || cleanExtractedValue(text.match(/\bI\s+work\s+(?:at|for)\s+[^\n.;]+?\s+(?:as|doing)\s+([^,\n.;]+)/i)?.[1])
    || cleanExtractedValue(text.match(/\b(?:I\s+work\s+(?:as|doing)|I\s+am\s+(?:a|an))\s+([^,\n.;]+)/i)?.[1]);
}

function extractFl150ChatPrefill(text: string): ChatIntakePrefill['fl150'] {
  const paySentence = text.match(/\b(?:I\s+)?(?:make|earn|get paid|gross|income(?:\s+is)?)\s+\$?([\d,]+(?:\.\d{2})?)([^\n.;]{0,40})/i);
  const payAmount = cleanMoney(paySentence?.[1]);
  const payPeriod = inferPayPeriod(paySentence?.[0] ?? text);

  return {
    employer: extractEmployer(text) || extractLabelValue(text, ['FL-150\\.employer', 'Employer_tf\\[0\\]', 'employer', 'company']),
    employerAddress: extractAnswerAfterMariaPrompt(text, [/employer.*address/i, /work.*address/i]) || extractLabelValue(text, ['FL-150\\.employerAddress', 'Employer_address_tf\\[0\\]', 'employer\s+address', 'work\s+address']),
    employerPhone: extractAnswerAfterMariaPrompt(text, [/employer.*phone/i, /work.*phone/i]) || extractLabelValue(text, ['FL-150\\.employerPhone', 'ft\\[0\\]', 'employer\s+phone', 'work\s+phone']),
    occupation: extractOccupation(text) || extractLabelValue(text, ['FL-150\\.occupation', 'Party_occupation_tf\\[0\\]']),
    hoursPerWeek: extractLabelValue(text, ['FL-150\\.hoursPerWeek', 'hours_tf\\[0\\]']) || cleanExtractedValue(text.match(/\b(\d{1,3})\s+(?:hours|hrs)\s+(?:per\s+)?week\b/i)?.[1])
      || cleanExtractedValue(extractAnswerAfterMariaPrompt(text, [/hours.*week/i, /how\s+many\s+hours/i]).match(/\d{1,3}/)?.[0]),
    payAmount: payAmount || cleanMoney(extractLabelValue(text, ['FL-150\\.payAmount', 'gross_tf\\[0\\]'])) || extractMoneyAfterMariaPrompt(text, [/how\s+much\s+do\s+you\s+(?:make|earn|get\s+paid)/i, /income/i, /pay/i, /wages/i, /salary/i]),
    payPeriod: payPeriod || inferPayPeriod(extractAnswerAfterMariaPrompt(text, [/how\s+much\s+do\s+you\s+(?:make|earn|get\s+paid)/i, /income/i, /pay/i, /wages/i, /salary/i])),
    salaryAverageMonthly: extractMoneyByPatterns(text, [
      /FL-150\.income\.salaryWages\.averageMonthly(?:\s*\([^)]*\))?\s*(?::|=|-)\s*\$?([\d,]+(?:\.\d{2})?)/i,
      /\b(?:monthly\s+income|gross\s+monthly\s+income|income\s+per\s+month)\s*(?:is|:)?\s*\$?([\d,]+(?:\.\d{2})?)/i,
      /\b(?:I\s+)?(?:make|earn|get paid)\s+\$?([\d,]+(?:\.\d{2})?)\s+(?:per\s+month|a\s+month|monthly)\b/i,
    ]),
    otherPartyIncome: extractMoneyByPatterns(text, [
      /(?:FL-150\.otherPartyGrossMonthlyIncome|FillTextincm\[0\])(?:\s*\([^)]*\))?\s*(?::|=|-)\s*\$?([\d,]+(?:\.\d{2})?)/i,
      /\b(?:other\s+party|spouse|respondent)\s+(?:makes|earns|income(?:\s+is)?)\s+\$?([\d,]+(?:\.\d{2})?)/i,
      /\b(?:other\s+party|spouse|respondent).*?gross\s+monthly\s+income.*?\$?([\d,]+(?:\.\d{2})?)/i,
    ]),
    rentOrMortgage: extractMoneyByPatterns(text, [/FL-150\.expenses\.rentOrMortgage(?:\s*\([^)]*\))?\s*(?::|=|-)\s*\$?([\d,]+(?:\.\d{2})?)/i, /\b(?:rent|mortgage)\s*(?:is|:|costs?)?\s*\$?([\d,]+(?:\.\d{2})?)/i]) || extractMoneyAfterMariaPrompt(text, [/rent/i, /mortgage/i, /housing/i]),
    groceriesHousehold: extractMoneyByPatterns(text, [/\b(?:groceries|food|household)\s*(?:are|is|:|costs?)?\s*\$?([\d,]+(?:\.\d{2})?)/i]) || extractMoneyAfterMariaPrompt(text, [/groceries/i, /food/i, /household/i]),
    utilities: extractMoneyByPatterns(text, [/FL-150\.expenses\.utilities(?:\s*\([^)]*\))?\s*(?::|=|-)\s*\$?([\d,]+(?:\.\d{2})?)/i, /\butilities\s*(?:are|is|:|costs?)?\s*\$?([\d,]+(?:\.\d{2})?)/i]) || extractMoneyAfterMariaPrompt(text, [/utilities/i]),
    phoneExpense: extractMoneyByPatterns(text, [/FL-150\.expenses\.telephone(?:\s*\([^)]*\))?\s*(?::|=|-)\s*\$?([\d,]+(?:\.\d{2})?)/i, /\b(?:phone\s+bill|cell\s+phone)\s*(?:is|:|costs?)?\s*\$?([\d,]+(?:\.\d{2})?)/i]) || extractMoneyAfterMariaPrompt(text, [/phone\s+bill/i, /cell\s+phone/i]),
    auto: extractMoneyByPatterns(text, [/\b(?:car\s+payment|auto\s+payment|vehicle\s+payment)\s*(?:is|:)?\s*\$?([\d,]+(?:\.\d{2})?)/i]) || extractMoneyAfterMariaPrompt(text, [/car\s+payment/i, /auto\s+payment/i, /vehicle\s+payment/i]),
    autoInsurance: extractMoneyByPatterns(text, [/FL-150\.expenses\.autoInsurance(?:\s*\([^)]*\))?\s*(?::|=|-)\s*\$?([\d,]+(?:\.\d{2})?)/i, /\b(?:car|auto|vehicle)\s+insurance\s*(?:is|:|costs?)?\s*\$?([\d,]+(?:\.\d{2})?)/i]) || extractMoneyAfterMariaPrompt(text, [/car.*insurance/i, /auto.*insurance/i, /vehicle.*insurance/i]),
    childCareCosts: extractMoneyByPatterns(text, [/\b(?:child\s*care|daycare)\s*(?:is|:|costs?)?\s*\$?([\d,]+(?:\.\d{2})?)/i]) || extractMoneyAfterMariaPrompt(text, [/child\s*care/i, /daycare/i]),
    healthCareCostsNotCovered: extractMoneyByPatterns(text, [/\b(?:unreimbursed|uncovered)\s+(?:medical|health(?:\s+care)?)\s*(?:is|:|costs?)?\s*\$?([\d,]+(?:\.\d{2})?)/i]) || extractMoneyAfterMariaPrompt(text, [/unreimbursed/i, /uncovered.*(?:medical|health)/i]),
    medicalInsuranceDeduction: extractMoneyByPatterns(text, [/\b(?:health|medical)\s+insurance\s*(?:is|:|costs?)?\s*\$?([\d,]+(?:\.\d{2})?)/i]) || extractMoneyAfterMariaPrompt(text, [/(?:health|medical).*insurance/i]),
    cashChecking: extractMoneyByPatterns(text, [/\b(?:cash|checking)\s*(?:is|:)?\s*\$?([\d,]+(?:\.\d{2})?)/i]) || extractMoneyAfterMariaPrompt(text, [/cash/i, /checking/i]),
    savingsCreditUnion: extractMoneyByPatterns(text, [/\b(?:savings|credit\s+union)\s*(?:is|:)?\s*\$?([\d,]+(?:\.\d{2})?)/i]) || extractMoneyAfterMariaPrompt(text, [/savings/i, /credit\s+union/i]),
    monthlyDebtPayments: extractMoneyByPatterns(text, [/\b(?:debt\s+payments?|monthly\s+debt)\s*(?:are|is|:)?\s*\$?([\d,]+(?:\.\d{2})?)/i]) || extractMoneyAfterMariaPrompt(text, [/debt/i]),
  };
}

function extractChildrenFromChat(text: string, user: User): ChatIntakePrefill['children'] {
  const children: ChatIntakePrefill['children'] = [];
  const namedChildren = extractLabelValue(text, [
    'children(?:\\s+are|\\s+names?)?',
    'kids(?:\\s+are|\\s+names?)?',
    'minor children(?:\\s+are|\\s+names?)?',
  ]);

  if (namedChildren) {
    namedChildren
      .split(/\s*(?:,| and | &)\s*/i)
      .map((part) => cleanExtractedValue(part).replace(/\b(?:age|aged)\s*\d{1,2}\b/i, '').trim())
      .filter((part) => part.length > 0 && !/^\d+$/.test(part))
      .slice(0, 8)
      .forEach((fullName) => children.push({ fullName }));
  }

  const countMatch = text.match(/\b(?:we have|have|has)\s+(\d+)\s+(?:minor\s+)?(?:children|kids)\b/i);
  const profileCount = user.profile?.childrenCount;
  const count = Number(countMatch?.[1] ?? profileCount ?? 0);
  if (Number.isFinite(count) && count > children.length) {
    for (let index = children.length; index < Math.min(count, 8); index += 1) {
      children.push({ age: user.profile?.childrenAges?.[index]?.toString() });
    }
  }

  return children;
}

function extractChatIntakePrefill(user: User, text: string): ChatIntakePrefill {
  const combined = truncateIntakeText(text);
  const children = extractChildrenFromChat(combined, user);
  const hasChildrenFromText = /\b(?:minor children|children|kids|custody|parenting time|visitation|child support)\b/i.test(combined);

  return {
    caseNumber: extractLabelValue(combined, ['case(?:\\s+number|\\s+no\\.?)']),
    filingCounty: extractCounty(combined),
    petitionerName: extractLabelValue(combined, ['petitioner(?:\\s+name)?', 'my\\s+name']),
    petitionerAddress: extractLabelValue(combined, ['(?:my\\s+)?address', 'petitioner\\s+address', 'mailing\\s+address']),
    petitionerPhone: extractPhoneByLabel(combined),
    petitionerEmail: extractLabelValue(combined, ['(?:my\\s+)?email', 'petitioner\\s+email']) || extractEmail(combined),
    respondentName: extractLabelValue(combined, ['respondent(?:\\s+name)?', "(?:my\\s+)?spouse(?:'s)?\\s+name", "(?:my\\s+)?husband(?:'s)?\\s+name", "(?:my\\s+)?wife(?:'s)?\\s+name", "(?:the\\s+)?other\\s+party(?:'s)?\\s+name"]),
    marriageDate: extractDateByLabel(combined, ['married', 'date\\s+of\\s+marriage', 'marriage\\s+date']),
    separationDate: extractDateByLabel(combined, ['separated', 'date\\s+of\\s+separation', 'separation\\s+date']),
    hasMinorChildren: typeof user.profile?.hasChildren === 'boolean' ? user.profile.hasChildren : children.length > 0 || hasChildrenFromText || undefined,
    children,
    fl150: extractFl150ChatPrefill(combined),
  };
}

function createChatField<T>(value: T, needsReview = true): DraftField<T> {
  return createField(value, { ...CHAT_PREFILL_SOURCE, needsReview });
}

function addIntakeFact(
  facts: DraftIntakeFact[],
  path: string[],
  label: string,
  value: string | boolean | undefined,
  sourceLabel = 'Maria chat intake',
  sourceType: DraftFieldSourceType = 'chat',
) {
  if (value === undefined) return;
  if (typeof value === 'string' && value.trim().length === 0) return;
  facts.push({
    id: uuidv4(),
    path,
    label,
    value,
    sourceType,
    sourceLabel,
    confidence: 'low',
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
}

function buildIntakeFactsFromChatPrefill(prefill: ChatIntakePrefill, sourceLabel = 'Maria chat intake', sourceType: DraftFieldSourceType = 'chat'): DraftIntakeFact[] {
  const facts: DraftIntakeFact[] = [];
  addIntakeFact(facts, ['caseNumber'], 'Case number', prefill.caseNumber, sourceLabel, sourceType);
  addIntakeFact(facts, ['filingCounty'], 'Filing county', prefill.filingCounty, sourceLabel, sourceType);
  addIntakeFact(facts, ['petitionerName'], 'Petitioner name', prefill.petitionerName, sourceLabel, sourceType);
  addIntakeFact(facts, ['petitionerAddress'], 'Petitioner address', prefill.petitionerAddress, sourceLabel, sourceType);
  addIntakeFact(facts, ['petitionerPhone'], 'Petitioner phone', prefill.petitionerPhone, sourceLabel, sourceType);
  addIntakeFact(facts, ['petitionerEmail'], 'Petitioner email', prefill.petitionerEmail, sourceLabel, sourceType);
  addIntakeFact(facts, ['respondentName'], 'Respondent name', prefill.respondentName, sourceLabel, sourceType);
  addIntakeFact(facts, ['marriageDate'], 'Marriage date', prefill.marriageDate, sourceLabel, sourceType);
  addIntakeFact(facts, ['separationDate'], 'Separation date', prefill.separationDate, sourceLabel, sourceType);
  addIntakeFact(facts, ['hasMinorChildren'], 'Has minor children', prefill.hasMinorChildren, sourceLabel, sourceType);
  prefill.children.forEach((child, index) => {
    addIntakeFact(facts, ['children', String(index), 'fullName'], `Child ${index + 1} full name`, child.fullName, sourceLabel, sourceType);
    addIntakeFact(facts, ['children', String(index), 'birthDate'], `Child ${index + 1} age mentioned`, child.age, sourceLabel, sourceType);
  });
  addIntakeFact(facts, ['fl150', 'employment', 'employerName'], 'FL-150 employer', prefill.fl150.employer, sourceLabel, sourceType);
  addIntakeFact(facts, ['fl150', 'employment', 'employerAddress'], 'FL-150 employer address', prefill.fl150.employerAddress, sourceLabel, sourceType);
  addIntakeFact(facts, ['fl150', 'employment', 'employerPhone'], 'FL-150 employer phone', prefill.fl150.employerPhone, sourceLabel, sourceType);
  addIntakeFact(facts, ['fl150', 'employment', 'occupation'], 'FL-150 occupation', prefill.fl150.occupation, sourceLabel, sourceType);
  addIntakeFact(facts, ['fl150', 'employment', 'hoursPerWeek'], 'FL-150 hours per week', prefill.fl150.hoursPerWeek, sourceLabel, sourceType);
  addIntakeFact(facts, ['fl150', 'income', 'salaryWages', 'averageMonthly'], 'FL-150 average monthly salary/wages', prefill.fl150.salaryAverageMonthly, sourceLabel, sourceType);
  addIntakeFact(facts, ['fl150', 'expenses', 'rentOrMortgage'], 'FL-150 rent/mortgage', prefill.fl150.rentOrMortgage, sourceLabel, sourceType);
  addIntakeFact(facts, ['fl150', 'expenses', 'groceriesHousehold'], 'FL-150 groceries/household supplies', prefill.fl150.groceriesHousehold, sourceLabel, sourceType);
  addIntakeFact(facts, ['fl150', 'expenses', 'utilities'], 'FL-150 utilities', prefill.fl150.utilities, sourceLabel, sourceType);
  addIntakeFact(facts, ['fl150', 'expenses', 'phoneExpense'], 'FL-150 phone expense', prefill.fl150.phoneExpense, sourceLabel, sourceType);
  addIntakeFact(facts, ['fl150', 'expenses', 'auto'], 'FL-150 auto expense', prefill.fl150.auto, sourceLabel, sourceType);
  addIntakeFact(facts, ['fl150', 'expenses', 'autoInsurance'], 'FL-150 auto insurance', prefill.fl150.autoInsurance, sourceLabel, sourceType);
  addIntakeFact(facts, ['fl150', 'childrenSupport', 'childCareCosts'], 'FL-150 child care costs', prefill.fl150.childCareCosts, sourceLabel, sourceType);
  addIntakeFact(facts, ['fl150', 'childrenSupport', 'healthCareCostsNotCovered'], 'FL-150 uncovered health care costs', prefill.fl150.healthCareCostsNotCovered, sourceLabel, sourceType);
  addIntakeFact(facts, ['fl150', 'deductions', 'medicalInsurance'], 'FL-150 medical insurance deduction', prefill.fl150.medicalInsuranceDeduction, sourceLabel, sourceType);
  addIntakeFact(facts, ['fl150', 'assets', 'cashChecking'], 'FL-150 cash/checking', prefill.fl150.cashChecking, sourceLabel, sourceType);
  addIntakeFact(facts, ['fl150', 'assets', 'savingsCreditUnion'], 'FL-150 savings/credit union', prefill.fl150.savingsCreditUnion, sourceLabel, sourceType);
  addIntakeFact(facts, ['fl150', 'expenses', 'monthlyDebtPayments'], 'FL-150 monthly debt payments', prefill.fl150.monthlyDebtPayments, sourceLabel, sourceType);
  return facts;
}

function buildIntakeFactsFromMessages(user: User, messages: ChatMessage[], conversationContext: string, sourceLabel = 'Maria chat intake') {
  const facts = buildIntakeFactsFromChatPrefill(extractChatIntakePrefill(user, conversationContext), sourceLabel, 'chat');
  messages.forEach((message) => {
    const uploadContext = message.draftContext?.trim();
    if (!uploadContext) return;
    const attachmentLabel = message.attachments?.length
      ? `Uploaded file(s): ${message.attachments.map((attachment) => attachment.name).join(', ')}`
      : 'Uploaded document context';
    facts.push(...buildIntakeFactsFromChatPrefill(extractChatIntakePrefill(user, uploadContext), attachmentLabel, 'upload'));
  });
  return facts;
}

function createSupportSnapshotField<T>(value: T): DraftField<T> {
  return createField(value, {
    sourceType: 'support-snapshot',
    sourceLabel: 'Saved support estimator snapshot',
    confidence: 'medium',
    needsReview: true,
  });
}

function withChatValue<T>(field: DraftField<T>, value: T | undefined) {
  if (value === undefined) return field;
  if (typeof value === 'string' && value.trim().length === 0) return field;
  if (typeof field.value === 'string' && field.value.trim().length > 0 && field.value !== 'unspecified') return field;
  if (typeof field.value === 'boolean' && field.value) return field;
  return createChatField(value);
}

function withSupportSnapshotValue<T>(field: DraftField<T>, value: T | undefined) {
  if (value === undefined) return field;
  if (typeof value === 'string' && value.trim().length === 0) return field;
  if (typeof field.value === 'string' && field.value.trim().length > 0 && field.value !== 'unspecified') return field;
  if (typeof field.value === 'boolean' && field.value) return field;
  return createSupportSnapshotField(value);
}

function formatSupportSnapshotNotes(scenario: SupportScenario) {
  const snapshot = scenario.snapshot;
  return [
    `Saved support estimator snapshot: ${scenario.title}`,
    `Saved: ${new Date(scenario.createdAt).toLocaleString()}`,
    `Estimated child support: $${Math.round(scenario.childSupport).toLocaleString()}`,
    `Estimated temporary spousal support: $${Math.round(scenario.spousalSupport).toLocaleString()}`,
    `Estimated combined support: $${Math.round(scenario.combinedSupport).toLocaleString()}`,
    `Estimated payer: ${scenario.estimatePayer}`,
    `County: ${snapshot.countyName || snapshot.countyId || 'not specified'}`,
    `Parent A/Petitioner net monthly income: $${Math.round(snapshot.parentAIncome).toLocaleString()}`,
    `Parent B/Respondent net monthly income: $${Math.round(snapshot.parentBIncome).toLocaleString()}`,
    `Parent A/Petitioner timeshare: ${snapshot.parentATimeShare}%`,
    `Children covered: ${snapshot.childrenCount}`,
    `Childcare add-on: $${Math.round(snapshot.childcare).toLocaleString()}`,
    `Medical add-on: $${Math.round(snapshot.medical).toLocaleString()}`,
    `Mode: ${snapshot.mode === 'advanced' ? 'Advanced gross/net capture' : 'Quick net mode'}`,
    'Review these estimator numbers before filing; they are planning estimates, not certified guideline calculations.',
  ].join('\n');
}

export function hydrateDraftWorkspaceFromSupportScenario(workspace: DraftFormsWorkspace, scenario?: SupportScenario | null): DraftFormsWorkspace {
  if (!scenario) return workspace;

  const snapshot = scenario.snapshot;
  const childSupportText = scenario.childSupport > 0 ? `$${Math.round(scenario.childSupport).toLocaleString()} estimated guideline child support (${scenario.estimatePayer})` : '';
  const spousalSupportText = scenario.spousalSupport > 0 ? `$${Math.round(scenario.spousalSupport).toLocaleString()} estimated temporary spousal support (${scenario.estimatePayer})` : '';
  const notes = formatSupportSnapshotNotes(scenario);

  return {
    ...workspace,
    filingCounty: withSupportSnapshotValue(workspace.filingCounty, snapshot.countyName),
    requests: {
      ...workspace.requests,
      childSupport: scenario.childSupport > 0 ? withSupportSnapshotValue(workspace.requests.childSupport, true) : workspace.requests.childSupport,
      spousalSupport: scenario.spousalSupport > 0 ? withSupportSnapshotValue(workspace.requests.spousalSupport, true) : workspace.requests.spousalSupport,
    },
    fl110: { includeForm: workspace.fl110?.includeForm ?? createField(true, { sourceType: 'manual', sourceLabel: 'Default starter packet form', confidence: 'medium', needsReview: false }) },
    fl300: {
      ...workspace.fl300,
      requestTypes: {
        ...workspace.fl300.requestTypes,
        childSupport: scenario.childSupport > 0 ? withSupportSnapshotValue(workspace.fl300.requestTypes.childSupport, true) : workspace.fl300.requestTypes.childSupport,
        spousalSupport: scenario.spousalSupport > 0 ? withSupportSnapshotValue(workspace.fl300.requestTypes.spousalSupport, true) : workspace.fl300.requestTypes.spousalSupport,
      },
      supportRequests: {
        ...workspace.fl300.supportRequests,
        childSupportGuideline: scenario.childSupport > 0 ? withSupportSnapshotValue(workspace.fl300.supportRequests.childSupportGuideline, true) : workspace.fl300.supportRequests.childSupportGuideline,
        childSupportMonthlyAmountText: withSupportSnapshotValue(workspace.fl300.supportRequests.childSupportMonthlyAmountText, childSupportText),
        childSupportChangeReasons: withSupportSnapshotValue(workspace.fl300.supportRequests.childSupportChangeReasons, notes),
        spousalSupportAmount: withSupportSnapshotValue(workspace.fl300.supportRequests.spousalSupportAmount, spousalSupportText),
        spousalSupportChangeReasons: withSupportSnapshotValue(workspace.fl300.supportRequests.spousalSupportChangeReasons, notes),
      },
    },
    fl150: {
      ...workspace.fl150,
      income: {
        ...workspace.fl150.income,
        salaryWages: {
          ...workspace.fl150.income.salaryWages,
          averageMonthly: withSupportSnapshotValue(workspace.fl150.income.salaryWages.averageMonthly, snapshot.parentAIncome ? String(snapshot.parentAIncome) : undefined),
        },
      },
      otherPartyIncome: {
        ...workspace.fl150.otherPartyIncome,
        grossMonthlyEstimate: withSupportSnapshotValue(workspace.fl150.otherPartyIncome.grossMonthlyEstimate, snapshot.parentBIncome ? String(snapshot.parentBIncome) : undefined),
        basis: withSupportSnapshotValue(workspace.fl150.otherPartyIncome.basis, 'Saved support estimator snapshot; verify against current income documents.'),
      },
      childrenSupport: {
        ...workspace.fl150.childrenSupport,
        numberOfChildren: withSupportSnapshotValue(workspace.fl150.childrenSupport.numberOfChildren, snapshot.childrenCount ? String(snapshot.childrenCount) : undefined),
        timeshareMePercent: withSupportSnapshotValue(workspace.fl150.childrenSupport.timeshareMePercent, Number.isFinite(snapshot.parentATimeShare) ? String(snapshot.parentATimeShare) : undefined),
        timeshareOtherParentPercent: withSupportSnapshotValue(workspace.fl150.childrenSupport.timeshareOtherParentPercent, Number.isFinite(snapshot.parentATimeShare) ? String(100 - snapshot.parentATimeShare) : undefined),
        childCareCosts: withSupportSnapshotValue(workspace.fl150.childrenSupport.childCareCosts, snapshot.childcare ? String(snapshot.childcare) : undefined),
        healthCareCostsNotCovered: withSupportSnapshotValue(workspace.fl150.childrenSupport.healthCareCostsNotCovered, snapshot.medical ? String(snapshot.medical) : undefined),
      },
      supportOtherInformation: withSupportSnapshotValue(workspace.fl150.supportOtherInformation, notes),
    },
  };
}

function applyChatPrefillToFl150(section: DraftFl150Section, prefill: ChatIntakePrefill['fl150']): DraftFl150Section {
  const hasFinancialPrefill = Object.values(prefill).some((value) => typeof value === 'string' ? value.trim().length > 0 : Boolean(value));
  const hasExpensePrefill = [
    prefill.rentOrMortgage,
    prefill.groceriesHousehold,
    prefill.utilities,
    prefill.phoneExpense,
    prefill.auto,
    prefill.autoInsurance,
    prefill.monthlyDebtPayments,
  ].some((value) => value?.trim());

  return {
    ...section,
    includeForm: hasFinancialPrefill ? createChatField(false) : section.includeForm,
    employment: {
      ...section.employment,
      employer: withChatValue(section.employment.employer, prefill.employer),
      employerAddress: withChatValue(section.employment.employerAddress, prefill.employerAddress),
      employerPhone: withChatValue(section.employment.employerPhone, prefill.employerPhone),
      occupation: withChatValue(section.employment.occupation, prefill.occupation),
      hoursPerWeek: withChatValue(section.employment.hoursPerWeek, prefill.hoursPerWeek),
      payAmount: withChatValue(section.employment.payAmount, prefill.payAmount),
      payPeriod: withChatValue(section.employment.payPeriod, prefill.payPeriod),
    },
    otherPartyIncome: {
      ...section.otherPartyIncome,
      grossMonthlyEstimate: withChatValue(section.otherPartyIncome.grossMonthlyEstimate, prefill.otherPartyIncome),
      basis: prefill.otherPartyIncome ? createChatField('Maria chat intake estimate; review source before filing.') : section.otherPartyIncome.basis,
    },
    income: {
      ...section.income,
      salaryWages: {
        ...section.income.salaryWages,
        averageMonthly: withChatValue(section.income.salaryWages.averageMonthly, prefill.salaryAverageMonthly || (prefill.payPeriod === 'month' ? prefill.payAmount : undefined)),
      },
    },
    deductions: {
      ...section.deductions,
      medicalInsurance: withChatValue(section.deductions.medicalInsurance, prefill.medicalInsuranceDeduction),
    },
    assets: {
      ...section.assets,
      cashChecking: withChatValue(section.assets.cashChecking, prefill.cashChecking),
      savingsCreditUnion: withChatValue(section.assets.savingsCreditUnion, prefill.savingsCreditUnion),
    },
    expenses: {
      ...section.expenses,
      basis: hasExpensePrefill ? createChatField('estimated' as DraftFl150ExpenseBasis) : section.expenses.basis,
      rentOrMortgage: withChatValue(section.expenses.rentOrMortgage, prefill.rentOrMortgage),
      groceriesHousehold: withChatValue(section.expenses.groceriesHousehold, prefill.groceriesHousehold),
      utilities: withChatValue(section.expenses.utilities, prefill.utilities),
      phone: withChatValue(section.expenses.phone, prefill.phoneExpense),
      auto: withChatValue(section.expenses.auto, prefill.auto),
      autoInsurance: withChatValue(section.expenses.autoInsurance, prefill.autoInsurance),
      monthlyDebtPayments: withChatValue(section.expenses.monthlyDebtPayments, prefill.monthlyDebtPayments),
    },
    childrenSupport: {
      ...section.childrenSupport,
      childCareCosts: withChatValue(section.childrenSupport.childCareCosts, prefill.childCareCosts),
      healthCareCostsNotCovered: withChatValue(section.childrenSupport.healthCareCostsNotCovered, prefill.healthCareCostsNotCovered),
    },
  };
}

function applyChatPrefillToBlankWorkspaceFields(workspace: DraftFormsWorkspace): DraftFormsWorkspace {
  const intakeText = [
    workspace.intake?.userRequest ?? '',
    workspace.intake?.mariaSummary ?? '',
  ].filter(Boolean).join('\n\n---\n\n');
  if (!intakeText.trim()) return workspace;

  const syntheticUser: User = {
    id: workspace.userId,
    email: '',
    subscription: 'free',
    chatCount: 0,
    chatCountResetDate: new Date().toISOString(),
    emailVerified: true,
    profile: {},
  };
  const prefill = extractChatIntakePrefill(syntheticUser, intakeText);
  const nextChildren = workspace.children.length > 0 || prefill.children.length === 0
    ? workspace.children
    : prefill.children.map((child) => ({
      id: uuidv4(),
      fullName: child.fullName ? createChatField(child.fullName) : createField('', { needsReview: true }),
      birthDate: createField('', {
        sourceType: child.age ? 'chat' : undefined,
        sourceLabel: child.age ? `Maria chat intake mentioned age ${child.age}; birth date still required` : undefined,
        confidence: child.age ? 'low' : undefined,
        needsReview: true,
      }),
      placeOfBirth: createField('', { needsReview: true }),
    }));

  return {
    ...workspace,
    caseNumber: withChatValue(workspace.caseNumber, prefill.caseNumber),
    filingCounty: withChatValue(workspace.filingCounty, prefill.filingCounty),
    petitionerName: withChatValue(workspace.petitionerName, prefill.petitionerName),
    petitionerAddress: withChatValue(workspace.petitionerAddress, prefill.petitionerAddress),
    petitionerPhone: withChatValue(workspace.petitionerPhone, prefill.petitionerPhone),
    petitionerEmail: withChatValue(workspace.petitionerEmail, prefill.petitionerEmail),
    petitionerAttorneyOrPartyName: withChatValue(workspace.petitionerAttorneyOrPartyName, prefill.petitionerName),
    respondentName: withChatValue(workspace.respondentName, prefill.respondentName),
    marriageDate: withChatValue(workspace.marriageDate, prefill.marriageDate),
    separationDate: withChatValue(workspace.separationDate, prefill.separationDate),
    hasMinorChildren: prefill.hasMinorChildren !== undefined && !workspace.hasMinorChildren.value
      ? createChatField(prefill.hasMinorChildren)
      : workspace.hasMinorChildren,
    children: nextChildren,
    fl150: applyChatPrefillToFl150(workspace.fl150, prefill.fl150),
  };
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

  const priorMessages = actualAssistantIndex >= 0 ? messages.slice(0, actualAssistantIndex + 1) : messages;
  const userContextMessages = priorMessages
    .filter((message) => message.role === 'user' && message.content.trim())
    .slice(-24);
  const userContext = truncateIntakeText(userContextMessages.map((message) => message.content.trim()).join('\n\n---\n\n'));
  const userContextWithUploads = truncateIntakeText(userContextMessages
    .map((message) => [message.content.trim(), message.draftContext?.trim()].filter(Boolean).join('\n\n'))
    .join('\n\n---\n\n'));
  const conversationContext = formatChatHandoffMessages(priorMessages.slice(-40));

  const attachmentNames = [...messages]
    .filter((message) => message.role === 'user')
    .flatMap((message) => message.attachments ?? [])
    .map((attachment) => attachment.name)
    .filter(Boolean);

  return { assistantMessage, userMessage, userContext: userContextWithUploads || userContext, conversationContext, attachmentNames: Array.from(new Set(attachmentNames)) };
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


function presetField<T>(current: DraftField<T>, value: T, presetLabel: string): DraftField<T> {
  return {
    ...current,
    value,
    sourceType: 'manual',
    sourceLabel: `Packet preset: ${presetLabel}`,
    confidence: 'medium',
    needsReview: false,
  };
}

function presetStringIfBlank(current: DraftField<string>, value: string, presetLabel: string) {
  return current.value.trim() ? current : presetField(current, value, presetLabel);
}

function presetPrintedNameIfBlank(current: DraftField<string>, fallback: string, presetLabel: string) {
  return presetStringIfBlank(current, fallback, presetLabel);
}

function presetInclude<T extends { includeForm: DraftField<boolean> }>(section: T, include: boolean, presetLabel: string): T {
  return {
    ...section,
    includeForm: presetField(section.includeForm, include, presetLabel),
  };
}

function applyPresetFormScope(workspace: DraftFormsWorkspace, presetId: DraftPacketPresetId, presetLabel: string): DraftFormsWorkspace {
  if (presetId === 'custom') return workspace;

  const include = (formId: DraftPacketPresetId, included: boolean) => presetId === formId && included;
  const includeChildren = workspace.hasMinorChildren.value;

  return {
    ...workspace,
    fl100: presetInclude(workspace.fl100, include('start_divorce', true), presetLabel),
    fl110: presetInclude(workspace.fl110, include('start_divorce', true), presetLabel),
    fl300: presetInclude(workspace.fl300, include('rfo_support_fees', true), presetLabel),
    fl150: presetInclude(workspace.fl150, include('rfo_support_fees', true), presetLabel),
    fl140: presetInclude(workspace.fl140, false, presetLabel),
    fl141: presetInclude(workspace.fl141, false, presetLabel),
    fl142: presetInclude(workspace.fl142, false, presetLabel),
    fl115: presetInclude(workspace.fl115, false, presetLabel),
    fl117: presetInclude(workspace.fl117, false, presetLabel),
    fl120: presetInclude(workspace.fl120, include('respond_divorce', true), presetLabel),
    fl160: presetInclude(workspace.fl160, false, presetLabel),
    fl342: presetInclude(workspace.fl342, include('rfo_support_fees', includeChildren), presetLabel),
    fl343: presetInclude(workspace.fl343, include('rfo_support_fees', true), presetLabel),
    fl130: presetInclude(workspace.fl130, include('default_uncontested_judgment', true), presetLabel),
    fl144: presetInclude(workspace.fl144, include('default_uncontested_judgment', true), presetLabel),
    fl170: presetInclude(workspace.fl170, include('default_uncontested_judgment', true), presetLabel),
    fl180: presetInclude(workspace.fl180, include('default_uncontested_judgment', true), presetLabel),
    fl190: presetInclude(workspace.fl190, include('default_uncontested_judgment', true), presetLabel),
    fl345: presetInclude(workspace.fl345, include('default_uncontested_judgment', true), presetLabel),
    fl348: presetInclude(workspace.fl348, false, presetLabel),
    fl165: presetInclude(workspace.fl165, include('default_uncontested_judgment', true), presetLabel),
    fl182: presetInclude(workspace.fl182, false, presetLabel),
    fl191: presetInclude(workspace.fl191, false, presetLabel),
    fl195: presetInclude(workspace.fl195, false, presetLabel),
    fl272: presetInclude(workspace.fl272, false, presetLabel),
    fl342a: presetInclude(workspace.fl342a, false, presetLabel),
    fl346: presetInclude(workspace.fl346, false, presetLabel),
    fl347: presetInclude(workspace.fl347, false, presetLabel),
    fl435: presetInclude(workspace.fl435, false, presetLabel),
    fl460: presetInclude(workspace.fl460, false, presetLabel),
    fl830: presetInclude(workspace.fl830, false, presetLabel),
    fw001: presetInclude(workspace.fw001, include('start_divorce', true) || include('respond_divorce', true), presetLabel),
    fw003: presetInclude(workspace.fw003, false, presetLabel),
    fw010: presetInclude(workspace.fw010, false, presetLabel),
    dv100: presetInclude(workspace.dv100, include('dvro', true), presetLabel),
    dv101: presetInclude(workspace.dv101, include('dvro', true), presetLabel),
    dv105: presetInclude(workspace.dv105, include('dvro', includeChildren), presetLabel),
    dv108: presetInclude(workspace.dv108, false, presetLabel),
    dv109: presetInclude(workspace.dv109, include('dvro', true), presetLabel),
    dv110: presetInclude(workspace.dv110, include('dvro', true), presetLabel),
    dv120: presetInclude(workspace.dv120, false, presetLabel),
    dv130: presetInclude(workspace.dv130, false, presetLabel),
    dv140: presetInclude(workspace.dv140, include('dvro', includeChildren), presetLabel),
    dv200: presetInclude(workspace.dv200, include('dvro', true), presetLabel),
  };
}

export function applyDraftPacketPreset(workspace: DraftFormsWorkspace, presetId: DraftPacketPresetId): DraftFormsWorkspace {
  const presetLabel = DRAFT_PACKET_PRESET_LABELS[presetId];
  const petitionerName = workspace.petitionerName.value.trim();
  const respondentName = workspace.respondentName.value.trim();
  const selectedPreset = presetField(workspace.selectedPreset ?? createField('custom', { needsReview: false }), presetId, presetLabel);

  let next: DraftFormsWorkspace = {
    ...workspace,
    selectedPreset,
  };

  if (presetId === 'custom') return next;

  next = applyPresetFormScope(next, presetId, presetLabel);

  if (presetId === 'start_divorce') {
    next = {
      ...next,
      requests: {
        ...next.requests,
        propertyRightsDetermination: presetField(next.requests.propertyRightsDetermination, true, presetLabel),
      },
      fl110: { includeForm: presetField(next.fl110?.includeForm ?? createField(true, { needsReview: false }), true, presetLabel) },
      fl100: {
        ...next.fl100,
        includeForm: presetField(next.fl100.includeForm, true, presetLabel),
        proceedingType: presetField(next.fl100.proceedingType, 'dissolution', presetLabel),
        legalGrounds: {
          ...next.fl100.legalGrounds,
          irreconcilableDifferences: presetField(next.fl100.legalGrounds.irreconcilableDifferences, true, presetLabel),
        },
        propertyDeclarations: {
          ...next.fl100.propertyDeclarations,
          communityAndQuasiCommunity: presetField(next.fl100.propertyDeclarations.communityAndQuasiCommunity, true, presetLabel),
          communityAndQuasiCommunityWhereListed: presetField(next.fl100.propertyDeclarations.communityAndQuasiCommunityWhereListed, 'fl160', presetLabel),
        },
      },
    };
  }

  if (presetId === 'respond_divorce') {
    next = {
      ...next,
      fl100: { ...next.fl100, includeForm: presetField(next.fl100.includeForm, false, presetLabel) },
      fl110: { includeForm: presetField(next.fl110?.includeForm ?? createField(true, { needsReview: false }), false, presetLabel) },
      fl120: {
        ...next.fl120,
        includeForm: presetField(next.fl120.includeForm, true, presetLabel),
        respondentPrintedName: presetPrintedNameIfBlank(next.fl120.respondentPrintedName, respondentName, presetLabel),
      },
    };
  }

  if (presetId === 'default_uncontested_judgment') {
    next = {
      ...next,
      fl100: { ...next.fl100, includeForm: presetField(next.fl100.includeForm, false, presetLabel) },
      fl110: { includeForm: presetField(next.fl110?.includeForm ?? createField(true, { needsReview: false }), false, presetLabel) },
      fl130: {
        ...next.fl130,
        includeForm: presetField(next.fl130.includeForm, true, presetLabel),
        appearanceBy: presetField(next.fl130.appearanceBy, 'respondent', presetLabel),
        petitionerPrintedName: presetPrintedNameIfBlank(next.fl130.petitionerPrintedName, petitionerName, presetLabel),
        respondentPrintedName: presetPrintedNameIfBlank(next.fl130.respondentPrintedName, respondentName, presetLabel),
      },
      fl144: {
        ...next.fl144,
        includeForm: presetField(next.fl144.includeForm, true, presetLabel),
        petitionerPrintedName: presetPrintedNameIfBlank(next.fl144.petitionerPrintedName, petitionerName, presetLabel),
        respondentPrintedName: presetPrintedNameIfBlank(next.fl144.respondentPrintedName, respondentName, presetLabel),
      },
      fl165: {
        ...next.fl165,
        includeForm: presetField(next.fl165.includeForm, true, presetLabel),
        details: presetStringIfBlank(next.fl165.details, 'Request to enter default / default judgment workflow. Review local court requirements before filing.', presetLabel),
        printedName: presetPrintedNameIfBlank(next.fl165.printedName, petitionerName, presetLabel),
      },
      fl170: {
        ...next.fl170,
        includeForm: presetField(next.fl170.includeForm, true, presetLabel),
        isDefaultOrUncontested: presetField(next.fl170.isDefaultOrUncontested, true, presetLabel),
        printedName: presetPrintedNameIfBlank(next.fl170.printedName, petitionerName, presetLabel),
      },
      fl180: {
        ...next.fl180,
        includeForm: presetField(next.fl180.includeForm, true, presetLabel),
        judgmentType: presetField(next.fl180.judgmentType, 'dissolution', presetLabel),
      },
      fl190: {
        ...next.fl190,
        includeForm: presetField(next.fl190.includeForm, true, presetLabel),
      },
      fl345: {
        ...next.fl345,
        includeForm: presetField(next.fl345.includeForm, true, presetLabel),
        attachTo: presetField(next.fl345.attachTo, 'fl180', presetLabel),
        propertyAwardSummary: presetStringIfBlank(next.fl345.propertyAwardSummary, 'Property and debts to be divided according to the parties’ written agreement or attached judgment terms.', presetLabel),
      },
    };
  }

  if (presetId === 'rfo_support_fees') {
    const includeChildSupport = next.hasMinorChildren.value || next.requests.childSupport.value;
    next = {
      ...next,
      fl110: { includeForm: workspace.fl110?.includeForm ?? createField(true, { sourceType: 'manual', sourceLabel: 'Default starter packet form', confidence: 'medium', needsReview: false }) },
    fl300: {
        ...next.fl300,
        includeForm: presetField(next.fl300.includeForm, true, presetLabel),
        requestTypes: {
          ...next.fl300.requestTypes,
          childSupport: presetField(next.fl300.requestTypes.childSupport, includeChildSupport, presetLabel),
          spousalSupport: presetField(next.fl300.requestTypes.spousalSupport, true, presetLabel),
          attorneyFeesCosts: presetField(next.fl300.requestTypes.attorneyFeesCosts, true, presetLabel),
        },
        requestedAgainst: {
          ...next.fl300.requestedAgainst,
          respondent: presetField(next.fl300.requestedAgainst.respondent, true, presetLabel),
        },
        attorneyFees: {
          ...next.fl300.attorneyFees,
          includeFl319: presetField(next.fl300.attorneyFees.includeFl319, true, presetLabel),
          paymentRequestedFrom: presetField(next.fl300.attorneyFees.paymentRequestedFrom, 'respondent', presetLabel),
        },
        typePrintName: presetPrintedNameIfBlank(next.fl300.typePrintName, petitionerName, presetLabel),
      },
      fl150: {
        ...next.fl150,
        includeForm: presetField(next.fl150.includeForm, true, presetLabel),
        typePrintName: presetPrintedNameIfBlank(next.fl150.typePrintName, petitionerName, presetLabel),
      },
      fl342: {
        ...next.fl342,
        includeForm: presetField(next.fl342.includeForm, includeChildSupport, presetLabel),
        attachTo: presetField(next.fl342.attachTo, 'fl300', presetLabel),
        payableTo: presetPrintedNameIfBlank(next.fl342.payableTo, petitionerName, presetLabel),
      },
      fl343: {
        ...next.fl343,
        includeForm: presetField(next.fl343.includeForm, true, presetLabel),
        supportType: presetField(next.fl343.supportType, 'spousal', presetLabel),
        payor: presetField(next.fl343.payor, 'respondent', presetLabel),
        payee: presetField(next.fl343.payee, 'petitioner', presetLabel),
      },
      requests: {
        ...next.requests,
        childSupport: presetField(next.requests.childSupport, includeChildSupport, presetLabel),
        spousalSupport: presetField(next.requests.spousalSupport, true, presetLabel),
      },
    };
  }

  if (presetId === 'dvro') {
    const dvDefaults = <T extends DraftDvFormSection>(section: T) => ({
      ...section,
      protectedPartyName: presetPrintedNameIfBlank(section.protectedPartyName, petitionerName, presetLabel),
      restrainedPartyName: presetPrintedNameIfBlank(section.restrainedPartyName, respondentName, presetLabel),
      printedName: presetPrintedNameIfBlank(section.printedName, petitionerName, presetLabel),
    });
    next = {
      ...next,
      dv100: { ...dvDefaults(next.dv100), includeForm: presetField(next.dv100.includeForm, true, presetLabel), requestSummary: presetStringIfBlank(next.dv100.requestSummary, 'Request domestic violence restraining orders. Add incident facts and requested protected-person / stay-away details before filing.', presetLabel) },
      dv101: { ...dvDefaults(next.dv101), includeForm: presetField(next.dv101.includeForm, true, presetLabel), requestSummary: presetStringIfBlank(next.dv101.requestSummary, 'Describe recent abuse incidents in date order. Replace this placeholder with specific facts.', presetLabel) },
      dv105: { ...dvDefaults(next.dv105), includeForm: presetField(next.dv105.includeForm, next.hasMinorChildren.value, presetLabel) },
      dv109: { ...dvDefaults(next.dv109), includeForm: presetField(next.dv109.includeForm, true, presetLabel) },
      dv110: { ...dvDefaults(next.dv110), includeForm: presetField(next.dv110.includeForm, true, presetLabel), orderSummary: presetStringIfBlank(next.dv110.orderSummary, 'Temporary personal conduct, stay-away, and no-contact orders requested. Review before filing.', presetLabel) },
      dv140: { ...dvDefaults(next.dv140), includeForm: presetField(next.dv140.includeForm, next.hasMinorChildren.value, presetLabel) },
      dv200: { ...dvDefaults(next.dv200), includeForm: presetField(next.dv200.includeForm, true, presetLabel) },
    };
  }

  return next;
}

export function createStarterPacketWorkspace(options: {
  user: User;
  messages?: ChatMessage[];
  sourceSessionId?: string;
  sourceAssistantMessageId?: string;
}) {
  const { user, messages = [], sourceSessionId, sourceAssistantMessageId } = options;
  const now = new Date().toISOString();
  const { assistantMessage, userMessage, userContext, conversationContext, attachmentNames } = getSourceMessages(messages, sourceAssistantMessageId);
  const chatContext = conversationContext || userContext || userMessage?.content?.trim() || '';
  const chatPrefill = extractChatIntakePrefill(user, chatContext);
  const petitionerProfileName = getPetitionerName(user);
  const petitionerName = petitionerProfileName || chatPrefill.petitionerName || '';
  const titleBase = petitionerName || user.email || 'Draft starter packet';
  const filingCounty = user.profile?.county?.trim() || chatPrefill.filingCounty || '';
  const marriageDate = user.profile?.marriageDate || chatPrefill.marriageDate || '';
  const separationDate = user.profile?.separationDate || chatPrefill.separationDate || '';
  const hasProfileChildren = typeof user.profile?.hasChildren === 'boolean';
  const hasMinorChildren = hasProfileChildren ? Boolean(user.profile?.hasChildren) : Boolean(chatPrefill.hasMinorChildren);
  const children = chatPrefill.children.map((child) => ({
    id: uuidv4(),
    fullName: child.fullName ? createChatField(child.fullName) : createField('', { needsReview: true }),
    birthDate: createField('', {
      sourceType: child.age ? 'chat' : undefined,
      sourceLabel: child.age ? `Maria chat intake mentioned age ${child.age}; birth date still required` : undefined,
      confidence: child.age ? 'low' : undefined,
      needsReview: true,
    }),
    placeOfBirth: createField('', { needsReview: true }),
  }));

  const workspace: DraftFormsWorkspace = {
    id: uuidv4(),
    userId: user.id,
    title: `${titleBase} — starter packet`,
    packetType: 'starter_packet_v1',
    selectedPreset: createField('start_divorce', { sourceType: 'manual', sourceLabel: 'Default Draft Forms preset', confidence: 'low', needsReview: false }),
    status: 'in_review',
    createdAt: now,
    updatedAt: now,
    sourceSessionId,
    sourceAssistantMessageId,
    intake: {
      userRequest: chatContext || undefined,
      mariaSummary: assistantMessage?.content?.trim() || undefined,
      attachmentNames,
      extractedFacts: buildIntakeFactsFromMessages(user, messages, chatContext, sourceSessionId ? `Maria chat session ${sourceSessionId}` : 'Maria chat intake'),
    },
    caseNumber: chatPrefill.caseNumber ? createChatField(chatPrefill.caseNumber) : createField('', {
      needsReview: false,
    }),
    filingCounty: createField(filingCounty, {
      sourceType: user.profile?.county ? 'profile' : chatPrefill.filingCounty ? 'chat' : undefined,
      sourceLabel: user.profile?.county ? 'Profile' : chatPrefill.filingCounty ? 'Maria chat intake' : undefined,
      confidence: user.profile?.county ? 'medium' : chatPrefill.filingCounty ? 'low' : undefined,
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
      sourceType: petitionerProfileName ? 'profile' : chatPrefill.petitionerName ? 'chat' : undefined,
      sourceLabel: petitionerProfileName ? 'Account profile' : chatPrefill.petitionerName ? 'Maria chat intake' : undefined,
      confidence: petitionerProfileName ? 'high' : chatPrefill.petitionerName ? 'low' : undefined,
      needsReview: !petitionerProfileName,
    }),
    petitionerAddress: chatPrefill.petitionerAddress ? createChatField(chatPrefill.petitionerAddress) : createField('', {
      needsReview: true,
    }),
    petitionerPhone: chatPrefill.petitionerPhone ? createChatField(chatPrefill.petitionerPhone) : createField('', {
      needsReview: true,
    }),
    petitionerEmail: createField(user.email || chatPrefill.petitionerEmail || '', {
      sourceType: user.email ? 'profile' : chatPrefill.petitionerEmail ? 'chat' : undefined,
      sourceLabel: user.email ? 'Account email' : chatPrefill.petitionerEmail ? 'Maria chat intake' : undefined,
      confidence: user.email ? 'high' : chatPrefill.petitionerEmail ? 'low' : undefined,
      needsReview: !user.email,
    }),
    petitionerFax: createField('', {
      needsReview: false,
    }),
    petitionerAttorneyOrPartyName: createField(petitionerName, {
      sourceType: petitionerProfileName ? 'profile' : chatPrefill.petitionerName ? 'chat' : 'manual',
      sourceLabel: petitionerProfileName ? 'Account profile' : chatPrefill.petitionerName ? 'Maria chat intake' : 'Default FL-100 assumption',
      confidence: petitionerProfileName ? 'high' : chatPrefill.petitionerName ? 'low' : 'low',
      needsReview: true,
    }),
    petitionerFirmName: createField('', {
      needsReview: false,
    }),
    petitionerStateBarNumber: createField('', {
      needsReview: false,
    }),
    petitionerAttorneyFor: createField('Petitioner in pro per', {
      sourceType: 'manual',
      sourceLabel: 'Default FL-100 assumption',
      confidence: 'low',
      needsReview: true,
    }),
    respondentName: chatPrefill.respondentName ? createChatField(chatPrefill.respondentName) : createField('', {
      needsReview: true,
    }),
    marriageDate: createField(marriageDate, {
      sourceType: user.profile?.marriageDate ? 'profile' : chatPrefill.marriageDate ? 'chat' : undefined,
      sourceLabel: user.profile?.marriageDate ? 'Profile' : chatPrefill.marriageDate ? 'Maria chat intake' : undefined,
      confidence: user.profile?.marriageDate ? 'medium' : chatPrefill.marriageDate ? 'low' : undefined,
      needsReview: true,
    }),
    separationDate: createField(separationDate, {
      sourceType: user.profile?.separationDate ? 'profile' : chatPrefill.separationDate ? 'chat' : undefined,
      sourceLabel: user.profile?.separationDate ? 'Profile' : chatPrefill.separationDate ? 'Maria chat intake' : undefined,
      confidence: user.profile?.separationDate ? 'medium' : chatPrefill.separationDate ? 'low' : undefined,
      needsReview: true,
    }),
    hasMinorChildren: createField(hasMinorChildren, {
      sourceType: hasProfileChildren ? 'profile' : chatPrefill.hasMinorChildren !== undefined ? 'chat' : undefined,
      sourceLabel: hasProfileChildren ? 'Profile' : chatPrefill.hasMinorChildren !== undefined ? 'Maria chat intake' : undefined,
      confidence: hasProfileChildren ? 'medium' : chatPrefill.hasMinorChildren !== undefined ? 'low' : undefined,
      needsReview: true,
    }),
    children,
    fl100: createDefaultFl100Section(),
    fl110: { includeForm: createField(true, { sourceType: 'manual', sourceLabel: 'Default starter packet form', confidence: 'medium', needsReview: false }) },
    fl300: createDefaultFl300Section(petitionerName),
    fl140: createDefaultFl140Section(petitionerName),
    fl141: createDefaultFl141Section(petitionerName),
    fl142: createDefaultFl142Section(petitionerName),
    fl115: createDefaultFl115Section(),
    fl117: createDefaultFl117Section(petitionerName, chatPrefill.respondentName || ''),
    fl120: createDefaultFl120Section(chatPrefill.respondentName || ''),
    fl160: createDefaultFl160Section(petitionerName),
    fl342: createDefaultFl342Section(),
    fl343: createDefaultFl343Section(),
    fl130: createDefaultFl130Section(petitionerName, chatPrefill.respondentName || ''),
    fl144: createDefaultFl144Section(petitionerName, chatPrefill.respondentName || ''),
    fl170: createDefaultFl170Section(petitionerName),
    fl180: createDefaultFl180Section(),
    fl190: createDefaultFl190Section(),
    fl345: createDefaultFl345Section(),
    fl348: createDefaultFl348Section(),
    fl165: createDefaultRemainingFlFormSection('FL-165', petitionerName),
    fl182: createDefaultRemainingFlFormSection('FL-182', petitionerName),
    fl191: createDefaultRemainingFlFormSection('FL-191', petitionerName),
    fl195: createDefaultRemainingFlFormSection('FL-195', petitionerName),
    fl272: createDefaultRemainingFlFormSection('FL-272', petitionerName),
    fl342a: createDefaultRemainingFlFormSection('FL-342(A)', petitionerName),
    fl346: createDefaultRemainingFlFormSection('FL-346', petitionerName),
    fl347: createDefaultRemainingFlFormSection('FL-347', petitionerName),
    fl435: createDefaultRemainingFlFormSection('FL-435', petitionerName),
    fl460: createDefaultRemainingFlFormSection('FL-460', petitionerName),
    fl830: createDefaultRemainingFlFormSection('FL-830', petitionerName),
    fw001: createDefaultRemainingFlFormSection('FW-001', petitionerName),
    fw003: createDefaultRemainingFlFormSection('FW-003', petitionerName),
    fw010: createDefaultRemainingFlFormSection('FW-010', petitionerName),
    dv100: createDefaultDvFormSection('DV-100', petitionerName, chatPrefill.respondentName || ''),
    dv101: createDefaultDvFormSection('DV-101', petitionerName, chatPrefill.respondentName || ''),
    dv105: createDefaultDvFormSection('DV-105', petitionerName, chatPrefill.respondentName || ''),
    dv108: createDefaultDvFormSection('DV-108', petitionerName, chatPrefill.respondentName || ''),
    dv109: createDefaultDvFormSection('DV-109', petitionerName, chatPrefill.respondentName || ''),
    dv110: createDefaultDvFormSection('DV-110', petitionerName, chatPrefill.respondentName || ''),
    dv120: createDefaultDvFormSection('DV-120', petitionerName, chatPrefill.respondentName || ''),
    dv130: createDefaultDvFormSection('DV-130', petitionerName, chatPrefill.respondentName || ''),
    dv140: createDefaultDvFormSection('DV-140', petitionerName, chatPrefill.respondentName || ''),
    dv200: createDefaultDvFormSection('DV-200', petitionerName, chatPrefill.respondentName || ''),
    fl150: applyChatPrefillToFl150(createDefaultFl150Section(petitionerName), chatPrefill.fl150),
    fl105: createDefaultFl105Section(petitionerName),
    requests: inferRequests(user, chatContext, assistantMessage?.content),
  };

  saveDraftWorkspace(workspace);
  return workspace;
}

export function hydrateDraftWorkspaceFromChatContext(
  workspace: DraftFormsWorkspace,
  messages: ChatMessage[] = [],
  sourceSessionId?: string,
) {
  if (messages.length === 0) return workspace;

  const { assistantMessage, userContext, conversationContext, attachmentNames } = getSourceMessages(messages);
  const mergedAttachmentNames = Array.from(new Set([...(workspace.intake.attachmentNames ?? []), ...attachmentNames]));
  const nextWorkspace: DraftFormsWorkspace = {
    ...workspace,
    sourceSessionId: workspace.sourceSessionId ?? sourceSessionId,
    sourceAssistantMessageId: workspace.sourceAssistantMessageId ?? assistantMessage?.id,
    intake: {
      userRequest: workspace.intake.userRequest?.trim() ? workspace.intake.userRequest : conversationContext || userContext || undefined,
      mariaSummary: workspace.intake.mariaSummary?.trim() ? workspace.intake.mariaSummary : assistantMessage?.content?.trim() || undefined,
      attachmentNames: mergedAttachmentNames,
      extractedFacts: workspace.intake.extractedFacts ?? buildIntakeFactsFromMessages({ id: workspace.userId, email: '', subscription: 'free', chatCount: 0, chatCountResetDate: new Date().toISOString(), emailVerified: true, profile: {} }, messages, conversationContext || userContext, sourceSessionId ? `Maria chat session ${sourceSessionId}` : 'Maria chat intake'),
    },
  };

  return applyChatPrefillToBlankWorkspaceFields(nextWorkspace);
}

export function replaceDraftWorkspaceChatHandoff(
  workspace: DraftFormsWorkspace,
  messages: ChatMessage[] = [],
  sourceSessionId?: string,
) {
  const { assistantMessage, userContext, conversationContext, attachmentNames } = getSourceMessages(messages);
  const nextWorkspace: DraftFormsWorkspace = {
    ...workspace,
    sourceSessionId,
    sourceAssistantMessageId: assistantMessage?.id,
    intake: {
      userRequest: conversationContext || userContext || undefined,
      mariaSummary: assistantMessage?.content?.trim() || undefined,
      attachmentNames,
      extractedFacts: buildIntakeFactsFromMessages({ id: workspace.userId, email: '', subscription: 'free', chatCount: 0, chatCountResetDate: new Date().toISOString(), emailVerified: true, profile: {} }, messages, conversationContext || userContext, sourceSessionId ? `Maria chat session ${sourceSessionId}` : 'Maria chat selection'),
    },
  };

  return applyChatPrefillToBlankWorkspaceFields(nextWorkspace);
}

export function listDraftWorkspaces(userId?: string) {
  const workspaces = readWorkspaces();
  return workspaces
    .filter((workspace) => (userId ? workspace.userId === userId : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getDraftWorkspace(workspaceId: string) {
  const workspace = readWorkspaces().find((entry) => entry.id === workspaceId) ?? null;
  return workspace ? applyChatPrefillToBlankWorkspaceFields(workspace) : null;
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

export function createBlankFl105AdditionalChildAttachment(childId = '') {
  return createBlankAdditionalChildAttachment(childId);
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


export function getDraftWorkspaceIncludedFormLabels(workspace: DraftFormsWorkspace): string[] {
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

  return [
    ...(workspace.fl100.includeForm.value ? ['FL-100'] : []),
    ...(workspace.fl110.includeForm.value ? ['FL-110'] : []),
    ...(workspace.hasMinorChildren.value ? ['FL-105/GC-120'] : []),
    ...(workspace.fl115.includeForm.value ? ['FL-115'] : []),
    ...(workspace.fl117.includeForm.value ? ['FL-117'] : []),
    ...(workspace.fl120.includeForm.value ? ['FL-120'] : []),
    ...(workspace.fl140.includeForm.value ? ['FL-140'] : []),
    ...(workspace.fl141.includeForm.value ? ['FL-141'] : []),
    ...(workspace.fl142.includeForm.value ? ['FL-142'] : []),
    ...(workspace.fl150.includeForm.value ? ['FL-150'] : []),
    ...(workspace.fl160.includeForm.value ? ['FL-160'] : []),
    ...(workspace.fl300.includeForm.value ? ['FL-300'] : []),
    ...(workspace.fl342.includeForm.value ? ['FL-342'] : []),
    ...(workspace.fl343.includeForm.value ? ['FL-343'] : []),
    ...(workspace.fl130.includeForm.value ? ['FL-130'] : []),
    ...(workspace.fl144.includeForm.value ? ['FL-144'] : []),
    ...(workspace.fl165.includeForm.value ? ['FL-165'] : []),
    ...(workspace.fl170.includeForm.value ? ['FL-170'] : []),
    ...(workspace.fl180.includeForm.value ? ['FL-180'] : []),
    ...(workspace.fl190.includeForm.value ? ['FL-190'] : []),
    ...(workspace.fl345.includeForm.value ? ['FL-345'] : []),
    ...(workspace.fl348.includeForm.value ? ['FL-348'] : []),
    ...(workspace.fl182.includeForm.value ? ['FL-182'] : []),
    ...(workspace.fl191.includeForm.value ? ['FL-191'] : []),
    ...(workspace.fl195.includeForm.value ? ['FL-195'] : []),
    ...(workspace.fl272.includeForm.value ? ['FL-272'] : []),
    ...(workspace.fl342a.includeForm.value ? ['FL-342(A)'] : []),
    ...(workspace.fl346.includeForm.value ? ['FL-346'] : []),
    ...(workspace.fl347.includeForm.value ? ['FL-347'] : []),
    ...(workspace.fl435.includeForm.value ? ['FL-435'] : []),
    ...(workspace.fl460.includeForm.value ? ['FL-460'] : []),
    ...(workspace.fl830.includeForm.value ? ['FL-830'] : []),
    ...(workspace.fw001.includeForm.value ? ['FW-001'] : []),
    ...(workspace.fw003.includeForm.value ? ['FW-003'] : []),
    ...(workspace.fw010.includeForm.value ? ['FW-010'] : []),
    ...(workspace.dv100.includeForm.value ? ['DV-100'] : []),
    ...(workspace.dv101.includeForm.value ? ['DV-101'] : []),
    ...(workspace.dv105.includeForm.value ? ['DV-105'] : []),
    ...(workspace.dv108.includeForm.value ? ['DV-108'] : []),
    ...(workspace.dv109.includeForm.value ? ['DV-109'] : []),
    ...(workspace.dv110.includeForm.value ? ['DV-110'] : []),
    ...(workspace.dv120.includeForm.value ? ['DV-120'] : []),
    ...(workspace.dv130.includeForm.value ? ['DV-130'] : []),
    ...(workspace.dv140.includeForm.value ? ['DV-140'] : []),
    ...(workspace.dv200.includeForm.value ? ['DV-200'] : []),
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
  const selectedPresetLabel = DRAFT_PACKET_PRESET_LABELS[workspace.selectedPreset?.value ?? 'custom'] ?? DRAFT_PACKET_PRESET_LABELS.custom;
  const includedFormLabels = getDraftWorkspaceIncludedFormLabels(workspace);
  const relationshipLabel = workspace.fl100.relationshipType.value === 'domestic_partnership'
    ? 'Domestic partnership'
    : workspace.fl100.relationshipType.value === 'both'
      ? 'Marriage and domestic partnership'
      : 'Marriage';
  const proceedingTypeLabel = workspace.fl100.proceedingType.value === 'legal_separation'
    ? 'Legal separation'
    : workspace.fl100.proceedingType.value === 'nullity'
      ? 'Nullity'
      : 'Dissolution';
  const isDissolutionProceeding = workspace.fl100.proceedingType.value === 'dissolution';
  const domesticPartnershipEstablishmentLabel = workspace.fl100.domesticPartnership.establishment.value === 'established_in_california'
    ? 'Established in California'
    : workspace.fl100.domesticPartnership.establishment.value === 'not_established_in_california'
      ? 'Not established in California'
      : 'Not specified';
  const nullityBasisLabels = [
    workspace.fl100.nullity.basedOnIncest.value ? 'Incest (void)' : null,
    workspace.fl100.nullity.basedOnBigamy.value ? 'Bigamy (void)' : null,
    workspace.fl100.nullity.basedOnAge.value ? 'Age at registration/marriage (voidable)' : null,
    workspace.fl100.nullity.basedOnPriorExistingMarriageOrPartnership.value ? 'Prior existing marriage/domestic partnership (voidable)' : null,
    workspace.fl100.nullity.basedOnUnsoundMind.value ? 'Unsound mind (voidable)' : null,
    workspace.fl100.nullity.basedOnFraud.value ? 'Fraud (voidable)' : null,
    workspace.fl100.nullity.basedOnForce.value ? 'Force (voidable)' : null,
    workspace.fl100.nullity.basedOnPhysicalIncapacity.value ? 'Physical incapacity (voidable)' : null,
  ].filter(Boolean) as string[];

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
  const communityPropertyWhereListedLabel = workspace.fl100.propertyDeclarations.communityAndQuasiCommunityWhereListed.value === 'fl160'
    ? 'Property Declaration (FL-160)'
    : workspace.fl100.propertyDeclarations.communityAndQuasiCommunityWhereListed.value === 'attachment'
      ? 'Attachment 10b'
      : workspace.fl100.propertyDeclarations.communityAndQuasiCommunityWhereListed.value === 'inline_list'
        ? 'Inline FL-100 list'
        : 'Not selected';
  const separatePropertyWhereListedLabel = workspace.fl100.propertyDeclarations.separatePropertyWhereListed.value === 'fl160'
    ? 'Property Declaration (FL-160)'
    : workspace.fl100.propertyDeclarations.separatePropertyWhereListed.value === 'attachment'
      ? 'Attachment 9b'
      : workspace.fl100.propertyDeclarations.separatePropertyWhereListed.value === 'inline_list'
        ? 'Inline FL-100 list'
        : 'Not selected';
  const separatePropertyInlineEntries = workspace.fl100.propertyDeclarations.separatePropertyDetails.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const generatesCommunityPropertyAttachment = workspace.fl100.propertyDeclarations.communityAndQuasiCommunity.value
    && workspace.fl100.propertyDeclarations.communityAndQuasiCommunityWhereListed.value === 'attachment'
    && workspace.fl100.propertyDeclarations.communityAndQuasiCommunityDetails.value.trim().length > 0;
  const generatesSeparatePropertyAttachment = workspace.fl100.propertyDeclarations.separateProperty.value
    && workspace.fl100.propertyDeclarations.separatePropertyWhereListed.value === 'attachment'
    && workspace.fl100.propertyDeclarations.separatePropertyDetails.value.trim().length > 0
    && workspace.fl100.propertyDeclarations.separatePropertyAwardedTo.value.trim().length > 0;
  const generatesOtherRequestsAttachment = workspace.fl100.otherRequests.continuedOnAttachment.value
    && workspace.fl100.otherRequests.details.value.trim().length > 0;
  const separatePropertyInlineOverflowCount = Math.max(
    separatePropertyInlineEntries.length - FL100_SEPARATE_PROPERTY_VISIBLE_ROWS,
    0,
  );

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
  const spousalSupportTerminateLabel = workspace.fl100.spousalSupport.terminateJurisdictionFor.value === 'petitioner'
    ? 'Terminate jurisdiction for petitioner'
    : workspace.fl100.spousalSupport.terminateJurisdictionFor.value === 'respondent'
      ? 'Terminate jurisdiction for respondent'
      : workspace.fl100.spousalSupport.terminateJurisdictionFor.value === 'both'
        ? 'Terminate jurisdiction for both parties'
        : 'No termination of jurisdiction selected';

  const legalGroundLabels = [
    workspace.fl100.legalGrounds.irreconcilableDifferences.value ? 'Irreconcilable differences' : null,
    workspace.fl100.legalGrounds.permanentLegalIncapacity.value ? 'Permanent legal incapacity' : null,
  ].filter(Boolean) as string[];
  const legalCustodyLabel = workspace.fl100.childCustodyVisitation.legalCustodyTo.value === 'petitioner'
    ? 'Petitioner'
    : workspace.fl100.childCustodyVisitation.legalCustodyTo.value === 'respondent'
      ? 'Respondent'
      : workspace.fl100.childCustodyVisitation.legalCustodyTo.value === 'joint'
        ? 'Joint'
        : workspace.fl100.childCustodyVisitation.legalCustodyTo.value === 'other'
          ? 'Other'
          : 'Not selected';
  const physicalCustodyLabel = workspace.fl100.childCustodyVisitation.physicalCustodyTo.value === 'petitioner'
    ? 'Petitioner'
    : workspace.fl100.childCustodyVisitation.physicalCustodyTo.value === 'respondent'
      ? 'Respondent'
      : workspace.fl100.childCustodyVisitation.physicalCustodyTo.value === 'joint'
        ? 'Joint'
        : workspace.fl100.childCustodyVisitation.physicalCustodyTo.value === 'other'
          ? 'Other'
          : 'Not selected';
  const visitationLabel = workspace.fl100.childCustodyVisitation.visitationTo.value === 'petitioner'
    ? 'Petitioner'
    : workspace.fl100.childCustodyVisitation.visitationTo.value === 'respondent'
      ? 'Respondent'
      : workspace.fl100.childCustodyVisitation.visitationTo.value === 'other'
        ? 'Other'
        : 'Not selected';
  const fl311Selected = workspace.fl100.childCustodyVisitation.attachments.formFl311.value;
  const fl311RelevantRequest = fl311Selected && (
    workspace.requests.childCustody.value
    || workspace.requests.visitation.value
    || workspace.fl100.childCustodyVisitation.legalCustodyTo.value !== 'none'
    || workspace.fl100.childCustodyVisitation.physicalCustodyTo.value !== 'none'
    || workspace.fl100.childCustodyVisitation.visitationTo.value !== 'none'
  );
  const fl311VisitationMode = workspace.fl100.childCustodyVisitation.fl311.visitationPlanMode.value;
  const fl311VisitationModeLabel = fl311VisitationMode === 'reasonable_right_of_visitation'
    ? 'Reasonable right of visitation'
    : fl311VisitationMode === 'attachment_on_file'
      ? 'See attached visitation plan'
      : 'Not selected';
  const fl311RequiresVisitationMode = fl311RelevantRequest && workspace.fl100.childCustodyVisitation.visitationTo.value !== 'none';
  const fl311AttachmentPlanNeedsDetails = fl311RelevantRequest
    && fl311VisitationMode === 'attachment_on_file'
    && (
      !workspace.fl100.childCustodyVisitation.fl311.visitationAttachmentPageCount.value.trim()
      || !workspace.fl100.childCustodyVisitation.fl311.visitationAttachmentDate.value.trim()
    );
  const fl312Selected = workspace.fl100.childCustodyVisitation.attachments.formFl312.value;
  const fl312RelevantRequest = fl312Selected && (
    workspace.requests.childCustody.value
    || workspace.requests.visitation.value
    || workspace.fl100.childCustodyVisitation.legalCustodyTo.value !== 'none'
    || workspace.fl100.childCustodyVisitation.physicalCustodyTo.value !== 'none'
    || workspace.fl100.childCustodyVisitation.visitationTo.value !== 'none'
  );
  const fl312 = workspace.fl100.childCustodyVisitation.fl312;
  const fl312AbductionBySelected = fl312.abductionBy.petitioner.value || fl312.abductionBy.respondent.value || fl312.abductionBy.otherParentParty.value;
  const fl312DestinationRiskSelected = fl312.riskDestinations.anotherCaliforniaCounty.value
    || fl312.riskDestinations.anotherState.value
    || fl312.riskDestinations.foreignCountry.value;
  const fl312BehaviorRiskSelected = fl312.riskFactors.custodyOrderViolationThreat.value
    || fl312.riskFactors.weakCaliforniaTies.value
    || fl312.riskFactors.recentAbductionPlanningActions.value
    || fl312.riskFactors.historyOfRiskBehaviors.value
    || fl312.riskFactors.criminalRecord.value;
  const fl312OrdersAgainstSelected = fl312.requestedOrdersAgainst.petitioner.value
    || fl312.requestedOrdersAgainst.respondent.value
    || fl312.requestedOrdersAgainst.otherParentParty.value;
  const fl312OrderSelected = fl312.requestedOrders.supervisedVisitation.value
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
  const fl312ReadinessIssues: string[] = [];
  if (fl312RelevantRequest) {
    if (!workspace.hasMinorChildren.value) fl312ReadinessIssues.push('minor children must be enabled');
    if (!fl312.requestingPartyName.value.trim()) fl312ReadinessIssues.push('requesting party name is required');
    if (!fl312AbductionBySelected) fl312ReadinessIssues.push('item 2 requires at least one restrained party');
    if (!fl312DestinationRiskSelected && !fl312BehaviorRiskSelected) fl312ReadinessIssues.push('at least one risk in item 3 or item 4 is required');
    if (fl312.riskDestinations.anotherCaliforniaCounty.value && !fl312.riskDestinations.anotherCaliforniaCountyName.value.trim()) fl312ReadinessIssues.push('item 3a county is required');
    if (fl312.riskDestinations.anotherState.value && !fl312.riskDestinations.anotherStateName.value.trim()) fl312ReadinessIssues.push('item 3b state is required');
    if (fl312.riskDestinations.foreignCountry.value && !fl312.riskDestinations.foreignCountryName.value.trim()) fl312ReadinessIssues.push('item 3c foreign country is required');
    if (fl312.riskDestinations.foreignCountryHasTies.value && !fl312.riskDestinations.foreignCountryTiesDetails.value.trim()) fl312ReadinessIssues.push('item 3c(2) ties details are required');
    if (fl312.riskFactors.custodyOrderViolationThreat.value && !fl312.riskFactors.custodyOrderViolationThreatDetails.value.trim()) fl312ReadinessIssues.push('item 4a explanation is required');
    if (fl312.riskFactors.weakCaliforniaTies.value && !fl312.riskFactors.weakCaliforniaTiesDetails.value.trim()) fl312ReadinessIssues.push('item 4b explanation is required');
    if (fl312.riskFactors.recentActionOther.value && !fl312.riskFactors.recentActionOtherDetails.value.trim()) fl312ReadinessIssues.push('item 4c other details are required');
    if (fl312.riskFactors.historyOfRiskBehaviors.value && !fl312.riskFactors.historyDetails.value.trim()) fl312ReadinessIssues.push('item 4d explanation is required');
    if (fl312.riskFactors.criminalRecord.value && !fl312.riskFactors.criminalRecordDetails.value.trim()) fl312ReadinessIssues.push('item 4e explanation is required');
    if (!fl312OrdersAgainstSelected) fl312ReadinessIssues.push('page 2 requires selecting who orders are against');
    if (!fl312OrderSelected) fl312ReadinessIssues.push('at least one requested order (items 5-14) is required');
    if (fl312.requestedOrders.supervisedVisitation.value && fl312.requestedOrders.supervisedVisitationTermsMode.value === 'unspecified') fl312ReadinessIssues.push('item 5 terms mode (FL-311 or as follows) is required');
    if (fl312.requestedOrders.supervisedVisitation.value && fl312.requestedOrders.supervisedVisitationTermsMode.value === 'fl311' && !workspace.fl100.childCustodyVisitation.attachments.formFl311.value) fl312ReadinessIssues.push('item 5 FL-311 mode requires FL-311 attachment selected');
    if (fl312.requestedOrders.supervisedVisitation.value && fl312.requestedOrders.supervisedVisitationTermsMode.value === 'as_follows' && !fl312.requestedOrders.supervisedVisitationTermsDetails.value.trim()) fl312ReadinessIssues.push('item 5 as-follows terms are required');
    if (fl312.requestedOrders.postBond.value && !fl312.requestedOrders.postBondAmount.value.trim()) fl312ReadinessIssues.push('item 6 bond amount is required');
    if (
      fl312.requestedOrders.noTravelWithoutWrittenPermissionOrCourtOrder.value
      && !fl312.requestedOrders.travelRestrictionThisCounty.value
      && !fl312.requestedOrders.travelRestrictionCalifornia.value
      && !fl312.requestedOrders.travelRestrictionUnitedStates.value
      && !fl312.requestedOrders.travelRestrictionOther.value
    ) fl312ReadinessIssues.push('item 8 requires at least one travel restriction');
    if (fl312.requestedOrders.travelRestrictionOther.value && !fl312.requestedOrders.travelRestrictionOtherDetails.value.trim()) fl312ReadinessIssues.push('item 8 other travel restriction details are required');
    if (fl312.requestedOrders.registerOrderInOtherState.value && !fl312.requestedOrders.registerOrderStateName.value.trim()) fl312ReadinessIssues.push('item 9 state is required');
    if (fl312.requestedOrders.provideOtherTravelDocuments.value && !fl312.requestedOrders.provideOtherTravelDocumentsDetails.value.trim()) fl312ReadinessIssues.push('item 11 other travel-document details are required');
    if (fl312.requestedOrders.notifyForeignEmbassyOrConsulate.value && !fl312.requestedOrders.embassyOrConsulateCountry.value.trim()) fl312ReadinessIssues.push('item 12 embassy/consulate country is required');
    if (fl312.requestedOrders.notifyForeignEmbassyOrConsulate.value && !fl312.requestedOrders.embassyNotificationWithinDays.value.trim()) fl312ReadinessIssues.push('item 12 calendar days is required');
    if (fl312.requestedOrders.otherOrdersRequested.value && !fl312.requestedOrders.otherOrdersDetails.value.trim()) fl312ReadinessIssues.push('item 14 other-order details are required');
    if (!fl312.signatureDate.value.trim()) fl312ReadinessIssues.push('signature date is required');
  }
  const fl341Selected = workspace.fl100.childCustodyVisitation.attachments.formFl341a.value
    || workspace.fl100.childCustodyVisitation.attachments.formFl341b.value
    || workspace.fl100.childCustodyVisitation.attachments.formFl341c.value
    || workspace.fl100.childCustodyVisitation.attachments.formFl341d.value
    || workspace.fl100.childCustodyVisitation.attachments.formFl341e.value;
  const fl341RelevantRequest = fl341Selected && (
    workspace.requests.childCustody.value
    || workspace.requests.visitation.value
    || workspace.fl100.childCustodyVisitation.legalCustodyTo.value !== 'none'
    || workspace.fl100.childCustodyVisitation.physicalCustodyTo.value !== 'none'
    || workspace.fl100.childCustodyVisitation.visitationTo.value !== 'none'
  );
  const fl341 = workspace.fl100.childCustodyVisitation.fl341;
  const fl341SourceOrderLabel = fl341.sourceOrder.value === 'fl340'
    ? 'FL-340 (Findings and Order After Hearing)'
    : fl341.sourceOrder.value === 'fl180'
      ? 'FL-180 (Judgment)'
      : fl341.sourceOrder.value === 'fl250'
        ? 'FL-250 (Judgment)'
        : fl341.sourceOrder.value === 'fl355'
          ? 'FL-355 (Stipulation and Order)'
          : fl341.sourceOrder.value === 'other'
            ? `Other (${fl341.sourceOrderOtherText.value || 'not provided'})`
            : 'Not selected';
  const fl341ReadinessIssues: string[] = [];
  const fl341aReadinessIssues: string[] = [];
  const fl341bReadinessIssues: string[] = [];
  const fl341cReadinessIssues: string[] = [];
  const fl341dReadinessIssues: string[] = [];
  const fl341eReadinessIssues: string[] = [];
  const fl341a = fl341.fl341a;
  const fl341b = fl341.fl341b;
  const fl341c = fl341.fl341c;
  const fl341d = fl341.fl341d;
  const fl341e = fl341.fl341e;
  const fl341cRows = [
    { label: "New Year's Day", row: fl341c.holidayRows.newYearsDay },
    { label: 'Spring Break', row: fl341c.holidayRows.springBreak },
    { label: 'Thanksgiving Day', row: fl341c.holidayRows.thanksgivingDay },
    { label: 'Winter Break', row: fl341c.holidayRows.winterBreak },
    { label: "Child's Birthday", row: fl341c.holidayRows.childBirthday },
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
  const fl341dProvisionEntries = [
    { label: 'Exchange schedule', value: fl341d.provisions.exchangeSchedule },
    { label: 'Transportation', value: fl341d.provisions.transportation },
    { label: 'Make-up parenting time', value: fl341d.provisions.makeupTime },
    { label: 'Communication', value: fl341d.provisions.communication },
    { label: 'Right of first refusal', value: fl341d.provisions.rightOfFirstRefusal },
    { label: 'Temporary changes by agreement', value: fl341d.provisions.temporaryChangesByAgreement },
    { label: 'Other provisions', value: fl341d.provisions.other },
  ];
  const fl341dSelectedCount = fl341dProvisionEntries.filter(({ value }) => value.selected.value).length;
  const fl341eAnyDecisionChosen = fl341e.decisionMaking.education.value !== 'unspecified'
    || fl341e.decisionMaking.nonEmergencyHealthcare.value !== 'unspecified'
    || fl341e.decisionMaking.mentalHealth.value !== 'unspecified'
    || fl341e.decisionMaking.extracurricular.value !== 'unspecified';
  const fl341eAnyOperatingTerm = fl341e.terms.recordsAccess.value
    || fl341e.terms.emergencyNotice.value
    || fl341e.terms.portalAccess.value
    || fl341e.terms.contactUpdates.value;
  const fl341eAnyDisputePath = fl341e.disputeResolution.meetAndConfer.value
    || fl341e.disputeResolution.mediation.value
    || fl341e.disputeResolution.court.value
    || fl341e.disputeResolution.other.value;
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
  if (fl341RelevantRequest) {
    if (!workspace.hasMinorChildren.value) fl341ReadinessIssues.push('minor children must be enabled');
    if (workspace.children.length === 0) fl341ReadinessIssues.push('at least one child row is required');
    if (workspace.children.length > FL105_FORM_CAPACITY.childrenRows) fl341ReadinessIssues.push(`v1 supports only the first ${FL105_FORM_CAPACITY.childrenRows} child rows`);
    if (fl341.sourceOrder.value === 'unspecified') fl341ReadinessIssues.push('source order form must be selected');
    if (fl341.sourceOrder.value === 'other' && !fl341.sourceOrderOtherText.value.trim()) fl341ReadinessIssues.push('source order "other" text is required');
    if (workspace.fl100.childCustodyVisitation.attachments.formFl341a.value) {
      if (!fl341aHasAnyDetail) fl341aReadinessIssues.push('add explicit supervised-visitation details');
      if (!fl341aSupervisedPartySelected) fl341aReadinessIssues.push('select at least one supervised party (petitioner/respondent/other parent-party)');
      if (fl341a.supervisor.type.value === 'unspecified') fl341aReadinessIssues.push('select supervisor type');
      if (fl341a.supervisor.type.value === 'other' && !fl341a.supervisor.otherTypeText.value.trim()) fl341aReadinessIssues.push('supervisor type "other" text is required');
      if (!fl341a.supervisor.name.value.trim()) fl341aReadinessIssues.push('supervisor name is required');
      if (!fl341a.supervisor.contact.value.trim()) fl341aReadinessIssues.push('supervisor contact is required');
      if (fl341a.supervisor.feesPaidBy.value === 'unspecified') fl341aReadinessIssues.push('select who pays supervisor fees');
      if (fl341a.supervisor.feesPaidBy.value === 'other' && !fl341a.supervisor.feesOtherText.value.trim()) fl341aReadinessIssues.push('supervisor fees "other" text is required');
      if (fl341a.schedule.mode.value === 'unspecified') fl341aReadinessIssues.push('select schedule mode (FL-311/attachment/as follows)');
      if (fl341a.schedule.mode.value === 'fl311' && !workspace.fl100.childCustodyVisitation.attachments.formFl311.value) fl341aReadinessIssues.push('schedule mode FL-311 requires FL-311 attachment selected');
      if (fl341a.schedule.mode.value === 'attachment' && !fl341a.schedule.attachmentPageCount.value.trim()) fl341aReadinessIssues.push('attached schedule page count is required when attachment mode is selected');
      if (fl341a.schedule.mode.value === 'text' && !fl341a.schedule.text.value.trim()) fl341aReadinessIssues.push('schedule terms are required when "as follows" is selected');
    }
    if (workspace.fl100.childCustodyVisitation.attachments.formFl341c.value) {
      if (!fl341cHasAnyDetail) fl341cReadinessIssues.push('add at least one explicit holiday or vacation term');
      fl341cEnabledRows.forEach(({ label, row }) => {
        if (row.yearPattern.value === 'unspecified') fl341cReadinessIssues.push(`${label}: choose every year / even years / odd years`);
        if (row.assignedTo.value === 'unspecified') fl341cReadinessIssues.push(`${label}: choose petitioner/respondent/other parent-party`);
      });
      if (fl341c.vacation.maxDuration.value.trim() && fl341c.vacation.maxDurationUnit.value === 'unspecified') {
        fl341cReadinessIssues.push('vacation max-duration unit (days/weeks) is required when max duration is entered');
      }
      if (fl341c.vacation.allowOutsideUnitedStates.value && !fl341c.vacation.allowOutsideCalifornia.value) {
        fl341cReadinessIssues.push('outside-U.S. vacation requires outside-California vacation to be selected');
      }
    }
    if (workspace.fl100.childCustodyVisitation.attachments.formFl341d.value) {
      if (fl341dSelectedCount === 0) fl341dReadinessIssues.push('select at least one additional physical-custody provision');
      fl341dProvisionEntries.forEach(({ label, value }) => {
        if (value.selected.value && !value.details.value.trim()) {
          fl341dReadinessIssues.push(`${label}: details are required`);
        }
      });
    }
    if (workspace.fl100.childCustodyVisitation.attachments.formFl341e.value) {
      if (!fl341e.orderJointLegalCustody.value) fl341eReadinessIssues.push('confirm that joint legal custody is ordered for FL-341(E)');
      if (fl341e.decisionMaking.education.value === 'unspecified') fl341eReadinessIssues.push('select who makes education decisions');
      if (fl341e.decisionMaking.nonEmergencyHealthcare.value === 'unspecified') fl341eReadinessIssues.push('select who makes non-emergency healthcare decisions');
      if (fl341e.decisionMaking.mentalHealth.value === 'unspecified') fl341eReadinessIssues.push('select who makes mental-health counseling decisions');
      if (fl341e.decisionMaking.extracurricular.value === 'unspecified') fl341eReadinessIssues.push('select who makes extracurricular decisions');
      if (!fl341eAnyOperatingTerm && !fl341eAnyDisputePath && !fl341e.additionalTerms.value.trim()) {
        fl341eReadinessIssues.push('add at least one operating term, dispute path, or additional term');
      }
      if (fl341e.disputeResolution.other.value && !fl341e.disputeResolution.otherText.value.trim()) {
        fl341eReadinessIssues.push('dispute-resolution other text is required when "other" is selected');
      }
    }
    if (workspace.fl100.childCustodyVisitation.attachments.formFl341b.value) {
      const hasRisk = fl341b.risk.violatedPastOrders.value
        || fl341b.risk.noStrongCaliforniaTies.value
        || fl341b.risk.preparationActions.selected.value
        || fl341b.risk.history.selected.value
        || fl341b.risk.criminalRecord.value
        || fl341b.risk.tiesToOtherJurisdiction.value;
      const hasOrder = fl341b.orders.supervisedVisitation.value
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
      if (!fl341b.restrainedPartyName.value.trim()) fl341bReadinessIssues.push('restrained party name is required');
      if (!hasRisk) fl341bReadinessIssues.push('select at least one child-abduction risk factor');
      if (!hasOrder) fl341bReadinessIssues.push('select at least one abduction-prevention order');
      if (fl341b.risk.preparationActions.selected.value
        && !fl341b.risk.preparationActions.quitJob.value
        && !fl341b.risk.preparationActions.soldHome.value
        && !fl341b.risk.preparationActions.closedBankAccount.value
        && !fl341b.risk.preparationActions.endedLease.value
        && !fl341b.risk.preparationActions.soldAssets.value
        && !fl341b.risk.preparationActions.hiddenOrDestroyedDocuments.value
        && !fl341b.risk.preparationActions.appliedForPassport.value
        && !fl341b.risk.preparationActions.other.value) fl341bReadinessIssues.push('preparation-actions risk needs at least one detail');
      if (fl341b.risk.preparationActions.other.value && !fl341b.risk.preparationActions.otherDetails.value.trim()) fl341bReadinessIssues.push('other preparation action details are required');
      if (fl341b.orders.supervisedVisitation.value && fl341b.orders.supervisedVisitationTermsMode.value === 'unspecified') fl341bReadinessIssues.push('supervised-visitation terms mode is required');
      if (fl341b.orders.supervisedVisitation.value && fl341b.orders.supervisedVisitationTermsMode.value === 'fl341a' && !workspace.fl100.childCustodyVisitation.attachments.formFl341a.value) fl341bReadinessIssues.push('FL-341(A) must be selected when referenced');
      if (fl341b.orders.postBond.value && !fl341b.orders.postBondAmount.value.trim()) fl341bReadinessIssues.push('bond amount is required');
    }
    if (fl341aReadinessIssues.length > 0) fl341ReadinessIssues.push(`FL-341(A): ${fl341aReadinessIssues.join('; ')}`);
    if (fl341bReadinessIssues.length > 0) fl341ReadinessIssues.push(`FL-341(B): ${fl341bReadinessIssues.join('; ')}`);
    if (fl341cReadinessIssues.length > 0) fl341ReadinessIssues.push(`FL-341(C): ${fl341cReadinessIssues.join('; ')}`);
    if (fl341dReadinessIssues.length > 0) fl341ReadinessIssues.push(`FL-341(D): ${fl341dReadinessIssues.join('; ')}`);
    if (fl341eReadinessIssues.length > 0) fl341ReadinessIssues.push(`FL-341(E): ${fl341eReadinessIssues.join('; ')}`);
  }
  const custodyAttachmentLabels = [
    workspace.fl100.childCustodyVisitation.attachments.formFl311.value ? 'FL-311' : null,
    workspace.fl100.childCustodyVisitation.attachments.formFl312.value ? 'FL-312' : null,
    workspace.fl100.childCustodyVisitation.attachments.formFl341a.value ? 'FL-341(A)' : null,
    workspace.fl100.childCustodyVisitation.attachments.formFl341b.value ? 'FL-341(B)' : null,
    workspace.fl100.childCustodyVisitation.attachments.formFl341c.value ? 'FL-341(C)' : null,
    workspace.fl100.childCustodyVisitation.attachments.formFl341d.value ? 'FL-341(D)' : null,
    workspace.fl100.childCustodyVisitation.attachments.formFl341e.value ? 'FL-341(E)' : null,
    workspace.fl100.childCustodyVisitation.attachments.attachment6c1.value ? 'Attachment 6c(1)' : null,
  ].filter(Boolean) as string[];
  const hasOverflowMinorChildren = workspace.children.length > FL105_FORM_CAPACITY.childrenRows;
  const childrenBeyondVisibleRowsCount = Math.max(workspace.children.length - FL105_FORM_CAPACITY.childrenRows, 0);
  const generatedChildAttachmentPageCount = getGeneratedChildAttachmentPageCount(childrenBeyondVisibleRowsCount);
  const generatedFl105AdditionalChildAttachmentPageCount = !workspace.fl105.childrenLivedTogetherPastFiveYears.value
    ? getFl105AdditionalChildAttachmentPageCount(workspace.fl105.additionalChildrenAttachments)
    : 0;
  const fl105ResidenceHistoryOverflowCount = getFl105ResidenceHistoryOverflowCount(workspace.fl105.residenceHistory);
  const hasFl105ResidenceHistoryDetails = workspace.fl105.residenceHistory.some((entry) => [
    entry.fromDate.value,
    entry.toDate.value,
    entry.residence.value,
    entry.personAndAddress.value,
    entry.relationship.value,
  ].some((value) => value.trim().length > 0));
  const generatesFl105ResidenceAttachment = hasFl105ResidenceHistoryDetails
    && (workspace.fl105.additionalResidenceAddressesOnAttachment3a.value || fl105ResidenceHistoryOverflowCount > 0);
  const fl105ProceedingOverflowCount = getFl105ProceedingOverflowCount(workspace.fl105.otherProceedings);
  const fl105OrderOverflowCount = getFl105OrderOverflowCount(workspace.fl105.domesticViolenceOrders);
  const fl105ClaimantOverflowCount = getFl105ClaimantOverflowCount(workspace.fl105.otherClaimants);
  const fl150 = workspace.fl150;
  const fl300SupportOrFeeRequest = workspace.fl300.includeForm.value && (
    workspace.fl300.requestTypes.childSupport.value
    || workspace.fl300.requestTypes.spousalSupport.value
    || workspace.fl300.requestTypes.attorneyFeesCosts.value
  );
  const fl150HasIncome = [
    fl150.income.salaryWages.averageMonthly.value,
    fl150.income.salaryWages.lastMonth.value,
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
  const fl150HasExpense = [
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
  const fl150ReadinessIssues: string[] = [];
  if (fl150.includeForm.value) {
    if (!fl150.typePrintName.value.trim()) fl150ReadinessIssues.push('typed/printed name is required');
    if (!fl150.signatureDate.value.trim()) fl150ReadinessIssues.push('signature date is required');
    if (!fl150HasIncome) fl150ReadinessIssues.push('enter at least one explicit income amount or mark zeros intentionally');
    if (!fl150HasExpense) fl150ReadinessIssues.push('enter at least one explicit monthly expense amount or total');
    if (fl150.employment.payAmount.value.trim() && fl150.employment.payPeriod.value === 'unspecified') fl150ReadinessIssues.push('pay period is required when pay amount is entered');
    if (fl150.taxes.filingStatus.value === 'married_joint' && !fl150.taxes.jointFilerName.value.trim()) fl150ReadinessIssues.push('joint filer name is required for married filing jointly');
    if (fl150.taxes.taxState.value === 'other' && !fl150.taxes.otherState.value.trim()) fl150ReadinessIssues.push('other tax state is required when selected');
    if (fl150.childrenSupport.hasChildrenHealthInsurance.value === 'yes' && !fl150.childrenSupport.insuranceCompanyName.value.trim()) fl150ReadinessIssues.push('children health-insurance company name is required when insurance is selected');
  }

  const sections: DraftPacketSection[] = [
    {
      heading: 'Case snapshot',
      body: [
        `Case number: ${workspace.caseNumber.value || 'Not provided'}`,
        `Filing county: ${workspace.filingCounty.value || 'Not provided'}`,
        `Petitioner: ${petitionerName}`,
        `Respondent: ${respondentName}`,
        `Selected packet preset: ${selectedPresetLabel}`,
        `Selected/generated forms: ${includedFormLabels.join(', ') || 'None selected'}`,
        `Proceeding type: ${proceedingTypeLabel}`,
        `Amended petition: ${workspace.fl100.isAmended.value ? 'Yes' : 'No'}`,
        `Relationship type: ${relationshipLabel}`,
        `Date of marriage: ${workspace.marriageDate.value || 'Not provided'}`,
        `Date of separation: ${workspace.separationDate.value || 'Not provided'}`,
        `Domestic partnership registration date: ${workspace.fl100.domesticPartnership.registrationDate.value || 'Not provided'}`,
        `Domestic partnership date of separation: ${workspace.fl100.domesticPartnership.partnerSeparationDate.value || 'Not provided'}`,
      ].join('\n'),
    },
    {
      heading: 'Petitioner contact',
      body: [
        `Email: ${workspace.petitionerEmail.value || 'Not provided'}`,
        `Phone: ${workspace.petitionerPhone.value || 'Not provided'}`,
        `Fax: ${workspace.petitionerFax.value || 'Not provided'}`,
        `Attorney or party name (FL-100 caption): ${workspace.petitionerAttorneyOrPartyName.value || 'Not provided'}`,
        `Firm name: ${workspace.petitionerFirmName.value || 'Not provided'}`,
        `State bar number: ${workspace.petitionerStateBarNumber.value || 'Not provided'}`,
        `Attorney for: ${workspace.petitionerAttorneyFor.value || 'Not provided'}`,
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
        `Residency qualification rule: ${isDissolutionProceeding ? 'Apply dissolution residency thresholds (or listed jurisdiction exceptions)' : 'Dissolution residency thresholds do not block this proceeding type'}`,
        `Petitioner residency in California: ${workspace.fl100.residency.petitionerCaliforniaMonths.value || 'Not provided'} month(s)`,
        `Petitioner residency in filing county: ${workspace.fl100.residency.petitionerCountyMonths.value || 'Not provided'} month(s)`,
        `Petitioner lives in (FL-100 item 2): ${workspace.fl100.residency.petitionerResidenceLocation.value || 'Not provided'}`,
        `Respondent residency in California: ${workspace.fl100.residency.respondentCaliforniaMonths.value || 'Not provided'} month(s)`,
        `Respondent residency in filing county: ${workspace.fl100.residency.respondentCountyMonths.value || 'Not provided'} month(s)`,
        `Respondent lives in (FL-100 item 2): ${workspace.fl100.residency.respondentResidenceLocation.value || 'Not provided'}`,
        `Domestic partnership establishment: ${domesticPartnershipEstablishmentLabel}`,
        `Domestic partnership California-residency exception: ${workspace.fl100.domesticPartnership.californiaResidencyException.value ? 'Yes' : 'No'}`,
        `Same-sex-married-in-California jurisdiction exception: ${workspace.fl100.domesticPartnership.sameSexMarriageJurisdictionException.value ? 'Yes' : 'No'}`,
        `Nullity basis selections: ${nullityBasisLabels.join(', ') || 'None selected'}`,
        `Legal grounds: ${legalGroundLabels.join(', ') || 'Not provided'}`,
        `Property declarations: ${propertyLabels.join(', ') || 'None selected'}`,
        `Community/quasi-community where listed: ${communityPropertyWhereListedLabel}`,
        `Community/quasi-community details: ${workspace.fl100.propertyDeclarations.communityAndQuasiCommunityDetails.value || 'Not provided'}`,
        `Generated FL-100 attachment 10b from details: ${generatesCommunityPropertyAttachment ? 'Yes' : workspace.fl100.propertyDeclarations.communityAndQuasiCommunityWhereListed.value === 'attachment' ? 'Selected but missing attachment details' : 'No'}`,
        `Separate property where listed: ${separatePropertyWhereListedLabel}`,
        `Separate property details: ${workspace.fl100.propertyDeclarations.separatePropertyDetails.value || 'Not provided'}`,
        `Separate property confirmed to: ${workspace.fl100.propertyDeclarations.separatePropertyAwardedTo.value || 'Not provided'}`,
        `Generated FL-100 attachment 9b from details: ${generatesSeparatePropertyAttachment ? 'Yes' : workspace.fl100.propertyDeclarations.separatePropertyWhereListed.value === 'attachment' ? 'Selected but missing attachment details / award target' : 'No'}`,
        `Separate property inline-row overflow: ${separatePropertyInlineOverflowCount > 0 ? `Yes (${separatePropertyInlineEntries.length} entered, ${FL100_SEPARATE_PROPERTY_VISIBLE_ROWS} visible)` : 'No'}`,
        `Spousal support direction: ${spousalSupportDirectionLabel}`,
        `Spousal support reserve jurisdiction: ${spousalSupportReserveLabel}`,
        `Spousal support terminate jurisdiction: ${spousalSupportTerminateLabel}`,
        `Spousal support details: ${workspace.fl100.spousalSupport.details.value || 'Not provided'}`,
        `Voluntary declaration of parentage signed: ${workspace.fl100.spousalSupport.voluntaryDeclarationOfParentageSigned.value ? 'Yes' : 'No'}`,
        `Legal custody requested to: ${legalCustodyLabel}`,
        `Physical custody requested to: ${physicalCustodyLabel}`,
        `Visitation requested to: ${visitationLabel}`,
        `Custody/visitation attachments selected: ${custodyAttachmentLabels.join(', ') || 'None'}`,
        `FL-311 selected: ${fl311Selected ? 'Yes' : 'No'}`,
        `FL-311 generation trigger present (custody/visitation request + selected): ${fl311RelevantRequest ? 'Yes' : 'No'}`,
        `FL-311 v1 generation scope: Caption + child list + custody direction + visitation direction only`,
        `FL-311 visitation plan mode: ${fl311VisitationModeLabel}`,
        `FL-311 attachment-page count (if plan attached): ${workspace.fl100.childCustodyVisitation.fl311.visitationAttachmentPageCount.value || 'Not provided'}`,
        `FL-311 attachment date (if plan attached): ${workspace.fl100.childCustodyVisitation.fl311.visitationAttachmentDate.value || 'Not provided'}`,
        `FL-311 readiness: ${!fl311Selected
          ? 'Not requested'
          : !fl311RelevantRequest
            ? 'Selected, but no custody/visitation request is currently mapped'
          : !workspace.hasMinorChildren.value
            ? 'Blocked: minor children must be enabled'
            : workspace.children.length > FL105_FORM_CAPACITY.childrenRows
              ? `Blocked: FL-311 v1 currently supports only the first ${FL105_FORM_CAPACITY.childrenRows} children`
              : fl311RequiresVisitationMode && fl311VisitationMode === 'unspecified'
                ? 'Blocked: choose FL-311 visitation-plan mode'
                : fl311AttachmentPlanNeedsDetails
                  ? 'Blocked: add FL-311 attached-plan page count and date'
                  : 'Ready'}`,
        `FL-312 selected: ${fl312Selected ? 'Yes' : 'No'}`,
        `FL-312 generation trigger present (custody/visitation request + selected): ${fl312RelevantRequest ? 'Yes' : 'No'}`,
        `FL-312 v1 generation scope: Official pages 1-2 with explicit Draft Forms selections; no silent legal assumptions`,
        `FL-312 requesting party name (item 1): ${fl312.requestingPartyName.value || 'Not provided'}`,
        `FL-312 item 2 restrained party selected: ${fl312AbductionBySelected ? 'Yes' : 'No'}`,
        `FL-312 item 3 destination-risk selected: ${fl312DestinationRiskSelected ? 'Yes' : 'No'}`,
        `FL-312 item 4 behavior-risk selected: ${fl312BehaviorRiskSelected ? 'Yes' : 'No'}`,
        `FL-312 page-2 orders-against selected: ${fl312OrdersAgainstSelected ? 'Yes' : 'No'}`,
        `FL-312 requested order selected (items 5-14): ${fl312OrderSelected ? 'Yes' : 'No'}`,
        `FL-312 readiness: ${!fl312Selected
          ? 'Not requested'
          : !fl312RelevantRequest
            ? 'Selected, but no custody/visitation request is currently mapped'
            : fl312ReadinessIssues.length > 0
              ? `Blocked: ${fl312ReadinessIssues.join('; ')}`
              : 'Ready'}`,
        `FL-341 selected (triggered by FL-341(A)/(B)/(C)/(D)/(E) selections): ${fl341Selected ? 'Yes' : 'No'}`,
        `FL-341 generation trigger present (custody/visitation request + selected): ${fl341RelevantRequest ? 'Yes' : 'No'}`,
        `FL-341 v1 generation scope: Official FL-341 plus Draft Forms FL-341(A)/(B)/(C)/(D)/(E) attachments`,
        `FL-341 source order form: ${fl341SourceOrderLabel}`,
        `FL-341 caption other parent/party name: ${fl341.otherParentPartyName.value || 'Not provided'}`,
        `FL-341(A) supervised party selected: ${fl341aSupervisedPartySelected ? 'Yes' : 'No'}`,
        `FL-341(A) supervisor type: ${fl341a.supervisor.type.value}`,
        `FL-341(A) schedule mode: ${fl341a.schedule.mode.value}`,
        `FL-341(A) has any supervised-visitation detail: ${fl341aHasAnyDetail ? 'Yes' : 'No'}`,
        `FL-341(A) readiness: ${workspace.fl100.childCustodyVisitation.attachments.formFl341a.value
          ? (fl341aReadinessIssues.length > 0 ? `Blocked: ${fl341aReadinessIssues.join('; ')}` : 'Ready')
          : 'Not requested'}`,
        `FL-341(B) restrained party name: ${fl341b.restrainedPartyName.value || 'Not provided'}`,
        `FL-341(B) readiness: ${workspace.fl100.childCustodyVisitation.attachments.formFl341b.value
          ? (fl341bReadinessIssues.length > 0 ? `Blocked: ${fl341bReadinessIssues.join('; ')}` : 'Ready')
          : 'Not requested'}`,
        `FL-341(C) enabled holiday rows: ${fl341cEnabledRows.length}`,
        `FL-341(C) has any holiday/vacation detail: ${fl341cHasAnyDetail ? 'Yes' : 'No'}`,
        `FL-341(C) readiness: ${workspace.fl100.childCustodyVisitation.attachments.formFl341c.value
          ? (fl341cReadinessIssues.length > 0 ? `Blocked: ${fl341cReadinessIssues.join('; ')}` : 'Ready')
          : 'Not requested'}`,
        `FL-341(D) selected additional provisions: ${fl341dSelectedCount}`,
        `FL-341(D) readiness: ${workspace.fl100.childCustodyVisitation.attachments.formFl341d.value
          ? (fl341dReadinessIssues.length > 0 ? `Blocked: ${fl341dReadinessIssues.join('; ')}` : 'Ready')
          : 'Not requested'}`,
        `FL-341(E) order joint legal custody: ${fl341e.orderJointLegalCustody.value ? 'Yes' : 'No'}`,
        `FL-341(E) any decision-maker chosen: ${fl341eAnyDecisionChosen ? 'Yes' : 'No'}`,
        `FL-341(E) any operating term chosen: ${fl341eAnyOperatingTerm ? 'Yes' : 'No'}`,
        `FL-341(E) any dispute path chosen: ${fl341eAnyDisputePath ? 'Yes' : 'No'}`,
        `FL-341(E) readiness: ${workspace.fl100.childCustodyVisitation.attachments.formFl341e.value
          ? (fl341eReadinessIssues.length > 0 ? `Blocked: ${fl341eReadinessIssues.join('; ')}` : 'Ready')
          : 'Not requested'}`,
        `FL-341 readiness: ${!fl341Selected
          ? 'Not requested'
          : !fl341RelevantRequest
            ? 'Selected, but no custody/visitation request is currently mapped'
            : fl341ReadinessIssues.length > 0
              ? `Blocked: ${fl341ReadinessIssues.join('; ')}`
              : 'Ready'}`,
        `FL-150 included: ${fl150.includeForm.value ? 'Yes' : 'No'}`,
        `FL-150 recommended by FL-300 support/fee request: ${fl300SupportOrFeeRequest ? 'Yes' : 'No'}`,
        `FL-300 support/fee request has FL-150 included: ${fl300SupportOrFeeRequest ? (fl150.includeForm.value ? 'Yes' : 'No — include FL-150 or prepare separate financial declaration') : 'Not applicable'}`,
        `FL-150 v1 generation scope: official FL-150 pages 1-4; explicit Draft Forms income, deductions, assets, expenses, children-support, hardship, and signature fields only`,
        `FL-150 readiness: ${!fl150.includeForm.value ? 'Not requested' : fl150ReadinessIssues.length > 0 ? `Blocked: ${fl150ReadinessIssues.join('; ')}` : 'Ready'}`,
        `Judgment/property forms v1 generation scope: FL-130/144/170/180/190/345/348 core caption, party/case, selected options, agreement/judgment dates/text, property/debt/support summaries, and names/signature dates only`,
        `FL-150 limitation: v1 does not infer financial entries from FL-300 or profile data; blank/unknown values stay blank. Review the completed declaration before filing.`,
        `Additional child support orders requested: ${workspace.fl100.childSupport.requestAdditionalOrders.value ? 'Yes' : 'No'}`,
        `Additional child support order details: ${workspace.fl100.childSupport.additionalOrdersDetails.value || 'Not provided'}`,
        `Unborn child of the relationship listed in item 4: ${workspace.fl100.minorChildren.hasUnbornChild.value ? 'Yes' : 'No'}`,
        `Children exceed FL-100 visible child rows: ${hasOverflowMinorChildren ? `Yes (${workspace.children.length} entered, ${FL105_FORM_CAPACITY.childrenRows} visible)` : 'No'}`,
        `Children exceed FL-105 visible child rows: ${hasOverflowMinorChildren ? `Yes (${workspace.children.length} entered, ${FL105_FORM_CAPACITY.childrenRows} visible)` : 'No'}`,
        `Attachment 4b marked for additional child details: ${workspace.fl100.minorChildren.detailsOnAttachment4b.value ? 'Yes' : 'No'}`,
        `Attorney fees and costs requested: ${workspace.fl100.attorneyFeesAndCosts.requestAward.value ? 'Yes' : 'No'}`,
        `Attorney fees/costs payable by: ${workspace.fl100.attorneyFeesAndCosts.payableBy.value}`,
        `Other FL-100 requests selected: ${workspace.fl100.otherRequests.requestOtherRelief.value ? 'Yes' : 'No'}`,
        `Other FL-100 requests detail: ${workspace.fl100.otherRequests.details.value || 'Not provided'}`,
        `Other requests continued on attachment: ${workspace.fl100.otherRequests.continuedOnAttachment.value ? 'Yes' : 'No'}`,
        `Generated FL-100 attachment 11c from details: ${generatesOtherRequestsAttachment ? 'Yes' : workspace.fl100.otherRequests.continuedOnAttachment.value ? 'Selected but missing attachment details' : 'No'}`,
        `FL-100 signature date (page 3): ${workspace.fl100.signatureDate.value || 'Not provided'}`,
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
        : workspace.fl100.minorChildren.hasUnbornChild.value
          ? 'No born/adopted child rows entered. Unborn child checkbox is selected for FL-100 item 4.'
          : 'Minor children were indicated, but child details have not been entered yet.',
    });

    if (hasOverflowMinorChildren) {
      sections.push({
        heading: 'FL-100 child row overflow',
        body: [
          `Visible FL-100 rows in this packet: ${FL105_FORM_CAPACITY.childrenRows}`,
          `Children entered in workspace: ${workspace.children.length}`,
          `Children beyond visible rows: ${childrenBeyondVisibleRowsCount}`,
          `Attachment 4b selected: ${workspace.fl100.minorChildren.detailsOnAttachment4b.value ? 'Yes' : 'No'}`,
          workspace.fl100.minorChildren.detailsOnAttachment4b.value
            ? 'Starter-packet generation will add FL-100 attachment 4b continuation pages for the extra children.'
            : 'Attachment 4b is not selected; generation should stay blocked until this is resolved.',
        ].join('\n'),
      });

      sections.push({
        heading: 'FL-105 child row overflow',
        body: [
          `Visible FL-105 rows in this packet: ${FL105_FORM_CAPACITY.childrenRows}`,
          `Children entered in workspace: ${workspace.children.length}`,
          `Children beyond visible rows: ${childrenBeyondVisibleRowsCount}`,
          `FL-105 attached pages selected: ${workspace.fl105.attachmentsIncluded.value ? 'Yes' : 'No'}`,
          `Manual FL-105 attachment page count entered: ${workspace.fl105.attachmentsIncluded.value ? (workspace.fl105.attachmentPageCount.value || 'Not provided') : 'Not applicable'}`,
          `Generated FL-105 attachment 2 pages for extra children: ${generatedChildAttachmentPageCount}`,
          'Starter-packet generation now creates FL-105 additional-child continuation pages automatically when children exceed the visible rows.',
        ].join('\n'),
      });
    }

    sections.push({
      heading: 'FL-105 / GC-120 details',
      body: [
        `FL-105 item 1 filing role: ${workspace.fl105.representationRole.value === 'authorized_representative' ? 'Authorized representative' : 'Party'}`,
        `Authorized representative agency name: ${workspace.fl105.representationRole.value === 'authorized_representative' ? (workspace.fl105.authorizedRepresentativeAgencyName.value || 'Not provided') : 'Not applicable'}`,
        `Children lived together for past five years: ${workspace.fl105.childrenLivedTogetherPastFiveYears.value ? 'Yes' : 'No / attachment needed'}`,
        `FL-105 item 3 residence-history assertion reviewed: ${workspace.fl105.childrenResidenceAssertionReviewed.value ? 'Yes' : 'No'}`,
        `FL-105(A)/GC-120(A) generated pages: ${generatedFl105AdditionalChildAttachmentPageCount > 0 ? generatedFl105AdditionalChildAttachmentPageCount : 'No'}`,
        `FL-105(A)/GC-120(A) child sections: ${workspace.fl105.additionalChildrenAttachments.length > 0 ? workspace.fl105.additionalChildrenAttachments.map((entry, index) => {
          const child = workspace.children.find((candidate) => candidate.id === entry.childId);
          const childLabel = child?.fullName.value || `Additional child ${index + 2}`;
          const sameAsChildA = entry.sameResidenceAsChildA.value;
          const historyCount = entry.residenceHistory.filter(hasFl105ResidenceHistoryData).length;
          return `${index + 1}. ${childLabel} — ${sameAsChildA ? `same as child 2a (${entry.sameResidenceReviewed.value ? 'reviewed' : 'not reviewed'})` : `${historyCount} row(s) entered`}`;
        }).join('\n') : 'No additional child sections required.'}`,
        `FL-105 item 3a additional addresses on attachment: ${workspace.fl105.additionalResidenceAddressesOnAttachment3a.value ? 'Yes' : 'No'}`,
        `FL-105 residence history rows entered: ${workspace.fl105.residenceHistory.filter(hasFl105ResidenceHistoryData).length}`,
        `Generated FL-105 attachment 3a overflow rows: ${fl105ResidenceHistoryOverflowCount > 0 ? `Yes (${fl105ResidenceHistoryOverflowCount})` : 'No'}`,
        `Generated FL-105 attachment 3a from residence history: ${generatesFl105ResidenceAttachment ? 'Yes' : workspace.fl105.additionalResidenceAddressesOnAttachment3a.value ? 'Not ready yet' : 'No'}`,
        `FL-105 item 3a residence confidentiality (state only): ${workspace.fl105.residenceAddressConfidentialStateOnly.value ? 'Yes' : 'No'}`,
        `FL-105 item 3a person/address confidentiality (state only): ${workspace.fl105.personAddressConfidentialStateOnly.value ? 'Yes' : 'No'}`,
        `Declarant signature date: ${workspace.fl105.signatureDate.value || 'Not provided'}`,
        `Additional FL-105 attached pages included: ${workspace.fl105.attachmentsIncluded.value ? 'Yes' : 'No'}`,
        `Manual FL-105 attachment page count entered: ${workspace.fl105.attachmentsIncluded.value ? (workspace.fl105.attachmentPageCount.value || 'Not provided') : 'Not applicable'}`,
        `Generated FL-105 child-overflow pages: ${generatedChildAttachmentPageCount}`,
        `Generated FL-105(A)/GC-120(A) child pages: ${generatedFl105AdditionalChildAttachmentPageCount}`,
        workspace.fl105.residenceHistory.length > 0
          ? `Residence history:\n${workspace.fl105.residenceHistory.map((entry, index) => `${index + 1}. From ${entry.fromDate.value || 'Not provided'}${entry.toDate.value ? ` to ${entry.toDate.value}` : ''} — ${entry.residence.value || 'Residence missing'} — Lived with ${entry.personAndAddress.value || 'Not provided'} (${entry.relationship.value || 'Relationship missing'})`).join('\n')}`
          : 'Residence history not entered yet.',
        `Other custody proceedings known: ${workspace.fl105.otherProceedingsKnown.value ? 'Yes' : 'No'}`,
        `FL-105 item 4 other-proceedings assertion reviewed: ${workspace.fl105.otherProceedingsAssertionReviewed.value ? 'Yes' : 'No'}`,
        `Other custody proceedings entered: ${workspace.fl105.otherProceedings.filter(hasFl105ProceedingData).length}`,
        `Generated FL-105 attachment 4 overflow rows: ${fl105ProceedingOverflowCount > 0 ? `Yes (${fl105ProceedingOverflowCount})` : 'No'}`,
        `Protective/restraining orders known: ${workspace.fl105.domesticViolenceOrdersExist.value ? 'Yes' : 'No'}`,
        `FL-105 item 5 protective-order assertion reviewed: ${workspace.fl105.domesticViolenceOrdersAssertionReviewed.value ? 'Yes' : 'No'}`,
        `Protective/restraining orders entered: ${workspace.fl105.domesticViolenceOrders.filter(hasFl105OrderData).length}`,
        `Generated FL-105 attachment 5 overflow rows: ${fl105OrderOverflowCount > 0 ? `Yes (${fl105OrderOverflowCount})` : 'No'}`,
        `Other custody/visitation claimants known: ${workspace.fl105.otherClaimantsKnown.value ? 'Yes' : 'No'}`,
        `FL-105 item 6 other-claimants assertion reviewed: ${workspace.fl105.otherClaimantsAssertionReviewed.value ? 'Yes' : 'No'}`,
        `Other custody/visitation claimants entered: ${workspace.fl105.otherClaimants.filter(hasFl105ClaimantData).length}`,
        `Generated FL-105 attachment 6 overflow rows: ${fl105ClaimantOverflowCount > 0 ? `Yes (${fl105ClaimantOverflowCount})` : 'No'}`,
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
