from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from PyPDF2 import PdfReader, PdfWriter

REPO = Path('/Users/raymalaspina/.openclaw/workspace/divorceos')
PUBLIC = REPO / 'public' / 'forms'
TEMPLATES = REPO / 'templates' / 'forms'


def load_fields(pdf_name: str) -> list[dict[str, Any]]:
    reader = PdfReader(str(PUBLIC / pdf_name))
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
            rows.append({
                'page': page_index,
                'name': str(name),
                'fullName': str(name),
                'type': str(obj.get('/FT')) if obj.get('/FT') else None,
                'rect': [float(v) for v in obj.get('/Rect')],
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


def map_custom(out: list[dict[str, Any]], custom_name: str, source: dict[str, Any], *, field_type: str | None = None) -> None:
    out.append({
        'page': source['page'],
        'name': custom_name,
        'fullName': custom_name,
        'rect': source['rect'],
        'type': field_type if field_type is not None else source['type'],
        'tooltip': source['tooltip'],
    })


def build_fields(fields: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    map_custom(out, 'FL-141.caption.attorneyOrParty', selector(fields, 'PartyAttyAddInfo_ft[0]'))
    map_custom(out, 'FL-141.caption.phone', selector(fields, 'Phone_ft[0]'))
    map_custom(out, 'FL-141.caption.fax', selector(fields, 'Fax_ft[0]'))
    map_custom(out, 'FL-141.caption.email', selector(fields, 'Email_ft[0]'))
    map_custom(out, 'FL-141.caption.attorneyFor', selector(fields, 'AttyFor_ft[0]'))
    map_custom(out, 'FL-141.caption.county', selector(fields, 'CrtCounty_ft[0]'))
    map_custom(out, 'FL-141.caption.street', selector(fields, 'Street_ft[0]'))
    map_custom(out, 'FL-141.caption.mailing', selector(fields, 'MailingAdd_ft[0]'))
    map_custom(out, 'FL-141.caption.cityZip', selector(fields, 'CityZip_ft[0]'))
    map_custom(out, 'FL-141.caption.branch', selector(fields, 'Branch_ft[0]'))
    map_custom(out, 'FL-141.caption.petitioner', selector(fields, 'Party1_ft[0]'))
    map_custom(out, 'FL-141.caption.respondent', selector(fields, 'Party2_ft[0]'))
    map_custom(out, 'FL-141.caption.otherParentParty', selector(fields, 'Party3_ft[0]'))
    map_custom(out, 'FL-141.caption.caseNumber', selector(fields, 'CaseNumber_ft[0]'))

    map_custom(out, 'FL-141.disclosure.preliminary', selector(fields, 'preliminary_cb[0]', index=0), field_type='/Btn')
    map_custom(out, 'FL-141.disclosure.final', selector(fields, 'final_cb[0]', index=0), field_type='/Btn')
    map_custom(out, 'FL-141.servingParty.petitioner', selector(fields, 'petitioner_cb[0]', index=0), field_type='/Btn')
    map_custom(out, 'FL-141.servingParty.respondent', selector(fields, 'respondent_cb[0]', index=0), field_type='/Btn')
    map_custom(out, 'FL-141.servedOn.petitioner', selector(fields, 'petitioner_cb[1]', index=0), field_type='/Btn')
    map_custom(out, 'FL-141.servedOn.respondent', selector(fields, 'respondent_cb[1]', index=0), field_type='/Btn')
    map_custom(out, 'FL-141.service.personal', selector(fields, 'personalservice_cb[0]'), field_type='/Btn')
    map_custom(out, 'FL-141.service.mail', selector(fields, 'bymail_cb[0]'), field_type='/Btn')
    map_custom(out, 'FL-141.preliminary.otherSelected', selector(fields, 'PreOtherSpecify_cb[0]'), field_type='/Btn')
    map_custom(out, 'FL-141.preliminary.otherText', selector(fields, 'PreOtherSpecify_ft[0]'))
    map_custom(out, 'FL-141.preliminary.serviceDate', selector(fields, 'PreOnDate_ft[0]'))
    map_custom(out, 'FL-141.final.otherSelected', selector(fields, 'FinOther_cb[0]'), field_type='/Btn')
    map_custom(out, 'FL-141.final.otherText', selector(fields, 'FinSpecify_ft[0]'))
    map_custom(out, 'FL-141.final.serviceDate', selector(fields, 'FinOnDate_ft[0]'))
    map_custom(out, 'FL-141.waiveFinalDeclaration', selector(fields, 'DODWaiveFin2105d_cb[0]'), field_type='/Btn')
    map_custom(out, 'FL-141.finalIncomeExpenseServed', selector(fields, 'IandEDec_cb[0]'), field_type='/Btn')
    map_custom(out, 'FL-141.waiveReceipt', selector(fields, 'WaiveReceipt_cb[0]'), field_type='/Btn')
    map_custom(out, 'FL-141.waiverServiceDate', selector(fields, 'on_date_ff[0]'))
    map_custom(out, 'FL-141.signature.name', selector(fields, 'YourName_ft[0]'))
    map_custom(out, 'FL-141.signature.date', selector(fields, 'DateTimeField1[0]'))
    return out


def write_template_without_widgets() -> None:
    reader = PdfReader(str(PUBLIC / 'fl-141.pdf'))
    if reader.is_encrypted:
        try:
            reader.decrypt('')
        except Exception:
            pass
    writer = PdfWriter()
    for page in reader.pages:
        page.pop('/Annots', None)
        writer.add_page(page)
    with (TEMPLATES / 'fl-141.template.pdf').open('wb') as handle:
        writer.write(handle)


if __name__ == '__main__':
    fields = build_fields(load_fields('fl-141.pdf'))
    (TEMPLATES / 'fl-141.fields.json').write_text(json.dumps(fields, indent=2))
    write_template_without_widgets()
    print(f'Wrote FL-141 assets with {len(fields)} mapped fields')
