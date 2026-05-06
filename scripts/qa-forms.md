# Draft Forms QA fixtures

Run:

```bash
npm run qa:forms
```

The script writes representative packet-preset workspace JSON samples to `tmp/qa-forms/`:

- Start divorce
- Respond to divorce
- Default / uncontested judgment
- RFO support / fees
- DVRO

These are lightweight developer fixtures for preset/regression review. Official PDF generation still depends on full browser-created Draft Forms workspaces and authenticated `/api/maria-documents` access, so this harness intentionally does not bypass auth or vault upload.
