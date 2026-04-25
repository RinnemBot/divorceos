import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage, User } from '@/services/auth';

const FORM_DRAFTS_KEY = 'divorceos_form_drafts';

export type DraftFieldSourceType = 'chat' | 'upload' | 'profile' | 'manual';
export type DraftFieldConfidence = 'high' | 'medium' | 'low';
export type DraftWorkspaceStatus = 'not_started' | 'in_review' | 'ready';
export type DraftFl100PropertyListLocation = 'unspecified' | 'fl160' | 'attachment' | 'inline_list';

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
  fl300: DraftFl300Section;
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
  const defaultFl300 = createDefaultFl300Section(petitionerName);
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
      return `${speaker}: ${message.content.trim()}${attachments}`.trim();
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
    const expression = new RegExp(`(?:^|[\\n.;,:])\\s*(?:${label})\\s*(?:is|are|:|=|-)\\s*([^\\n.;]+)`, 'i');
    const match = text.match(expression);
    const value = cleanExtractedValue(match?.[1]);
    if (value) return value;
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
  };
}

function createChatField<T>(value: T, needsReview = true): DraftField<T> {
  return createField(value, { ...CHAT_PREFILL_SOURCE, needsReview });
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
  const conversationContext = formatChatHandoffMessages(priorMessages.slice(-40));

  const attachmentNames = [...messages]
    .filter((message) => message.role === 'user')
    .flatMap((message) => message.attachments ?? [])
    .map((attachment) => attachment.name)
    .filter(Boolean);

  return { assistantMessage, userMessage, userContext, conversationContext, attachmentNames: Array.from(new Set(attachmentNames)) };
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
    status: 'in_review',
    createdAt: now,
    updatedAt: now,
    sourceSessionId,
    sourceAssistantMessageId,
    intake: {
      userRequest: chatContext || undefined,
      mariaSummary: assistantMessage?.content?.trim() || undefined,
      attachmentNames,
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
    fl300: createDefaultFl300Section(petitionerName),
    fl150: createDefaultFl150Section(petitionerName),
    fl105: createDefaultFl105Section(petitionerName),
    requests: inferRequests(user, chatContext, assistantMessage?.content),
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
