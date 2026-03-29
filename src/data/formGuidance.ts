export interface FormGuidanceEntry {
  basic: string;
  detailed: string;
}

export const FORM_GUIDANCE: Record<string, FormGuidanceEntry> = {
  'fl-100': {
    basic: `• Use FL-100 to open a divorce, legal separation, or nullity case.
• Complete the caption (names, county, case number once you have it) and check the correct relationship boxes.
• Paragraph 2: mark "Divorce" unless you are seeking legal separation/annulment.
• Paragraph 3: list the marriage date, separation date, and confirm jurisdiction.
• Paragraphs 4 & 5: check all boxes that apply (custody, support, property) even if you still need to gather the details.
• Sign and date page 4, then file it with the court along with FL-110 (Summons).`,
    detailed: `**Detailed FL-100 walkthrough**
1. **Caption** – match the Superior Court and branch address exactly as it appears on FL-110. Leave the case number blank until the clerk stamps it.
2. **Legal relationship** – check marriage and/or domestic partnership. If you checked domestic partnership, also attach a copy of the registration.
3. **Residence requirement (§ 2320)** – at least one spouse must have lived in California 6 months and in the county 3 months before filing. If not, mark legal separation first, then amend later.
4. **Statistical facts (¶ 2)** – list both the wedding date and separation date. If you are unsure of the exact separation date, use "on or about".
5. **Minor children (¶ 3)** – list ONLY children of this relationship. Cross-reference UCCJEA (FL-105) so the counties match.
6. **Petitioner’s requests (¶ 4-6)**
   • Custody/visitation: check legal/physical custody boxes and reference the parenting plan you’ll attach on FL-311.
   • Child support: check if there are children under 18—even if you expect a guideline zero order.
   • Spousal support: check both Petitioner/Respondent if you want the court to reserve jurisdiction.
   • Property: check "Determine property rights" and plan to file FL-142/160.
7. **Property declarations (¶ 7)** – you can attach FL-160 immediately or check the box indicating you’ll serve the disclosures later.
8. **Request for attorney fees (§ 2030)** – check if you plan to ask for need-based fees; you’ll support it with an Income & Expense Declaration (FL-150).
9. **Signature** – sign, type/print your name, and date. If you used an attorney-in-fact, note that in the signature block.
10. **Next steps** – file FL-100 + FL-110 together, pay the filing fee (or attach FW-001 for fee waiver), then arrange personal service on the Respondent followed by FL-115 (proof of service).`
  },
  'fl-110': {
    basic: `• FL-110 (Summons) must be filed and served with the petition.
• Fill out the caption to match FL-100 exactly.
• Review page 2 so you understand the automatic temporary restraining orders (ATROs).
• After filing, have the Respondent personally served with FL-100 + FL-110 + blank response packets.`,
    detailed: `**Summons (FL-110) guidance**
- Copy the court name/branch/case number exactly from FL-100 so the clerk can pair the forms.
- Leave the "Notice to Respondent" text untouched; it is standard language.
- The ATROs prohibit either party from removing children, hiding assets, or changing insurance. Mention these when you serve so the Respondent can’t claim ignorance.
- Attach the required blank forms for service: FL-120 (Response) plus FL-105 if there are minor kids.
- After service, have your process server complete FL-115 (Proof of Service) and file it.
- If you anticipate cooperation, consider FL-117 (Notice & Acknowledgement of Receipt) for substituted service, but only after diligent attempts at personal service.`,
  },
  'fl-105': {
    basic: `• Required whenever minor children are involved.
• List where each child has lived for the past five years.
• Identify anyone else with custody/visitation claims.
• Be consistent with the information you’ll provide on FL-311/FL-341.`,
    detailed: `**FL-105 (UCCJEA) specifics**
1. Complete one row per child with the DOB, city, state, and period of residence.
2. Any gaps in the five-year timeframe? Add an extra page explaining why (e.g., newborns, international moves).
3. Section 4 – list all other cases involving custody, visitation, DV, or CPS investigations, even if they’re closed. Courts hate surprises.
4. Section 5 – name anyone (grandparents, former partners) who claims custody rights.
5. Sign under penalty of perjury. If you don’t know something, write “Unknown” rather than leaving it blank.
6. Attach it to both the Petition (FL-100) and Response (FL-120) whenever children are under 18.`,
  },
  'fl-120': {
    basic: `• Use FL-120 to respond within 30 days of being served with FL-100/FL-110.
• Mirror the sections on the Petition: address status, custody, support, property.
• Sign and file with the court clerk, then serve a copy on the Petitioner with FL-115.`,
    detailed: `**FL-120 (Response) guidance**
- Calendar the 30-day deadline from the date of personal service (add 5 days if you were served by mail).
- ¶ 1: check divorce/legal separation/annulment to match what you’ll contest.
- ¶ 2-3: if you dispute residence or date-of-separation facts, note it here.
- ¶ 4-6: mark custody/support boxes for anything you want the court to decide. If you want joint legal custody, check it now even if you’re still negotiating.
- Property section: list separate property you want confirmed to you. You can attach FL-160 for clarity.
- If you want spousal support reserved, check both "Respondent" and "Petitioner" boxes in ¶ 6.
- Sign, file, pay the first appearance fee (or request a fee waiver), and mail a copy to Petitioner along with blank FL-320/FL-321 if you expect hearings.`,
  },
  'fl-142': {
    basic: `• Use FL-142 for your preliminary/ final property disclosures.
• List each asset and debt: who acquired it, the date, and estimated value.
• Include both community and separate property.
• Attach extra pages if needed; be consistent with FL-150 and FL-160.`,
    detailed: `**FL-142 (Schedule of Assets & Debts) tips**
- Separate sections A-D cover real property, vehicles, bank accounts, and household items. List everything, even if you think it’s separate.
- Column C (community or separate) should match the date of acquisition; use "C" for items acquired between marriage and separation, "S" otherwise.
- For retirements, include current balance AND the portion earned before marriage if you have statements.
- Debts section should list credit cards, loans, and any informal debts (family loans) you expect to divide.
- Attach statements for every item under Cal. Rules of Court 5.406.
- Serve FL-142 together with FL-150 and the Declaration of Disclosure (FL-140) within 60 days of filing/response.
- Keep a copy — you’ll reuse it for final disclosures or settlements.`,
  },
  'fl-150': {
    basic: `• Lists your income, expenses, and ability to pay support or fees.
• Fill out Sections 1–6 and attach recent pay stubs or profit/loss statements.
• Keep numbers consistent with what you reported on FL-142 and tax returns.`,
    detailed: `**FL-150 (Income & Expense Declaration)**
1. **Employment (Items 1–3)** – include second jobs, gig work, or self-employment. If hours vary, average the last 12 months.
2. **Tax filing status** – match your most recent tax return or explain why it will change (e.g., you’ll file separately this year).
3. **Other income** – include bonuses, RSUs, rental income, unemployment, and public benefits. Courts expect transparency even if the amount fluctuates.
4. **Deductions** – list mandatory retirement, union dues, health insurance. Voluntary 401(k) contributions rarely reduce support.
5. **Expenses** – focus on actual monthly costs (rent, child care, medical). If you’re moving, list projected costs and explain in Item 13.
6. **Additional pages** – attach pay stubs covering the last 2 months (or a P&L if self-employed) to comply with CRC 5.260.
7. **Certification** – sign under penalty of perjury; incorrect or missing info can sink support requests.`,
  },
  'fl-141': {
    basic: `• Confirms you served your preliminary/final disclosures.
• Check the boxes for the exact documents you served (FL-140, FL-150, FL-142/160).
• File it with the court—don’t serve it on the other party.`,
    detailed: `**FL-141 (Declaration re Service of Disclosure)**
- Use one form per service event. You’ll normally file it twice: once for preliminary disclosures, once for final.
- Section 1: enter the date you served the disclosure packet. For electronic service you must have a written agreement; otherwise personal/mail service only.
- Section 2: check each document included (FL-140, FL-150, FL-142/FL-160). If you provided a statement of assets outside the Judicial Council forms, note it in "Other".
- Section 3: sign the declaration and file it with the court—this is your proof that you complied with Fam. Code §§ 2103–2106.
- Remember to file the matching FL-141 for the Respondent when they serve you; the court will not set trial without both sides on file.`,
  },
  'fl-160': {
    basic: `• Optional detailed property schedule that pairs with FL-160 attachments (community / separate property).
• Use one attachment per property type so the court can import it into a judgment.`,
    detailed: `**FL-160 (Property Declaration)**
- Use Attachment 1 for Community Property and Attachment 2 for Separate Property; include the item number from FL-100/120 so the judge can cross-reference.
- Columns should show description, date acquired, gross fair market value, and the amount of any liens.
- The final column lets you propose how to divide the item (“Petitioner to receive” vs “Respondent to receive”). Fill it out so your judgment can be signed without redrafting.
- Attach supporting statements (deeds, titles, account statements) with the same numbering system.
- Sign each attachment even though it’s part of FL-160; the court treats it as testimony under penalty of perjury.`,
  },
  'fl-311': {
    basic: `• Parenting plan attachment for custody/visitation.
• Fill out parenting schedule, holiday plan, transportation, and decision-making preferences.
• Attach it to any request that involves custody (FL-300, FL-260).`,
    detailed: `**FL-311 (Child Custody & Visitation Attachment)**
- Section 2: spell out the regular weekly schedule by day and time; avoid "reasonable" schedules unless both parents truly cooperate.
- Section 3: detail holidays/special days. Judges appreciate alternating even years/odd years.
- Section 4: describe the exchange location and who drives. If exchanges happen at school, say so.
- Section 5: add safety provisions (no alcohol 12 hours before exchanges, supervised visits, etc.). Tie them to evidence if possible.
- Section 6: include travel notice requirements (30 days’ notice before travel, passports held by which parent, etc.).
- Attach additional sheets for unique needs (therapy, medical decisions, extracurriculars) so your plan is complete enough to copy into a final order.`,
  },
  'fl-195': {
    basic: `• Income Withholding for Support—used to garnish wages for child or spousal support.
• Usually prepared after a support order; submit it to the employer once signed by the clerk/judge.`,
    detailed: `**FL-195 (Income Withholding Order)**
- Copy the exact support amounts from your signed child/spousal support order, including add-ons (child care, uninsured medical, etc.).
- Section 3 requires the pay cycle; confirm whether the employer pays weekly, biweekly, or monthly.
- Provide the employer’s full legal name and address; inaccurate info delays garnishment.
- If multiple children are covered, add their name/ DOB but redact on any copy filed publicly to protect privacy.
- Serve one copy on the employer (certified mail works) and another on the other party; keep proof of service.
- The employer usually has 10 days to start withholding. Follow up with the local child support agency if nothing happens.`,
  },
  'fl-115': {
    basic: `• Proof of Service of Summons—file after the Respondent is personally served.
• Your process server (not you) must complete and sign it.
• File with the clerk to show the 30-day response clock has started.`,
    detailed: `**FL-115 (Proof of Service of Summons)**
- Section 1 lists the documents served (typically FL-100, FL-110, blank FL-120, FL-105 when kids involved). Make sure every document in the service packet is checked.
- Section 2 identifies the process server. They must be 18+ and not a party to the case. Professional servers should include their registration number.
- Section 3 describes how service occurred (personal or substituted). For substituted service, attach the declaration of diligence and mailing details.
- The server signs under penalty of perjury. You then file the original FL-115 with the court; keep a copy for your records.
- Without this form, the court cannot enter defaults or enforce deadlines, so file it immediately after service.`,
  },
  'fl-117': {
    basic: `• Notice and Acknowledgment of Receipt—used for cooperative service by mail.
• Mail the packet along with two copies of FL-117 and a return envelope.
• Respondent signs and mails it back; file it with the court.`,
    detailed: `**FL-117 (Notice & Acknowledgment)**
- Only use when the Respondent agrees to accept service—never for domestic violence cases.
- Fill in the top box with the documents sent, then sign the “Notice” portion before mailing.
- Include two copies and a self-addressed stamped envelope so the Respondent can sign the “Acknowledgment” and return it.
- Once returned, attach the signed acknowledgment to FL-117 and file it with the clerk; it has the same legal effect as personal service and starts the 30-day response period.
- If the Respondent fails to return it, you must revert to traditional service and cannot recover the filing fee for this attempt.`,
  },
  'fl-272': {
    basic: `• Default/Uncontested Judgment declaration.
• Use when the other party did not respond and you want the judge to enter judgment based on your paperwork.
• Summarize your requests (custody, support, property) and confirm disclosures are complete.`,
    detailed: `**FL-272 (Declaration for Default or Uncontested Dissolution)**
- Check box 4a if the Respondent defaulted (no FL-120 filed) and you mailed the default packet; check 4b if you have a signed settlement (written agreement attached).
- Attach your proposed judgment (FL-180 + attachments) and any required support calculations (DissoMaster printout or guideline worksheet).
- Paragraph 5 confirms the status of your financial disclosures—if both sides waived final disclosures, attach the waiver.
- Use paragraph 7 to provide short narrative facts (length of marriage, number of children, community property outline) so the judge sees the big picture.
- Sign/date and file it with your judgment packet; many counties reject judgments without a properly completed FL-272.`,
  },
  'fl-140': {
    basic: `• Declaration of Disclosure cover sheet.
• Attach it to the packet of disclosures you’re serving (FL-150 + FL-142/160).
• Sign and serve it; it does not get filed.`,
    detailed: `**FL-140 (Declaration of Disclosure)**
- Complete Section 1 with the case information and check whether it’s preliminary or final disclosures.
- Section 2 outlines what you’re serving: Income & Expense Declaration, Schedule of Assets & Debts, tax returns, statement of material facts. Check every item included.
- Section 3 requires the date you will complete final disclosures (or leave blank if preliminary).
- Sign under oath and serve this form with the disclosure packet. Do **not** file FL-140 with the court—only file FL-141 after service is completed.
- Both parties must exchange disclosures unless they have a valid written waiver (Fam. Code § 2107).`,
  },
  'fl-312': {
    basic: `• Parenting Time Order attachment—commonly paired with FL-341 or FL-311.
• Use when you need detailed provisions for custody/visitation beyond the basic schedule.`,
    detailed: `**FL-312**
- Choose the options that match your case: supervised visitation, exchanges at a neutral site, no alcohol use during visits, etc.
- Section 3 lets you craft a detailed transportation plan (who drives, what happens if someone is late).
- Section 5 can impose communication rules (use OurFamilyWizard, no put-downs, etc.).
- Judges appreciate when each clause references the child’s name so orders are enforceable without confusion.
- Attach extra pages for unique medical/education provisions.`,
  },
  'fl-341': {
    basic: `• FL-341 (and sub-attachments A-D) outline legal/physical custody and visitation details.
• Attach the subforms that apply to your case (e.g., Attachment A for Supervised Visitation).`,
    detailed: `**FL-341 series**
- Use the main FL-341 page to state who has legal custody, physical custody, and a general visitation schedule.
- Attachment (A) is for Supervised Visitation, (B) for Child Abduction Prevention, (C) for Children’s Holiday Schedule, (D) for Order for Joint Legal Custody.
- Check only the attachments you are filing so the clerk/judge knows which provisions to review.
- If you’re stipulating, initial every page. If you’re submitting for a hearing, highlight the key clauses in your declaration so the judicial officer understands why you need them.`,
  },
  'fl-342': {
    basic: `• Child Support Information and Order Attachment.
• Summarizes guideline calculations and add-ons.
• Attach to any order or judgment that includes child support.`,
    detailed: `**FL-342**
- Item 1 captures the guideline result (enter the DissoMaster numbers). Attach the printout if required by local rule.
- Item 2 lists mandatory add-ons (child care, uninsured medical) and optional add-ons (education, travel). Specify the cost-sharing percentage.
- Item 3 sets payment logistics: due date, initial payment, whether to use DCSS.
- Item 5 allows for health insurance provisions—identify which parent must maintain coverage.
- Judges rely on this attachment to make support orders enforceable, so double-check the math and parties’ names.`,
  },
  'fl-191': {
    basic: `• Child Support Case Registry form.
• Required whenever child support is ordered.
• Provides contact/employer info to the State Disbursement Unit.`,
    detailed: `**FL-191**
- Fill in both parents’ contact info, SSN (if comfortable—omit on public copies), employers, and the kids covered by the order.
- Submit it with the support order; the court forwards it to the State Disbursement Unit so payments can be tracked.
- Update FL-191 anytime someone moves or changes employment.`,
  },
  'fl-342a': {
    basic: `• Joint Custody Attachment for child support cases requiring special provisions.
• Use when parents share custody in a way that affects support payments.`,
    detailed: `**FL-342(A)**
- Useful when parents share costs unevenly (e.g., one pays private school, the other extracurriculars) and you want those credits built into the support order.
- Specify the expenses, due dates, reimbursement timeline, and documentation requirements.
- Combine with FL-342 to keep the judge’s order organized.`,
  },
  'fl-346': {
    basic: `• Spousal/Partner Support Declaration Attachment.
• Provides supporting facts for spousal support requests (Fam. Code § 4320 factors).`,
    detailed: `**FL-346**
- Address each § 4320 factor: earning capacity, contributions to education, duration of marriage, age/health, tax consequences, etc.
- Use bullet points and attach exhibits (pay stubs, budgets) referenced by letter.
- Judges appreciate concise explanations tied to evidence (“See Exhibit B – 2023 W-2”).`,
  },
  'fl-431': {
    basic: `• Spousal/Partner Support Order Attachment.
• Summarizes the court’s spousal support order (amount, duration, conditions).`,
    detailed: `**FL-431**
- Fill in the monthly amount, start date, and termination triggers (death/remarriage).
- Section 5 allows you to specify wage assignments or lump-sum buyouts.
- Attach to judgments or minute orders so the support terms are enforceable.`,
  },
  'fl-435': {
    basic: `• Spousal/Partner Support Order After Hearing.
• Used when the judge makes an order at a hearing (FL-300 request).`,
    detailed: `**FL-435**
- Summarize what the judge ordered: amount, effective date, arrears, attorney fees, etc.
- Serve it on the other party and file with the court. If the other party doesn’t sign, submit it as a proposed order—most judges will sign if it matches the minute order.
- Pair with FL-343 if child support was also addressed.`,
  },
  'fl-830': {
    basic: `• Stipulation & Order for Dissolution/Legal Separation without spouse’s signature (summary dissolution cases).
• Used when parties qualify for the summary procedure.`,
    detailed: `**FL-830**
- Confirm eligibility: marriage under 5 years, no kids, limited assets/debts, both waive spousal support.
- Detail how property/debts are divided and attach the settlement agreement.
- Both parties sign; submit to the clerk with the rest of the summary dissolution packet.
- Waiting period is still 6 months from filing the Notice of Intention (FL-800).`,
  },
  'fl-345': {
    basic: `• Property Declaration Attachment (general).
• Lets you describe assets/debts when FL-160 isn’t attached.`,
    detailed: `**FL-345**
- Use it to list contested items in detail for trial statements or settlement proposals.
- Include fair market value, liens, and proposed distribution for each asset.
- Attach supporting documents labeled with the same item numbers for clarity.`,
  },
  'fl-348': {
    basic: `• Property Order Attachment to Judgment.
• Finalizes how each asset/debt is awarded in the judgment.`,
    detailed: `**FL-348**
- Break out each category (real property, vehicles, bank accounts, debts) and specify who receives what.
- Include refinance deadlines or equalizing payments if needed.
- Judges prefer this attachment because they can sign the judgment without rewriting property language.`,
  },
  'fl-460': {
    basic: `• Simplified Property Declaration.
• Alternate to FL-142 for very small estates.`,
    detailed: `**FL-460**
- Suitable when the asset list is short (e.g., one car, a bank account). For anything complex, stick with FL-142.
- List community assets/debts, then separate ones for each party.
- Still must be exchanged with the other party—treat it like any disclosure document.`,
  },
  'dv-100': {
    basic: `• Petition for Domestic Violence Restraining Order.
• Describes the abuse and the protection you need.
• File with DV-109/DV-110 for temporary orders.`,
    detailed: `**DV-100**
- List every incident of abuse (physical, threats, stalking, coercive control). Specific dates and examples carry more weight.
- Check the boxes for protections you need: stay-away, move-out, custody, support, firearms surrender.
- Attach photos, texts, or police reports as exhibits. Summarize them in Item 27.
- Sign under penalty of perjury and submit to the clerk for same-day review.`,
  },
  'dv-101': {
    basic: `• Detailed description of abuse (optional attachment).
• Use when you need more space than DV-100 provides.`,
    detailed: `**DV-101**
- Tell the story chronologically: what happened, injuries, witnesses, law enforcement involvement.
- Explain how the abuse impacts the children if you’re requesting custody orders.
- Attach supporting documents and label them (Exhibit A, B, etc.).`,
  },
  'dv-105': {
    basic: `• Requests child custody/visitation orders within a DVRO case.
• Similar to FL-311 but tailored for DV cases.`,
    detailed: `**DV-105**
- Describe existing custody arrangements and why you need court intervention.
- Propose a schedule that keeps the children safe (supervised exchanges, professionally supervised visits, etc.).
- Tie each request back to the abuse described in DV-100 so the judge sees the connection.`,
  },
  'dv-108': {
    basic: `• Request for Order: No Travel with Children.
• Stops the restrained person from removing kids from the area.`,
    detailed: `**DV-108**
- Provide specific reasons (prior threats to kidnap, passports, family overseas).
- Ask for surrender of passports and restrictions on new applications.
- Suggest limited travel radius (e.g., within California) if appropriate.`,
  },
  'dv-109': {
    basic: `• Notice of Court Hearing—issued by the court.
• Lists hearing date/time; you must serve it with the DV packet.`,
    detailed: `**DV-109**
- After the clerk fills in the hearing info, make copies and include it in the service packet.
- Personal service must occur at least 5 court days before the hearing for the restrained person (2 court days for Custody/Visitation requests).
- File proof of service before the hearing.`,
  },
  'dv-110': {
    basic: `• Temporary Restraining Order (TRO) signed by the judge.
• Lists the temporary protections until the hearing.`,
    detailed: `**DV-110**
- Review the signed order carefully—these are the rules in effect immediately.
- Serve it with DV-109/100/101 so the restrained person knows the restrictions.
- Keep copies with you; law enforcement will enforce what is written here.
- Any firearm surrender orders must be complied with within 24 hours.`,
  },
  'dv-120': {
    basic: `• Response to DV restraining order.
• Lets the restrained person tell their side and request custody/ visitation.`,
    detailed: `**DV-120**
- Must be filed before the hearing; serve a copy on the requesting party (mail OK).
- Respond to each request (agree, disagree, explain). If you want custody orders, attach DV-120-INFO or FL-341 forms.
- Bring proof (texts, witnesses) to the hearing.`,
  },
  'dv-130': {
    basic: `• Restraining Order After Hearing (final order).
• Issued if the judge grants the DVRO.`,
    detailed: `**DV-130**
- Review it before leaving court to ensure all provisions you requested are included (custody, support, residence exclusion, etc.).
- Once signed, the clerk files it and provides copies; serve the restrained person if they didn’t attend the hearing.
- Keep it with you; law enforcement enforces these terms for the duration (up to 5 years).`,
  },
  'dv-140': {
    basic: `• Request for Firearms Surrender Order.
• Used when you need specific firearm surrender instructions.`,
    detailed: `**DV-140**
- Identify any known firearms and explain threats/risks.
- Ask the court to order immediate surrender and proof of compliance.
- Attach to DV-100 so the judge sees it with the initial request.`,
  },
  'dv-200': {
    basic: `• Proof of Personal Service for DV cases.
• Required after serving DV-100/109/110 packet.`,
    detailed: `**DV-200**
- Similar to FL-115 but specific to DV forms. The server lists every document served, the person served, and how service occurred.
- File it ASAP; without it the court can’t proceed at the hearing.
- If you use a sheriff or professional server, have them fill it out or provide their certificate of service.`,
  },
  'fl-130': {
    basic: `• Appearance, Stipulations, and Waivers.
• Lets parties waive certain procedural steps (notice of trial, final declaration of disclosure) when settling.`,
    detailed: `**FL-130**
- Both parties sign to confirm they made an appearance and waive rights listed in Items 1–5 (e.g., require no further notice).
- Attach it to stipulated judgments so the court knows both sides consented.
- Be sure the waiver of final disclosures (Item 4) is only checked if both parties completed or validly waived them.`,
  },
  'fl-144': {
    basic: `• Stipulation to Establish or Modify Child Support.
• Used when parents agree to a support number.`,
    detailed: `**FL-144**
- Enter the guideline calculation and the agreed-upon figure. Explain any deviation (significant parenting time, travel costs, etc.).
- Both parties initial the “Notice” acknowledging they understand the guideline amount.
- Attach DissoMaster calculations and file it with the court for approval.
- Include FL-342 so the terms are enforceable.`,
  },
  'fl-165': {
    basic: `• Request to Enter Default.
• Filed when the Respondent misses the 30-day deadline and you want default entered.`,
    detailed: `**FL-165**
- Attach proof of service (FL-115) and, if applicable, a military status affidavit.
- Check the box requesting default and list any fees/costs to be added to the judgment.
- Mail a copy to the Respondent to show notice was given before default judgment.`,
  },
  'fl-170': {
    basic: `• Declaration for Default or Uncontested Dissolution (with agreements).
• Similar to FL-272 but used when parties signed a written agreement.`,
    detailed: `**FL-170**
- Choose the scenario that applies: default, uncontested with agreement, or both parties appeared.
- Confirm child custody, support, and property terms match the agreement/judgment attachments.
- Include the status of disclosures and whether spousal support is reserved.
- Sign and file with the judgment packet.`,
  },
  'fl-180': {
    basic: `• Judgment (Family Law).
• Cover sheet the judge signs to finalize the divorce/legal separation.`,
    detailed: `**FL-180**
- Fill in the statistical info (marriage date, separation date, children) and the status of child/spousal support.
- Check every attachment that makes up the judgment (FL-341, FL-348, FL-342, etc.).
- Leave the “Judgment” portion for the judge; once signed, file-stamped copies must be served on the other party.`,
  },
  'fl-182': {
    basic: `• Notice of Entry of Judgment (Proof of Service).
• Tells the other party the judgment was entered and starts appeal deadlines.`,
    detailed: `**FL-182**
- Fill out the top with the case info, attach the file-stamped judgment, and serve it by mail.
- Complete the proof of service section (or attach POS-030) showing who mailed it and when.
- File the original with the court; deadlines (set-aside motions, appeals) run from this service date.`,
  },
  'fl-190': {
    basic: `• Notice of Entry of Judgment (Uncontested).
• Similar to FL-182 but used when no response was filed.`,
    detailed: `**FL-190**
- Fill in judgment details, serve it, and file with the clerk.
- Many counties require FL-190 plus FL-182; follow your local checklist.
- Without proof of service of the judgment, some agencies (DMV, SSA) won’t recognize the divorce.`,
  },
  'fl-347': {
    basic: `• Stipulation for Entry of Judgment.
• Lets parties submit a written agreement for the court to adopt without a hearing.`,
    detailed: `**FL-347**
- Summarize the agreement (custody, support, property) or attach the full Stipulated Judgment.
- Both parties (and attorneys, if any) sign. Nonsigning parties must be served with a Notice of Entry afterward.
- File it with FL-180 and supporting attachments. Judges usually sign stipulated judgments faster when FL-347 is included.`,
  },
};
