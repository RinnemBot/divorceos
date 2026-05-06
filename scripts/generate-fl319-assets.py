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
    for page in (0, 1):
        map_custom(out, 'FL-319.caption.petitioner', selector(fields, 'Party1[0]', page=page))
        map_custom(out, 'FL-319.caption.respondent', selector(fields, 'Party2[0]', page=page))
        map_custom(out, 'FL-319.caption.otherParentParty', selector(fields, 'Party3[0]', page=page))
        map_custom(out, 'FL-319.caption.caseNumber', selector(fields, 'CaseNumber[0]', page=page))

    map_custom(out, 'FL-319.freeLegalServices', selector(fields, 'Receivingfreelegalsrvcs[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-319.paymentFrom.petitioner', selector(fields, 'Petitionerplaintiff[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-319.paymentFrom.respondent', selector(fields, 'Respondentdefendant[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-319.paymentFrom.other', selector(fields, 'Otherparty[0]', page=0, index=0), field_type='/Btn')
    map_custom(out, 'FL-319.paymentFrom.otherText', selector(fields, 'Specify[0]', page=0))
    map_custom(out, 'FL-319.request.fees', selector(fields, 'Fees[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-319.request.feesAmount', selector(fields, 'DecimalField1[0]', page=0))
    map_custom(out, 'FL-319.request.costs', selector(fields, 'Costs[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-319.request.costsAmount', selector(fields, 'DecimalField2[0]', page=0))
    map_custom(out, 'FL-319.order.feeAmount', selector(fields, 'Feeamt[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-319.order.feeAmountText', selector(fields, 'DecimalField3[0]', page=0))
    map_custom(out, 'FL-319.order.incurredAmount', selector(fields, 'Attysfeesandcostsfrombegin[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-319.order.incurredAmountText', selector(fields, 'DecimalField4[0]', page=0))
    map_custom(out, 'FL-319.order.estimatedAmount', selector(fields, 'estimatefeescosts[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-319.order.estimatedAmountText', selector(fields, 'DecimalField5[0]', page=0))
    map_custom(out, 'FL-319.order.limitedScopeAmount', selector(fields, 'Attysfeeslimitedscope[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-319.order.limitedScopeAmountText', selector(fields, 'DecimalField6[0]', page=0))
    map_custom(out, 'FL-319.priorOrder.no', selector(fields, 'No[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-319.priorOrder.yes', selector(fields, 'YesDescribe[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-319.priorOrder.petitioner', selector(fields, '[0]', page=0, index=0), field_type='/Btn')
    map_custom(out, 'FL-319.priorOrder.respondent', selector(fields, '[0]', page=0, index=1), field_type='/Btn')
    map_custom(out, 'FL-319.priorOrder.other', selector(fields, 'Otherparty[0]', page=0, index=1), field_type='/Btn')
    map_custom(out, 'FL-319.priorOrder.amount', selector(fields, 'DecimalField7[0]', page=0))
    map_custom(out, 'FL-319.priorOrder.date', selector(fields, 'DateField1[0]', page=0))
    map_custom(out, 'FL-319.paymentSources', selector(fields, 'Listknownpaymentsources[0]', page=0))
    map_custom(out, 'FL-319.payments.made', selector(fields, 'Havebeenmade[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-319.payments.notMade', selector(fields, 'Havenotbeenmade[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-319.payments.partial', selector(fields, 'havebeenmadeinpart[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-319.additionalInfo.selected', selector(fields, 'Additionalinformation[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-319.additionalInfo.text', selector(fields, 'specifyaddinfo[0]', page=0))
    map_custom(out, 'FL-319.pagesAttached', selector(fields, 'Noofpagesattached[0]', page=1))
    map_custom(out, 'FL-319.signature.date', selector(fields, 'SigDate[0]', page=1))
    map_custom(out, 'FL-319.signature.name', selector(fields, 'SigName[0]', page=1))
    return out


def write_template_without_widgets() -> None:
    reader = PdfReader(str(PUBLIC / 'fl-319.pdf'))
    if reader.is_encrypted:
        try:
            reader.decrypt('')
        except Exception:
            pass
    writer = PdfWriter()
    for page in reader.pages:
        page.pop('/Annots', None)
        writer.add_page(page)
    with (TEMPLATES / 'fl-319.template.pdf').open('wb') as handle:
        writer.write(handle)


if __name__ == '__main__':
    fields = build_fields(load_fields('fl-319.pdf'))
    (TEMPLATES / 'fl-319.fields.json').write_text(json.dumps(fields, indent=2))
    write_template_without_widgets()
    print(f'Wrote FL-319 assets with {len(fields)} mapped fields')
