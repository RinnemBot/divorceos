export interface CourtForm {
  id: string;
  formNumber: string;
  title: string;
  description: string;
  category: string;
  pdfUrl: string;
  instructionsUrl?: string;
}

export const FORM_CATEGORIES = [
  { id: 'petition', name: 'Starting a Divorce', icon: 'FileText' },
  { id: 'response', name: 'Responding to Divorce', icon: 'Reply' },
  { id: 'financial', name: 'Financial Disclosures', icon: 'DollarSign' },
  { id: 'custody', name: 'Child Custody & Support', icon: 'Users' },
  { id: 'support', name: 'Spousal Support', icon: 'Heart' },
  { id: 'property', name: 'Property & Debt', icon: 'Home' },
  { id: 'dv', name: 'Domestic Violence', icon: 'Shield' },
  { id: 'judgment', name: 'Finalizing Divorce', icon: 'CheckCircle' },
];

export const COURT_FORMS: CourtForm[] = [
  // Starting a Divorce
  {
    id: 'fl-100',
    formNumber: 'FL-100',
    title: 'Petition - Marriage/Domestic Partnership',
    description: 'The main form to start a divorce or legal separation.',
    category: 'petition',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl100.pdf',
    instructionsUrl: 'https://www.courts.ca.gov/documents/fl100info.pdf',
  },
  {
    id: 'fl-110',
    formNumber: 'FL-110',
    title: 'Summons - Family Law',
    description: 'Notifies your spouse that you have filed for divorce.',
    category: 'petition',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl110.pdf',
  },
  {
    id: 'fl-105',
    formNumber: 'FL-105',
    title: 'Declaration Under UCCJEA',
    description: 'Required if you have children under 18. Declares where children have lived.',
    category: 'petition',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl105.pdf',
  },
  {
    id: 'fl-115',
    formNumber: 'FL-115',
    title: 'Proof of Service of Summons',
    description: 'Proves your spouse was properly served with divorce papers.',
    category: 'petition',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl115.pdf',
  },
  {
    id: 'fl-117',
    formNumber: 'FL-117',
    title: 'Notice and Acknowledgment of Receipt',
    description: 'Alternative way for spouse to acknowledge receiving papers.',
    category: 'petition',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl117.pdf',
  },
  
  // Responding to Divorce
  {
    id: 'fl-120',
    formNumber: 'FL-120',
    title: 'Response - Marriage/Domestic Partnership',
    description: 'The form to respond to a divorce petition.',
    category: 'response',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl120.pdf',
    instructionsUrl: 'https://www.courts.ca.gov/documents/fl120info.pdf',
  },
  {
    id: 'fl-272',
    formNumber: 'FL-272',
    title: 'Declaration for Default or Uncontested Dissolution',
    description: 'For uncontested divorces where spouse does not respond.',
    category: 'response',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl272.pdf',
  },
  
  // Financial Disclosures
  {
    id: 'fl-140',
    formNumber: 'FL-140',
    title: 'Declaration of Disclosure',
    description: 'Required declaration that you have disclosed all financial information.',
    category: 'financial',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl140.pdf',
  },
  {
    id: 'fl-142',
    formNumber: 'FL-142',
    title: 'Schedule of Assets and Debts',
    description: 'Lists all property and debts - community and separate.',
    category: 'financial',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl142.pdf',
  },
  {
    id: 'fl-150',
    formNumber: 'FL-150',
    title: 'Income and Expense Declaration',
    description: 'Details your income, expenses, and financial situation.',
    category: 'financial',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl150.pdf',
  },
  {
    id: 'fl-141',
    formNumber: 'FL-141',
    title: 'Declaration Regarding Service of Declaration of Disclosure',
    description: 'Confirms you served your financial disclosures on your spouse.',
    category: 'financial',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl141.pdf',
  },
  {
    id: 'fl-160',
    formNumber: 'FL-160',
    title: 'Property Declaration',
    description: 'Alternative form for listing assets and debts.',
    category: 'financial',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl160.pdf',
  },
  
  // Child Custody & Support
  {
    id: 'fl-311',
    formNumber: 'FL-311',
    title: 'Child Custody and Visitation Application Attachment',
    description: 'Details your requested custody and visitation arrangement.',
    category: 'custody',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl311.pdf',
  },
  {
    id: 'fl-312',
    formNumber: 'FL-312',
    title: 'Child Custody and Visitation (Parenting Time) Order Attachment',
    description: 'Proposed order for custody and visitation.',
    category: 'custody',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl312.pdf',
  },
  {
    id: 'fl-341',
    formNumber: 'FL-341(A-D)',
    title: 'Child Custody Information Forms',
    description: 'Various forms for child custody matters including visitation details.',
    category: 'custody',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl341.pdf',
  },
  {
    id: 'fl-342',
    formNumber: 'FL-342',
    title: 'Supervised Visitation Order',
    description: 'For cases requiring supervised visitation.',
    category: 'custody',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl342.pdf',
  },
  {
    id: 'fl-191',
    formNumber: 'FL-191',
    title: 'Child Support Case Registry Form',
    description: 'Required form to register child support case.',
    category: 'custody',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl191.pdf',
  },
  {
    id: 'fl-195',
    formNumber: 'FL-195',
    title: 'Income Withholding for Support',
    description: 'For wage garnishment of child support payments.',
    category: 'custody',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl195.pdf',
  },
  {
    id: 'fl-342a',
    formNumber: 'FL-342(A)',
    title: 'Joint Custody Attachment',
    description: 'Additional provisions for joint custody arrangements.',
    category: 'custody',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl342a.pdf',
  },
  
  // Spousal Support
  {
    id: 'fl-346',
    formNumber: 'FL-346',
    title: 'Spousal or Partner Support Declaration Attachment',
    description: 'Provides additional information for spousal support requests.',
    category: 'support',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl346.pdf',
  },
  {
    id: 'fl-431',
    formNumber: 'FL-431',
    title: 'Spousal or Partner Support Order Attachment',
    description: 'Proposed order for spousal support.',
    category: 'support',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl431.pdf',
  },
  {
    id: 'fl-435',
    formNumber: 'FL-435',
    title: 'Spousal or Partner Support Order After Hearing',
    description: 'Final spousal support order after court hearing.',
    category: 'support',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl435.pdf',
  },
  {
    id: 'fl-830',
    formNumber: 'FL-830',
    title: 'Spousal Support Registry Form',
    description: 'For registering spousal support orders.',
    category: 'support',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl830.pdf',
  },
  
  // Property & Debt
  {
    id: 'fl-345',
    formNumber: 'FL-345',
    title: 'Property Declaration - Attachment',
    description: 'Detailed property and debt information.',
    category: 'property',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl345.pdf',
  },
  {
    id: 'fl-348',
    formNumber: 'FL-348',
    title: 'Property Order Attachment to Judgment',
    description: 'Orders regarding division of property.',
    category: 'property',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl348.pdf',
  },
  {
    id: 'fl-460',
    formNumber: 'FL-460',
    title: 'Property Declaration (Attachment) - Simplified',
    description: 'Simplified property declaration for certain cases.',
    category: 'property',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl460.pdf',
  },
  
  // Domestic Violence
  {
    id: 'dv-100',
    formNumber: 'DV-100',
    title: 'Request for Domestic Violence Restraining Order',
    description: 'The main form to request protection from domestic violence.',
    category: 'dv',
    pdfUrl: 'https://www.courts.ca.gov/documents/dv100.pdf',
    instructionsUrl: 'https://www.courts.ca.gov/documents/dv100info.pdf',
  },
  {
    id: 'dv-101',
    formNumber: 'DV-101',
    title: 'Description of Abuse',
    description: 'Detailed description of the abuse you have experienced.',
    category: 'dv',
    pdfUrl: 'https://www.courts.ca.gov/documents/dv101.pdf',
  },
  {
    id: 'dv-105',
    formNumber: 'DV-105',
    title: 'Request for Child Custody and Visitation Orders',
    description: 'Request custody orders as part of DV restraining order.',
    category: 'dv',
    pdfUrl: 'https://www.courts.ca.gov/documents/dv105.pdf',
  },
  {
    id: 'dv-108',
    formNumber: 'DV-108',
    title: 'Request for Order: No Travel With Children',
    description: 'Prevents abuser from traveling with children.',
    category: 'dv',
    pdfUrl: 'https://www.courts.ca.gov/documents/dv108.pdf',
  },
  {
    id: 'dv-109',
    formNumber: 'DV-109',
    title: 'Notice of Court Hearing',
    description: 'Notifies parties of hearing date for DV restraining order.',
    category: 'dv',
    pdfUrl: 'https://www.courts.ca.gov/documents/dv109.pdf',
  },
  {
    id: 'dv-110',
    formNumber: 'DV-110',
    title: 'Temporary Restraining Order',
    description: 'Temporary orders issued before the hearing.',
    category: 'dv',
    pdfUrl: 'https://www.courts.ca.gov/documents/dv110.pdf',
  },
  {
    id: 'dv-120',
    formNumber: 'DV-120',
    title: 'Response to Request for Domestic Violence Restraining Order',
    description: 'Form for responding to a DV restraining order request.',
    category: 'dv',
    pdfUrl: 'https://www.courts.ca.gov/documents/dv120.pdf',
  },
  {
    id: 'dv-130',
    formNumber: 'DV-130',
    title: 'Restraining Order After Hearing',
    description: 'The final restraining order issued after the court hearing.',
    category: 'dv',
    pdfUrl: 'https://www.courts.ca.gov/documents/dv130.pdf',
  },
  {
    id: 'dv-140',
    formNumber: 'DV-140',
    title: 'Request for Firearms Restraining Order',
    description: 'Request to remove firearms from abuser.',
    category: 'dv',
    pdfUrl: 'https://www.courts.ca.gov/documents/dv140.pdf',
  },
  {
    id: 'dv-200',
    formNumber: 'DV-200',
    title: 'Proof of Personal Service',
    description: 'Proves the restrained person was served with the order.',
    category: 'dv',
    pdfUrl: 'https://www.courts.ca.gov/documents/dv200.pdf',
  },
  
  // Finalizing Divorce
  {
    id: 'fl-130',
    formNumber: 'FL-130',
    title: 'Appearance, Stipulations, and Waivers',
    description: 'For uncontested divorces where spouse agrees to terms.',
    category: 'judgment',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl130.pdf',
  },
  {
    id: 'fl-144',
    formNumber: 'FL-144',
    title: 'Stipulation to Establish or Modify Child Support',
    description: 'Agreement between parents on child support.',
    category: 'judgment',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl144.pdf',
  },
  {
    id: 'fl-165',
    formNumber: 'FL-165',
    title: 'Notice of Entry of Judgment',
    description: 'Notifies parties that the divorce judgment has been entered.',
    category: 'judgment',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl165.pdf',
  },
  {
    id: 'fl-170',
    formNumber: 'FL-170',
    title: 'Declaration for Default or Uncontested Dissolution',
    description: 'For finalizing uncontested divorces.',
    category: 'judgment',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl170.pdf',
  },
  {
    id: 'fl-180',
    formNumber: 'FL-180',
    title: 'Judgment',
    description: 'The final judgment of dissolution of marriage.',
    category: 'judgment',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl180.pdf',
  },
  {
    id: 'fl-182',
    formNumber: 'FL-182',
    title: 'Notice of Entry of Judgment (Proof of Service)',
    description: 'Proof that the judgment was served on the other party.',
    category: 'judgment',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl182.pdf',
  },
  {
    id: 'fl-190',
    formNumber: 'FL-190',
    title: 'Notice of Entry of Judgment (Uncontested)',
    description: 'For uncontested judgment entries.',
    category: 'judgment',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl190.pdf',
  },
  {
    id: 'fl-347',
    formNumber: 'FL-347',
    title: 'Stipulation for Entry of Judgment',
    description: 'Agreement to enter judgment on stipulated terms.',
    category: 'judgment',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl347.pdf',
  },
];

export function getFormsByCategory(categoryId: string): CourtForm[] {
  return COURT_FORMS.filter(form => form.category === categoryId);
}

export function searchForms(query: string): CourtForm[] {
  const lowerQuery = query.toLowerCase();
  return COURT_FORMS.filter(form => 
    form.title.toLowerCase().includes(lowerQuery) ||
    form.description.toLowerCase().includes(lowerQuery) ||
    form.formNumber.toLowerCase().includes(lowerQuery)
  );
}

export function getFormById(id: string): CourtForm | undefined {
  return COURT_FORMS.find(form => form.id === id);
}
