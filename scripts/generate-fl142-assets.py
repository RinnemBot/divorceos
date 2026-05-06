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


def map_asset(out: list[dict[str, Any]], fields: list[dict[str, Any]], key: str, page: int, indexes: tuple[int, int, int, int, int]) -> None:
    desc_i, sep_i, date_i, value_i, owed_i = indexes
    map_custom(out, f'FL-142.asset.{key}.description', selector(fields, 'TextField1[0]', page=page, index=desc_i))
    map_custom(out, f'FL-142.asset.{key}.separateProperty', selector(fields, 'TextField2[0]', page=page, index=sep_i))
    map_custom(out, f'FL-142.asset.{key}.dateAcquired', selector(fields, 'TextField3[0]', page=page, index=date_i))
    map_custom(out, f'FL-142.asset.{key}.grossValue', selector(fields, 'TextField4[0]', page=page, index=value_i))
    owed_name = 'TextField5[0]' if page in (1, 2) and owed_i == -1 else ('TextField6[0]' if page != 0 or owed_i != 0 else 'TextField6[0]')
    if owed_i == -1:
        map_custom(out, f'FL-142.asset.{key}.amountOwed', selector(fields, 'TextField5[0]', page=page, index=0))
    else:
        map_custom(out, f'FL-142.asset.{key}.amountOwed', selector(fields, owed_name, page=page, index=owed_i))


def map_debt(out: list[dict[str, Any]], fields: list[dict[str, Any]], key: str, page: int, indexes: tuple[int, int, int, int]) -> None:
    desc_i, sep_i, owing_i, date_i = indexes
    map_custom(out, f'FL-142.debt.{key}.description', selector(fields, 'TextField1[0]', page=page, index=desc_i))
    map_custom(out, f'FL-142.debt.{key}.separateProperty', selector(fields, 'TextField2[0]', page=page, index=sep_i))
    map_custom(out, f'FL-142.debt.{key}.totalOwing', selector(fields, 'TextField3[0]', page=page, index=owing_i))
    map_custom(out, f'FL-142.debt.{key}.dateAcquired', selector(fields, 'TextField6[0]' if key != 'studentLoans' else 'TextField4[0]', page=page, index=date_i))


def build_fields(fields: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    map_custom(out, 'FL-142.caption.attorneyOrParty', selector(fields, 'TextField1[0]', page=0, index=0))
    map_custom(out, 'FL-142.caption.phone', selector(fields, 'Phone[0]', page=0))
    map_custom(out, 'FL-142.caption.email', selector(fields, 'Email[0]', page=0))
    map_custom(out, 'FL-142.caption.county', selector(fields, 'CrtCounty[0]', page=0))
    map_custom(out, 'FL-142.caption.petitioner', selector(fields, 'Party1[0]', page=0))
    map_custom(out, 'FL-142.caption.respondent', selector(fields, 'Party2[0]', page=0))
    map_custom(out, 'FL-142.caption.caseNumber', selector(fields, 'CaseNumber[0]', page=0))
    map_custom(out, 'FL-142.party.petitioner', selector(fields, 'RB2Choice2[0]', page=0), field_type='/Btn')
    map_custom(out, 'FL-142.party.respondent', selector(fields, 'RB2Choice2[1]', page=0), field_type='/Btn')

    map_asset(out, fields, 'realEstate', 0, (1, 0, 0, 0, 0))
    # page 0 swaps field names for row 2: description is TextField6, owed is TextField1 index 2
    map_custom(out, 'FL-142.asset.household.description', selector(fields, 'TextField6[0]', page=0, index=1))
    map_custom(out, 'FL-142.asset.household.separateProperty', selector(fields, 'TextField4[0]', page=0, index=1))
    map_custom(out, 'FL-142.asset.household.dateAcquired', selector(fields, 'TextField3[0]', page=0, index=1))
    map_custom(out, 'FL-142.asset.household.grossValue', selector(fields, 'TextField2[0]', page=0, index=1))
    map_custom(out, 'FL-142.asset.household.amountOwed', selector(fields, 'TextField1[0]', page=0, index=2))
    map_asset(out, fields, 'jewelryArt', 0, (3, 2, 2, 2, 2))
    map_asset(out, fields, 'vehicles', 1, (0, 0, 0, 0, -1))
    map_asset(out, fields, 'savings', 1, (1, 1, 1, 1, 0))
    map_asset(out, fields, 'checking', 1, (2, 2, 2, 2, 1))
    map_asset(out, fields, 'creditUnion', 1, (3, 3, 3, 3, 2))
    map_asset(out, fields, 'cash', 1, (4, 4, 4, 4, 3))
    map_asset(out, fields, 'taxRefund', 1, (5, 5, 5, 5, 4))
    map_asset(out, fields, 'lifeInsurance', 1, (6, 6, 6, 6, 5))
    map_asset(out, fields, 'stocksBonds', 2, (0, 0, 0, 0, -1))
    map_asset(out, fields, 'retirement', 2, (1, 1, 1, 1, 0))
    map_asset(out, fields, 'profitSharingIra', 2, (2, 2, 2, 2, 1))
    map_asset(out, fields, 'accountsReceivable', 2, (3, 3, 3, 3, 2))
    map_asset(out, fields, 'businessInterests', 2, (4, 4, 4, 4, 3))
    map_asset(out, fields, 'otherAssets', 2, (5, 5, 5, 5, 4))
    map_custom(out, 'FL-142.assetTotals.grossValue', selector(fields, 'total1[0]', page=2))
    map_custom(out, 'FL-142.assetTotals.amountOwed', selector(fields, 'total2[0]', page=2))

    map_debt(out, fields, 'studentLoans', 3, (1, 0, 0, 0))
    map_debt(out, fields, 'taxes', 3, (2, 1, 1, 0))
    map_debt(out, fields, 'supportArrearages', 3, (3, 2, 2, 1))
    map_debt(out, fields, 'unsecuredLoans', 3, (4, 3, 3, 2))
    map_debt(out, fields, 'creditCards', 3, (5, 4, 4, 3))
    map_debt(out, fields, 'otherDebts', 3, (6, 5, 5, 4))
    map_custom(out, 'FL-142.debtTotals.totalOwing', selector(fields, 'TotalDebts[0]', page=3))
    map_custom(out, 'FL-142.continuation.selected', selector(fields, 'ChoiceNumber[0]', page=3), field_type='/Btn')
    map_custom(out, 'FL-142.continuation.pageCount', selector(fields, 'FillText1[0]', page=3))
    map_custom(out, 'FL-142.signature.date', selector(fields, 'SigDate[0]', page=3))
    map_custom(out, 'FL-142.signature.name', selector(fields, 'SigName[0]', page=3))
    return out


def write_template_without_widgets() -> None:
    reader = PdfReader(str(PUBLIC / 'fl-142.pdf'))
    if reader.is_encrypted:
        try:
            reader.decrypt('')
        except Exception:
            pass
    writer = PdfWriter()
    for page in reader.pages:
        page.pop('/Annots', None)
        writer.add_page(page)
    with (TEMPLATES / 'fl-142.template.pdf').open('wb') as handle:
        writer.write(handle)


if __name__ == '__main__':
    fields = build_fields(load_fields('fl-142.pdf'))
    (TEMPLATES / 'fl-142.fields.json').write_text(json.dumps(fields, indent=2))
    write_template_without_widgets()
    print(f'Wrote FL-142 assets with {len(fields)} mapped fields')
