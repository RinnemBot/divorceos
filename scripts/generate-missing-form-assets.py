#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from PyPDF2 import PdfReader, PdfWriter

REPO = Path(__file__).resolve().parents[1]
PUBLIC = REPO / 'public' / 'forms'
TEMPLATES = REPO / 'templates' / 'forms'


def load_widget_fields(pdf_path: Path) -> list[dict[str, Any]]:
    reader = PdfReader(str(pdf_path), strict=False)
    if reader.is_encrypted:
        try:
            reader.decrypt('')
        except Exception:
            pass
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
                'rect': [float(v) for v in rect] if rect else None,
                'tooltip': str(obj.get('/TU')) if obj.get('/TU') is not None else None,
            })
    return rows


def write_template_without_widgets(pdf_path: Path, out_path: Path) -> None:
    reader = PdfReader(str(pdf_path), strict=False)
    if reader.is_encrypted:
        try:
            reader.decrypt('')
        except Exception:
            pass
    writer = PdfWriter()
    for page in reader.pages:
        page.pop('/Annots', None)
        writer.add_page(page)
    with out_path.open('wb') as handle:
        writer.write(handle)


def generate(stem: str, force: bool = False) -> tuple[str, int] | None:
    pdf_path = PUBLIC / f'{stem}.pdf'
    fields_path = TEMPLATES / f'{stem}.fields.json'
    template_path = TEMPLATES / f'{stem}.template.pdf'
    if not pdf_path.exists():
        raise FileNotFoundError(pdf_path)
    if not force and fields_path.exists() and template_path.exists():
        return None
    fields = load_widget_fields(pdf_path)
    fields_path.write_text(json.dumps(fields, indent=2) + '\n')
    write_template_without_widgets(pdf_path, template_path)
    return stem, len(fields)


if __name__ == '__main__':
    TEMPLATES.mkdir(parents=True, exist_ok=True)
    import argparse
    parser = argparse.ArgumentParser(description='Generate raw official PDF template/field assets for forms that do not yet have custom mappings.')
    parser.add_argument('forms', nargs='*', help='Form stems like fl-342. Defaults to all public/forms PDFs missing template assets.')
    parser.add_argument('--force', action='store_true', help='Overwrite existing template/field assets.')
    args = parser.parse_args()

    stems = args.forms or [p.stem for p in sorted(PUBLIC.glob('*.pdf'))]
    generated = []
    skipped = []
    failed = []
    for stem in stems:
        try:
            result = generate(stem, force=args.force)
            if result is None:
                skipped.append(stem)
            else:
                generated.append(result)
                print(f'Wrote {result[0]} assets with {result[1]} raw official fields')
        except Exception as exc:
            failed.append((stem, str(exc)))
            print(f'FAILED {stem}: {exc}')
    print(f'Done. generated={len(generated)} skipped={len(skipped)} failed={len(failed)}')
    if failed:
        raise SystemExit(1)
