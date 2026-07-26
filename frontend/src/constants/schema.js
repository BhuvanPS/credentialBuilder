/**
 * Schema declarations, initial form states, and render structures
 * for the Credential Builder frontend forms, timeline stages, and skill grids.
 */

/**
 * List of all parsed document field properties extracted from Azure Content Understanding.
 */
export const FIELD_SCHEMA = [
  { key: 'fullName', label: 'Full Name', type: 'text' },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'phoneNumber', label: 'Phone', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'linkedInUrl', label: 'LinkedIn URL', type: 'text' },
  { key: 'title', label: 'Title', type: 'text' },
  { key: 'roleServiceLine', label: 'Role / Service Line', type: 'text' },
  { key: 'experience', label: 'Experience Summary', type: 'text' },
  { key: 'summary', label: 'Profile Summary', type: 'text' },
  { key: 'keyExpertise', label: 'Key Expertise', type: 'list' },
  { key: 'coreCompetencies', label: 'Core Competencies', type: 'list' },
  { key: 'certifications', label: 'Certifications', type: 'list' },
  { key: 'affiliationsMemberships', label: 'Affiliations / Memberships', type: 'list' },
  { key: 'clientOutcomes', label: 'Client Outcomes', type: 'list' },
  { key: 'workExperiences', label: 'Work Experience', type: 'objectList' },
  { key: 'education', label: 'Education', type: 'list' },
  { key: 'achievementsAndLeadership', label: 'Achievements & Leadership', type: 'list' },
  { key: 'taxSkills', label: 'Tax Skills', type: 'list' },
  { key: 'privateSkills', label: 'Private Skills', type: 'list' },
  { key: 'dealsSkills', label: 'Deals Skills', type: 'list' },
  { key: 'peopleCultureSkills', label: 'People & Culture Skills', type: 'list' },
  { key: 'legalRiskSkills', label: 'Legal / Risk Skills', type: 'list' },
  { key: 'financeSkills', label: 'Finance Skills', type: 'list' },
  { key: 'technologySkills', label: 'Technology Skills', type: 'list' },
];

/**
 * Generates the initial empty form state mapping to avoid undefined react warnings.
 */
export const initialFormData = FIELD_SCHEMA.reduce((acc, field) => {
  if (field.type === 'text') {
    acc[field.key] = { value: '', confidence: null };
  } else {
    acc[field.key] = [];
  }
  return acc;
}, {});

/**
 * Definition and ordering of fields rendered directly in Step 2 prefilled form page.
 */
export const FORM_RENDER_FIELDS = [
  { key: 'fullName', label: 'Full Name', type: 'text' },
  { key: 'title', label: 'Title', type: 'text' },
  { key: 'roleServiceLine', label: 'Role / Service Line', type: 'text' },
  { key: 'experience', label: 'Experience', type: 'text' },
  { key: 'keyExpertise', label: 'Key Expertise', type: 'list', placeholder: 'e.g. M&A restructuring, cross-border tax compliance, risk management', addButtonLabel: '+ Add expertise' },
  { key: 'coreCompetencies', label: 'Core Competencies', type: 'list', placeholder: 'e.g. Data modeling, regulatory audit, financial forecasting, process optimization', addButtonLabel: '+ Add competency' },
  { key: 'certifications', label: 'Certifications', type: 'list', placeholder: 'e.g. CA (ANZ), CTA, CPA Australia', addButtonLabel: '+ Add certification' },
  { key: 'affiliationsMemberships', label: 'Affiliations & Memberships', type: 'list', placeholder: 'Professional bodies, industry groups, boards', addButtonLabel: '+ Add affiliation' },
  { key: 'education', label: 'Education', type: 'list', placeholder: 'e.g. Master of Laws (LLM), Melbourne University', addButtonLabel: '+ Add qualification' },
  { key: 'achievementsAndLeadership', label: 'Career Highlights', type: 'textareaList', placeholder: 'Industry leadership, top-tier recognition, awards, notable appointments', addButtonLabel: '+ Add highlight' },
  { key: 'clientOutcomes', label: 'Client Outcomes', type: 'textareaList', placeholder: 'Specific deals or engagements with measurable results (deal size, savings, timelines)', addButtonLabel: '+ Add client outcome' }
];

/**
 * Available skill domains (pools) rendered in the percentage slider/value matrix.
 */
export const SKILL_POOL_FIELDS = [
  { key: 'taxSkills', label: 'Tax Skills' },
  { key: 'privateSkills', label: 'Private Skills' },
  { key: 'dealsSkills', label: 'Deals Skills' },
  { key: 'peopleCultureSkills', label: 'People & Culture Skills' },
  { key: 'legalRiskSkills', label: 'Legal / Risk Skills' },
  { key: 'financeSkills', label: 'Finance Skills' },
  { key: 'technologySkills', label: 'Technology Skills' }
];

/**
 * Progression steps displayed in StepTabs header timeline.
 */
export const STEP_TITLES = [
  { id: 1, label: 'Upload / LinkedIn' },
  { id: 2, label: 'Your Credentials' },
  { id: 3, label: 'Credential Summary' },
];
