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
  packetFormIds?: string[];
  resources?: {
    label: string;
    url: string;
    description?: string;
  }[];
}


const DEFAULT_PACKET_FORMS = ['fl-100', 'fl-110', 'fl-105', 'fl-115', 'fl-117', 'fl-120', 'fl-140', 'fl-142', 'fl-150'];


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
    packetFormIds: DEFAULT_PACKET_FORMS,
    resources: [
      {
        label: 'FamLaw-001 Starting Divorce Packet (PDF)',
        url: 'https://retired.cc-courts.org/forms/packets/FamLaw001-StartingDivorcePacket.pdf',
        description: 'County-issued checklist plus all statewide forms needed to open a case in Contra Costa.',
      },
      {
        label: 'Contra Costa Divorce Roadmap',
        url: 'https://contracosta.courts.ca.gov/divisions/family-and-children/divorce-legal-separation-annulment/divorce-roadmap',
        description: 'Official court roadmap that pairs with our concierge walkthrough.',
      },
    ],
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
  // Central Valley & North State coverage
  {
    id: 'fresno',
    name: 'Fresno County',
    filingMethod: 'B.F. Sisk Courthouse handles all Family Law filings. Attorneys must use Odyssey eFileCA; self-represented parties may e-file, use the lobby drop box, or book limited counter appointments (shortened hours).',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'B.F. Sisk Courthouse – Family Law Clerk',
      address: '1130 O St., Fresno, CA 93721',
      hours: 'Mon–Thu, 8:00am – 3:00pm; Fri, 8:00am – 12:00pm',
      phone: '(559) 457-2000',
      efilePortal: 'https://www.fresno.courts.ca.gov/online-services/efile-resources',
    },
    processingTime: 'Odyssey filings are generally reviewed within 1–2 court days; drop-box packets filed before 3:00 p.m. receive same-day file stamps.',
    serviceNotes: 'Serve FL-100/FL-110 within 60 days. Fresno Sheriff Civil typically needs 2+ weeks—private servers are faster for Clovis, Sanger, and foothill addresses.',
    packetFormIds: DEFAULT_PACKET_FORMS,
    resources: [
      {
        label: 'Fresno eFile resources',
        url: 'https://www.fresno.courts.ca.gov/online-services/efile-resources',
        description: 'EFSP onboarding, formatting rules, and Odyssey fee details.',
      },
      {
        label: 'B.F. Sisk location + clerk hours',
        url: 'https://www.fresno.courts.ca.gov/location/b-f-sisk-courthouse',
      },
    ],
    steps: [
      {
        title: 'Assemble the Fresno starter packet',
        description: 'Combine FL-100, FL-110, FL-105 (if kids) plus the Fresno filing checklist. Attach FW-001 when requesting a fee waiver.',
      },
      {
        title: 'File through Odyssey or the lobby drop box',
        description: 'Upload a text-searchable PDF (select Fresno – Family) or leave two copies with payment in the B.F. Sisk drop box before 3:00 p.m.',
      },
      {
        title: 'Lock in mediation early',
        description: 'Family Court Services fills quickly—call as soon as a custody hearing is reserved so you do not lose your spot.',
      },
      {
        title: 'Serve and e-file FL-115',
        description: 'Use professional servers for rural service, then e-file FL-115 so the department keeps your first hearing on calendar.',
      },
    ],
    proTips: [
      'If Odyssey rejects a filing, correct it within two court days to keep the original submission date.',
      'Bring a large self-addressed envelope for counter filings—clerks no longer provide courtesy copies.',
    ],
  },
  {
    id: 'tulare',
    name: 'Tulare County',
    filingMethod: 'Visalia County Civic Center processes all Family Law filings. Odyssey eFileCA is available for Civil/Family; self-represented parties can still file at the Mooney Boulevard windows or use drop boxes.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Visalia County Civic Center Courthouse',
      address: '221 S. Mooney Blvd., Visalia, CA 93291',
      hours: 'Mon–Fri, 8:00am – 4:00pm',
      phone: '(559) 730-5000',
      efilePortal: 'https://www.tulare.courts.ca.gov/online-services/efiling',
    },
    processingTime: 'E-filings post within 2–3 court days. Counter filings submitted before 4:00 p.m. receive same-day stamps; drop-box packets are processed the next morning.',
    serviceNotes: 'Serve within 60 days. Sheriff Civil pickup routes happen twice weekly—hire a private server for Porterville/South County matters if you are on a deadline.',
    packetFormIds: DEFAULT_PACKET_FORMS,
    resources: [
      {
        label: 'Visalia courthouse info',
        url: 'https://www.tulare.courts.ca.gov/location/visalia-county-civic-center',
      },
      {
        label: 'Tulare Family Law division',
        url: 'https://www.tulare.courts.ca.gov/divisions/family-law',
      },
    ],
    steps: [
      {
        title: 'Build the Tulare packet',
        description: 'Complete FL-100/110/105 plus Tulare’s local Family Law Cover Sheet if required. Add FW-001 if you plan to request a fee waiver.',
      },
      {
        title: 'File electronically or at S. Mooney Blvd.',
        description: 'Submit via Odyssey or bring two copies to the Visalia counter. Use the drop box when lines are long.',
      },
      {
        title: 'Contact Family Court Services',
        description: 'Call the FCS scheduler (559-730-5000 x1089) when custody or visitation is contested to avoid hearing continuances.',
      },
      {
        title: 'Serve and lodge proofs',
        description: 'File FL-115 or POS-010 as soon as service is complete so the court will keep your Case Management Conference.',
      },
    ],
    proTips: [
      'Use the remote appearance hotline (559-738-2330) if you need help connecting to a Teams hearing.',
      'Appointments fill quickly; schedule counter visits online if you need conformed copies the same day.',
    ],
  },
  {
    id: 'kings',
    name: 'Kings County',
    filingMethod: 'The Hanford courthouse processes Family Law filings at 1640 Kings County Drive. Odyssey eFileCA is enabled, but self-represented parties can still file at the clerk windows 8:00 a.m.–4:00 p.m.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Kings County Courthouse – Civil/Family Division',
      address: '1640 Kings County Dr., Hanford, CA 93230',
      hours: 'Mon–Fri, 8:00am – 4:00pm',
      phone: '(559) 582-1010',
      efilePortal: 'https://www.kings.courts.ca.gov/online-services/efile',
    },
    processingTime: 'E-filings process within two court days; counter filings recorded the same day if submitted before 4:00 p.m.',
    serviceNotes: 'Serve within 60 days. Sheriff Civil routes cover the valley floor weekly—hire a registered server for Lemoore NAS or outlying towns.',
    packetFormIds: DEFAULT_PACKET_FORMS,
    resources: [
      {
        label: 'Kings court locations & contacts',
        url: 'https://www.kings.courts.ca.gov/general-information/location-contact-info',
      },
      {
        label: 'Family Court Services',
        url: 'https://www.kings.courts.ca.gov/divisions/family-court-services',
      },
    ],
    steps: [
      {
        title: 'Prep the Hanford packet',
        description: 'Complete the statewide forms plus Kings’ local case assignment sheet (available on the court site).',
      },
      {
        title: 'File via Odyssey or at the clerk windows',
        description: 'Upload through Odyssey (select Kings – Civil/Family) or bring two copies with a return envelope to the main courthouse.',
      },
      {
        title: 'Coordinate mediation',
        description: 'Email familycourtservices@kings.courts.ca.gov once a custody hearing is set to lock in mediation dates.',
      },
      {
        title: 'Serve and confirm proofs',
        description: 'File FL-115 promptly—judges routinely drop hearings if proof of service is missing 5 court days prior.',
      },
    ],
    proTips: [
      'Kings often requests courtesy copies for RFOs longer than 35 pages—deliver them to Dept. 6 the next business day.',
      'Phone tree options change often; press 2 then 4 to reach a live Family Law clerk faster.',
    ],
  },
  {
    id: 'madera',
    name: 'Madera County',
    filingMethod: 'The new Madera Courthouse on G Street handles Civil/Family filings. Odyssey eFileCA is available, but self-represented litigants can still file at the lobby windows 8:00 a.m.–4:00 p.m.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Madera Courthouse – Family Law Clerk',
      address: '200 S. G St., Madera, CA 93637',
      hours: 'Mon–Fri, 8:00am – 4:00pm',
      phone: '(559) 416-5525',
      efilePortal: 'https://www.madera.courts.ca.gov/online-services/efiling-dvgv-petition-online-case-information',
    },
    processingTime: 'E-filings usually post within two court days. Counter filings submitted before 4:00 p.m. receive same-day processing.',
    serviceNotes: 'Serve within 60 days. Sheriff Civil serves within the city limits weekly; use private servers for Chowchilla and foothill addresses.',
    packetFormIds: DEFAULT_PACKET_FORMS,
    resources: [
      {
        label: 'Madera Family Law division',
        url: 'https://www.madera.courts.ca.gov/divisions/family-law-court',
      },
      {
        label: 'Madera eFile portal',
        url: 'https://www.madera.courts.ca.gov/online-services/efiling-dvgv-petition-online-case-information',
      },
    ],
    steps: [
      {
        title: 'Assemble statewide + Madera forms',
        description: 'Complete FL-100/110/105 and pick up the local packet checklist from the clerk or self-help desk.',
      },
      {
        title: 'File online or at 200 S. G Street',
        description: 'Upload via Odyssey or bring paper copies to the courthouse with payment (cashier’s check or money order).',
      },
      {
        title: 'Book FCS interviews',
        description: 'Family Court Services calendars fill quickly—call 559-416-5570 after filing any custody request.',
      },
      {
        title: 'Serve and e-file FL-115',
        description: 'Once service is complete, e-file FL-115 to avoid continuances at the Mandatory Settlement Conference.',
      },
    ],
    proTips: [
      'Self-Help computers on the first floor let you e-file for free—bring your packet on a flash drive to speed things up.',
      'If you need certified copies, submit the request before noon; the Records Unit batches afternoon pickups.',
    ],
  },
  {
    id: 'merced',
    name: 'Merced County',
    filingMethod: 'The Old Merced Courthouse on 21st Street handles Family Law filings. Odyssey eFileCA is available; drop boxes at 21st Street and the Los Banos branch clear at 5:00 p.m.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Old Merced Courthouse – Family Law Clerk',
      address: '627 W. 21st St., Merced, CA 95340',
      hours: 'Mon–Fri, 8:00am – 4:00pm',
      phone: '(209) 725-4101',
      efilePortal: 'https://www.merced.courts.ca.gov/online-services/e-filing',
    },
    processingTime: 'E-filings are reviewed within two court days; counter filings and drop-box packets submitted before 4:00 p.m. receive same-day stamps.',
    serviceNotes: 'Serve within 60 days. Sheriff Civil serves Merced/Atwater weekly; plan for longer timelines in Los Banos or the foothills.',
    packetFormIds: DEFAULT_PACKET_FORMS,
    resources: [
      {
        label: 'Merced Family Law division',
        url: 'https://www.merced.courts.ca.gov/divisions/family-law',
      },
      {
        label: 'Merced forms & eFile',
        url: 'https://www.merced.courts.ca.gov/forms-filing',
      },
    ],
    steps: [
      {
        title: 'Prep the Merced packet',
        description: 'Fill FL-100/110/105 and add the local case cover sheet from the court website. Staple the first appearance fee worksheet on top.',
      },
      {
        title: 'File via Odyssey or at 21st Street',
        description: 'Upload electronically or bring two copies to the clerk. Include a return envelope for conformed copies.',
      },
      {
        title: 'Schedule mediation in advance',
        description: 'Call Family Court Services (209-725-4100 option 3) once a custody hearing is set; the calendar fills months ahead.',
      },
      {
        title: 'Serve and lodge proofs',
        description: 'File FL-115 immediately so your Case Management Conference stays on calendar.',
      },
    ],
    proTips: [
      'Merced judges expect proposed orders in Word format when you e-file—upload both DOCX and PDF.',
      'Los Banos drop-box pickups happen at noon; plan accordingly if you need same-day stamps there.',
    ],
  },
  {
    id: 'stanislaus',
    name: 'Stanislaus County',
    filingMethod: '800 11th Street (Modesto) processes all Family Law filings. Odyssey eFileCA is available for most documents; counter windows accept packets 8:00 a.m.–4:00 p.m. by queue ticket.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Stanislaus County Courthouse – Family Law Clerk',
      address: '800 11th St., Modesto, CA 95354',
      hours: 'Mon–Fri, 8:00am – 4:00pm',
      phone: '(209) 530-3100',
      efilePortal: 'https://www.stanislaus.courts.ca.gov/forms-filing',
    },
    processingTime: 'E-filings post within two court days. Request-for-Order packets submitted in person before 8:45 a.m. are ready for pickup the following court day at noon.',
    serviceNotes: 'Serve within 60 days. Sheriff Civil requires prepayment and a self-addressed envelope; private servers cover Turlock/Salida faster.',
    packetFormIds: DEFAULT_PACKET_FORMS,
    resources: [
      {
        label: 'Stanislaus Family Law division',
        url: 'https://www.stanislaus.courts.ca.gov/divisions/family-law',
      },
      {
        label: 'Court forms & eFile',
        url: 'https://www.stanislaus.courts.ca.gov/forms-filing',
      },
    ],
    steps: [
      {
        title: 'Download the Stanislaus checklist',
        description: 'Complete FL-100/110/105 and the local Family Law Case Cover Sheet. Add MC-025 if you need extra space for facts.',
      },
      {
        title: 'File via Odyssey or Window 1',
        description: 'Submit electronically or pull a lobby ticket to reach Window 1 for filings and RFO pickups.',
      },
      {
        title: 'Coordinate mediation',
        description: 'Family Court Services requires a questionnaire one week before the appointment—return it to 800 11th Street, Room 220.',
      },
      {
        title: 'Serve and lodge proofs',
        description: 'E-file FL-115 or leave it with the drop box so the department has proof of service before your hearing.',
      },
    ],
    proTips: [
      'Bring government ID to pick up RFO packets between noon and 12:30 p.m.—staff releases only during that window.',
      'The clerk rejects PDFs that exceed 25MB; split exhibits before uploading to Odyssey.',
    ],
  },
  {
    id: 'san-joaquin',
    name: 'San Joaquin County',
    filingMethod: 'The Stockton Family Law Courthouse (180 E. Weber Ave.) accepts Odyssey e-file submissions and limited in-person filings 8:00 a.m.–4:00 p.m.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Stockton Family Law Courthouse',
      address: '180 E. Weber Ave., Stockton, CA 95202',
      hours: 'Mon–Fri, 8:00am – 4:00pm',
      phone: '(209) 992-5555',
      efilePortal: 'http://www.odysseyefileca.com/',
    },
    processingTime: 'Most e-filings are reviewed within 1–2 court days. Counter filings stamped the same day if submitted before 3:30 p.m.',
    serviceNotes: 'Serve within 60 days. Sheriff Civil routes cover Stockton/Lodi weekly; hire private servers for Mountain House, Tracy, or Delta islands.',
    packetFormIds: DEFAULT_PACKET_FORMS,
    resources: [
      {
        label: 'Family Law & Support division',
        url: 'https://www.sjcourts.org/family-law-and-support',
      },
      {
        label: 'County filing info',
        url: 'https://www.sjcourts.org/forms-filing',
      },
    ],
    steps: [
      {
        title: 'Compile Stockton packet',
        description: 'Complete FL-100/110/105 and attach the local case cover sheet from sjcourts.org. Include FW-001 if requesting a fee waiver.',
      },
      {
        title: 'File via Odyssey or lobby kiosks',
        description: 'Use Odyssey or the public kiosks in the first-floor lobby. Drop boxes clear at 4:00 p.m.',
      },
      {
        title: 'Schedule DCSS/FCS appointments',
        description: 'For child support matters, coordinate with DCSS; for custody, call Family Court Services immediately after setting a hearing.',
      },
      {
        title: 'Serve and upload FL-115',
        description: 'Upload proofs in Odyssey with bookmarked exhibits to avoid rejection.',
      },
    ],
    proTips: [
      'Bring payment separate from document packets; security lines are long, so arrive 30 minutes early.',
      'Odyssey requires fillable cover sheets—download the current version before filing.',
    ],
  },
  {
    id: 'placer',
    name: 'Placer County',
    filingMethod: 'Family Law matters file at the Santucci Justice Center (Roseville). Odyssey eFileCA is active, but drop boxes and window filing remain available 8:00 a.m.–4:00 p.m.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Bill Santucci Justice Center – Family/Civil Clerk',
      address: '10820 Justice Center Dr., Roseville, CA 95678',
      hours: 'Mon–Fri, 8:00am – 4:00pm (windows close 3:00pm)',
      phone: '(916) 408-6000',
      efilePortal: 'https://www.placer.courts.ca.gov/online-services/efiling',
    },
    processingTime: 'E-filings typically review within 2 court days; drop-box packets processed the morning after submission.',
    serviceNotes: 'Serve within 60 days. Sheriff Civil serves Roseville/Rocklin quickly but requires prepaid mileage for Tahoe/Truckee service.',
    packetFormIds: DEFAULT_PACKET_FORMS,
    resources: [
      {
        label: 'Placer court locations',
        url: 'https://www.placer.courts.ca.gov/locations',
      },
      {
        label: 'Family Law facilitator',
        url: 'https://www.placer.courts.ca.gov/self-help-families',
      },
    ],
    steps: [
      {
        title: 'Gather statewide + Placer forms',
        description: 'Complete FL-100/110/105 and add the local cover sheet and case assignment form from the court website.',
      },
      {
        title: 'File at Santucci or via Odyssey',
        description: 'Submit electronically or drop packets at the first-floor windows with a return envelope.',
      },
      {
        title: 'Schedule mediation with FCS',
        description: 'Call Family Court Services once you file an RFO involving custody to secure a Roseville or Tahoe appointment.',
      },
      {
        title: 'Serve and lodge proofs',
        description: 'E-file FL-115 and any POS-030 forms so the judge sees proof before the Settlement Conference.',
      },
    ],
    proTips: [
      'Parking fills by 8:15 a.m.—use the overflow lot on Justice Center Dr. if you have a morning appointment.',
      'Bookmark long declarations; Placer rejects PDFs without bookmarks or page numbers.',
    ],
  },
  {
    id: 'el-dorado',
    name: 'El Dorado County',
    filingMethod: 'Placerville’s Main Street courthouse processes Family Law filings (limited windows 8:00 a.m.–4:00 p.m.). Odyssey eFile is enabled for Civil/Family; South Lake Tahoe accepts drop-box filings for local matters.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'El Dorado County Courthouse – Family/Civil Clerk',
      address: '2850 Fairlane Ct., Placerville, CA 95667',
      hours: 'Mon–Fri, 8:00am – 4:00pm',
      phone: '(530) 621-6427',
      efilePortal: 'https://www.eldorado.courts.ca.gov/online-services/efiling',
    },
    processingTime: 'E-filings review within 2–3 court days. Paper filings submitted before 4:00 p.m. receive same-day stamps in Placerville.',
    serviceNotes: 'Serve within 60 days. Sheriff Civil charges travel for Tahoe/foothill service; plan ahead for winter weather delays.',
    packetFormIds: DEFAULT_PACKET_FORMS,
    resources: [
      {
        label: 'El Dorado court locations',
        url: 'https://www.eldorado.courts.ca.gov/locations',
      },
      {
        label: 'Family Law division',
        url: 'https://www.eldorado.courts.ca.gov/divisions/family-law',
      },
    ],
    steps: [
      {
        title: 'Compile El Dorado packet',
        description: 'Complete statewide forms plus the optional “Family Law Case Cover Sheet” from the court website. Include FW-001 for fee waivers.',
      },
      {
        title: 'File in Placerville or e-file',
        description: 'Upload via Odyssey or bring two copies to Fairlane Court. Leave extra time for security screening.',
      },
      {
        title: 'Arrange mediation',
        description: 'Call Family Court Services early—Placerville and Tahoe calendars book weeks ahead.',
      },
      {
        title: 'Serve and file FL-115',
        description: 'Return proofs quickly; departments reset hearings if service is not of record 10 days beforehand.',
      },
    ],
    proTips: [
      'Check storm closures before driving to Placerville in winter—courts sometimes reduce hours due to weather.',
      'Tahoe filings can be dropped locally but are processed in Placerville; expect a one-day lag for conformed copies.',
    ],
  },
  {
    id: 'yolo',
    name: 'Yolo County',
    filingMethod: 'All Family Law filings route through the Woodland courthouse (1000 Main Street). Odyssey eFile is available for Civil/Family; self-represented parties may file at the clerk windows or drop boxes.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Yolo Superior Court – Family Division',
      address: '1000 Main St., Woodland, CA 95695',
      hours: 'Mon–Fri, 8:00am – 4:00pm',
      phone: '(530) 406-6704',
      efilePortal: 'https://www.yolo.courts.ca.gov/online-services/efile-court-documents',
    },
    processingTime: 'Most e-filings post within 2 court days; counter filings before 3:30 p.m. receive same-day stamps.',
    serviceNotes: 'Serve within 60 days. Sheriff Civil covers Woodland/West Sacramento weekly; private servers are faster for Davis and rural Capay Valley.',
    packetFormIds: DEFAULT_PACKET_FORMS,
    resources: [
      {
        label: 'Yolo Family Division',
        url: 'https://www.yolo.courts.ca.gov/divisions/family-division',
      },
      {
        label: 'Yolo eFile instructions',
        url: 'https://www.yolo.courts.ca.gov/online-services/efile-court-documents',
      },
    ],
    steps: [
      {
        title: 'Prepare statewide + Yolo forms',
        description: 'Complete FL-100/110/105 and attach the local case cover sheet (FL-800).',
      },
      {
        title: 'File through Odyssey or the Main Street counter',
        description: 'Upload electronically or bring paper packets with a return envelope for conformed copies.',
      },
      {
        title: 'Schedule CCRC mediation',
        description: 'Email familylaw@yolo.courts.ca.gov after filing custody requests so Child Custody Recommending Counseling is scheduled on time.',
      },
      {
        title: 'Serve and confirm proofs',
        description: 'File FL-115 as soon as service is complete; judges continue hearings without proof on file.',
      },
    ],
    proTips: [
      'Yolo requires hearing reservation numbers in the caption—enter them before e-filing RFOs.',
      'Self-help desks open at 8:00 a.m.—arrive early if you need document review before filing.',
    ],
  },
  {
    id: 'nevada',
    name: 'Nevada County',
    filingMethod: 'Nevada City Courthouse accepts Family Law filings at 201 Church Street. E-filing is limited; most parties file in person or via drop box (8:00 a.m.–4:00 p.m.).',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Nevada City Courthouse – Civil/Family Counter',
      address: '201 Church St., Nevada City, CA 95959',
      hours: 'Mon–Fri, 8:00am – 4:00pm',
      phone: '(530) 362-4309',
    },
    processingTime: 'Paper filings submitted before 4:00 p.m. receive same-day stamps. Drop-box packets are processed the next business day.',
    serviceNotes: 'Serve within 60 days. Sheriff Civil covers Nevada City/Grass Valley weekly; hire a registered server for Truckee or remote mountain communities.',
    packetFormIds: DEFAULT_PACKET_FORMS,
    resources: [
      {
        label: 'Nevada County Self-Help',
        url: 'https://www.nevada.courts.ca.gov/self-help',
      },
      {
        label: 'Court location & contact',
        url: 'https://www.nevada.courts.ca.gov/general-information',
      },
    ],
    steps: [
      {
        title: 'Assemble the Nevada County packet',
        description: 'Complete statewide forms and add any local standing orders provided by the Self-Help Center.',
      },
      {
        title: 'File at 201 Church Street',
        description: 'Take a queue ticket or use the drop box. Bring exact change or a cashier’s check.',
      },
      {
        title: 'Schedule mediation',
        description: 'Contact Family Court Services early—mediators travel between Nevada City and Truckee on limited schedules.',
      },
      {
        title: 'Serve and lodge proofs',
        description: 'File FL-115 or POS-040 as soon as service is complete so the judicial officer keeps your hearing.',
      },
    ],
    proTips: [
      'Winter storms can close Highway 20/49—plan filings ahead during snow season.',
      'Bring two hole-punched copies or the clerk will charge to punch them for you.',
    ],
  },
  {
    id: 'butte',
    name: 'Butte County',
    filingMethod: 'North Butte County Courthouse (1775 Concord Ave., Chico) processes Family Law filings. Odyssey eFileCA is available; counters run 8:30 a.m.–4:00 p.m.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'North Butte County Courthouse – Family Division',
      address: '1775 Concord Ave., Chico, CA 95928',
      hours: 'Mon–Fri, 8:30am – 4:00pm',
      phone: '(530) 532-7008',
      efilePortal: 'https://www.butte.courts.ca.gov/online-services/efiling',
    },
    processingTime: 'E-filings are reviewed within 1–2 court days; counter filings submitted before 4:00 p.m. receive same-day processing.',
    serviceNotes: 'Serve within 60 days. Sheriff Civil requires a conformed copy of the petition; private servers are faster for Paradise/Oroville areas rebuilding after fires.',
    packetFormIds: DEFAULT_PACKET_FORMS,
    resources: [
      {
        label: 'Butte Family Law division',
        url: 'https://www.butte.courts.ca.gov/divisions/family-law',
      },
      {
        label: 'Self-Help & facilitator',
        url: 'https://www.butte.courts.ca.gov/self-help',
      },
    ],
    steps: [
      {
        title: 'Collect statewide + Butte forms',
        description: 'Complete FL-100/110/105 and review any standing orders for North Butte filings.',
      },
      {
        title: 'File in Chico or via Odyssey',
        description: 'Upload through Odyssey or drop paper packets at the courthouse front desk.',
      },
      {
        title: 'Book Family Court Services',
        description: 'Call 530-532-7008 to schedule mediation before custody hearings.',
      },
      {
        title: 'Serve and file proofs',
        description: 'E-file FL-115 quickly so your case management review stays on the calendar.',
      },
    ],
    proTips: [
      'Arrive early—security lines and parking spill onto Concord Ave. after 9:00 a.m.',
      'Bookmark long declarations to avoid Odyssey rejection notices.',
    ],
  },
  {
    id: 'shasta',
    name: 'Shasta County',
    filingMethod: 'Redding’s courthouse (1500 Court Street) handles Family Law filings. E-filing is available through Journal Technologies; counters operate 8:30 a.m.–4:30 p.m.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Shasta County Courthouse – Civil/Family Clerk',
      address: '1500 Court St., Redding, CA 96001',
      hours: 'Mon–Fri, 8:30am – 4:30pm',
      phone: '(530) 245-6900',
      efilePortal: 'https://www.shasta.courts.ca.gov/forms-filing',
    },
    processingTime: 'Electronic filings are reviewed within about 2 court days; counter filings receive same-day stamps if submitted before 4:00 p.m.',
    serviceNotes: 'Serve within 60 days. Sheriff Civil requires prepayment and proof of residency; private servers cover Anderson and Cottonwood faster.',
    packetFormIds: DEFAULT_PACKET_FORMS,
    resources: [
      {
        label: 'Shasta Family Law division',
        url: 'https://www.shasta.courts.ca.gov/divisions/family-law-division',
      },
      {
        label: 'Self-help/facilitator',
        url: 'https://www.shastacounty.gov/media/28896',
      },
    ],
    steps: [
      {
        title: 'Complete statewide forms',
        description: 'Fill FL-100/110/105 and gather supporting declarations before heading to the courthouse.',
      },
      {
        title: 'File online or at Room 115',
        description: 'E-file via Journal Technologies or submit paper packets in Room 115 at 1500 Court Street.',
      },
      {
        title: 'Coordinate CCRC appointments',
        description: 'Email familycrtsvc@shasta.courts.ca.gov to schedule mediation as soon as a custody issue is raised.',
      },
      {
        title: 'Serve and confirm FL-115',
        description: 'Upload proofs with bookmarks to avoid rejection; judges want them filed at least 5 court days before hearings.',
      },
    ],
    proTips: [
      'Security screening can back up when jury panels report—plan for extra time in the mornings.',
      'Use the clerk’s drop box (Court St. entrance) after hours; items are time-stamped the next business day.',
    ],
  },
  {
    id: 'humboldt',
    name: 'Humboldt County',
    filingMethod: 'Eureka courthouse (825 5th Street) accepts Family Law filings at the Civil counter 8:00 a.m.–5:00 p.m. Limited e-filing is available for represented parties via Journal Technologies.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Humboldt County Courthouse – Civil/Family Services',
      address: '825 5th St., Eureka, CA 95501',
      hours: 'Mon–Fri, 8:00am – 5:00pm',
      phone: '(707) 445-7256',
      efilePortal: 'https://www.humboldt.courts.ca.gov/online-services',
    },
    processingTime: 'Counter filings submitted before 4:30 p.m. get same-day stamps; e-filings are processed within 2–3 court days.',
    serviceNotes: 'Serve within 60 days. Sheriff Civil coverage outside Eureka/Arcata can take several weeks—hire a private server for Fortuna, Garberville, or rural communities.',
    packetFormIds: DEFAULT_PACKET_FORMS,
    resources: [
      {
        label: 'Humboldt online services',
        url: 'https://www.humboldt.courts.ca.gov/online-services',
      },
      {
        label: 'Courthouse contact info',
        url: 'https://www.humboldt.courts.ca.gov/general-information/contact-uslocations',
      },
    ],
    steps: [
      {
        title: 'Assemble statewide + Humboldt instructions',
        description: 'Complete FL-100/110/105 and review local standing orders linked from the court website.',
      },
      {
        title: 'File at 825 5th Street or e-file',
        description: 'Drop packets at the civil counter or upload through the Journal Technologies portal.',
      },
      {
        title: 'Coordinate mediation',
        description: 'Contact Family Court Services early—staff also cover satellite days in Garberville and Hoopa.',
      },
      {
        title: 'Serve and file proofs',
        description: 'File FL-115 promptly so the department keeps your CMC or custody hearing on calendar.',
      },
    ],
    proTips: [
      'Fog often delays travel along Highway 101—allow extra time if you’re driving from the North or South county.',
      'Use the lobby kiosks to print conformed copies if you e-file and need stamped sets for service.',
    ],
  },
  {
    id: 'mendocino',
    name: 'Mendocino County',
    filingMethod: 'Ukiah courthouse (100 N. State Street) and the Fort Bragg branch share Family Law filings. Journal Technologies eFile is enabled; counters operate 8:00 a.m.–4:00 p.m.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Mendocino County Courthouse – Family/Civil Clerk',
      address: '100 N. State St., Ukiah, CA 95482',
      hours: 'Mon–Fri, 8:00am – 4:00pm',
      phone: '(707) 468-2001',
      efilePortal: 'https://www.mendocino.courts.ca.gov/e-filing',
    },
    processingTime: 'E-filings are reviewed within approximately 2 court days; counter filings before 4:00 p.m. are processed the same day.',
    serviceNotes: 'Serve within 60 days. Sheriff Civil charges mileage for coast runs—hire private servers for Fort Bragg or Anderson Valley matters.',
    packetFormIds: DEFAULT_PACKET_FORMS,
    resources: [
      {
        label: 'Mendocino Family Law',
        url: 'https://www.mendocino.courts.ca.gov/divisions/family/family-law',
      },
      {
        label: 'e-Filing information',
        url: 'https://www.mendocino.courts.ca.gov/e-filing',
      },
    ],
    steps: [
      {
        title: 'Collect statewide + local instructions',
        description: 'Fill FL-100/110/105 and review the Family Mediation packet if custody is disputed.',
      },
      {
        title: 'File in Ukiah/Fort Bragg or e-file',
        description: 'Submit electronically or bring paper packets to the appropriate branch with a return envelope.',
      },
      {
        title: 'Schedule mediation',
        description: 'Contact Family Court Services (Room 212) once you calendar any custody motion.',
      },
      {
        title: 'Serve and lodge proofs',
        description: 'File FL-115 as soon as service is complete—judges expect proof five days before hearings.',
      },
    ],
    proTips: [
      'Phone coverage is limited after 3:00 p.m.—email familylaw@mendocino.courts.ca.gov for status questions.',
      'If you need coast coverage, use the Fort Bragg drop box to avoid long drives over Highway 20.',
    ],
  },
  {
    id: 'lake',
    name: 'Lake County',
    filingMethod: 'The Lakeport courthouse (255 N. Forbes Street) accepts Family Law filings at the civil counter 8:00 a.m.–4:00 p.m. E-filing is not yet available, so SRLs must file in person, by mail, or via drop box.',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Lake County Superior Court – Civil/Family Clerk',
      address: '255 N. Forbes St., Lakeport, CA 95453',
      hours: 'Mon–Fri, 8:00am – 4:00pm',
      phone: '(707) 263-2374',
    },
    processingTime: 'Paper filings submitted before 4:00 p.m. get same-day stamps; mailed packets are processed the day they arrive.',
    serviceNotes: 'Serve within 60 days. Sheriff Civil covers Lakeport/Clearlake weekly; remote Cobb/Hwy 175 addresses take longer—use private servers if time-sensitive.',
    packetFormIds: DEFAULT_PACKET_FORMS,
    resources: [
      {
        label: 'Lake Superior Court general info',
        url: 'https://lake.courts.ca.gov/general-information',
      },
      {
        label: 'Self-help resources',
        url: 'https://lake.courts.ca.gov/self-help',
      },
    ],
    steps: [
      {
        title: 'Complete statewide forms',
        description: 'Finish FL-100/110/105 and any case-specific attachments (Income & Expense, Property Declaration, etc.).',
      },
      {
        title: 'File at Lakeport or mail packets',
        description: 'Bring two copies to 255 N. Forbes Street or mail filings with a self-addressed stamped envelope.',
      },
      {
        title: 'Schedule mediation',
        description: 'Call Family Court Services as soon as custody is disputed; mediators rotate between Lakeport and Clearlake.',
      },
      {
        title: 'Serve and file proofs',
        description: 'Once service is complete, file FL-115 so the judge will hear your motion.',
      },
    ],
    proTips: [
      'Bring exact change or a cashier’s check—credit card terminals occasionally go offline.',
      'Expect security lines around 8:30 a.m.; plan filings earlier in the day.',
    ],
  },
  {
    id: 'tehama',
    name: 'Tehama County',
    filingMethod: 'Red Bluff courthouse (1740 Walnut Street) processes all Family Law filings. E-filing is not yet available; use the clerk windows or the exterior drop box (cleared daily at 4:00 p.m.).',
    filingFee: '$435 (petition)',
    responseFee: '$435 (response)',
    clerk: {
      courthouse: 'Tehama County Courthouse – Civil/Family Clerk',
      address: '1740 Walnut St., Red Bluff, CA 96080',
      hours: 'Mon–Fri, 8:00am – 4:00pm',
      phone: '(530) 527-3484',
    },
    processingTime: 'Counter filings before 4:00 p.m. post same day; drop-box items are stamped the morning after collection.',
    serviceNotes: 'Serve within 60 days. Sheriff Civil requires separate checks for mileage outside Red Bluff; private servers are faster for Corning or rural ranches.',
    packetFormIds: DEFAULT_PACKET_FORMS,
    resources: [
      {
        label: 'Tehama Superior Court',
        url: 'https://www.tehama.courts.ca.gov/',
      },
      {
        label: 'Family Court Services info',
        url: 'https://www.tehama.courts.ca.gov/divisions/family-law',
      },
    ],
    steps: [
      {
        title: 'Prepare the Tehama packet',
        description: 'Complete the statewide divorce packet and attach any standing orders or cover sheets posted on the court website.',
      },
      {
        title: 'File at Walnut Street or via drop box',
        description: 'Bring two copies and payment to the clerk windows or use the exterior drop box before 4:00 p.m.',
      },
      {
        title: 'Schedule mediation through FCS',
        description: 'Family Court Services provides mediation in Red Bluff; call immediately once you set a custody hearing.',
      },
      {
        title: 'Serve and return proofs',
        description: 'File FL-115 promptly so the judicial officer keeps your hearing.',
      },
    ],
    proTips: [
      'Lines are shortest between 8:00–9:00 a.m.—arrive early during harvest season.',
      'The clerk accepts money orders or cashier’s checks; personal checks are returned if you are not a local attorney.',
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
