export type TemplateFieldType = 'text' | 'date' | 'textarea';

export type TemplateField = {
  id: string;
  label: string;
  type: TemplateFieldType;
  required?: boolean;
  placeholder?: string;
};

export type TemplateCategoryId = 'legal' | 'hr' | 'business';

export type TemplateItem = {
  id: string;
  name: string;
  categoryId: TemplateCategoryId;
  categoryLabel: string;
  description: string;
  coverStyle: { bg: string; accent: string };
  fields: TemplateField[];
  preview: {
    title: string;
    body: string[];
    sections: Array<{ heading: string; lines: string[] }>;
  };
};

export const TEMPLATE_LIBRARY_TEMPLATES: TemplateItem[] = [
  {
    id: 'nda',
    name: 'Non-Disclosure Agreement',
    categoryId: 'legal',
    categoryLabel: 'Legal',
    description: 'Mutual NDA template with standard confidentiality, exclusions, term, and remedies.',
    coverStyle: { bg: 'from-slate-50 to-white', accent: 'bg-[#3E2B66]' },
    fields: [
      { id: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
      { id: 'partyAName', label: 'Disclosing Party Name', type: 'text', required: true, placeholder: 'e.g., Acme Pvt Ltd' },
      { id: 'partyAEntityType', label: 'Disclosing Party Entity Type', type: 'text', required: true, placeholder: 'e.g., Private Limited Company' },
      { id: 'partyAJurisdiction', label: 'Disclosing Party Jurisdiction', type: 'text', required: true, placeholder: 'e.g., India' },
      { id: 'partyAAddress', label: 'Disclosing Party Address', type: 'textarea', required: true, placeholder: 'Full address' },
      { id: 'partyBName', label: 'Receiving Party Name', type: 'text', required: true, placeholder: 'e.g., John Doe' },
      { id: 'partyBEntityType', label: 'Receiving Party Entity Type', type: 'text', required: true, placeholder: 'e.g., Individual / Company' },
      { id: 'partyBJurisdiction', label: 'Receiving Party Jurisdiction', type: 'text', required: true, placeholder: 'e.g., India' },
      { id: 'partyBAddress', label: 'Receiving Party Address', type: 'textarea', required: true, placeholder: 'Full address' },
      { id: 'purpose', label: 'Purpose', type: 'textarea', required: true, placeholder: 'Describe why confidential information is being shared' },
      { id: 'termMonths', label: 'Confidentiality Term (months)', type: 'text', required: true, placeholder: 'e.g., 24' },
      { id: 'partyASignatoryName', label: 'Party A Signatory Name', type: 'text', required: true, placeholder: 'e.g., Sneha Tiwari' },
      { id: 'partyASignDate', label: 'Party A Sign Date', type: 'date', required: true },
      { id: 'partyBSignatoryName', label: 'Party B Signatory Name', type: 'text', required: true, placeholder: 'e.g., Rahul Sharma' },
      { id: 'partyBSignDate', label: 'Party B Sign Date', type: 'date', required: true },
    ],
    preview: {
      title: 'NON-DISCLOSURE AGREEMENT (MUTUAL)',
      body: [
        'This Non-Disclosure Agreement (this “Agreement”) is entered into as of {{effectiveDate}} (the “Effective Date”) by and between:',
        '',
        '(1) {{partyAName}}, a {{partyAEntityType}} organized under the laws of {{partyAJurisdiction}}, with its principal place of business at {{partyAAddress}} (“Party A”); and',
        '',
        '(2) {{partyBName}}, a {{partyBEntityType}} organized under the laws of {{partyBJurisdiction}}, with its principal place of business at {{partyBAddress}} (“Party B”).',
        '',
        'Party A and Party B may each be referred to as a “Party,” and collectively as the “Parties.”',
      ],
      sections: [
        {
          heading: '1. PURPOSE',
          lines: [
            'The Parties wish to explore and/or engage in discussions regarding {{purpose}} (the “Purpose”).',
            'In connection with the Purpose, each Party may disclose to the other certain Confidential Information (as defined below).',
          ],
        },
        {
          heading: '2. DEFINITION OF CONFIDENTIAL INFORMATION',
          lines: [
            '“Confidential Information” means any non-public information disclosed by a Party (the “Disclosing Party”) to the other Party (the “Receiving Party”), whether orally, visually, in writing, or in any other form, that a reasonable person would understand to be confidential given the nature of the information and the circumstances of disclosure.',
          ],
        },
        {
          heading: '3. EXCLUSIONS',
          lines: [
            'Confidential Information does not include information that the Receiving Party can demonstrate: (a) is or becomes publicly available through no breach of this Agreement; (b) was lawfully known by the Receiving Party prior to disclosure; (c) is received from a third party without breach of any obligation of confidentiality; or (d) is independently developed without use of or reference to the Confidential Information.',
          ],
        },
        {
          heading: '4. OBLIGATIONS OF RECEIVING PARTY',
          lines: [
            'The Receiving Party shall: (a) use the Confidential Information solely for the Purpose; (b) restrict disclosure to its employees, contractors, and advisors who have a need to know and are bound by confidentiality obligations at least as protective as those in this Agreement; and (c) protect the Confidential Information using reasonable care, and in no event less than the degree of care it uses to protect its own confidential information of similar importance.',
          ],
        },
        {
          heading: '5. REQUIRED DISCLOSURE',
          lines: [
            'If the Receiving Party is required by law, regulation, or court order to disclose any Confidential Information, it shall (to the extent permitted) provide prompt written notice to the Disclosing Party and reasonably cooperate in seeking a protective order or other remedy.',
          ],
        },
        {
          heading: '6. TERM; RETURN/DESTRUCTION',
          lines: [
            'This Agreement begins on the Effective Date and remains in effect until terminated by either Party upon written notice.',
            'The confidentiality obligations under this Agreement will continue for {{termMonths}} months from the date of each disclosure.',
            'Upon request, the Receiving Party will promptly return or destroy all Confidential Information in its possession or control, except where retention is required by law or internal compliance policies, provided such retained information remains subject to this Agreement.',
          ],
        },
        {
          heading: '7. NO LICENSE; NO OBLIGATION',
          lines: [
            'All Confidential Information remains the property of the Disclosing Party. No license or other rights are granted by this Agreement, whether by implication, estoppel, or otherwise.',
            'Nothing in this Agreement requires either Party to proceed with any transaction or relationship, and each Party reserves the right, in its sole discretion, to terminate discussions at any time.',
          ],
        },
        {
          heading: '8. REMEDIES',
          lines: [
            'The Parties agree that unauthorized disclosure or use of Confidential Information may cause irreparable harm for which monetary damages may be inadequate. Accordingly, the Disclosing Party may seek injunctive or equitable relief in addition to any other remedies available at law or in equity.',
          ],
        },
        {
          heading: '9. GOVERNING LAW; JURISDICTION',
          lines: [
            'This Agreement is governed by the laws of {{partyAJurisdiction}}, without regard to conflict of laws principles. The courts located in {{partyAJurisdiction}} shall have exclusive jurisdiction, subject to applicable law.',
          ],
        },
        {
          heading: 'IN WITNESS WHEREOF',
          lines: [
            'The Parties have executed this Agreement as of the Effective Date.',
            '',
            'Party A Signatory: {{partyASignatoryName}}',
            'Party A Sign Date: {{partyASignDate}}',
            'Party B Signatory: {{partyBSignatoryName}}',
            'Party B Sign Date: {{partyBSignDate}}',
          ],
        },
      ],
    },
  },
  {
    id: 'mou',
    name: 'Memorandum of Understanding',
    categoryId: 'business',
    categoryLabel: 'Business',
    description: 'MOU template for collaboration, scope, milestones, and commercial terms (non-binding).',
    coverStyle: { bg: 'from-violet-50 to-white', accent: 'bg-violet-600' },
    fields: [
      { id: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
      { id: 'partyA', label: 'Party A', type: 'text', required: true },
      { id: 'partyB', label: 'Party B', type: 'text', required: true },
      { id: 'projectName', label: 'Project / Initiative Name', type: 'text', required: true },
      { id: 'scope', label: 'Scope', type: 'textarea', required: true },
      { id: 'durationMonths', label: 'Duration (months)', type: 'text', required: true, placeholder: 'e.g., 6' },
      { id: 'partyASignatoryName', label: 'Party A Signatory Name', type: 'text', required: true, placeholder: 'e.g., Jane Doe' },
      { id: 'partyASignDate', label: 'Party A Sign Date', type: 'date', required: true },
      { id: 'partyBSignatoryName', label: 'Party B Signatory Name', type: 'text', required: true, placeholder: 'e.g., John Smith' },
      { id: 'partyBSignDate', label: 'Party B Sign Date', type: 'date', required: true },
    ],
    preview: {
      title: 'MEMORANDUM OF UNDERSTANDING',
      body: [
        'This Memorandum of Understanding (the “MOU”) is made effective as of {{effectiveDate}} between {{partyA}} and {{partyB}} (each a “Party,” together the “Parties”).',
        '',
        'The Parties desire to collaborate on {{projectName}} subject to the terms set out below.',
      ],
      sections: [
        {
          heading: '1. SCOPE OF COLLABORATION',
          lines: ['The Parties intend to collaborate within the following scope:', '{{scope}}'],
        },
        {
          heading: '2. ROLES AND RESPONSIBILITIES',
          lines: [
            'Each Party will designate a point of contact for coordination.',
            'The Parties will cooperate in good faith and share necessary information to achieve agreed objectives.',
          ],
        },
        {
          heading: '3. TIMELINE AND DURATION',
          lines: [
            'This MOU remains in effect for {{durationMonths}} months from the Effective Date unless terminated earlier by written notice.',
          ],
        },
        {
          heading: '4. CONFIDENTIALITY',
          lines: [
            'The Parties agree to maintain confidentiality of non-public information shared in connection with this MOU and the collaboration.',
          ],
        },
        {
          heading: '5. INTELLECTUAL PROPERTY',
          lines: [
            'Existing intellectual property remains the property of the owning Party. Any jointly developed deliverables will be handled under a separate written agreement, if required.',
          ],
        },
        {
          heading: '6. NON-BINDING; GOOD FAITH',
          lines: [
            'This MOU is intended to reflect the Parties’ understanding and is not legally binding except for confidentiality and any other clauses expressly stated to be binding.',
          ],
        },
        {
          heading: '7. TERMINATION',
          lines: [
            'Either Party may terminate this MOU for convenience upon written notice. Termination will not affect accrued obligations intended to survive.',
          ],
        },
        {
          heading: 'SIGNATURES',
          lines: [
            'Party A Signatory: {{partyASignatoryName}}',
            'Party A Sign Date: {{partyASignDate}}',
            'Party B Signatory: {{partyBSignatoryName}}',
            'Party B Sign Date: {{partyBSignDate}}',
          ],
        },
      ],
    },
  },
  {
    id: 'employment',
    name: 'Employment Agreement',
    categoryId: 'hr',
    categoryLabel: 'HR',
    description: 'Employment agreement template with role, compensation, confidentiality, and termination.',
    coverStyle: { bg: 'from-emerald-50 to-white', accent: 'bg-emerald-600' },
    fields: [
      { id: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
      { id: 'employer', label: 'Employer', type: 'text', required: true },
      { id: 'employee', label: 'Employee', type: 'text', required: true },
      { id: 'role', label: 'Role / Title', type: 'text', required: true },
      { id: 'startDate', label: 'Start Date', type: 'date', required: true },
      { id: 'workLocation', label: 'Work Location', type: 'text', required: true },
      { id: 'salary', label: 'Salary / Compensation', type: 'text', required: true, placeholder: 'e.g., ₹12,00,000 per annum' },
      { id: 'noticeDays', label: 'Notice Period (days)', type: 'text', required: true, placeholder: 'e.g., 30' },
      { id: 'companySignatoryName', label: 'Company Signatory Name', type: 'text', required: true, placeholder: 'e.g., John Doe' },
      { id: 'companySignDate', label: 'Company Sign Date', type: 'date', required: true },
      { id: 'employeeSignatoryName', label: 'Employee Signatory Name', type: 'text', required: true, placeholder: 'e.g., Priya Verma' },
      { id: 'employeeSignDate', label: 'Employee Sign Date', type: 'date', required: true },
    ],
    preview: {
      title: 'EMPLOYMENT AGREEMENT',
      body: [
        'This Employment Agreement (the “Agreement”) is entered into on {{effectiveDate}} between {{employer}} (the “Company”) and {{employee}} (the “Employee”).',
      ],
      sections: [
        {
          heading: '1. POSITION AND DUTIES',
          lines: [
            'The Employee will serve as {{role}} starting on {{startDate}}.',
            'The Employee agrees to perform duties consistent with this role and as reasonably assigned by the Company.',
          ],
        },
        {
          heading: '2. LOCATION',
          lines: ['The Employee’s primary work location will be {{workLocation}}, subject to reasonable business travel and remote work policies.'],
        },
        {
          heading: '3. COMPENSATION',
          lines: ['The Company will pay the Employee {{salary}}, subject to applicable taxes and deductions.'],
        },
        {
          heading: '4. CONFIDENTIALITY',
          lines: [
            'The Employee shall maintain the confidentiality of all non-public Company information and shall not disclose such information except as required to perform duties.',
          ],
        },
        {
          heading: '5. INTELLECTUAL PROPERTY',
          lines: [
            'All work product and inventions created by the Employee in the course of employment are the exclusive property of the Company, subject to applicable law.',
          ],
        },
        {
          heading: '6. TERMINATION',
          lines: [
            'Either Party may terminate employment by providing {{noticeDays}} days’ written notice, unless otherwise required by law or Company policy.',
          ],
        },
        {
          heading: 'SIGNATURES',
          lines: [
            'Company Signatory: {{companySignatoryName}}',
            'Company Sign Date: {{companySignDate}}',
            'Employee Signatory: {{employeeSignatoryName}}',
            'Employee Sign Date: {{employeeSignDate}}',
          ],
        },
      ],
    },
  },
];

