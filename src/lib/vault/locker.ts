/**
 * Document Locker v1 (Spec 017 / F1.7)
 * Pure categorization and governance logic for official corporate documents.
 * Organizes company documents into standard corporate kit folders, computes
 * status badges, checks essential incorporation document completeness by
 * jurisdiction, and provides date sorting and human-readable labeling.
 */

export type CorporateFolderCategory =
  | 'incorporation_kit'
  | 'tax_records'
  | 'kyc_identification'
  | 'compliance_filings';

export type DocumentBadgeStatus =
  | 'verified'
  | 'pending_review'
  | 'expired'
  | 'missing_essential';

export interface DocumentItem {
  id: string;
  file_name: string;
  category?: string | null;
  document_type?: string | null;
  status?: string | null;
  badge_status?: DocumentBadgeStatus;
  expiry_date?: Date | string | null;
  created_at?: Date | string | null;
  file_size_bytes?: number | null;
  r2_key?: string | null;
  mime_type?: string | null;
  download_url?: string | null;
  company_id?: string | null;
}

export interface CategorizedLocker {
  incorporation_kit: DocumentItem[];
  tax_records: DocumentItem[];
  kyc_identification: DocumentItem[];
  compliance_filings: DocumentItem[];
}

export interface EssentialDocumentRequirement {
  id: string;
  name: string;
  category: CorporateFolderCategory;
  description: string;
  matchPatterns: (string | RegExp)[];
}

export interface EssentialDocumentsCheckResult {
  jurisdiction: string;
  isComplete: boolean;
  requiredDocuments: EssentialDocumentRequirement[];
  missingDocuments: EssentialDocumentRequirement[];
  presentDocuments: EssentialDocumentRequirement[];
  warningMessage?: string;
}

/**
 * Standard folder definitions & metadata
 */
export const CORPORATE_FOLDERS: Array<{
  id: CorporateFolderCategory;
  name: string;
  description: string;
}> = [
  {
    id: 'incorporation_kit',
    name: 'Incorporation Kit',
    description: 'Trade license, certificate of incorporation, MOA/AOA, and share certificates',
  },
  {
    id: 'tax_records',
    name: 'Tax Records',
    description: 'Tax registration certificates (TRN/TIN), VAT, and corporate tax filings',
  },
  {
    id: 'kyc_identification',
    name: 'KYC & Identification',
    description: 'Passport copies, proof of address, and UBO declarations',
  },
  {
    id: 'compliance_filings',
    name: 'Compliance Filings',
    description: 'Annual returns, Economic Substance (ESR) filings, and audited financials',
  },
];

/**
 * Human-readable label lookup table for categories and document types.
 */
export const CATEGORY_LABELS: Record<string, string> = {
  // Folder categories
  incorporation_kit: 'Incorporation Kit',
  tax_records: 'Tax Records',
  kyc_identification: 'KYC & Identification',
  compliance_filings: 'Compliance Filings',

  // Incorporation kit document types
  trade_license: 'Trade License',
  certificate_of_incorporation: 'Certificate of Incorporation',
  coi: 'Certificate of Incorporation',
  moa_aoa: 'MOA / AOA',
  moa: 'Memorandum of Association',
  aoa: 'Articles of Association',
  share_certificate: 'Share Certificate',
  share_certificates: 'Share Certificates',
  good_standing: 'Certificate of Good Standing',
  certificate_of_good_standing: 'Certificate of Good Standing',
  register_of_directors: 'Register of Directors',
  register_of_members: 'Register of Members',
  nominee_poa: 'Nominee POA',

  // Tax records document types
  tax_certificate: 'Tax Certificate',
  tax_registration: 'Tax Registration Certificate',
  trn_certificate: 'Tax Registration (TRN / TIN)',
  tin_certificate: 'Tax Identification (TIN)',
  vat_certificate: 'VAT Certificate',
  corporate_tax_filing: 'Corporate Tax Filing',
  tax_filing: 'Tax Return Filing',
  bank_document: 'Bank Document',
  bank_letter: 'Bank Confirmation Letter',

  // KYC identification document types
  passport: 'Passport Copy',
  passport_copy: 'Passport Copy',
  proof_of_address: 'Proof of Address',
  utility_bill: 'Proof of Address (Utility / Bank)',
  ubo_declaration: 'UBO Declaration',
  ubo_register: 'Register of Ultimate Beneficial Owners',
  national_id: 'National ID / Emirates ID',

  // Compliance filings document types
  annual_return: 'Annual Return',
  esr_filing: 'Economic Substance (ESR) Filing',
  economic_substance: 'Economic Substance Filing',
  audited_financials: 'Audited Financials',
  financial_audit: 'Financial Audit Report',
  other: 'Other Document',
};

/**
 * Returns a human-friendly label for a folder or document type.
 */
export function getDocumentCategoryLabel(categoryOrType?: string | null): string {
  if (!categoryOrType) return 'Document';
  const key = categoryOrType.toLowerCase().trim();
  if (CATEGORY_LABELS[key]) {
    return CATEGORY_LABELS[key];
  }
  // Fallback: convert snake_case or kebab-case to Title Case
  return categoryOrType
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

/**
 * Resolves the appropriate corporate folder for a document based on its
 * category, document_type, or file_name.
 */
export function resolveDocumentCategory(doc: DocumentItem): CorporateFolderCategory {
  const explicitCategory = (doc.category || '').toLowerCase().trim();
  const explicitType = (doc.document_type || '').toLowerCase().trim();
  const fileName = (doc.file_name || '').toLowerCase().trim();

  // 1. Direct folder category match
  if (explicitCategory === 'incorporation_kit') return 'incorporation_kit';
  if (explicitCategory === 'tax_records') return 'tax_records';
  if (explicitCategory === 'kyc_identification') return 'kyc_identification';
  if (explicitCategory === 'compliance_filings') return 'compliance_filings';

  // 2. Map existing DB categories to folders
  if (['trade_license', 'moa_aoa', 'share_certificate', 'nominee_poa'].includes(explicitCategory)) {
    return 'incorporation_kit';
  }
  if (['tax_certificate', 'bank_document'].includes(explicitCategory)) {
    return 'tax_records';
  }

  // 3. Check document_type
  if (
    [
      'trade_license',
      'certificate_of_incorporation',
      'coi',
      'moa',
      'aoa',
      'moa_aoa',
      'constitution',
      'share_certificate',
      'share_certificates',
      'good_standing',
      'certificate_of_good_standing',
      'register_of_directors',
      'register_of_members',
      'nominee_poa',
    ].includes(explicitType)
  ) {
    return 'incorporation_kit';
  }

  if (
    [
      'tax_certificate',
      'tax_registration',
      'trn_certificate',
      'tin_certificate',
      'vat_certificate',
      'corporate_tax_filing',
      'tax_filing',
      'bank_document',
      'bank_letter',
    ].includes(explicitType)
  ) {
    return 'tax_records';
  }

  if (
    [
      'passport',
      'passport_copy',
      'proof_of_address',
      'utility_bill',
      'ubo_declaration',
      'ubo_register',
      'national_id',
    ].includes(explicitType)
  ) {
    return 'kyc_identification';
  }

  if (
    [
      'annual_return',
      'esr_filing',
      'economic_substance',
      'audited_financials',
      'financial_audit',
    ].includes(explicitType)
  ) {
    return 'compliance_filings';
  }

  // 4. File name heuristics (regex / keywords)
  // KYC keywords
  if (
    /passport|emirates[\s_-]?id|national[\s_-]?id|proof[\s_-]?of[\s_-]?address|utility[\s_-]?bill|ubo[\s_-]?declaration|beneficial[\s_-]?owner/i.test(
      fileName
    )
  ) {
    return 'kyc_identification';
  }

  // Tax keywords
  if (
    /tax|trn|tin|vat|revenue|corporate[\s_-]?tax|bank[\s_-]?(statement|letter|doc|confirmation)/i.test(
      fileName
    )
  ) {
    return 'tax_records';
  }

  // Compliance keywords
  if (
    /annual[\s_-]?return|economic[\s_-]?substance|esr|audited|financial[\s_-]?audit|compliance/i.test(
      fileName
    )
  ) {
    return 'compliance_filings';
  }

  // Incorporation kit keywords
  if (
    /license|trade|incorporation|moa|aoa|article|memorandum|share[\s_-]?cert|good[\s_-]?standing|register[\s_-]?(director|member)|formation|charter/i.test(
      fileName
    )
  ) {
    return 'incorporation_kit';
  }

  // Default fallback for business documents is incorporation kit
  return 'incorporation_kit';
}

/**
 * Calculates badge status for a document.
 * Returns 'expired', 'pending_review', 'verified', or 'missing_essential'.
 */
export function getDocumentBadgeStatus(
  doc: DocumentItem,
  referenceDate: Date = new Date()
): DocumentBadgeStatus {
  if (doc.badge_status) {
    return doc.badge_status;
  }

  // Check expiry
  if (doc.expiry_date) {
    const exp = doc.expiry_date instanceof Date ? doc.expiry_date : new Date(doc.expiry_date);
    if (!isNaN(exp.getTime()) && exp.getTime() < referenceDate.getTime()) {
      return 'expired';
    }
  }

  const status = (doc.status || '').toLowerCase().trim();
  if (
    status === 'pending_review' ||
    status === 'action_needed' ||
    status === 'submitted' ||
    status === 'pending'
  ) {
    return 'pending_review';
  }

  if (status === 'archived' || status === 'superseded') {
    return 'pending_review';
  }

  return 'verified';
}

/**
 * Categorizes a list of documents into standard corporate kit folders.
 */
export function categorizeDocuments(documents: DocumentItem[]): CategorizedLocker {
  const result: CategorizedLocker = {
    incorporation_kit: [],
    tax_records: [],
    kyc_identification: [],
    compliance_filings: [],
  };

  if (!Array.isArray(documents)) {
    return result;
  }

  for (const doc of documents) {
    const folder = resolveDocumentCategory(doc);
    result[folder].push({
      ...doc,
      badge_status: getDocumentBadgeStatus(doc),
    });
  }

  return result;
}

/**
 * Essential incorporation document definitions per jurisdiction.
 */
export const JURISDICTION_ESSENTIALS: Record<string, EssentialDocumentRequirement[]> = {
  uae: [
    {
      id: 'trade_license',
      name: 'Trade License',
      category: 'incorporation_kit',
      description: 'Official mainland or freezone trade license with legal activity',
      matchPatterns: ['trade_license', /trade[\s_-]?license/i, /commercial[\s_-]?license/i],
    },
    {
      id: 'moa_aoa',
      name: 'Memorandum & Articles of Association (MOA/AOA)',
      category: 'incorporation_kit',
      description: 'Notarized or authority-signed MOA/AOA constitution',
      matchPatterns: ['moa_aoa', 'moa', 'aoa', /moa/i, /aoa/i, /memorandum/i, /articles/i],
    },
    {
      id: 'share_certificate',
      name: 'Share Certificate(s)',
      category: 'incorporation_kit',
      description: 'Issued company share certificate indicating equity distribution',
      matchPatterns: ['share_certificate', 'share_certificates', /share[\s_-]?cert/i],
    },
    {
      id: 'certificate_of_incorporation',
      name: 'Certificate of Incorporation',
      category: 'incorporation_kit',
      description: 'Official registrar certificate of incorporation or trade license',
      matchPatterns: [
        'certificate_of_incorporation',
        'coi',
        'trade_license',
        /incorporation/i,
        /formation/i,
      ],
    },
  ],
  hk: [
    {
      id: 'certificate_of_incorporation',
      name: 'Certificate of Incorporation (CI)',
      category: 'incorporation_kit',
      description: 'Hong Kong Companies Registry Certificate of Incorporation',
      matchPatterns: ['certificate_of_incorporation', 'coi', /incorporation/i],
    },
    {
      id: 'trade_license',
      name: 'Business Registration Certificate (BRC)',
      category: 'incorporation_kit',
      description: 'Inland Revenue Department Business Registration Certificate',
      matchPatterns: ['trade_license', /business[\s_-]?registration/i, /brc/i],
    },
    {
      id: 'moa_aoa',
      name: 'Articles of Association',
      category: 'incorporation_kit',
      description: 'Articles of Association registered with Companies Registry',
      matchPatterns: ['moa_aoa', 'aoa', /articles/i],
    },
    {
      id: 'register_of_directors',
      name: 'Register of Directors & Members',
      category: 'incorporation_kit',
      description: 'Significant Controllers Register and Register of Directors',
      matchPatterns: ['register_of_directors', 'register_of_members', /register[\s_-]?(director|member)/i],
    },
  ],
  sg: [
    {
      id: 'certificate_of_incorporation',
      name: 'Certificate of Incorporation (ACRA)',
      category: 'incorporation_kit',
      description: 'Accounting and Corporate Regulatory Authority Incorporation Certificate',
      matchPatterns: ['certificate_of_incorporation', 'coi', /acra/i, /incorporation/i],
    },
    {
      id: 'trade_license',
      name: 'ACRA Business Profile',
      category: 'incorporation_kit',
      description: 'Instant Electronic Business Profile (ACRA Bizfile)',
      matchPatterns: ['trade_license', /business[\s_-]?profile/i, /bizfile/i],
    },
    {
      id: 'moa_aoa',
      name: 'Company Constitution',
      category: 'incorporation_kit',
      description: 'Model or customized Singapore Company Constitution',
      matchPatterns: ['moa_aoa', 'constitution', /constitution/i, /articles/i],
    },
  ],
  bh: [
    {
      id: 'trade_license',
      name: 'Commercial Registration (CR)',
      category: 'incorporation_kit',
      description: 'Bahrain Ministry of Industry and Commerce Commercial Registration Certificate',
      matchPatterns: ['trade_license', /commercial[\s_-]?registration/i, /\bcr\b/i],
    },
    {
      id: 'moa_aoa',
      name: 'Memorandum of Association',
      category: 'incorporation_kit',
      description: 'Notarized Bahrain Memorandum of Association',
      matchPatterns: ['moa_aoa', 'moa', /memorandum/i],
    },
  ],
  ie: [
    {
      id: 'certificate_of_incorporation',
      name: 'Certificate of Incorporation (CRO)',
      category: 'incorporation_kit',
      description: 'Companies Registration Office Ireland Certificate of Incorporation',
      matchPatterns: ['certificate_of_incorporation', 'coi', /cro/i, /incorporation/i],
    },
    {
      id: 'moa_aoa',
      name: 'Company Constitution',
      category: 'incorporation_kit',
      description: 'Irish Companies Act 2014 compliant Constitution',
      matchPatterns: ['moa_aoa', 'constitution', /constitution/i, /memorandum/i],
    },
  ],
  bvi: [
    {
      id: 'certificate_of_incorporation',
      name: 'Certificate of Incorporation',
      category: 'incorporation_kit',
      description: 'BVI / Cayman Registry Certificate of Incorporation',
      matchPatterns: ['certificate_of_incorporation', 'coi', /incorporation/i],
    },
    {
      id: 'moa_aoa',
      name: 'Memorandum & Articles of Association',
      category: 'incorporation_kit',
      description: 'BVI / Cayman M&A approved by Registered Agent',
      matchPatterns: ['moa_aoa', 'moa', 'aoa', /memorandum/i, /articles/i],
    },
    {
      id: 'register_of_directors',
      name: 'Register of Directors',
      category: 'incorporation_kit',
      description: 'Certified Register of Directors filed with corporate registry',
      matchPatterns: ['register_of_directors', 'good_standing', /register[\s_-]?director/i, /good[\s_-]?standing/i],
    },
  ],
};

// Generic fallback requirements
const DEFAULT_ESSENTIALS: EssentialDocumentRequirement[] = [
  {
    id: 'trade_license',
    name: 'Trade License or Certificate of Incorporation',
    category: 'incorporation_kit',
    description: 'Official government corporate formation certificate',
    matchPatterns: ['trade_license', 'certificate_of_incorporation', 'coi', /license/i, /incorporation/i],
  },
  {
    id: 'moa_aoa',
    name: 'Memorandum & Articles of Association (MOA/AOA)',
    category: 'incorporation_kit',
    description: 'Constitutional corporate charter',
    matchPatterns: ['moa_aoa', 'moa', 'aoa', 'constitution', /moa/i, /aoa/i, /articles/i, /memorandum/i],
  },
  {
    id: 'share_certificate',
    name: 'Share Certificate',
    category: 'incorporation_kit',
    description: 'Equity allocation certificate',
    matchPatterns: ['share_certificate', 'share_certificates', /share[\s_-]?cert/i],
  },
];

/**
 * Normalizes jurisdiction codes to canonical keys.
 */
function normalizeJurisdictionKey(jurisdiction?: string | null): string {
  if (!jurisdiction) return 'default';
  const clean = jurisdiction.toLowerCase().trim();
  if (['uae', 'ae', 'dubai', 'abu_dhabi', 'adgm', 'difc', 'dmcc', 'meydan', 'ifza', 'shams', 'rak'].includes(clean)) {
    return 'uae';
  }
  if (['hk', 'hong_kong', 'hongkong'].includes(clean)) return 'hk';
  if (['sg', 'singapore'].includes(clean)) return 'sg';
  if (['bh', 'bahrain'].includes(clean)) return 'bh';
  if (['ie', 'ireland'].includes(clean)) return 'ie';
  if (['bvi', 'vg', 'cayman', 'ky', 'offshore'].includes(clean)) return 'bvi';
  return 'default';
}

/**
 * Checks whether a single document matches an essential requirement.
 */
function documentMatchesRequirement(doc: DocumentItem, req: EssentialDocumentRequirement): boolean {
  const cat = (doc.category || '').toLowerCase().trim();
  const type = (doc.document_type || '').toLowerCase().trim();
  const name = (doc.file_name || '').toLowerCase().trim();

  for (const pattern of req.matchPatterns) {
    if (typeof pattern === 'string') {
      const p = pattern.toLowerCase();
      if (cat === p || type === p) return true;
      if (name.includes(p)) return true;
    } else if (pattern instanceof RegExp) {
      if (pattern.test(cat) || pattern.test(type) || pattern.test(name)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Checks essential document completeness for a given company jurisdiction.
 * Returns whether all essential documents are present, which are missing,
 * and a human-readable warning message if any are absent.
 */
export function checkEssentialDocuments(
  jurisdiction: string | null | undefined,
  documents: DocumentItem[] = []
): EssentialDocumentsCheckResult {
  const normalizedKey = normalizeJurisdictionKey(jurisdiction);
  const required = JURISDICTION_ESSENTIALS[normalizedKey] || DEFAULT_ESSENTIALS;
  const docs = Array.isArray(documents) ? documents : [];

  const presentDocuments: EssentialDocumentRequirement[] = [];
  const missingDocuments: EssentialDocumentRequirement[] = [];

  for (const req of required) {
    const isPresent = docs.some((doc) => documentMatchesRequirement(doc, req));
    if (isPresent) {
      presentDocuments.push(req);
    } else {
      missingDocuments.push(req);
    }
  }

  const isComplete = missingDocuments.length === 0;
  const jurisdictionLabel =
    normalizedKey === 'uae'
      ? 'UAE'
      : normalizedKey === 'hk'
      ? 'Hong Kong'
      : normalizedKey === 'sg'
      ? 'Singapore'
      : normalizedKey === 'bh'
      ? 'Bahrain'
      : normalizedKey === 'ie'
      ? 'Ireland'
      : normalizedKey === 'bvi'
      ? 'BVI / Cayman'
      : 'your company';

  let warningMessage: string | undefined;
  if (!isComplete) {
    const missingNames = missingDocuments.map((d) => d.name).join(', ');
    warningMessage = `Missing essential incorporation documents for ${jurisdictionLabel}: ${missingNames}.`;
  }

  return {
    jurisdiction: jurisdiction || 'generic',
    isComplete,
    requiredDocuments: required,
    missingDocuments,
    presentDocuments,
    warningMessage,
  };
}

/**
 * Pure date sorting function for documents.
 * Does not mutate input array. Handles missing dates, Date objects, and ISO strings.
 */
export function sortDocumentsByDate(
  docs: DocumentItem[],
  direction: 'asc' | 'desc' = 'desc'
): DocumentItem[] {
  if (!Array.isArray(docs)) return [];

  return [...docs].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;

    const safeA = isNaN(timeA) ? 0 : timeA;
    const safeB = isNaN(timeB) ? 0 : timeB;

    if (direction === 'asc') {
      return safeA - safeB;
    }
    return safeB - safeA;
  });
}

/**
 * Formats file size in bytes to a human-readable string.
 */
export function formatFileSize(bytes?: number | null): string {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes < 0) {
    return '—';
  }
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const unitIndex = Math.min(i, units.length - 1);
  const size = bytes / Math.pow(1024, unitIndex);
  return `${size >= 10 || unitIndex === 0 ? Math.round(size) : size.toFixed(1)} ${units[unitIndex]}`;
}
