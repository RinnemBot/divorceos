export interface CountyStep {
  title: string;
  description: string;
}

export interface CountyGuide {
  id: string;
  name: string;
  filingMethod: string;
  filingFee: string;
  responseFee: string;
  clerk: {
    courthouse: string;
    address: string;
    hours: string;
    phone: string;
    efilePortal?: string;
  };
  processingTime: string;
  serviceNotes: string;
  steps: CountyStep[];
  proTips: string[];
}


export function getCountyGuideIdFromName(countyName?: string | null): string | undefined {
  if (!countyName) return undefined;
  const normalized = countyName.trim().toLowerCase();
  const slug = normalized
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const slugMatch = COUNTY_GUIDES.find((guide) => guide.id === slug);
  if (slugMatch) {
    return slugMatch.id;
  }
  return COUNTY_GUIDES.find((guide) => guide.name.toLowerCase().includes(normalized))?.id;
}


export const COUNTY_GUIDES: CountyGuide[] = [
  {
    id: 'los-angeles',
    name: 'Los Angeles County',
    filingMethod: 'Mandatory e-filing (TurboCourt) + limited in-person drop boxes',
    filingFee: '$435 (petition) | $435 (response)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Stanley Mosk Courthouse',
      address: '111 N. Hill St., Los Angeles, CA 90012',
      hours: 'Mon–Fri, 8:30am – 4:30pm',
      phone: '(213) 830-0803',
      efilePortal: 'https://www.lacourt.org/EFiling/familylaw' ,
    },
    processingTime: 'Initial filings accepted within 1–2 business days; stamped copies available in portal',
    serviceNotes: 'Personal service within 60 days is strongly preferred; LA sheriffs serve within 2–3 weeks.',
    steps: [
      {
        title: 'Create e-filing account',
        description: 'Register for the court-approved Family Law e-filing provider (TurboCourt). Save your login for future filings.',
      },
      {
        title: 'Upload FL-100 & FL-110',
        description: 'Combine forms into a single PDF, include Civil Case Cover Sheet (CM-010), and pay the $435 fee online.',
      },
      {
        title: 'Wait for acceptance',
        description: 'You’ll get an email when the clerk accepts the filing—download the conformed copies with the stamped case number.',
      },
      {
        title: 'Serve the packet',
        description: 'Have a server deliver FL-100, FL-110, blank FL-120, FL-105 (if kids) + local form FAM 020. File FL-115 once complete.',
      },
      {
        title: 'Set calendar reminders',
        description: 'LA requires status conferences around the 6–9 month mark. Use our reminders to avoid missing them.',
      },
    ],
    proTips: [
      'Add “Return for Correction” monitoring—LA e-filings can be rejected for small mistakes.',
      'Clerks expect FL-157 (Spousal Support Declaration) for long-term marriages when support requested.',
      'Mail service for disclosures is acceptable but include POS-030 within 5 days.',
    ],
  },
  {
    id: 'orange',
    name: 'Orange County',
    filingMethod: 'E-filing strongly encouraged; Lamoreaux Justice Center still accepts window filings.',
    filingFee: '$435 (petition) | $435 (response)',
    responseFee: '$435',
    clerk: {
      courthouse: 'Lamoreaux Justice Center',
      address: '341 The City Dr. S., Orange, CA 92868',
      hours: 'Mon–Fri, 8:00am – 4:00pm',
      phone: '(657) 622-8457',
      efilePortal: 'https://www.occourts.org/media-relations/efiling/family.html',
    },
    processingTime: 'Same-day acceptance if filed before 3pm; stamped copies emailed immediately.',
    serviceNotes: 'Orange allows Notice & Acknowledgment (FL-117) for cooperative respondents; otherwise use personal service.',
    steps: [
      {
        title: 'Prep your packet',
        description: 'FL-100, FL-110, FL-105 (kids), local form L-1120 (Family Law Cover Sheet).',
      },
      {
        title: 'File online or window',
        description: 'Upload via eFileCA or drop at the Lamoreaux clerk windows. Same fees either way.',
      },
      {
        title: 'Serve + file proof',
        description: 'Serve the respondent and upload FL-115. Orange rejects proofs that omit server’s county/registration number.',
      },
      {
        title: 'Plan disclosures',
        description: 'Prelim disclosures due within 60 days. Our reminder engine will nudge you 45 days post-filing.',
      },
    ],
    proTips: [
      'Reserve hearing dates online through the Self-Help portal; walk-in reservations are rarely available.',
      'Orange frequently requests FL-341(A) for custody orders—even for temporary requests.',
    ],
  },
  {
    id: 'san-diego',
    name: 'San Diego County',
    filingMethod: 'E-file for most filings; Downtown and Vista courthouses accept drop-offs.',
    filingFee: '$450 (petition) | $450 (response)',
    responseFee: '$450',
    clerk: {
      courthouse: 'Central Courthouse (Family Law)',
      address: '1100 Union St., San Diego, CA 92101',
      hours: 'Mon–Fri, 8:30am – 4:00pm',
      phone: '(619) 844-2700',
      efilePortal: 'https://www.sdcourt.ca.gov/portal/page?_pageid=55,1924471&_dad=portal&_schema=PORTAL',
    },
    processingTime: '2–3 days for acceptance; mailed copies take 7–10 days so download online.',
    serviceNotes: 'Sheriff service averages 3 weeks. Use a registered process server if you’re on a tight timeline.',
    steps: [
      {
        title: 'Assemble forms',
        description: 'FL-100, FL-110, FL-105 (if kids), FL-157 (if requesting support), and local SDSC Form D-049.',
      },
      {
        title: 'E-file + pay',
        description: 'Upload through One Legal. Include a self-addressed stamped envelope if you need physical copies mailed back.',
      },
      {
        title: 'Serve promptly',
        description: 'Courts expect service within 60 days. Use our server checklist to ensure nothing is missed.',
      },
      {
        title: 'Track hearings',
        description: 'San Diego issues a Case Management Conference around day 120. Add it to your roadmap automatically.',
      },
    ],
    proTips: [
      'Vista branch requires separate drop-offs for restraining order packets—plan for extra time.',
      'Attach SDSC local form D-049 for financial information whenever you’re requesting temporary orders.',
    ],
  },
  {
    id: 'san-francisco',
    name: 'San Francisco County',
    filingMethod: 'E-filing via Odyssey; limited walk-in counter services at McAllister St.',
    filingFee: '$435 (petition/response)',
    responseFee: '$435',
    clerk: {
      courthouse: 'Unified Family Court',
      address: '400 McAllister St., San Francisco, CA 94102',
      hours: 'Mon–Fri, 8:30am – 2:00pm (reduced hours)',
      phone: '(415) 551-4000',
      efilePortal: 'https://www.sfsuperiorcourt.org/divisions/civil/efiling',
    },
    processingTime: 'Expect 3–4 business days for acceptance; clerks often “return for correction” if signatures missing.',
    serviceNotes: 'Because of limited sheriff resources, private process servers are recommended.',
    steps: [
      {
        title: 'Complete forms',
        description: 'FL-100, FL-110, local FLF-001 (Civil Case Cover Sheet Addendum).',
      },
      {
        title: 'E-file package',
        description: 'Upload through Odyssey, pay the fee, and wait for an acceptance email with stamped copies.',
      },
      {
        title: 'Serve and file proof',
        description: 'Serve all required forms plus local notice FLF-027. File FL-115 once done.',
      },
      {
        title: 'Watch for 6-month review',
        description: 'The court sends postcards scheduling a review hearing—enter it into the roadmap so you’re ready.',
      },
    ],
    proTips: [
      'Self-help center requires appointments; schedule online to validate your roadmap before filing.',
      'If you need emergency orders, file at Window 23 before noon for same-day review.',
    ],
  },
  // Bay Area jurisdictions
  {
    id: 'alameda',
    name: 'Alameda County',
    filingMethod: 'Family Law requires mandatory Odyssey eFileCA submissions for attorneys; self-represented parties may e-file or book clerk appointments in Oakland or Hayward. Drop boxes at René C. Davidson and Hayward Hall are cleared at 4:00 p.m.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'René C. Davidson Courthouse – Family Law Clerk',
      address: '1225 Fallon St., Oakland, CA 94612',
      hours: 'Mon–Fri, 8:30am – 4:30pm (filing windows by appointment / LiveChat check-in)',
      phone: '(510) 891-6000',
      efilePortal: 'https://www.alameda.courts.ca.gov/online-services/e-filing/family-law-e-filing',
    },
    processingTime: 'Odyssey e-filings are usually reviewed within 2–3 court days; drop-box packets filed before 4:00 p.m. receive the same-day file stamp.',
    serviceNotes: 'Serve FL-100/FL-110 within 60 days. Alameda Sheriff Civil Bureau averages 2+ weeks, so most litigants hire registered process servers for Oakland/Hayward work.',
    steps: [
      {
        title: 'Build the Alameda packet',
        description: 'Combine FL-100, FL-110, FL-105 (if children), and the Alameda Family Law Case Cover Sheet from the county forms page. Add FW-001 if requesting a fee waiver.',
      },
      {
        title: 'File via Odyssey or clerk appointment',
        description: 'Submit through eFileCA (select Family Law) or schedule a clerk visit/leave paperwork in the Oakland or Hayward drop box with a return envelope.',
      },
      {
        title: 'Calendar mediation + case management',
        description: 'Alameda automatically sets a Family Centered Case Resolution Conference. If custody orders are requested, contact Family Court Services for mediation before the hearing.',
      },
      {
        title: 'Serve and upload proof',
        description: 'Arrange personal service, then e-file or drop off FL-115. Alameda requires text-searchable PDFs and bookmarked exhibits, so prep proofs accordingly.',
      },
    ],
    proTips: [
      'Use the Family Law LiveChat (8:30 a.m.–3:00 p.m.) to confirm whether your filing needs an appointment or can go straight to the drop box.',
      'If Odyssey rejects a filing, correct it within 2 court days to keep the original submission date.',
    ],
  },
  {
    id: 'contra-costa',
    name: 'Contra Costa County',
    filingMethod: 'The Family Law Center in Martinez accepts Odyssey eFileCA filings 24/7. Self-represented litigants may e-file or drop packets at 751 Pine Street during clerk hours.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Family Law Center – 2nd Floor',
      address: '751 Pine St., Martinez, CA 94553',
      hours: 'Mon–Fri, 8:00am – 3:00pm',
      phone: '(925) 608-1000',
      efilePortal: 'https://contracosta.courts.ca.gov/online-services/court-e-filing-services',
    },
    processingTime: 'Most Odyssey filings are accepted in 1–2 court days; counter filings receive same-day stamps if submitted before 3:00 p.m.',
    serviceNotes: 'Serve FL-100/FL-110 within 60 days. The Sheriff’s Civil Division picks up work twice a week, so private servers are faster for East County addresses.',
    steps: [
      {
        title: 'Use the Contra Costa cover sheet',
        description: 'Download the Superior Court Family Law Filing Checklist and cover sheet from the court website and attach it to the statewide petition packet.',
      },
      {
        title: 'File at Martinez or eFileCA',
        description: 'Submit through Odyssey (select Contra Costa – Family Law) or hand-deliver to the Family Law Center with a self-addressed stamped envelope for conformed copies.',
      },
      {
        title: 'Book Family Court Services if custody is contested',
        description: 'Custody/visitation motions automatically trigger mediation at 751 Pine Street—call as soon as your hearing is scheduled to secure an appointment.',
      },
      {
        title: 'Serve and file proofs',
        description: 'Complete personal service and e-file FL-115 along with any local proof-of-service worksheets before your first hearing.',
      },
    ],
    proTips: [
      'If Odyssey does not assess the correct first-appearance fee, add it manually or the clerk will reject the filing.',
      'Use the Court’s “Where to File” page to confirm whether ancillary pleadings belong in Martinez or the regional branch handling your case.',
    ],
  },
  {
    id: 'marin',
    name: 'Marin County',
    filingMethod: 'Marin accepts eFileCA submissions for Family Law and maintains an 8:00 a.m.–4:00 p.m. clerk window at the Civic Center. Drop boxes are cleared daily at 5:00 p.m.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Marin Civic Center – Room 116',
      address: '3501 Civic Center Dr., San Rafael, CA 94903',
      hours: 'Mon–Fri, 8:00am – 4:00pm',
      phone: '(415) 444-7040',
      efilePortal: 'https://www.marincourt.org/online_services_efiling.htm',
    },
    processingTime: 'Odyssey filings are reviewed in 1–2 days; paper packets filed before 4:00 p.m. receive same-day stamps.',
    serviceNotes: 'Personal service within 60 days is required. Marin Sheriff Civil typically needs 10–14 days—use a registered server for faster turnaround.',
    steps: [
      {
        title: 'Gather statewide + Marin forms',
        description: 'Prepare FL-100, FL-110, and FL-105 plus Marin’s local Family Law Case Cover Sheet (available on the court site).',
      },
      {
        title: 'File electronically or at Room 116',
        description: 'Submit through eFileCA (choose Marin) or deliver to Room 116. Include FW-001 if requesting a fee waiver and a return envelope for conformed copies.',
      },
      {
        title: 'Schedule mediation when custody is contested',
        description: 'Contact Family Court Services immediately after filing an RFO involving custody/visitation to get on the mediation calendar.',
      },
      {
        title: 'Serve, then upload proofs',
        description: 'File FL-115 and any local service declarations as soon as personal service is completed to avoid continuances.',
      },
    ],
    proTips: [
      'Parking fills fast at the Civic Center—arrive before 8:15 a.m. if you are filing in person.',
      'Marin requires paginated, text-searchable PDFs via eFileCA; bookmark declarations and exhibits to prevent rejection.',
    ],
  },
  {
    id: 'monterey',
    name: 'Monterey County',
    filingMethod: 'Family Law filings go through the Monterey Courthouse clerk or the county’s eFile portal (powered by Odyssey). Self-represented parties may still file in person or by drop box.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Monterey Courthouse – Civil/Family Counter',
      address: '1200 Aguajito Rd., Monterey, CA 93940',
      hours: 'Mon–Fri, 8:00am – 4:00pm',
      phone: '(831) 775-5400 (Option 4)',
      efilePortal: 'https://www.monterey.courts.ca.gov/self-help-resources/efiling',
    },
    processingTime: 'Odyssey filings are processed in 2–3 business days; drop-box packets left before 4:00 p.m. are stamped the same day.',
    serviceNotes: 'Personal service within 60 days. Sheriff Civil Division needs ~2 weeks; registered process servers cover Salinas/Monterey within a few days.',
    steps: [
      {
        title: 'Prep Monterey’s required packet',
        description: 'Assemble FL-100, FL-110, FL-105 (if children), and the Monterey Family Law Cover Sheet. Include FW-001 if asking for a fee waiver.',
      },
      {
        title: 'File through eFileCA or at Aguajito Road',
        description: 'Submit electronically or deliver to the Monterey counter with two copies and a self-addressed stamped envelope for conformed copies.',
      },
      {
        title: 'Track hearings and mediation',
        description: 'The court sets a Case Management Conference roughly 120 days out. If custody is disputed, call Family Court Services to book mediation quickly.',
      },
      {
        title: 'Serve and lodge proof',
        description: 'Arrange service, then file FL-115 and any POS-010/030 forms promptly so your initial hearing is not continued.',
      },
    ],
    proTips: [
      'If you e-file, include a proposed order in PDF + DOCX—Monterey requires an editable copy for most stipulations.',
      'Use the Salinas annex only for restraining orders; all other Family Law filings are routed through Monterey.',
    ],
  },
  {
    id: 'napa',
    name: 'Napa County',
    filingMethod: 'Napa accepts in-person filings at the Historic Courthouse and now offers Odyssey eFile for Family Law. Drop boxes at Brown Street stay open until 5:00 p.m.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Historic Courthouse – Civil/Family Window',
      address: '825 Brown St., Napa, CA 94559',
      hours: 'Mon–Fri, 8:00am – 4:00pm',
      phone: '(707) 299-1130',
      efilePortal: 'https://www.napa.courts.ca.gov/divisions/family/family-law-filing',
    },
    processingTime: 'Paper filings submitted before 4:00 p.m. get a same-day stamp; Odyssey filings are reviewed within 1–2 court days.',
    serviceNotes: 'Personal service within 60 days. Napa Sheriff Civil takes 10–14 days; private servers in Napa/Sonoma turn requests within a week.',
    steps: [
      {
        title: 'Collect statewide + Napa resources',
        description: 'Complete FL-100, FL-110, FL-105, and download the Napa Family Law filing checklist. Attach FW-001 if requesting a fee waiver.',
      },
      {
        title: 'File at Brown Street or via eFile',
        description: 'Submit through Odyssey or deliver to the Historic Courthouse counter. Use the drop box for after-hours filings (cleared daily at 5:00 p.m.).',
      },
      {
        title: 'Request hearings or mediation',
        description: 'Family Court Services handles mediation on site—call as soon as you set a custody hearing date to avoid delays.',
      },
      {
        title: 'Serve and evidence proof',
        description: 'Once personal service is done, file FL-115 plus any local proof forms before your first CMC.',
      },
    ],
    proTips: [
      'Napa requires courtesy copies for long RFO packets. Deliver them to the department at least 5 court days before the hearing.',
      'If Odyssey does not assess the proper first-appearance fee, add it manually or the filing will be rejected.',
    ],
  },
  {
    id: 'san-benito',
    name: 'San Benito County',
    filingMethod: 'The Hollister courthouse accepts paper filings at the clerk window (appointments 8:00 a.m.–3:30 p.m.) and now supports electronic filing through the Journal Technologies portal.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'San Benito County Superior Court – Civil/Family Division',
      address: '450 Fourth St., Hollister, CA 95023',
      hours: 'Mon–Fri, 8:00am – 3:30pm',
      phone: '(831) 636-4057 (Option 5)',
      efilePortal: 'https://www.sanbenito.courts.ca.gov/online-services/efiling',
    },
    processingTime: 'Paper packets filed before 3:30 p.m. post the same day; eFiled documents are reviewed within 2–3 business days.',
    serviceNotes: 'Personal service within 60 days is required. Ex parte packets must be filed (or e-filed) by 3:00 p.m. the court day before the requested hearing.',
    steps: [
      {
        title: 'Prepare the Hollister packet',
        description: 'Complete FL-100, FL-110, FL-105 (if children) and review the Family Law FAQ on the court website for any local notices that must be attached.',
      },
      {
        title: 'File at the clerk’s window or online',
        description: 'Schedule a filing appointment or submit through the Journal Technologies EFSP. Include FW-001 if you need a fee waiver.',
      },
      {
        title: 'Book mediation for custody disputes',
        description: 'Contact Family Court Services as soon as a custody hearing is set; the court requires mediation before most custody hearings.',
      },
      {
        title: 'Serve and confirm with FL-115',
        description: 'Once service is complete, drop off or e-file FL-115 and keep proof handy for the Case Management Conference.',
      },
    ],
    proTips: [
      'Use the court’s texting reminder service so you do not miss clerk appointments or hearings.',
      'The EFSP charges a per-filing fee even if you have a fee waiver, so budget for the service-provider surcharge.',
    ],
  },
  {
    id: 'san-mateo',
    name: 'San Mateo County',
    filingMethod: 'Family Law filings go through the Redwood City Hall of Justice clerk (appointments only, 8:30 a.m.–1:00 p.m.) or via the county’s eFile portal powered by Odyssey.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Hall of Justice – Family Law Clerk',
      address: '400 County Center, 1st Floor, Redwood City, CA 94063',
      hours: 'Mon–Fri, 8:30am – 1:00pm (appointment only)',
      phone: '(650) 261-5100',
      efilePortal: 'https://sanmateo.courts.ca.gov/online-services/efiling',
    },
    processingTime: 'Odyssey filings are processed within 2 court days; appointment filings receive same-day stamps if you arrive on time.',
    serviceNotes: 'Personal service within 60 days. For domestic violence matters, file at the South San Francisco branch.',
    steps: [
      {
        title: 'Download the San Mateo filing checklist',
        description: 'Gather FL-100, FL-110, FL-105 (if applicable) and the county’s Family Law Case Cover Sheet from the court’s forms page.',
      },
      {
        title: 'Submit via eFile or clerk appointment',
        description: 'Use Odyssey for most filings. If appearing in person, book an appointment online and bring two copies plus a return envelope.',
      },
      {
        title: 'Coordinate mediation',
        description: 'Family Court Services requires mediation before custody hearings. Call as soon as you have a hearing date to secure a slot.',
      },
      {
        title: 'File FL-115 promptly',
        description: 'Upload or drop off the proof of service so the department does not continue your first CMC.',
      },
    ],
    proTips: [
      'Clerk phone lines are open only until 1:00 p.m.—use LiveChat or email for afternoon questions.',
      'Bookmark your PDFs and include editable orders when e-filing to avoid rejections.',
    ],
  },
  {
    id: 'santa-clara',
    name: 'Santa Clara County',
    filingMethod: 'Family Justice Center accepts eFile submissions through Odyssey and offers limited walk-in service (8:30 a.m.–3:00 p.m.) by queue ticket. Drop boxes clear at 4:00 p.m.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Family Justice Center Courthouse',
      address: '201 N. First St., San Jose, CA 95113',
      hours: 'Mon–Fri, 8:30am – 4:00pm (windows close 3:00pm)',
      phone: '(408) 882-2650',
      efilePortal: 'https://www.scscourt.org/online_services/efiling/',
    },
    processingTime: 'Odyssey filings are processed within about 2 court days; paper packets receive same-day stamps if submitted before 3:00 p.m.',
    serviceNotes: 'Personal service required within 60 days. Sheriff Civil Unit currently requires 10–14 days, so most parties use professional servers for faster service.',
    steps: [
      {
        title: 'Use the Santa Clara checklists',
        description: 'Gather FL-100, FL-110, FL-105, and the county’s Family Law Checklist (available on scscourt.org). Attach the Family Law Case Cover Sheet for faster routing.',
      },
      {
        title: 'File via Odyssey or FJC drop box',
        description: 'Submit electronically (select Santa Clara – Family) or drop packets at 201 N. First Street with a return envelope. Include FW-001 for fee waivers.',
      },
      {
        title: 'Schedule Child Custody Recommending Counseling',
        description: 'Family Court Services books mediation quickly—call 408-534-5760 once a custody RFO is filed.',
      },
      {
        title: 'Serve and lodge proofs',
        description: 'File FL-115 and any local proof-of-service forms via Odyssey or at the Records Unit (Room 107) so your initial case management conference stays on calendar.',
      },
    ],
    proTips: [
      'When e-filing, provide editable orders in DOCX along with the PDF—departments will reject “orders only” PDFs.',
      'Lines move faster if you arrive before 9:00 a.m.; otherwise expect to wait outside due to capacity limits.',
    ],
  },
  {
    id: 'santa-cruz',
    name: 'Santa Cruz County',
    filingMethod: 'Family Law filings are accepted at the Santa Cruz Courthouse clerk windows (8:00 a.m.–4:00 p.m.) and through the county’s Odyssey eFile portal. Watsonville handles restraining orders and south-county hearings.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Santa Cruz Courthouse – Civil/Family Division',
      address: '701 Ocean St., Room 120, Santa Cruz, CA 95060',
      hours: 'Mon–Fri, 8:00am – 4:00pm',
      phone: '(831) 420-2200',
      efilePortal: 'https://www.santacruz.courts.ca.gov/forms-filing/electronic-filing',
    },
    processingTime: 'Paper packets filed before 4:00 p.m. get same-day stamps; eFiled documents are usually processed within 2 business days.',
    serviceNotes: 'Personal service within 60 days. South County addresses can be served through the Watsonville Sheriff substation; plan ahead for rural service.',
    steps: [
      {
        title: 'Assemble the Santa Cruz packet',
        description: 'Prepare FL-100, FL-110, FL-105 and any local cover sheets listed on the court’s File @ Home page. Bring two copies when filing in person.',
      },
      {
        title: 'File at Ocean Street or online',
        description: 'Submit via Odyssey (select Santa Cruz – Family) or deliver to Room 120. Drop boxes accept filings until 5:00 p.m.',
      },
      {
        title: 'Coordinate mediation through FCS',
        description: 'Family Court Services is co-located at 701 Ocean—book mediation immediately when custody is in dispute.',
      },
      {
        title: 'Serve and confirm proof',
        description: 'File FL-115 promptly so the department will keep your hearing date. Upload proofs with bookmarks to avoid Odyssey rejections.',
      },
    ],
    proTips: [
      'Use the court’s “File @ Home” guided interviews if you need help completing proofs of service or RFO packets.',
      'Parking near Ocean Street is limited—arrive early or use public transit (SC Metro lines).',
    ],
  },
  {
    id: 'solano',
    name: 'Solano County',
    filingMethod: 'Family Law pleadings must be filed at the Fairfield Civil & Family Courthouse or through Solano’s Odyssey eFile portal. Clerk counters operate 8:00 a.m.–3:30 p.m.; drop boxes close at 4:30 p.m.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Civil & Family Courthouse',
      address: '600 Union Ave., Fairfield, CA 94533',
      hours: 'Mon–Fri, 8:00am – 3:30pm',
      phone: '(707) 207-7345',
      efilePortal: 'https://solano.courts.ca.gov/online-services/electronic-filing-e-filing',
    },
    processingTime: 'Paper filings submitted before 3:30 p.m. receive same-day stamps; eFiled packets usually process within 2 court days.',
    serviceNotes: 'Personal service required within 60 days. Sheriff Civil serves Fairfield/Vacaville within ~2 weeks; private servers can usually handle requests inside of 5 days.',
    steps: [
      {
        title: 'Gather statewide + Solano forms',
        description: 'Complete FL-100/110/105 and add the Solano Family Law Case Cover Sheet from the county website.',
      },
      {
        title: 'File at Union Avenue or via Odyssey',
        description: 'Submit electronically or bring two copies to the clerk window with a return envelope. Use the drop box when the line is long.',
      },
      {
        title: 'Reserve custody mediation',
        description: 'Family Court Services handles mediation out of Fairfield—contact them as soon as you calendar a custody dispute.',
      },
      {
        title: 'Serve and lodge FL-115',
        description: 'Once service is complete, e-file FL-115 and any POS-030 forms so the judge has proof before the Case Resolution Conference.',
      },
    ],
    proTips: [
      'Email the family law clerk (familylawdivision@solano.courts.ca.gov) for status updates—phone hold times can be long.',
      'Include hearing reservation numbers on the first page of your RFO or the filing will be rejected.',
    ],
  },
  {
    id: 'sonoma',
    name: 'Sonoma County',
    filingMethod: 'Family Law filings are accepted at the Civil & Family Courthouse (3055 Cleveland Ave.) and through Odyssey eFile. Clerk windows are open 8:00 a.m.–3:30 p.m.; phone hours end at noon.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Civil & Family Law Courthouse',
      address: '3055 Cleveland Ave., Santa Rosa, CA 95403',
      hours: 'Mon–Fri, 8:00am – 3:30pm',
      phone: '(707) 521-6500',
      efilePortal: 'https://sonoma.courts.ca.gov/online-services/e-filing',
    },
    processingTime: 'Paper filings are stamped the same day when submitted before 3:30 p.m. Odyssey filings typically post in 1–2 court days.',
    serviceNotes: 'Personal service within 60 days. For domestic violence filings, use the drop box at 8:00 a.m. for same-day review.',
    steps: [
      {
        title: 'Compile statewide + Sonoma forms',
        description: 'Fill out FL-100, FL-110, FL-105, and the Sonoma Family Law Cover Sheet if applicable. Bring two copies for in-person filing.',
      },
      {
        title: 'File electronically or in Santa Rosa',
        description: 'Submit via Odyssey (select Sonoma) or drop packets at the Cleveland Avenue courthouse with a return envelope for conformed copies.',
      },
      {
        title: 'Schedule Family Law Facilitator help if needed',
        description: 'The facilitator’s office is in the same building—get paperwork reviewed before submitting to reduce rejects.',
      },
      {
        title: 'Serve and upload FL-115',
        description: 'File proofs immediately; Sonoma departments reset hearings if service is not on file 5 days beforehand.',
      },
    ],
    proTips: [
      'Phone lines close at noon, so email familylaw@sonomacourt.org for afternoon status questions.',
      'Bookmark all PDFs when e-filing—Sonoma rejects un-bookmarked declarations and exhibits.',
    ],
  },
  {
    id: 'berkeley',
    name: 'City of Berkeley',
    filingMethod: 'Berkeley Civic Center is an Alameda County satellite. Most Family Law filings still route through Oakland or Hayward, but probate/family counter staff can accept limited filings and provide hearing calendars. Business hours are shortened (Mon–Thu 8:30 a.m.–3:00 p.m., Fri 8:30 a.m.–2:00 p.m.).',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Berkeley Civic Center Courthouse',
      address: '2120 Martin Luther King Jr. Way, Berkeley, CA 94704',
      hours: 'Mon–Thu, 8:30am – 3:00pm; Fri, 8:30am – 2:00pm',
      phone: '(510) 647-4439',
      efilePortal: 'https://www.alameda.courts.ca.gov/online-services/e-filing/family-law-e-filing',
    },
    processingTime: 'Filings accepted in Berkeley are routed nightly to Oakland for processing; expect 2–3 court days before conformed copies are ready.',
    serviceNotes: 'Because Berkeley is a satellite, most parties still file and serve through the main Oakland location. Use Berkeley primarily for file reviews, probate matters, or restraining orders when directed.',
    steps: [
      {
        title: 'Confirm the right filing location',
        description: 'Call the Berkeley clerk or use LiveChat to confirm whether your document can be accepted there or must be dropped in Oakland/Hayward.',
      },
      {
        title: 'Use Alameda’s eFile portal when possible',
        description: 'Submit filings through Odyssey to avoid interoffice transfer delays. Select René C. Davidson as the filing venue.',
      },
      {
        title: 'Pick up certified copies locally',
        description: 'If the judge directs you to pick up conformed copies in Berkeley, bring ID and your receipt; processing happens after 1:00 p.m.',
      },
    ],
    proTips: [
      'Parking near Civic Center is scarce—use BART (Downtown Berkeley) or AC Transit.',
      'Because this is a satellite, staff cannot accept drop box filings after 2:00 p.m. on Fridays; route urgent packets to Oakland instead.',
    ],
  },
  // Southern jurisdictions
  {
    id: 'imperial',
    name: 'Imperial County',
    filingMethod: 'Imperial does not offer e-filing for Family Law yet. File in person at the El Centro courthouse or use the drop box (cleared daily at 4:00 p.m.).',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'El Centro Courthouse – Family Law Clerk',
      address: '939 W. Main St., El Centro, CA 92243',
      hours: 'Mon–Fri, 8:00am – 4:00pm',
      phone: '(760) 482-2200',
    },
    processingTime: 'Same-day file stamps for packets submitted before 4:00 p.m.; mail/drop-box items post next business day.',
    serviceNotes: 'Personal service within 60 days. Sheriff Civil typically needs 2 weeks in Imperial Valley; private servers cover border areas faster.',
    steps: [
      {
        title: 'Assemble statewide + Imperial forms',
        description: 'Complete FL-100/110/105 and include any Imperial County cover sheets listed on the Access Center page. Bring two copies and a return envelope.',
      },
      {
        title: 'File at 939 W. Main or via mail',
        description: 'Walk filings into the clerk lobby, place them in the drop box, or mail them with payment (cashier’s check or money order).',
      },
      {
        title: 'Schedule mediation quickly',
        description: 'Family Court Services calendars fill fast—call as soon as you file a custody RFO.',
      },
      {
        title: 'Serve and file FL-115',
        description: 'After service, return to the clerk to lodge FL-115 so the hearing is not continued.',
      },
    ],
    proTips: [
      'Use the Access Center (same address) if you need help finishing forms before you file.',
      'If you live in Brawley or Calexico, plan for longer security lines—arrive 30 minutes early.',
    ],
  },
  {
    id: 'kern',
    name: 'Kern County',
    filingMethod: 'Mandatory Odyssey eFileCA for attorneys; self-represented parties may e-file or file in person at the Metropolitan Division (drop boxes open until 5:00 p.m.).',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Metropolitan Division – Justice Building',
      address: '1215 Truxtun Ave., Bakersfield, CA 93301',
      hours: 'Mon–Fri, 8:00am – 4:00pm',
      phone: '(661) 868-5393',
      efilePortal: 'https://www.kern.courts.ca.gov/online-services/efile',
    },
    processingTime: 'E-filings are usually accepted within 1–2 court days. Counter filings submitted before 4:00 p.m. post the same day.',
    serviceNotes: 'Personal service required within 60 days. Kern Sheriff Civil averages 14 days; private servers are faster for outlying towns.',
    steps: [
      {
        title: 'Use Kern’s Family Law checklist',
        description: 'Prepare FL-100/110/105 and the Kern Family Law Cover Sheet (download from kern.courts.ca.gov). Include FW-001 if necessary.',
      },
      {
        title: 'File via Odyssey or at the Justice Building',
        description: 'Submit electronically (select Kern – Family Law) or walk filings to the Room 300 drop window with two copies and a return envelope.',
      },
      {
        title: 'Book Family Court Services',
        description: 'Call Family Court Services (661-610-6700) immediately after filing a custody motion to secure a mediation slot.',
      },
      {
        title: 'Serve and upload proof',
        description: 'Once FL-115 is ready, e-file it or drop it off so your hearing isn’t continued.',
      },
    ],
    proTips: [
      'Odyssey filings must be text searchable and bookmarked—Kern rejects PDFs that fail those rules.',
      'If you need help, the Family Law Facilitator is on the first floor (appointments preferred).',
    ],
  },
  {
    id: 'riverside',
    name: 'Riverside County',
    filingMethod: 'Riverside mandates eFile for attorneys (Odyssey) and encourages self-represented parties to eFile or use the Family Law clerk at 4175 Main Street; counters open 7:30 a.m.–4:00 p.m.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Riverside Family Law Courthouse',
      address: '4175 Main St., Riverside, CA 92501',
      hours: 'Mon–Fri, 7:30am – 4:00pm (phones until 2:00pm)',
      phone: '(951) 777-3147',
      efilePortal: 'https://www.riverside.courts.ca.gov/online-services/efile',
    },
    processingTime: 'E-filings typically receive a response within 1–2 business days. In-person filings submitted before 3:30 p.m. get same-day stamps.',
    serviceNotes: 'Personal service required within 60 days. Riverside Sheriffs average two weeks; private servers are faster in Coachella Valley.',
    steps: [
      {
        title: 'Compile Riverside packet',
        description: 'Combine FL-100/110/105 and Riverside’s local Case Assignment sheet (from the court’s website) plus any required attachments.',
      },
      {
        title: 'File via Odyssey or lobby kiosks',
        description: 'Submit through eFileCA or bring two copies to the Main Street clerk. Drop boxes are available on the first floor.',
      },
      {
        title: 'Schedule custody mediation',
        description: 'Family Court Services is onsite—call immediately after filing a custody/visitation motion to reserve mediation.',
      },
      {
        title: 'Serve and confirm proofs',
        description: 'Once FL-115 is complete, e-file it so the judge has proof before the initial hearing.',
      },
    ],
    proTips: [
      'Phone queues close at 2:00 p.m., so use web chat or email for afternoon updates.',
      'Bookmark exhibits when e-filing—Riverside rejects un-bookmarked PDFs.',
    ],
  },
  {
    id: 'san-bernardino',
    name: 'San Bernardino County',
    filingMethod: 'Family Law filings belong at the Historic Courthouse (351 N. Arrowhead Ave.) or via the court’s eFile portal (Odyssey). Drop boxes close at 4:00 p.m.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Historic Courthouse – Family Law Division',
      address: '351 N. Arrowhead Ave., San Bernardino, CA 92415',
      hours: 'Mon–Fri, 8:00am – 4:00pm (lobby opens 7:45am)',
      phone: '(909) 521-3136',
      efilePortal: 'https://www.sb-court.org/online-services/electronic-filing',
    },
    processingTime: 'E-filings typically receive responses within 2 court days; documents dropped before 4:00 p.m. are filed the same day.',
    serviceNotes: 'Personal service within 60 days. Sheriff Civil has limited capacity—hire a registered server for High Desert or West Valley addresses.',
    steps: [
      {
        title: 'Prepare county-specific forms',
        description: 'Complete FL-100/110/105 and attach the San Bernardino Family Law Cover Sheet from the court’s website.',
      },
      {
        title: 'File electronically or at 351 N. Arrowhead',
        description: 'Use Odyssey eFile or deliver two copies to the clerk. A drop box sits at the Arrowhead entrance for after-hours filings.',
      },
      {
        title: 'Arrange mediation',
        description: 'Family Court Services shares the same building—contact them immediately after filing a custody motion to reserve a mediation date.',
      },
      {
        title: 'Serve and lodge proof',
        description: 'Submit FL-115 via eFile or drop box to keep your hearing on calendar.',
      },
    ],
    proTips: [
      'Parking is scarce downtown—plan time to find metered spots or park in the 3rd Street garage.',
      'Bookmark and text-search every PDF for Odyssey or risk rejection.',
    ],
  },
  {
    id: 'san-luis-obispo',
    name: 'San Luis Obispo County',
    filingMethod: 'Civil & Family Branch (1050 Monterey St.) accepts in-person filings 8:30 a.m.–12:00 p.m. and offers Odyssey eFileCA for 24/7 submissions.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Civil & Family Law Branch',
      address: '1050 Monterey St., San Luis Obispo, CA 93408',
      hours: 'Mon–Thu, 8:30am – 12:00pm (phones until 4:00pm)',
      phone: '(805) 706-3600',
      efilePortal: 'https://www.slo.courts.ca.gov/online-services/efile',
    },
    processingTime: 'E-filings are reviewed in 1–2 court days; counter filings dropped before noon are processed same day.',
    serviceNotes: 'Personal service within 60 days. Use local servers for coast or North County addresses to avoid long turnaround.',
    steps: [
      {
        title: 'Gather statewide + SLO forms',
        description: 'Complete FL-100/110/105 and review the SLO Family Law forms page for any required cover sheets.',
      },
      {
        title: 'File via eFile or limited counter hours',
        description: 'Submit electronically or arrive before noon to hand file. Drop boxes accept filings until 5:00 p.m.',
      },
      {
        title: 'Schedule mediation',
        description: 'Family Court Services assigns mediations from the same building—call immediately after filing custody motions.',
      },
      {
        title: 'Serve and submit proof',
        description: 'File FL-115 quickly to keep your hearing set; use eFile for faster posting.',
      },
    ],
    proTips: [
      'Counter hours are short—plan ahead or e-file to avoid missing the noon cut-off.',
      'The court now offers text reminders; opt in when you file so you don’t miss hearings.',
    ],
  },
  {
    id: 'santa-barbara',
    name: 'Santa Barbara County',
    filingMethod: 'Family Law filings are handled at the Anacapa Division (downtown Santa Barbara) with limited counter hours (8:00 a.m.–3:00 p.m.) and via the court’s eFile portal.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Anacapa Division',
      address: '1100 Anacapa St., Santa Barbara, CA 93121',
      hours: 'Mon–Fri, 8:00am – 3:00pm (phones 9:00am – 3:00pm)',
      phone: '(805) 882-4520',
      efilePortal: 'https://www.santabarbara.courts.ca.gov/online-services/electronic-filing',
    },
    processingTime: 'E-filings: 1–2 court days. Counter filings: same day if received before 3:00 p.m.; drop box available until 4:00 p.m.',
    serviceNotes: 'Personal service within 60 days. For Santa Maria/Lompoc cases, verify the assigned branch after filing.',
    steps: [
      {
        title: 'Assemble the Santa Barbara packet',
        description: 'Complete FL-100/110/105 and check the court’s website for any required local cover sheets or declarations.',
      },
      {
        title: 'File via eFile or Anacapa counter',
        description: 'Use Odyssey eFile or bring filings to 1100 Anacapa. City lot across the street offers 75 minutes of free parking.',
      },
      {
        title: 'Coordinate mediation or facilitator help',
        description: 'Family Court Services and the facilitator are on-site—book appointments early, especially for custody issues.',
      },
      {
        title: 'Serve and record proof',
        description: 'Submit FL-115 promptly (eFile or in-person) so the judge has service confirmation.',
      },
    ],
    proTips: [
      'Arrive before 7:45 a.m. for security—lines form quickly at this tourist-heavy courthouse.',
      'Bookmark all PDFs when e-filing; Santa Barbara rejects filings that don’t meet that rule.',
    ],
  },
  {
    id: 'ventura',
    name: 'Ventura County',
    filingMethod: 'Hall of Justice accepts limited counter filings (hours vary by division) and requires Odyssey eFileCA for attorneys. Self-represented parties can eFile or use the clerk windows.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Hall of Justice',
      address: '800 S. Victoria Ave., Ventura, CA 93009',
      hours: 'Mon–Fri, 9:00am – 4:00pm (check division schedule for closures)',
      phone: '(805) 289-8733',
      efilePortal: 'https://ventura.courts.ca.gov/online-services/efile',
    },
    processingTime: 'E-files are typically processed in 1–2 days; counter filings submitted before 4:00 p.m. are stamped that day.',
    serviceNotes: 'Personal service within 60 days. Use local process servers for Oxnard/Camarillo/Thousand Oaks to avoid sheriff backlogs.',
    steps: [
      {
        title: 'Prepare Ventura-specific packet',
        description: 'Complete FL-100/110/105 plus the Ventura Family Law Cover Sheet if applicable. Download clerk-approved packets from ventura.courts.ca.gov.',
      },
      {
        title: 'File via Odyssey or Room 210',
        description: 'Submit electronically or hand file at Hall of Justice. Drop completed packets in the after-hours box on the ground floor.',
      },
      {
        title: 'Book mediation/facilitator appointments',
        description: 'The Family Law Self-Help Center operates on select days—reserve a slot if you need assistance with custody or support forms.',
      },
      {
        title: 'Serve and file proof',
        description: 'File FL-115 (and any POS forms) promptly so the department keeps your hearing date.',
      },
    ],
    proTips: [
      'Self-Help walk-in days fill up quickly; arrive early or use the Calendly appointment link on the court site.',
      'Ventura insists on text-searchable, bookmarked PDFs for eFile submissions.',
    ],
  },
  {
    id: 'tri-city',
    name: 'Tri-City (Pomona / Claremont / La Verne)',
    filingMethod: 'Tri-City filings route through Los Angeles County’s Pomona South Courthouse. LA requires eFile for most Family Law documents (Journal Technologies) plus drop boxes at Pomona.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Pomona South Courthouse',
      address: '400 Civic Center Plaza, Pomona, CA 91766',
      hours: 'Mon–Fri, 8:30am – 4:30pm (appointments encouraged)',
      phone: '(909) 802-9944',
      efilePortal: 'https://www.lacourt.org/division/efiling/efiling.aspx',
    },
    processingTime: 'LA eFile submissions are processed in 2–3 court days; Pomona drop-box packets deposited before 4:30 p.m. get same-day stamps.',
    serviceNotes: 'Follow LA County service rules—personal service within 60 days and local Form FAM-020 for custody matters.',
    steps: [
      {
        title: 'Use LA-specific packet',
        description: 'Complete FL-100/110/105 and add the LA Family Law Case Cover Sheet plus any required Pomona notices.',
      },
      {
        title: 'File via LA eFile or Pomona drop box',
        description: 'Most litigants eFile through Journal Technologies. If you need to hand file, schedule a Pomona appointment or use the Civic Center drop box.',
      },
      {
        title: 'Coordinate mediation with LA Family Court Services',
        description: 'Pomona’s Family Court Services handles Tri-City mediations—book early via the LA Court website.',
      },
      {
        title: 'Serve and upload proofs',
        description: 'After service, eFile FL-115 or deliver it to Pomona to keep your hearing date.',
      },
    ],
    proTips: [
      'LA requires reservation numbers for many hearings—obtain one before filing your RFO.',
      'Ensure all PDFs are text-searchable and bookmarked; LA strictly enforces eFile formatting rules.',
    ],
  },
  // Additional statewide additions
  {
    id: 'sacramento',
    name: 'Sacramento County',
    filingMethod: 'Family Law filings belong at the William R. Ridgeway Family Relations Courthouse or through Sacramento’s e-Delivery service (limited eFile).',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'William R. Ridgeway Family Relations Courthouse',
      address: '3341 Power Inn Rd., Sacramento, CA 95826',
      hours: 'Mon–Fri, 8:30am – 4:00pm',
      phone: '(916) 875-3400',
      efilePortal: 'https://www.saccourt.ca.gov/efiling/edelivery.aspx',
    },
    processingTime: 'e-Delivery submissions generally process within 2 court days; counter filings before 4:00 p.m. get same-day stamps.',
    serviceNotes: 'Personal service within 60 days. Sacramento Sheriff requires advance appointments—use private servers if you’re on a deadline.',
    steps: [
      {
        title: 'Gather Sacramento-specific forms',
        description: 'Complete FL-100/110/105 plus the Sacramento Family Law Case Cover Sheet (FL-001) and any local notices.',
      },
      {
        title: 'File via e-Delivery or in person',
        description: 'Upload PDFs using e-Delivery or hand file at the Power Inn Road clerk windows. Include FW-001 for fee waivers.',
      },
      {
        title: 'Schedule mediation and status conferences',
        description: 'Family Court Services is onsite—call immediately after filing custody motions to reserve mediation.',
      },
      {
        title: 'Serve and submit FL-115',
        description: 'Once service is complete, e-Deliver or deliver FL-115 to keep your hearing from being continued.',
      },
    ],
    proTips: [
      'Lines form early; arrive before 8:00 a.m. if you plan to use the clerk window.',
      'e-Delivery requires bookmarked, text-searchable PDFs—double-check before uploading.',
    ],
  },
];
