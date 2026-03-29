# Child Support Estimator – Gross Income / Deductions Mode

## Goal
Extend the existing `ChildSupportEstimator` so users can start with gross monthly income, capture the deductions recognized by California DCSS (per the 2024 Guideline Calculator User Guide), and automatically compute net disposable income before running the statutory formula. The UI must keep the current quick net-income mode but add an "Advanced" tab/accordion for gross inputs.

## Inputs
- Gross monthly wages/salary for Parent A & Parent B
- Additional income categories (checkbox + amount):
  - Overtime/bonus/commission
  - Self-employment net income
  - Unemployment/disability benefits
  - Other taxable income
- Deduction toggles/amounts (per Family Code §4059):
  - Federal income tax (auto-estimated via simplified bracket or user-provided amount)
  - State income tax (same approach)
  - FICA (Social Security + Medicare) based on gross up to current caps
  - Mandatory retirement contributions (user supplied)
  - Health insurance premiums paid for the children
  - Mandatory union dues
  - Existing child/spousal support orders actually being paid
  - Extreme hardship deduction placeholder (manual amount + note)

## Calculations
1. For each parent, compute estimated federal/state/FICA amounts using a simplified bracket (document assumptions in UI). Allow user override for tax values.
2. Net disposable income = gross income + extra income − deductions (taxes, FICA, retirement, union dues, health premiums, existing orders, hardship).
3. Feed the computed net values into the existing guideline logic (multi-child factors + full K factor table already implemented).
4. Display an itemized breakdown (gross → deductions → net) beside the support result.

## UI/UX
- Add tabs: "Quick (Net Income)" and "Advanced (Gross Income)".
- Advanced tab groups inputs into Gross Income, Add’l Income, Deductions, Custody/children, Add-ons.
- Provide info tooltips referencing the DCSS calculator guide for each deduction category.
- Show the computed net disposable income (read-only) so users can sanity check against the quick mode.
- Allow users to collapse/expand deduction sections for mobile usability.

## Validation & Gates
- Reuse existing validation (number fields ≥ 0, percentages within range).
- Add warning banners when assumptions are used (e.g., tax estimates are approximate; consult official calculator for final orders).
- Unit tests to cover: single child vs multi-child, gross mode producing same result as quick mode when manual net matches, edge cases (zero income, high income > $15k).
- Update documentation (README or dedicated help panel) to explain both modes.

## Spousal Support / Injunction Extension
- Once gross-mode is live, add a companion "California Spousal Support" card that mirrors the Cristin Lowe Law calculator inputs: annual gross income for both spouses, filing status, dependents, child support paid, health premiums.
- Use the short-term guideline heuristic (40% of higher earner’s net minus 50% of lower earner’s net, adjusted for child support) and clearly mark it as an estimate with the same disclaimers (not court-certified, consult an attorney).
- Surface automatic spousal-support injunction language (reminder that ATROs prohibit transferring property, canceling insurance, etc.) near the CTA.
- Allow users to email the combined child + spousal support summary to themselves or their attorney (optional checkbox).

## Implementation Notes (2026-03-29)
- Advanced mode now ships with a working gross-income calculator that surfaces both the raw inputs and deduction breakdowns per parent.
- Tax/FICA estimates assume a single filer, the 2024 IRS brackets, standard deduction, and California resident brackets. Each line item can be overridden manually to reflect exact numbers from DCSS or DissoMaster outputs.
- Net disposable income feeds directly into the existing guideline logic only when the Advanced tab is active so Quick mode remains untouched for manual entry scenarios.
