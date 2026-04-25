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
    pdfUrl: '/forms/fl-100.pdf',
    instructionsUrl: 'https://www.courts.ca.gov/documents/fl100info.pdf',
  },
  {
    id: 'fl-110',
    formNumber: 'FL-110',
    title: 'Summons - Family Law',
    description: 'Notifies your spouse that you have filed for divorce.',
    category: 'petition',
    pdfUrl: '/forms/fl-110.pdf',
  },
  {
    id: 'fl-105',
    formNumber: 'FL-105',
    title: 'Declaration Under UCCJEA',
    description: 'Required if you have children under 18. Declares where children have lived.',
    category: 'petition',
    pdfUrl: '/forms/fl-105.pdf',
  },
  {
    id: 'fl-105a',
    formNumber: 'FL-105(A)',
    title: 'Attachment to Declaration Under UCCJEA',
    description: 'Official continuation page for each additional child when the children have not all lived together for the past five years.',
    category: 'petition',
    pdfUrl: '/forms/fl-105a.pdf',
  },
  {
    id: 'fl-115',
    formNumber: 'FL-115',
    title: 'Proof of Service of Summons',
    description: 'Proves your spouse was properly served with divorce papers.',
    category: 'petition',
    pdfUrl: '/forms/fl-115.pdf',
  },
  {
    id: 'fl-117',
    formNumber: 'FL-117',
    title: 'Notice and Acknowledgment of Receipt',
    description: 'Alternative way for spouse to acknowledge receiving papers.',
    category: 'petition',
    pdfUrl: '/forms/fl-117.pdf',
  },
  {
    id: 'fl-700',
    formNumber: 'FL-700',
    title: 'Joint Petition, Marriage or Domestic Partnership',
    description: 'Newer joint filing path for couples who are aligned and expect agreement on all issues.',
    category: 'petition',
    pdfUrl: 'https://courts.ca.gov/system/files/2025-12/fl700.pdf',
    instructionsUrl: 'https://courts.ca.gov/system/files/2025-12/fl700info.pdf',
  },
  
  // Responding to Divorce
  {
    id: 'fl-120',
    formNumber: 'FL-120',
    title: 'Response - Marriage/Domestic Partnership',
    description: 'The form to respond to a divorce petition.',
    category: 'response',
    pdfUrl: '/forms/fl-120.pdf',
    instructionsUrl: 'https://www.courts.ca.gov/documents/fl120info.pdf',
  },
  {
    id: 'fl-272',
    formNumber: 'FL-272',
    title: 'Declaration for Default or Uncontested Dissolution',
    description: 'For uncontested divorces where spouse does not respond.',
    category: 'response',
    pdfUrl: '/forms/fl-272.pdf',
  },
  
  // Financial Disclosures
  {
    id: 'fl-140',
    formNumber: 'FL-140',
    title: 'Declaration of Disclosure',
    description: 'Required declaration that you have disclosed all financial information.',
    category: 'financial',
    pdfUrl: '/forms/fl-140.pdf',
  },
  {
    id: 'fl-142',
    formNumber: 'FL-142',
    title: 'Schedule of Assets and Debts',
    description: 'Lists all property and debts - community and separate.',
    category: 'financial',
    pdfUrl: '/forms/fl-142.pdf',
  },
  {
    id: 'fl-150',
    formNumber: 'FL-150',
    title: 'Income and Expense Declaration',
    description: 'Details your income, expenses, and financial situation.',
    category: 'financial',
    pdfUrl: '/forms/fl-150.pdf',
  },
  {
    id: 'fl-141',
    formNumber: 'FL-141',
    title: 'Declaration Regarding Service of Declaration of Disclosure',
    description: 'Confirms you served your financial disclosures on your spouse.',
    category: 'financial',
    pdfUrl: '/forms/fl-141.pdf',
  },
  {
    id: 'fl-160',
    formNumber: 'FL-160',
    title: 'Property Declaration',
    description: 'Alternative form for listing assets and debts.',
    category: 'financial',
    pdfUrl: '/forms/fl-160.pdf',
  },
  
  // Child Custody & Support
  {
    id: 'fl-300',
    formNumber: 'FL-300',
    title: 'Request for Order',
    description: 'Ask the court to make or change temporary orders about custody, visitation, support, fees, or property control.',
    category: 'custody',
    pdfUrl: '/forms/fl-300.pdf',
    instructionsUrl: 'https://www.courts.ca.gov/documents/fl300info.pdf',
  },
  {
    id: 'fl-311',
    formNumber: 'FL-311',
    title: 'Child Custody and Visitation Application Attachment',
    description: 'Details your requested custody and visitation arrangement.',
    category: 'custody',
    pdfUrl: '/forms/fl-311.pdf',
  },
  {
    id: 'fl-312',
    formNumber: 'FL-312',
    title: 'Child Custody and Visitation (Parenting Time) Order Attachment',
    description: 'Proposed order for custody and visitation.',
    category: 'custody',
    pdfUrl: '/forms/fl-312.pdf',
  },
  {
    id: 'fl-341',
    formNumber: 'FL-341',
    title: 'Child Custody and Visitation Order Attachment',
    description: 'Main child custody and visitation order attachment that references supplemental attachments.',
    category: 'custody',
    pdfUrl: '/forms/fl-341.pdf',
  },
  {
    id: 'fl-341a',
    formNumber: 'FL-341(A)',
    title: 'Supervised Visitation Order',
    description: 'Attachment used to specify supervised visitation terms, supervisor details, and conditions.',
    category: 'custody',
    pdfUrl: '/forms/fl-341a.pdf',
  },
  {
    id: 'fl-341b',
    formNumber: 'FL-341(B)',
    title: 'Child Abduction Prevention Order Attachment',
    description: 'Order attachment for child abduction prevention restrictions and safeguards.',
    category: 'custody',
    pdfUrl: '/forms/fl-341b.pdf',
  },
  {
    id: 'fl-341c',
    formNumber: 'FL-341(C)',
    title: "Children's Holiday Schedule Attachment",
    description: 'Holiday parenting schedule attachment for child custody and visitation orders.',
    category: 'custody',
    pdfUrl: '/forms/fl-341c.pdf',
  },
  {
    id: 'fl-341d',
    formNumber: 'FL-341(D)',
    title: 'Additional Provisions-Physical Custody Attachment',
    description: 'Additional physical custody provisions attachment.',
    category: 'custody',
    pdfUrl: '/forms/fl-341d.pdf',
  },
  {
    id: 'fl-341e',
    formNumber: 'FL-341(E)',
    title: 'Joint Legal Custody Attachment',
    description: 'Joint legal custody decision-making and related terms attachment.',
    category: 'custody',
    pdfUrl: '/forms/fl-341e.pdf',
  },
  {
    id: 'fl-342',
    formNumber: 'FL-342',
    title: 'Child Support Information and Order Attachment',
    description: 'Used to state guideline support, add-ons, payment terms, and health insurance provisions.',
    category: 'custody',
    pdfUrl: '/forms/fl-342.pdf',
  },
  {
    id: 'fl-191',
    formNumber: 'FL-191',
    title: 'Child Support Case Registry Form',
    description: 'Required form to register child support case.',
    category: 'custody',
    pdfUrl: '/forms/fl-191.pdf',
  },
  {
    id: 'fl-195',
    formNumber: 'FL-195',
    title: 'Income Withholding for Support',
    description: 'For wage garnishment of child support payments.',
    category: 'custody',
    pdfUrl: '/forms/fl-195.pdf',
  },
  {
    id: 'fl-342a',
    formNumber: 'FL-342(A)',
    title: 'Joint Custody Attachment',
    description: 'Additional provisions for joint custody arrangements.',
    category: 'custody',
    pdfUrl: '/forms/fl-342a.pdf',
  },
  
  // Spousal Support
  {
    id: 'fl-346',
    formNumber: 'FL-346',
    title: 'Spousal or Partner Support Declaration Attachment',
    description: 'Provides additional information for spousal support requests.',
    category: 'support',
    pdfUrl: '/forms/fl-346.pdf',
  },
  {
    id: 'fl-431',
    formNumber: 'FL-431',
    title: 'Spousal or Partner Support Order Attachment',
    description: 'Proposed order for spousal support.',
    category: 'support',
    pdfUrl: '/forms/fl-431.pdf',
  },
  {
    id: 'fl-435',
    formNumber: 'FL-435',
    title: 'Spousal or Partner Support Order After Hearing',
    description: 'Final spousal support order after court hearing.',
    category: 'support',
    pdfUrl: '/forms/fl-435.pdf',
  },
  {
    id: 'fl-830',
    formNumber: 'FL-830',
    title: 'Spousal Support Registry Form',
    description: 'For registering spousal support orders.',
    category: 'support',
    pdfUrl: '/forms/fl-830.pdf',
  },
  
  // Property & Debt
  {
    id: 'fl-345',
    formNumber: 'FL-345',
    title: 'Property Declaration - Attachment',
    description: 'Detailed property and debt information.',
    category: 'property',
    pdfUrl: '/forms/fl-345.pdf',
  },
  {
    id: 'fl-348',
    formNumber: 'FL-348',
    title: 'Property Order Attachment to Judgment',
    description: 'Orders regarding division of property.',
    category: 'property',
    pdfUrl: '/forms/fl-348.pdf',
  },
  {
    id: 'fl-460',
    formNumber: 'FL-460',
    title: 'Property Declaration (Attachment) - Simplified',
    description: 'Simplified property declaration for certain cases.',
    category: 'property',
    pdfUrl: '/forms/fl-460.pdf',
  },
  
  // Domestic Violence
  {
    id: 'dv-100',
    formNumber: 'DV-100',
    title: 'Request for Domestic Violence Restraining Order',
    description: 'The main form to request protection from domestic violence.',
    category: 'dv',
    pdfUrl: '/forms/dv-100.pdf',
    instructionsUrl: 'https://www.courts.ca.gov/documents/dv100info.pdf',
  },
  {
    id: 'dv-101',
    formNumber: 'DV-101',
    title: 'Description of Abuse',
    description: 'Detailed description of the abuse you have experienced.',
    category: 'dv',
    pdfUrl: '/forms/dv-101.pdf',
  },
  {
    id: 'dv-105',
    formNumber: 'DV-105',
    title: 'Request for Child Custody and Visitation Orders',
    description: 'Request custody orders as part of DV restraining order.',
    category: 'dv',
    pdfUrl: '/forms/dv-105.pdf',
  },
  {
    id: 'dv-108',
    formNumber: 'DV-108',
    title: 'Request for Order: No Travel With Children',
    description: 'Prevents abuser from traveling with children.',
    category: 'dv',
    pdfUrl: '/forms/dv-108.pdf',
  },
  {
    id: 'dv-109',
    formNumber: 'DV-109',
    title: 'Notice of Court Hearing',
    description: 'Notifies parties of hearing date for DV restraining order.',
    category: 'dv',
    pdfUrl: '/forms/dv-109.pdf',
  },
  {
    id: 'dv-110',
    formNumber: 'DV-110',
    title: 'Temporary Restraining Order',
    description: 'Temporary orders issued before the hearing.',
    category: 'dv',
    pdfUrl: '/forms/dv-110.pdf',
  },
  {
    id: 'dv-120',
    formNumber: 'DV-120',
    title: 'Response to Request for Domestic Violence Restraining Order',
    description: 'Form for responding to a DV restraining order request.',
    category: 'dv',
    pdfUrl: '/forms/dv-120.pdf',
  },
  {
    id: 'dv-130',
    formNumber: 'DV-130',
    title: 'Restraining Order After Hearing',
    description: 'The final restraining order issued after the court hearing.',
    category: 'dv',
    pdfUrl: '/forms/dv-130.pdf',
  },
  {
    id: 'dv-140',
    formNumber: 'DV-140',
    title: 'Request for Firearms Restraining Order',
    description: 'Request to remove firearms from abuser.',
    category: 'dv',
    pdfUrl: '/forms/dv-140.pdf',
  },
  {
    id: 'dv-200',
    formNumber: 'DV-200',
    title: 'Proof of Personal Service',
    description: 'Proves the restrained person was served with the order.',
    category: 'dv',
    pdfUrl: '/forms/dv-200.pdf',
  },
  
  // Finalizing Divorce
  {
    id: 'fl-130',
    formNumber: 'FL-130',
    title: 'Appearance, Stipulations, and Waivers',
    description: 'For uncontested divorces where spouse agrees to terms.',
    category: 'judgment',
    pdfUrl: '/forms/fl-130.pdf',
  },
  {
    id: 'fl-144',
    formNumber: 'FL-144',
    title: 'Stipulation to Establish or Modify Child Support',
    description: 'Agreement between parents on child support.',
    category: 'judgment',
    pdfUrl: '/forms/fl-144.pdf',
  },
  {
    id: 'fl-165',
    formNumber: 'FL-165',
    title: 'Notice of Entry of Judgment',
    description: 'Notifies parties that the divorce judgment has been entered.',
    category: 'judgment',
    pdfUrl: '/forms/fl-165.pdf',
  },
  {
    id: 'fl-170',
    formNumber: 'FL-170',
    title: 'Declaration for Default or Uncontested Dissolution',
    description: 'For finalizing uncontested divorces.',
    category: 'judgment',
    pdfUrl: '/forms/fl-170.pdf',
  },
  {
    id: 'fl-180',
    formNumber: 'FL-180',
    title: 'Judgment',
    description: 'The final judgment of dissolution of marriage.',
    category: 'judgment',
    pdfUrl: '/forms/fl-180.pdf',
  },
  {
    id: 'fl-182',
    formNumber: 'FL-182',
    title: 'Notice of Entry of Judgment (Proof of Service)',
    description: 'Proof that the judgment was served on the other party.',
    category: 'judgment',
    pdfUrl: '/forms/fl-182.pdf',
  },
  {
    id: 'fl-190',
    formNumber: 'FL-190',
    title: 'Notice of Entry of Judgment (Uncontested)',
    description: 'For uncontested judgment entries.',
    category: 'judgment',
    pdfUrl: '/forms/fl-190.pdf',
  },
  {
    id: 'fl-347',
    formNumber: 'FL-347',
    title: 'Stipulation for Entry of Judgment',
    description: 'Agreement to enter judgment on stipulated terms.',
    category: 'judgment',
    pdfUrl: '/forms/fl-347.pdf',
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
