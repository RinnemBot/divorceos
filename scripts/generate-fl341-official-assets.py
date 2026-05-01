from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any

from PyPDF2 import PdfReader


REPO = Path('/Users/raymalaspina/.openclaw/workspace/divorceos')
PUBLIC_FORMS = REPO / 'public' / 'forms'
TEMPLATES = REPO / 'templates' / 'forms'


def load_official_fields(pdf_name: str) -> list[dict[str, Any]]:
    reader = PdfReader(str(PUBLIC_FORMS / pdf_name))
    rows: list[dict[str, Any]] = []
    for page_index, page in enumerate(reader.pages):
        annots = page.get('/Annots')
        if annots is None:
            continue
        if hasattr(annots, 'get_object'):
            annots = annots.get_object()
        for ref in annots:
            obj = ref.get_object()
            if obj.get('/Subtype') != '/Widget':
                continue
            name = obj.get('/T')
            if not name:
                continue
            rect = obj.get('/Rect')
            rows.append({
                'page': page_index,
                'name': str(name),
                'fullName': str(name),
                'type': str(obj.get('/FT')) if obj.get('/FT') else None,
                'rect': [float(v) for v in rect],
                'tooltip': str(obj.get('/TU')) if obj.get('/TU') is not None else None,
            })
    return rows


def selector(fields: list[dict[str, Any]], name: str, page: int | None = None, index: int = 0) -> dict[str, Any]:
    matches = [f for f in fields if f['name'] == name and (page is None or f['page'] == page)]
    if not matches:
        raise KeyError(f'No official field found: {name} page={page}')
    if index >= len(matches):
        raise IndexError(f'Field index out of range: {name} page={page} index={index} matches={len(matches)}')
    return matches[index]


def map_custom(
    out: list[dict[str, Any]],
    custom_name: str,
    source: dict[str, Any],
    *,
    tooltip: str | None = None,
    field_type: str | None = None,
) -> None:
    out.append({
        'page': source['page'],
        'name': custom_name,
        'fullName': custom_name,
        'rect': source['rect'],
        'type': field_type if field_type is not None else source['type'],
        'tooltip': source['tooltip'] if tooltip is None else tooltip,
    })


def build_fl341a(fields: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []

    # Caption on both pages.
    for page in (0, 1):
        map_custom(out, 'FL-341A.caption.petitioner', selector(fields, 'Party1[0]', page=page))
        map_custom(out, 'FL-341A.caption.respondent', selector(fields, 'Party2[0]', page=page))
        map_custom(out, 'FL-341A.caption.otherParentParty', selector(fields, 'Party3[0]', page=page))
        map_custom(out, 'FL-341A.caption.caseNumber', selector(fields, 'CaseNumber[0]', page=page))

    # Source-order compatibility keys.
    map_custom(out, 'FL-341A.sourceOrder.fl340', selector(fields, 'ResponsiveDec_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341A.sourceOrder.fl180', selector(fields, 'petitioner_cb1[0]', page=0, index=0), field_type='/Btn')
    map_custom(out, 'FL-341A.sourceOrder.fl250', selector(fields, 'petitioner_cb2[0]', page=0, index=0), field_type='/Btn')
    map_custom(out, 'FL-341A.sourceOrder.fl355', selector(fields, 'petitioner_cb3[0]', page=0, index=0), field_type='/Btn')
    map_custom(out, 'FL-341A.sourceOrder.other', selector(fields, 'Respondent_cb[0]', page=0, index=0), field_type='/Btn')
    map_custom(out, 'FL-341A.sourceOrder.otherText', selector(fields, 'Pick_Up_Address_ft[0]', page=0, index=0), field_type='/Tx')

    map_custom(out, 'FL-341A.supervisedParty.petitioner', selector(fields, 'item1checkbox[0]', page=0, index=0), field_type='/Btn')
    map_custom(out, 'FL-341A.supervisedParty.respondent', selector(fields, 'item1checkbox[1]', page=0, index=0), field_type='/Btn')
    map_custom(out, 'FL-341A.supervisedParty.other_parent_party', selector(fields, 'item1checkbox[2]', page=0, index=0), field_type='/Btn')

    map_custom(out, 'FL-341A.supervisor.type.professional', selector(fields, 'petitioner_cb[0]', page=0, index=1), field_type='/Btn')
    map_custom(out, 'FL-341A.supervisor.type.nonprofessional', selector(fields, 'petitioner_cb[0]', page=1, index=0), field_type='/Btn')
    map_custom(out, 'FL-341A.supervisor.type.other', selector(fields, 'petitioner_cb[0]', page=0, index=0), field_type='/Btn')
    map_custom(out, 'FL-341A.supervisor.type.otherText', selector(fields, 'OtherTransportationIssues_ft[0]', page=1), field_type='/Tx')
    map_custom(out, 'FL-341A.supervisor.name', selector(fields, 'T126[0]', page=0, index=0), field_type='/Tx')
    map_custom(out, 'FL-341A.supervisor.contact', selector(fields, 'phonetf[0]', page=0, index=0), field_type='/Tx')

    map_custom(out, 'FL-341A.supervisor.fees.petitioner', selector(fields, 'petitioner_cb2[0]', page=0, index=1), field_type='/Btn')
    map_custom(out, 'FL-341A.supervisor.fees.respondent', selector(fields, 'petitioner_cb3[0]', page=0, index=1), field_type='/Btn')
    map_custom(out, 'FL-341A.supervisor.fees.shared', selector(fields, 'petitioner_cb4[0]', page=0, index=1), field_type='/Btn')
    map_custom(out, 'FL-341A.supervisor.fees.other', selector(fields, 'petitioner_cb5[0]', page=0, index=1), field_type='/Btn')
    map_custom(out, 'FL-341A.supervisor.fees.otherText', selector(fields, 'on_date_ff[0]', page=0, index=0), field_type='/Tx')

    map_custom(out, 'FL-341A.schedule.mode.fl311', selector(fields, 'UnsupervisedVisitation_cb[0]', page=0, index=0), field_type='/Btn')
    map_custom(out, 'FL-341A.schedule.mode.attachment', selector(fields, 'Petitioner_cb[0]', page=0, index=2), field_type='/Btn')
    map_custom(out, 'FL-341A.schedule.mode.text', selector(fields, 'Respondent_cb[0]', page=0, index=5), field_type='/Btn')
    map_custom(out, 'FL-341A.schedule.attachmentPageCount', selector(fields, 'Pick_Up_Address_ft[0]', page=0, index=2), field_type='/Tx')
    map_custom(out, 'FL-341A.schedule.text', selector(fields, 'T126[0]', page=1, index=0), field_type='/Tx')
    map_custom(out, 'FL-341A.restrictions', selector(fields, 'OtherTransportationIssues_ft[0]', page=1), field_type='/Tx')
    map_custom(out, 'FL-341A.otherTerms', selector(fields, 'Pick_Up_Address_ft[0]', page=1, index=3), field_type='/Tx')

    return out


def build_fl341c(fields: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []

    for page in (0, 1):
        map_custom(out, 'FL-341C.caption.petitioner', selector(fields, 'Petitioner_ft[0]', page=page))
        map_custom(out, 'FL-341C.caption.respondent', selector(fields, 'Respondent_ft[0]', page=page))
        map_custom(out, 'FL-341C.caption.otherParentParty', selector(fields, 'OtherParentParty_ft[0]', page=page))
        map_custom(out, 'FL-341C.caption.caseNumber', selector(fields, 'CaseNumber_ft[0]', page=page))

    map_custom(out, 'FL-341C.sourceOrder.fl340', selector(fields, 'FindingsOrder_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341C.sourceOrder.fl180', selector(fields, 'Response_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341C.sourceOrder.fl250', selector(fields, 'RequestForOrder_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341C.sourceOrder.fl355', selector(fields, 'StipOrdCustodyVisitation_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341C.sourceOrder.other', selector(fields, 'OtherSpecify_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341C.sourceOrder.otherText', selector(fields, 'SpecifyOtherAttachment_tf[0]', page=0), field_type='/Tx')

    holiday_rows = {
        'newYearsDay': 'Holidayrow1',
        'springBreak': 'Holidayrow2',
        'thanksgiving': 'Holidayrow3',
        'winterBreak': 'Holidayrow4',
        'childBirthday': 'Holidayrow5',
    }

    for key, row in holiday_rows.items():
        every_name = f'{row}EveryYear_ft[0]'
        if row == 'Holidayrow5':
            every_name = 'Holidayrow5EveryYear_Ft[0]'
        map_custom(out, f'FL-341C.holiday.{key}.mode.every_year', selector(fields, every_name, page=1), field_type='/Btn')
        map_custom(out, f'FL-341C.holiday.{key}.mode.even_years', selector(fields, f'{row}EvenYears_ft[0]', page=1), field_type='/Btn')
        odd_name = f'{row}OddYears_ft[0]'
        if row == 'Holidayrow5':
            odd_name = 'Holidayrow5OddYears_ft[0]'
        map_custom(out, f'FL-341C.holiday.{key}.mode.odd_years', selector(fields, odd_name, page=1), field_type='/Btn')
        # Party assignment does not exist as dedicated fields in official form; map to row label cell.
        map_custom(out, f'FL-341C.holiday.{key}.party.petitioner', selector(fields, f'{row}_ft[0]', page=1), field_type='/Btn')
        map_custom(out, f'FL-341C.holiday.{key}.party.respondent', selector(fields, f'{row}_ft[0]', page=1), field_type='/Btn')
        map_custom(out, f'FL-341C.holiday.{key}.party.other_parent_party', selector(fields, f'{row}_ft[0]', page=1), field_type='/Btn')
        map_custom(out, f'FL-341C.holiday.{key}.times', selector(fields, f'{row}Times_ft[0]', page=1), field_type='/Tx')

    map_custom(out, 'FL-341C.holiday.additionalNotes', selector(fields, 'Other_ft[0]', page=1), field_type='/Tx')

    map_custom(out, 'FL-341C.vacation.party.petitioner', selector(fields, 'Petitioner_cb[0]', page=1), field_type='/Btn')
    map_custom(out, 'FL-341C.vacation.party.respondent', selector(fields, 'Respondent_cb[0]', page=1), field_type='/Btn')
    map_custom(out, 'FL-341C.vacation.party.other_parent_party', selector(fields, 'OtherParentParty_cb[0]', page=1), field_type='/Btn')
    map_custom(out, 'FL-341C.vacation.maxDuration', selector(fields, 'MaxNumber_ft[0]', page=1), field_type='/Tx')
    map_custom(out, 'FL-341C.vacation.maxDurationUnit.days', selector(fields, 'DaysOrWeeks_cb[0]', page=1), field_type='/Btn')
    map_custom(out, 'FL-341C.vacation.maxDurationUnit.weeks', selector(fields, 'DaysOrWeeks_cb[1]', page=1), field_type='/Btn')
    map_custom(out, 'FL-341C.vacation.timesPerYear', selector(fields, 'NumberOfTimes_ft[0]', page=1), field_type='/Tx')
    map_custom(out, 'FL-341C.vacation.noticeDays', selector(fields, 'MinimumNumberofDays_ft[0]', page=1), field_type='/Tx')
    map_custom(out, 'FL-341C.vacation.responseDays', selector(fields, 'DaysToRespond_ft[0]', page=1), field_type='/Tx')
    map_custom(out, 'FL-341C.vacation.outsideCalifornia', selector(fields, 'VacationOutsideCA_cb[0]', page=1), field_type='/Btn')
    map_custom(out, 'FL-341C.vacation.outsideUnitedStates', selector(fields, 'US_cb[0]', page=1), field_type='/Btn')
    map_custom(out, 'FL-341C.vacation.otherTerms', selector(fields, 'Other_ft[1]', page=1), field_type='/Tx')

    return out


def build_fl341d(fields: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []

    for page in (0, 1):
        map_custom(out, 'FL-341D.caption.petitioner', selector(fields, 'Petitioner_ft[0]', page=page))
        map_custom(out, 'FL-341D.caption.respondent', selector(fields, 'Respondent_ft[0]', page=page))
        map_custom(out, 'FL-341D.caption.otherParentParty', selector(fields, 'OtherParentParty_ft[0]', page=page))
        map_custom(out, 'FL-341D.caption.caseNumber', selector(fields, 'CaseNumber_ft[0]', page=page))

    map_custom(out, 'FL-341D.sourceOrder.fl340', selector(fields, 'FindingsOrder_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341D.sourceOrder.fl180', selector(fields, 'Response_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341D.sourceOrder.fl250', selector(fields, 'RequestForOrder_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341D.sourceOrder.fl355', selector(fields, 'StipOrdCustodyVisitation_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341D.sourceOrder.other', selector(fields, 'Otherspecify_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341D.sourceOrder.otherText', selector(fields, 'SpecifyOtherAttachment_tf[0]', page=0), field_type='/Tx')

    mapping = {
        'exchangeSchedule': ('NoncustodialParentLate_cb[0]', 'OtherIfUNable_ft[0]'),
        'transportation': ('ChildCare_cb[0]', 'OtherIfChildIsSick_ft[0]'),
        'makeupTime': ('CanceledParentTime_cb[0]', 'NumberMinutes_no[0]'),
        'communication': ('PhoneParentChildren_cb[0]', 'PhoneContactDetails_ft[0]'),
        'rightOfFirstRefusal': ('Right1stOptionChildCare_cb[0]', 'NumberHour_no[0]'),
        'temporaryChangesByAgreement': ('TermsConditions_cb[0]', 'OtheProvisions_ft[0]'),
        'other': ('Other_cb[0]', 'OtheProvisions_ft[0]'),
    }

    for key, (check_name, text_name) in mapping.items():
        check_page = 1 if key in ('temporaryChangesByAgreement', 'other') else 0
        text_page = 1 if text_name == 'OtheProvisions_ft[0]' else 0
        map_custom(out, f'FL-341D.provision.{key}.selected', selector(fields, check_name, page=check_page), field_type='/Btn')
        map_custom(out, f'FL-341D.provision.{key}.details', selector(fields, text_name, page=text_page), field_type='/Tx')

    return out


def build_fl341e(fields: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []

    map_custom(out, 'FL-341E.caption.petitioner', selector(fields, 'Petitioner_ft[0]', page=0))
    map_custom(out, 'FL-341E.caption.respondent', selector(fields, 'Respondent_ft[0]', page=0))
    map_custom(out, 'FL-341E.caption.otherParentParty', selector(fields, 'OtherParent_ft[0]', page=0))
    map_custom(out, 'FL-341E.caption.caseNumber', selector(fields, 'CaseNumber[0]', page=0))

    map_custom(out, 'FL-341E.sourceOrder.fl340', selector(fields, 'FindingsOrder_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341E.sourceOrder.fl180', selector(fields, 'Response_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341E.sourceOrder.fl250', selector(fields, 'RequestForOrder_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341E.sourceOrder.fl355', selector(fields, 'StipOrdCustodyVisitation_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341E.sourceOrder.other', selector(fields, 'OtherSpecify_cb[1]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341E.sourceOrder.otherText', selector(fields, 'SpecifyOtherAttachment_ft[0]', page=0), field_type='/Tx')

    map_custom(out, 'FL-341E.orderJointLegalCustody', selector(fields, 'SpecialDecisions_cb[0]', page=0), field_type='/Btn')

    decision_rows = {
        'education': 'EnrollmentOrLeavingSchool_cb[0]',
        'nonEmergencyHealthcare': 'SelectionOfDoctor_cb[0]',
        'mentalHealth': 'BeginOrEndCounseling_cb[0]',
        'extracurricular': 'Activities_cb[0]',
    }

    for key, row in decision_rows.items():
        map_custom(out, f'FL-341E.decision.{key}.joint', selector(fields, row, page=0), field_type='/Btn')
        map_custom(out, f'FL-341E.decision.{key}.petitioner', selector(fields, 'petitioner_cb[1]', page=0), field_type='/Btn')
        map_custom(out, f'FL-341E.decision.{key}.respondent', selector(fields, 'Respondent_cb[0]', page=0), field_type='/Btn')
        map_custom(out, f'FL-341E.decision.{key}.other_parent_party', selector(fields, 'Respondent_cb[1]', page=0), field_type='/Btn')

    map_custom(out, 'FL-341E.term.recordsAccess', selector(fields, 'SchoolNotification_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341E.term.emergencyNotice', selector(fields, 'HealthCareNotification_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341E.term.portalAccess', selector(fields, 'EachNotifies_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341E.term.contactUpdates', selector(fields, 'RequiredToAdminister_cb[0]', page=0), field_type='/Btn')

    map_custom(out, 'FL-341E.dispute.meetAndConfer', selector(fields, 'EachPartyAuthorizedToTakeAction_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341E.dispute.mediation', selector(fields, 'NotChangeChildSurName_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341E.dispute.court', selector(fields, 'OtherConseqSpecify_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341E.dispute.other', selector(fields, 'OtherSpecify_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341E.dispute.otherText', selector(fields, 'OtherConsequences_ft[0]', page=0), field_type='/Tx')
    map_custom(out, 'FL-341E.additionalTerms', selector(fields, 'OtherSpecify_ft[0]', page=0), field_type='/Tx')

    return out


def build_fl341b(fields: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []

    for page in (0, 1):
        map_custom(out, 'FL-341B.caption.petitioner', selector(fields, 'Petitioner_ft[0]', page=page))
        map_custom(out, 'FL-341B.caption.respondent', selector(fields, 'Respondent_ft[0]', page=page))
        map_custom(out, 'FL-341B.caption.otherParentParty', selector(fields, 'OtherParentParty_ft[0]', page=page))
        map_custom(out, 'FL-341B.caption.caseNumber', selector(fields, 'CaseNumber_ft[0]', page=page))

    map_custom(out, 'FL-341B.sourceOrder.fl341', selector(fields, 'ChildCustodyVisitationAttachment_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.sourceOrder.jv200', selector(fields, 'JuvenileCustodyOrder_Judgment_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.sourceOrder.other', selector(fields, 'CheckBox61[0]', page=0, index=0), field_type='/Btn')
    map_custom(out, 'FL-341B.sourceOrder.otherText', selector(fields, 'OtherAttachment_ft[0]', page=0), field_type='/Tx')

    map_custom(out, 'FL-341B.restrainedPartyName', selector(fields, 'PartyWhoWillTakeChildWithoutPermissin_ft[0]', page=0), field_type='/Tx')

    map_custom(out, 'FL-341B.risk.violatedPastOrders', selector(fields, 'ViolatedPastOrders_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.risk.noStrongCaliforniaTies', selector(fields, 'NoStrongTiesToCalifornia_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.risk.preparationActions', selector(fields, 'ThingsDoneByParent_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.risk.preparation.quitJob', selector(fields, 'QuitJob_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.risk.preparation.soldHome', selector(fields, 'SoldHome_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.risk.preparation.closedBankAccount', selector(fields, 'ClosedBankAcct_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.risk.preparation.endedLease', selector(fields, 'EndedLease_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.risk.preparation.soldAssets', selector(fields, 'SoldAssets_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.risk.preparation.hiddenOrDestroyedDocuments', selector(fields, 'HiddenOrDestroyedDocs_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.risk.preparation.appliedForPassport', selector(fields, 'AppliedForPassport_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.risk.preparation.other', selector(fields, 'CheckBox61[0]', page=0, index=1), field_type='/Btn')
    map_custom(out, 'FL-341B.risk.preparation.otherDetails', selector(fields, 'ThingsDoneToPrep_ft[0]', page=0), field_type='/Tx')
    map_custom(out, 'FL-341B.risk.history', selector(fields, 'HasHistoryOf_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.risk.history.domesticViolence', selector(fields, 'DomesticViolence_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.risk.history.childAbuse', selector(fields, 'ChildAbuse_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.risk.history.nonCooperation', selector(fields, 'NotCooperating_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.risk.criminalRecord', selector(fields, 'HasCriminalRecord_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.risk.tiesToOtherJurisdiction', selector(fields, 'HasTiesToOtherCountyStateCountry_cb[0]', page=0), field_type='/Btn')

    map_custom(out, 'FL-341B.order.supervisedVisitation', selector(fields, 'SupervisedVisitsOrdered_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.order.supervisedVisitationTerms.fl341a', selector(fields, 'SupVisitTermsWhere_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.order.supervisedVisitationTerms.asFollows', selector(fields, 'SupVisitTermsWhere_cb[1]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.order.supervisedVisitationTerms.details', selector(fields, 'TermsOfSupervisedVisits_ft[0]', page=0), field_type='/Tx')

    map_custom(out, 'FL-341B.order.postBond', selector(fields, 'BondRequiredToBePosted_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.order.postBondAmount', selector(fields, 'DollarAmountofBond_nu[0]', page=0), field_type='/Tx')
    map_custom(out, 'FL-341B.order.postBondTerms', selector(fields, 'SpecifyCont[0]', page=0), field_type='/Tx')

    map_custom(out, 'FL-341B.order.noMoveWithoutPermission', selector(fields, 'PartyMustNotMoveWithChildrenFrom_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.order.noMove.currentResidence', selector(fields, 'CurrentResidence_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.order.noMove.currentSchoolDistrict', selector(fields, 'CheckBox61[0]', page=0, index=2), field_type='/Btn')
    map_custom(out, 'FL-341B.order.noMove.other', selector(fields, 'OtherPlace_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.order.noMove.otherDetails', selector(fields, 'T371[0]', page=0), field_type='/Tx')
    map_custom(out, 'FL-341B.order.noMove.thisCounty', selector(fields, 'ThisCountry_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.order.noMove.otherPlace', selector(fields, 'OtherPlace_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.order.noMove.otherPlaceDetails', selector(fields, 'SpecifyOtherPlace_ft[0]', page=0), field_type='/Tx')

    map_custom(out, 'FL-341B.order.noTravelWithoutPermission', selector(fields, 'NoTravelWithChildren_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.order.noTravel.thisCounty', selector(fields, 'NoMoveFromThisCounty_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.order.noTravel.california', selector(fields, 'NoMovesFromCalifornia_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.order.noTravel.unitedStates', selector(fields, 'NoMoveFromUSA_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.order.noTravel.other', selector(fields, 'NoMoveFromOtherPlace_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.order.noTravel.otherDetails', selector(fields, 'OtherPlace_ft[0]', page=0), field_type='/Tx')

    map_custom(out, 'FL-341B.order.registerInOtherState', selector(fields, 'RegisterThisOrderInAnotherState_cb[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-341B.order.registerInOtherStateName', selector(fields, 'SpecifyOtherState_ft[0]', page=0), field_type='/Tx')
    map_custom(out, 'FL-341B.order.noPassportApplications', selector(fields, 'NoApplicationsForPassportsAndVitalDocs_cb[0]', page=0), field_type='/Btn')

    map_custom(out, 'FL-341B.order.turnInPassportsAndVitalDocs', selector(fields, 'MustTurnInChildrensPassports_cb[0]', page=1), field_type='/Btn')
    map_custom(out, 'FL-341B.order.turnInPassportsAndVitalDocsList', selector(fields, 'ListVitalDocumentsToTurnIn_ft[0]', page=1), field_type='/Tx')

    map_custom(out, 'FL-341B.order.provideTravelInfo', selector(fields, 'GiveOtherParentItemsBeforeTravelWithChildren_cb[0]', page=1), field_type='/Btn')
    map_custom(out, 'FL-341B.order.provideTravelItinerary', selector(fields, 'TravelItinerary_cb[0]', page=1), field_type='/Btn')
    map_custom(out, 'FL-341B.order.provideRoundTripTickets', selector(fields, 'Copies_RoundtripTickets_cb[0]', page=1), field_type='/Btn')
    map_custom(out, 'FL-341B.order.provideAddressesAndTelephone', selector(fields, 'AddressesAndTelephoneInfo_cb[0]', page=1), field_type='/Btn')
    map_custom(out, 'FL-341B.order.provideOpenReturnTicket', selector(fields, 'OpenAirlineTickeForOtherParent_cb[0]', page=1), field_type='/Btn')
    map_custom(out, 'FL-341B.order.provideOtherTravelInfo', selector(fields, 'CheckBox61[0]', page=1, index=0), field_type='/Btn')
    map_custom(out, 'FL-341B.order.provideOtherTravelInfoDetails', selector(fields, 'OtherTravelInfo_ft[0]', page=1), field_type='/Tx')

    map_custom(out, 'FL-341B.order.notifyEmbassyOrConsulate', selector(fields, 'NotifyEmbassyOrConsulate_cb[0]', page=1), field_type='/Btn')
    map_custom(out, 'FL-341B.order.notifyEmbassyOrConsulateCountry', selector(fields, 'SpecifyCountry_ft[0]', page=1), field_type='/Tx')
    map_custom(out, 'FL-341B.order.notifyEmbassyWithinDays', selector(fields, 'NumberOfDaysNoticeDueToCourt_nu[0]', page=1), field_type='/Tx')
    map_custom(out, 'FL-341B.order.obtainForeignOrderBeforeTravel', selector(fields, 'GetOrdersFromOtherCountryLikeOrderInUSA_cb[0]', page=1), field_type='/Btn')
    map_custom(out, 'FL-341B.order.enforceOrder', selector(fields, 'EnforceTheOrder_cb[0]', page=1), field_type='/Btn')
    map_custom(out, 'FL-341B.order.enforceOrderContactInfo', selector(fields, 'EnforcementContactInfo_ft[0]', page=1), field_type='/Tx')
    map_custom(out, 'FL-341B.order.other', selector(fields, 'OtherOrder_cb[0]', page=1), field_type='/Btn')
    map_custom(out, 'FL-341B.order.otherDetails', selector(fields, 'SpecifyOtherOrders_ft[0]', page=1), field_type='/Tx')

    return out


def write_fields(base_name: str, rows: list[dict[str, Any]]) -> None:
    path = TEMPLATES / f'{base_name}.fields.json'
    path.write_text(json.dumps(rows, indent=2) + '\n', encoding='utf-8')


def copy_template(base_name: str) -> None:
    shutil.copyfile(PUBLIC_FORMS / f'{base_name}.pdf', TEMPLATES / f'{base_name}.template.pdf')


def main() -> None:
    TEMPLATES.mkdir(parents=True, exist_ok=True)

    fl341a_official = load_official_fields('fl-341a.pdf')
    fl341b_official = load_official_fields('fl-341b.pdf')
    fl341c_official = load_official_fields('fl-341c.pdf')
    fl341d_official = load_official_fields('fl-341d.pdf')
    fl341e_official = load_official_fields('fl-341e.pdf')

    write_fields('fl-341a', build_fl341a(fl341a_official))
    write_fields('fl-341b', build_fl341b(fl341b_official))
    write_fields('fl-341c', build_fl341c(fl341c_official))
    write_fields('fl-341d', build_fl341d(fl341d_official))
    write_fields('fl-341e', build_fl341e(fl341e_official))

    for name in ('fl-341a', 'fl-341b', 'fl-341c', 'fl-341d', 'fl-341e'):
        copy_template(name)

    print('Generated official FL-341(A/B/C/D/E) template/field assets.')


if __name__ == '__main__':
    main()
