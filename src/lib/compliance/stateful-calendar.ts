/**
 * Pure calculation module for statutory compliance deadlines across all 6 jurisdictions:
 * UAE, Hong Kong, Singapore, Bahrain, Ireland, BVI & Cayman.
 *
 * Implements Spec 016 (Stateful Compliance Calendar, F1.2).
 */

export type DeadlineStatus = 'overdue' | 'due_soon' | 'upcoming';

export type ComplianceCategory =
  | 'tax'
  | 'vat'
  | 'license'
  | 'annual_return'
  | 'esr'
  | 'other';

export interface StatutoryDeadlineItem {
  id: string;
  title: string;
  category: ComplianceCategory;
  deadlineDate: string; // ISO format "YYYY-MM-DD"
  daysRemaining: number;
  status: DeadlineStatus;
  penaltyExplanation: string;
  filingAuthority: string;
  filingPortalUrl: string;
  description: string;
  requirement: string; // alias for title
}

export interface ComplianceSummary {
  total: number;
  overdue: number;
  dueSoon: number;
  upcoming: number;
  nextDeadline: StatutoryDeadlineItem | null;
  overallStatus: 'compliant' | 'action_required' | 'critical';
}

export interface CalculateDeadlinesParams {
  jurisdiction: string;
  incorporationDate: string | Date;
  fiscalYearEndMonth?: number; // 1-12
  fiscalYearEndDay?: number;   // 1-31
  fiscalYearEnd?: string;      // "MM-DD" e.g. "12-31"
  isVatRegistered?: boolean;
  referenceDate?: string | Date; // Defaults to now (UTC)
}

// ---------------------------------------------------------------------------
// Date Math Utilities (Pure UTC, Leap-Year Safe)
// ---------------------------------------------------------------------------

/** Parses string or Date into a normalized UTC midnight Date. Returns Invalid Date on error. */
export function parseDateUtc(input: string | Date | undefined): Date {
  if (!input) return new Date(NaN);
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return new Date(NaN);
    return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(Date.UTC(year, month, day));
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
    }
  }
  return new Date(NaN);
}

/** Formats a UTC Date to "YYYY-MM-DD". Returns empty string if invalid. */
export function formatDateIso(date: Date): string {
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds months in UTC. If the source date is the last day of its month (common for FYE),
 * the result is clamped to the last day of the target month (e.g. Jun 30 + 9 mo = Mar 31).
 * Otherwise, the day of month is preserved unless clamped by a shorter target month.
 */
export function addMonthsClamped(date: Date, months: number): Date {
  if (Number.isNaN(date.getTime())) return new Date(NaN);
  const sourceYear = date.getUTCFullYear();
  const sourceMonth = date.getUTCMonth();
  const sourceDay = date.getUTCDate();

  const sourceLastDay = new Date(Date.UTC(sourceYear, sourceMonth + 1, 0)).getUTCDate();
  const isSourceEndOfMonth = sourceDay === sourceLastDay;

  const totalMonths = sourceYear * 12 + sourceMonth + months;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;
  const targetLastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();

  const targetDay = isSourceEndOfMonth ? targetLastDay : Math.min(sourceDay, targetLastDay);
  return new Date(Date.UTC(targetYear, targetMonth, targetDay));
}

/** Adds years in UTC, clamping to Feb 28 on non-leap years. */
export function addYearsClamped(date: Date, years: number): Date {
  return addMonthsClamped(date, years * 12);
}

/** Adds days in UTC. */
export function addDaysUtc(date: Date, days: number): Date {
  if (Number.isNaN(date.getTime())) return new Date(NaN);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

/** Computes whole calendar days from `from` to `to` in UTC. */
export function daysBetweenUtc(from: Date, to: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const fromUtc = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const toUtc = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((toUtc - fromUtc) / msPerDay);
}

// ---------------------------------------------------------------------------
// Jurisdiction Normalization
// ---------------------------------------------------------------------------

export type SupportedJurisdiction =
  | 'uae'
  | 'hong-kong'
  | 'singapore'
  | 'bahrain'
  | 'ireland'
  | 'bvi'
  | 'cayman';

export function normalizeJurisdiction(raw: string): SupportedJurisdiction {
  const s = (raw || '').toLowerCase().trim().replace(/_/g, '-');
  if (s.includes('uae') || s.includes('emirates') || s.includes('dubai')) return 'uae';
  if (s.includes('hong') || s.includes('hk')) return 'hong-kong';
  if (s.includes('sing') || s.includes('sg')) return 'singapore';
  if (s.includes('bahrain') || s.includes('bh')) return 'bahrain';
  if (s.includes('ireland') || s.includes('irish') || s === 'ie') return 'ireland';
  if (s.includes('cayman')) return 'cayman';
  if (s.includes('bvi') || s.includes('virgin')) return 'bvi';
  return 'uae'; // Default fallback
}

// ---------------------------------------------------------------------------
// Active Cycle Resolution Engine
// ---------------------------------------------------------------------------

/**
 * Resolves the active statutory deadline occurrence for a company relative to referenceDate.
 * - If past deadline occurred within the last 365 days and is not yet replaced by an imminent deadline (<= 30d),
 *   it returns the past deadline with negative days remaining (status: 'overdue').
 * - Otherwise returns the earliest upcoming deadline (status: 'due_soon' or 'upcoming').
 */
function resolveActiveOccurrence(
  candidateDeadlines: Date[],
  referenceDate: Date
): Date {
  if (candidateDeadlines.length === 0) return new Date(NaN);

  const validCandidates = candidateDeadlines.filter((d) => !Number.isNaN(d.getTime()));
  if (validCandidates.length === 0) return new Date(NaN);

  // If reference date is before or exactly on the very first candidate:
  if (daysBetweenUtc(referenceDate, validCandidates[0]) >= 0) {
    return validCandidates[0];
  }

  // Find the candidate closest to referenceDate
  for (let i = validCandidates.length - 1; i >= 0; i--) {
    const candidate = validCandidates[i];
    const diff = daysBetweenUtc(referenceDate, candidate);
    if (diff < 0) {
      const nextCandidate = validCandidates[i + 1];
      if (!nextCandidate) {
        return candidate;
      }
      const nextDiff = daysBetweenUtc(referenceDate, nextCandidate);
      // If overdue within 365 days and next cycle is still more than 30 days out, show overdue item
      if (diff >= -365 && nextDiff > 30) {
        return candidate;
      }
      return nextCandidate;
    }
  }

  return validCandidates[validCandidates.length - 1];
}

/** Parses fiscal year end month and day with fallback defaults. */
function resolveFiscalYearEnd(
  params: CalculateDeadlinesParams,
  jurisdiction: SupportedJurisdiction
): { month: number; day: number } {
  let month = params.fiscalYearEndMonth;
  let day = params.fiscalYearEndDay;

  if ((!month || !day) && params.fiscalYearEnd) {
    const parts = params.fiscalYearEnd.split('-');
    if (parts.length === 2) {
      const m = parseInt(parts[0], 10);
      const d = parseInt(parts[1], 10);
      if (!Number.isNaN(m) && m >= 1 && m <= 12) month = m;
      if (!Number.isNaN(d) && d >= 1 && d <= 31) day = d;
    }
  }

  if (!month) {
    month = 12; // Standard calendar year end
  }

  if (!day) {
    day = new Date(Date.UTC(2024, month, 0)).getUTCDate();
  }

  return { month, day };
}

/** Builds candidate annual fiscal year end dates from incorporation year to +4 years. */
function generateFiscalYearEnds(
  incDate: Date,
  fyeMonth: number,
  fyeDay: number,
  refDate: Date
): Date[] {
  const startYear = incDate.getUTCFullYear();
  const endYear = Math.max(startYear, refDate.getUTCFullYear()) + 4;
  const list: Date[] = [];

  for (let y = startYear; y <= endYear; y++) {
    const lastDayOfMonth = new Date(Date.UTC(y, fyeMonth, 0)).getUTCDate();
    const actualDay = Math.min(fyeDay, lastDayOfMonth);
    const fyeDate = new Date(Date.UTC(y, fyeMonth - 1, actualDay));
    // The first financial year must end on or after the incorporation date
    if (fyeDate >= incDate || list.length === 0) {
      list.push(fyeDate);
    }
  }
  return list;
}

// ---------------------------------------------------------------------------
// Main Statutory Deadlines Calculator
// ---------------------------------------------------------------------------

export function calculateStatutoryDeadlines(
  params: CalculateDeadlinesParams
): StatutoryDeadlineItem[] {
  const refDate = parseDateUtc(params.referenceDate) || new Date();
  const normalizedRefDate = Number.isNaN(refDate.getTime())
    ? new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()))
    : refDate;

  let incDate = parseDateUtc(params.incorporationDate);
  if (Number.isNaN(incDate.getTime())) {
    // Graceful fallback to 1 year before reference date
    incDate = addYearsClamped(normalizedRefDate, -1);
  }

  const jurisdiction = normalizeJurisdiction(params.jurisdiction);
  const { month: fyeMonth, day: fyeDay } = resolveFiscalYearEnd(params, jurisdiction);
  const fyeDates = generateFiscalYearEnds(incDate, fyeMonth, fyeDay, normalizedRefDate);

  const items: StatutoryDeadlineItem[] = [];

  // Helper to build a final item
  const buildItem = (
    id: string,
    title: string,
    category: ComplianceCategory,
    candidates: Date[],
    penaltyExplanation: string,
    filingAuthority: string,
    filingPortalUrl: string,
    description: string
  ) => {
    const chosenDate = resolveActiveOccurrence(candidates, normalizedRefDate);
    if (Number.isNaN(chosenDate.getTime())) return;

    const daysRemaining = daysBetweenUtc(normalizedRefDate, chosenDate);
    let status: DeadlineStatus = 'upcoming';
    if (daysRemaining < 0) {
      status = 'overdue';
    } else if (daysRemaining <= 30) {
      status = 'due_soon';
    } else {
      status = 'upcoming';
    }

    const deadlineIso = formatDateIso(chosenDate);

    items.push({
      id,
      title,
      requirement: title,
      category,
      deadlineDate: deadlineIso,
      daysRemaining,
      status,
      penaltyExplanation,
      filingAuthority,
      filingPortalUrl,
      description,
    });
  };

  // -------------------------------------------------------------------------
  // 1. UAE
  // -------------------------------------------------------------------------
  if (jurisdiction === 'uae') {
    // Trade License Annual Renewal (12 months post-incorporation anniversary)
    const licenseCandidates: Date[] = [];
    for (let k = 1; k <= 6; k++) {
      licenseCandidates.push(addYearsClamped(incDate, k));
    }
    buildItem(
      'uae-trade-license-renewal',
      'Trade License & Establishment Card Annual Renewal',
      'license',
      licenseCandidates,
      'Late renewal penalty of AED 200–500 per month, bank account freeze, and visa quota block.',
      'Department of Economic Development (DED) / Freezone Authority',
      'https://ded.ae',
      'Statutory annual renewal of commercial trade license and immigration establishment card.'
    );

    // Corporate Tax Return (9 months post fiscal year end)
    const ctCandidates = fyeDates.map((fye) => addMonthsClamped(fye, 9));
    buildItem(
      'uae-corporate-tax-return',
      'Corporate Tax Return & Payment (Form CT)',
      'tax',
      ctCandidates,
      'AED 10,000 for failure to submit return on time, plus 14% p.a. monthly late payment interest.',
      'Federal Tax Authority (FTA)',
      'https://eservices.tax.gov.ae',
      'Mandatory corporate tax declaration within 9 months following the end of the financial year.'
    );

    // Economic Substance Regulations (ESR) Notification (within 6 months post FYE)
    const esrNotifCandidates = fyeDates.map((fye) => addMonthsClamped(fye, 6));
    buildItem(
      'uae-esr-notification',
      'Economic Substance Regulations (ESR) Notification',
      'esr',
      esrNotifCandidates,
      'AED 20,000 penalty for failure to submit statutory ESR notification.',
      'Ministry of Finance (MoF)',
      'https://mof.gov.ae',
      'Annual regulatory notification confirming whether licensee conducted a Relevant Activity.'
    );

    // ESR Annual Report (within 12 months post FYE)
    const esrReportCandidates = fyeDates.map((fye) => addMonthsClamped(fye, 12));
    buildItem(
      'uae-esr-report',
      'Economic Substance Regulations (ESR) Annual Report',
      'esr',
      esrReportCandidates,
      'AED 50,000 fine for first year non-filing, escalating to AED 400,000 for repeated failure.',
      'Ministry of Finance (MoF)',
      'https://mof.gov.ae',
      'Detailed economic substance reporting demonstrating core income generating activities.'
    );

    // VAT Return (Quarterly, 28th day following period end) if registered
    if (params.isVatRegistered) {
      const vatCandidates: Date[] = [];
      const startYear = Math.min(incDate.getUTCFullYear(), normalizedRefDate.getUTCFullYear());
      const endYear = Math.max(incDate.getUTCFullYear(), normalizedRefDate.getUTCFullYear()) + 2;
      for (let y = startYear; y <= endYear; y++) {
        vatCandidates.push(new Date(Date.UTC(y, 3, 28))); // April 28 (Q1: Jan-Mar)
        vatCandidates.push(new Date(Date.UTC(y, 6, 28))); // July 28 (Q2: Apr-Jun)
        vatCandidates.push(new Date(Date.UTC(y, 9, 28))); // Oct 28 (Q3: Jul-Sep)
        vatCandidates.push(new Date(Date.UTC(y + 1, 0, 28))); // Jan 28 (Q4: Oct-Dec)
      }
      vatCandidates.sort((a, b) => a.getTime() - b.getTime());
      buildItem(
        'uae-vat-return',
        'Value Added Tax (VAT) Periodic Return',
        'vat',
        vatCandidates,
        'AED 1,000 for first late filing, AED 2,000 for repeat late filing, plus up to 300% tax penalty.',
        'Federal Tax Authority (FTA)',
        'https://eservices.tax.gov.ae',
        'Quarterly VAT declaration and tax remittance due on the 28th day following tax period.'
      );
    }
  }

  // -------------------------------------------------------------------------
  // 2. Hong Kong
  // -------------------------------------------------------------------------
  else if (jurisdiction === 'hong-kong') {
    // Annual Return (NAR1) - within 42 days of incorporation anniversary
    const nar1Candidates: Date[] = [];
    for (let k = 1; k <= 6; k++) {
      const anniversary = addYearsClamped(incDate, k);
      nar1Candidates.push(addDaysUtc(anniversary, 42));
    }
    buildItem(
      'hk-annual-return-nar1',
      'Companies Registry Annual Return (Form NAR1)',
      'annual_return',
      nar1Candidates,
      'Escalating registration fee from HK$105 to HK$3,480, plus daily default fine of HK$700.',
      'Companies Registry (CR)',
      'https://www.e-services.cr.gov.hk',
      'Mandatory annual statutory return lodging corporate particulars within 42 days of anniversary.'
    );

    // Business Registration Certificate (BRC) Renewal (anniversary of incorporation)
    const brcCandidates: Date[] = [];
    for (let k = 1; k <= 6; k++) {
      brcCandidates.push(addYearsClamped(incDate, k));
    }
    buildItem(
      'hk-brc-renewal',
      'Business Registration Certificate (BRC) Renewal',
      'license',
      brcCandidates,
      'Fine of up to HK$5,000 and imprisonment for 1 year under Section 21 of the BRO.',
      'Inland Revenue Department (BRO)',
      'https://www.gov.hk/en/residents/taxes/etax/services/brc.htm',
      'Annual renewal of statutory Business Registration Certificate with the Inland Revenue.'
    );

    // Profits Tax Return (BIR51/BIR52) - 1st return 18 months post-inc, subsequent annually
    const birCandidates: Date[] = [];
    const firstBir = addMonthsClamped(incDate, 18);
    birCandidates.push(firstBir);
    for (let k = 1; k <= 5; k++) {
      birCandidates.push(addYearsClamped(firstBir, k));
    }
    buildItem(
      'hk-profits-tax-bir51',
      'Profits Tax Return (BIR51 / BIR52)',
      'tax',
      birCandidates,
      'Level 3 fine (HK$10,000) under Section 80(2) of IRO, court summons, and triple undercharged tax.',
      'Inland Revenue Department (IRD)',
      'https://www.ird.gov.hk',
      'Profits tax declaration and certified audited financial statements submitted to the IRD.'
    );
  }

  // -------------------------------------------------------------------------
  // 3. Singapore
  // -------------------------------------------------------------------------
  else if (jurisdiction === 'singapore') {
    // Estimated Chargeable Income (ECI) - within 3 months of FYE
    const eciCandidates = fyeDates.map((fye) => addMonthsClamped(fye, 3));
    buildItem(
      'sg-eci-filing',
      'Estimated Chargeable Income (ECI) Filing',
      'tax',
      eciCandidates,
      'Estimated Notice of Assessment issued by IRAS with complete loss of tax installment privileges.',
      'Inland Revenue Authority of Singapore (IRAS)',
      'https://mytax.iras.gov.sg',
      'Mandatory declaration of estimated taxable profits within 3 months of financial year end.'
    );

    // Annual Return & AGM Lodgement (within 6 to 7 months post FYE)
    const arCandidates = fyeDates.map((fye) => addMonthsClamped(fye, 7));
    buildItem(
      'sg-acra-annual-return',
      'ACRA Annual Return & AGM Lodgement',
      'annual_return',
      arCandidates,
      'Late lodgement fee of S$300 to S$600, plus potential disqualification of company directors.',
      'Accounting and Corporate Regulatory Authority (ACRA)',
      'https://www.bizfile.gov.sg',
      'Lodgement of financial statements and holding of Annual General Meeting via BizFile+.'
    );

    // Corporate Income Tax (Form C / Form C-S) - Nov 30 of Year of Assessment
    const citCandidates = fyeDates.map((fye) => {
      const ya = fye.getUTCFullYear() + 1;
      return new Date(Date.UTC(ya, 10, 30)); // Nov 30
    });
    buildItem(
      'sg-corporate-tax-form-c',
      'Corporate Income Tax Return (Form C / C-S)',
      'tax',
      citCandidates,
      'Fines up to S$5,000 under Section 94 of Income Tax Act, plus 5% late payment penalty.',
      'Inland Revenue Authority of Singapore (IRAS)',
      'https://mytax.iras.gov.sg',
      'Final corporate tax return and tax computation for the relevant Year of Assessment.'
    );

    // GST Return (Quarterly, 1 month post period end) if registered
    if (params.isVatRegistered) {
      const gstCandidates: Date[] = [];
      const startYear = Math.min(incDate.getUTCFullYear(), normalizedRefDate.getUTCFullYear());
      const endYear = Math.max(incDate.getUTCFullYear(), normalizedRefDate.getUTCFullYear()) + 2;
      for (let y = startYear; y <= endYear; y++) {
        gstCandidates.push(new Date(Date.UTC(y, 3, 30))); // April 30
        gstCandidates.push(new Date(Date.UTC(y, 6, 31))); // July 31
        gstCandidates.push(new Date(Date.UTC(y, 9, 31))); // Oct 31
        gstCandidates.push(new Date(Date.UTC(y + 1, 0, 31))); // Jan 31
      }
      gstCandidates.sort((a, b) => a.getTime() - b.getTime());
      buildItem(
        'sg-gst-return',
        'Goods and Services Tax (GST F5) Return',
        'vat',
        gstCandidates,
        '5% late payment penalty plus S$200 monthly penalty for late submission up to S$10,000.',
        'Inland Revenue Authority of Singapore (IRAS)',
        'https://mytax.iras.gov.sg',
        'Quarterly GST return and tax remittance due 1 month after prescribed accounting period.'
      );
    }
  }

  // -------------------------------------------------------------------------
  // 4. Bahrain
  // -------------------------------------------------------------------------
  else if (jurisdiction === 'bahrain') {
    // Commercial Registration (CR) Annual Renewal (12 months post incorporation)
    const crCandidates: Date[] = [];
    for (let k = 1; k <= 6; k++) {
      crCandidates.push(addYearsClamped(incDate, k));
    }
    buildItem(
      'bh-cr-renewal',
      'Commercial Registration (CR) Annual Renewal',
      'license',
      crCandidates,
      'Administrative fines, suspension of CR, bank account freeze, and labor service blocks.',
      'Ministry of Industry and Commerce (MOIC) / Sijilat',
      'https://www.sijilat.bh',
      'Annual renewal of statutory commercial registration and municipal commercial activity fees.'
    );

    // ESR Return (within 3 months of FYE)
    const bhEsrCandidates = fyeDates.map((fye) => addMonthsClamped(fye, 3));
    buildItem(
      'bh-esr-return',
      'Economic Substance Regulations (ESR) Annual Return',
      'esr',
      bhEsrCandidates,
      'Administrative fines between BHD 1,000 and BHD 100,000, CR suspension, and strike-off.',
      'Ministry of Industry and Commerce (MOIC)',
      'https://www.moic.gov.bh',
      'Annual ESR compliance filing declaring genuine economic substance within Bahrain.'
    );

    // Corporate Tax / Nil Exemption Filing (within 4 months of FYE)
    const bhCtCandidates = fyeDates.map((fye) => addMonthsClamped(fye, 4));
    buildItem(
      'bh-corporate-tax-return',
      'Corporate Tax / Nil Exemption Filing',
      'tax',
      bhCtCandidates,
      'Late filing penalty of 1% per month of unpaid tax (minimum BHD 500).',
      'National Bureau for Revenue (NBR)',
      'https://www.nbr.gov.bh',
      'Annual corporate tax or nil declaration return submitted to the National Bureau for Revenue.'
    );

    // VAT Return (Quarterly, last day of month following quarter) if registered
    if (params.isVatRegistered) {
      const bhVatCandidates: Date[] = [];
      const startYear = Math.min(incDate.getUTCFullYear(), normalizedRefDate.getUTCFullYear());
      const endYear = Math.max(incDate.getUTCFullYear(), normalizedRefDate.getUTCFullYear()) + 2;
      for (let y = startYear; y <= endYear; y++) {
        bhVatCandidates.push(new Date(Date.UTC(y, 3, 30))); // April 30
        bhVatCandidates.push(new Date(Date.UTC(y, 6, 31))); // July 31
        bhVatCandidates.push(new Date(Date.UTC(y, 9, 31))); // Oct 31
        bhVatCandidates.push(new Date(Date.UTC(y + 1, 0, 31))); // Jan 31
      }
      bhVatCandidates.sort((a, b) => a.getTime() - b.getTime());
      buildItem(
        'bh-vat-return',
        'Value Added Tax (VAT) Periodic Return',
        'vat',
        bhVatCandidates,
        '5% to 25% unpaid tax fine, plus submission delay fines from BHD 500 to BHD 5,000.',
        'National Bureau for Revenue (NBR)',
        'https://www.nbr.gov.bh',
        'Periodic VAT return and payment due by the end of the month following the tax period.'
      );
    }
  }

  // -------------------------------------------------------------------------
  // 5. Ireland
  // -------------------------------------------------------------------------
  else if (jurisdiction === 'ireland') {
    // Annual Return (Form B1) - First ARD 6 months post-inc + 28 days, subsequent annually
    const b1Candidates: Date[] = [];
    const firstArd = addMonthsClamped(incDate, 6);
    const firstB1 = addDaysUtc(firstArd, 28);
    b1Candidates.push(firstB1);
    for (let k = 1; k <= 5; k++) {
      const subArd = addYearsClamped(firstArd, k);
      b1Candidates.push(addDaysUtc(subArd, 28));
    }
    buildItem(
      'ie-annual-return-b1',
      'Companies Registration Office (CRO) Annual Return (B1)',
      'annual_return',
      b1Candidates,
      'Immediate €100 late filing penalty + €3/day (up to €1,200) and loss of audit exemption for 2 years.',
      'Companies Registration Office (CRO)',
      'https://core.cro.ie',
      'Statutory Annual Return (B1) filing with CRO to maintain company in good standing.'
    );

    // Corporation Tax Return (CT1) - 23rd day of 9th month post accounting period end
    const ct1Candidates = fyeDates.map((fye) => {
      const targetDate = addMonthsClamped(fye, 9);
      return new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), 23));
    });
    buildItem(
      'ie-corporation-tax-ct1',
      'Corporation Tax Return & Payment (CT1)',
      'tax',
      ct1Candidates,
      '5% surcharge if within 2 months (max €12,695), 10% thereafter (max €63,485) plus 0.0219%/day interest.',
      'Revenue Commissioners (ROS)',
      'https://www.ros.ie',
      'Corporation tax return and self-assessment submitted electronically through ROS.'
    );

    // VAT3 Return (Bi-monthly, 23rd of following month) if registered
    if (params.isVatRegistered) {
      const vat3Candidates: Date[] = [];
      const startYear = Math.min(incDate.getUTCFullYear(), normalizedRefDate.getUTCFullYear());
      const endYear = Math.max(incDate.getUTCFullYear(), normalizedRefDate.getUTCFullYear()) + 2;
      for (let y = startYear; y <= endYear; y++) {
        vat3Candidates.push(new Date(Date.UTC(y, 2, 23))); // Mar 23 (Jan-Feb)
        vat3Candidates.push(new Date(Date.UTC(y, 4, 23))); // May 23 (Mar-Apr)
        vat3Candidates.push(new Date(Date.UTC(y, 6, 23))); // Jul 23 (May-Jun)
        vat3Candidates.push(new Date(Date.UTC(y, 8, 23))); // Sep 23 (Jul-Aug)
        vat3Candidates.push(new Date(Date.UTC(y, 10, 23))); // Nov 23 (Sep-Oct)
        vat3Candidates.push(new Date(Date.UTC(y + 1, 0, 23))); // Jan 23 (Nov-Dec)
      }
      vat3Candidates.sort((a, b) => a.getTime() - b.getTime());
      buildItem(
        'ie-vat3-return',
        'Value Added Tax (VAT3) Bi-Monthly Return',
        'vat',
        vat3Candidates,
        'Fixed €4,000 penalty under Section 115 of VATCA 2010 plus interest on overdue balance.',
        'Revenue Commissioners (ROS)',
        'https://www.ros.ie',
        'Bi-monthly VAT return and balancing payment due on the 23rd of the following month.'
      );
    }
  }

  // -------------------------------------------------------------------------
  // 6. BVI & Cayman
  // -------------------------------------------------------------------------
  else {
    const isCayman = jurisdiction === 'cayman';

    if (isCayman) {
      // Cayman Islands Annual Return & Fee (Jan 31 of year following incorporation)
      const caymanArCandidates: Date[] = [];
      const startYear = incDate.getUTCFullYear() + 1;
      for (let y = startYear; y <= startYear + 5; y++) {
        caymanArCandidates.push(new Date(Date.UTC(y, 0, 31)));
      }
      buildItem(
        'cayman-annual-return-fee',
        'Cayman Islands Annual Return & Government Fee',
        'annual_return',
        caymanArCandidates,
        'Late penalties: 33% from Apr 1, 66% from Jul 1, 100% from Oct 1, leading to strike-off.',
        'General Registry of the Cayman Islands',
        'https://www.ciregistry.ky',
        'Annual return filing and government registry fee to maintain corporate active standing.'
      );
    } else {
      // BVI Annual Government Fee (May 31 for H1 inc, Nov 30 for H2 inc)
      const bviCandidates: Date[] = [];
      const startYear = incDate.getUTCFullYear() + 1;
      const isFirstHalf = incDate.getUTCMonth() < 6; // Jan-Jun
      for (let y = startYear; y <= startYear + 5; y++) {
        if (isFirstHalf) {
          bviCandidates.push(new Date(Date.UTC(y, 4, 31))); // May 31
        } else {
          bviCandidates.push(new Date(Date.UTC(y, 10, 30))); // Nov 30
        }
      }
      buildItem(
        'bvi-annual-registry-fee',
        'BVI FSC Annual Government Registry Fee',
        'annual_return',
        bviCandidates,
        '10% penalty within 2 months, 50% penalty thereafter, leading to administrative strike-off.',
        'BVI Financial Services Commission (FSC)',
        'https://www.bvifsc.vg',
        'Annual statutory renewal and registry maintenance fee remitted to BVI FSC.'
      );
    }

    // Economic Substance (ES) Return (within 6 months of FYE)
    const esReturnCandidates = fyeDates.map((fye) => addMonthsClamped(fye, 6));
    buildItem(
      isCayman ? 'cayman-es-return' : 'bvi-es-return',
      'Economic Substance (ES) Annual Declaration',
      'esr',
      esReturnCandidates,
      'Statutory fines from US$5,000 to US$50,000 and potential court strike-off from register.',
      isCayman ? 'Department for International Tax Cooperation (DITC)' : 'International Tax Authority (ITA)',
      isCayman ? 'https://www.ditc.ky' : 'https://www.bviita.vg',
      'Mandatory annual economic substance declaration confirming business activities and substance.'
    );

    // Annual Financial Return to Registered Agent (within 9 months of FYE)
    const finReturnCandidates = fyeDates.map((fye) => addMonthsClamped(fye, 9));
    buildItem(
      isCayman ? 'cayman-financial-records' : 'bvi-annual-financial-return',
      'Annual Financial Return to Registered Agent',
      'tax',
      finReturnCandidates,
      'US$300 for first month of late submission and US$200/month thereafter up to US$5,000.',
      'Registered Agent & Regulatory Commission',
      isCayman ? 'https://www.ciregistry.ky' : 'https://www.bvifsc.vg',
      'Mandatory submission of annual financial return / balance sheet to the licensed registered agent.'
    );
  }

  // Sort deadlines by date ascending
  items.sort((a, b) => a.deadlineDate.localeCompare(b.deadlineDate));

  return items;
}

// ---------------------------------------------------------------------------
// Compliance Summary Engine
// ---------------------------------------------------------------------------

export function getComplianceSummary(
  deadlines: StatutoryDeadlineItem[]
): ComplianceSummary {
  const total = deadlines.length;
  const overdue = deadlines.filter((d) => d.status === 'overdue').length;
  const dueSoon = deadlines.filter((d) => d.status === 'due_soon').length;
  const upcoming = deadlines.filter((d) => d.status === 'upcoming').length;

  // Next deadline priority:
  // 1. Closest upcoming or due_soon (daysRemaining >= 0, lowest daysRemaining)
  // 2. If all are overdue, the most recently overdue one (highest negative daysRemaining)
  const pendingOrUpcoming = deadlines
    .filter((d) => d.daysRemaining >= 0)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const nextDeadline = pendingOrUpcoming.length > 0
    ? pendingOrUpcoming[0]
    : (deadlines.length > 0
        ? [...deadlines].sort((a, b) => b.daysRemaining - a.daysRemaining)[0]
        : null);

  let overallStatus: 'compliant' | 'action_required' | 'critical' = 'compliant';
  if (overdue > 0) {
    overallStatus = 'critical';
  } else if (dueSoon > 0) {
    overallStatus = 'action_required';
  }

  return {
    total,
    overdue,
    dueSoon,
    upcoming,
    nextDeadline,
    overallStatus,
  };
}
