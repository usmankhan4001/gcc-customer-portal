import { describe, expect, it } from 'vitest';
import {
  addDaysUtc,
  addMonthsClamped,
  addYearsClamped,
  calculateStatutoryDeadlines,
  daysBetweenUtc,
  formatDateIso,
  getComplianceSummary,
  normalizeJurisdiction,
  parseDateUtc,
} from './stateful-calendar';

describe('Date Math Utilities & Leap Years (AC3)', () => {
  it('parses valid UTC date strings and Dates correctly', () => {
    const d1 = parseDateUtc('2025-05-15');
    expect(formatDateIso(d1)).toBe('2025-05-15');

    const d2 = parseDateUtc(new Date(Date.UTC(2025, 4, 15)));
    expect(formatDateIso(d2)).toBe('2025-05-15');

    const d3 = parseDateUtc('invalid-date');
    expect(Number.isNaN(d3.getTime())).toBe(true);
    expect(formatDateIso(d3)).toBe('');
  });

  it('correctly handles month additions and clamps to month ends including leap years', () => {
    // Jan 31 in leap year 2024 + 1 month = Feb 29, 2024
    const leapJan = new Date(Date.UTC(2024, 0, 31));
    expect(formatDateIso(addMonthsClamped(leapJan, 1))).toBe('2024-02-29');

    // Jan 31 in non-leap year 2025 + 1 month = Feb 28, 2025
    const nonLeapJan = new Date(Date.UTC(2025, 0, 31));
    expect(formatDateIso(addMonthsClamped(nonLeapJan, 1))).toBe('2025-02-28');

    // Leap day Feb 29, 2024 + 1 year = Feb 28, 2025
    const leapDay = new Date(Date.UTC(2024, 1, 29));
    expect(formatDateIso(addYearsClamped(leapDay, 1))).toBe('2025-02-28');

    // Leap day Feb 29, 2024 + 4 years = Feb 29, 2028 (next leap year)
    expect(formatDateIso(addYearsClamped(leapDay, 4))).toBe('2028-02-29');

    // Aug 31 + 1 month = Sep 30
    const aug31 = new Date(Date.UTC(2025, 7, 31));
    expect(formatDateIso(addMonthsClamped(aug31, 1))).toBe('2025-09-30');
  });

  it('correctly calculates whole days between UTC dates', () => {
    const d1 = new Date(Date.UTC(2025, 0, 1));
    const d2 = new Date(Date.UTC(2025, 0, 31));
    expect(daysBetweenUtc(d1, d2)).toBe(30);
    expect(daysBetweenUtc(d2, d1)).toBe(-30);
    expect(daysBetweenUtc(d1, d1)).toBe(0);
  });
});

describe('Jurisdiction Normalization', () => {
  it('normalizes common variants of jurisdiction names', () => {
    expect(normalizeJurisdiction('UAE')).toBe('uae');
    expect(normalizeJurisdiction('United Arab Emirates')).toBe('uae');
    expect(normalizeJurisdiction('Dubai')).toBe('uae');
    expect(normalizeJurisdiction('hong-kong')).toBe('hong-kong');
    expect(normalizeJurisdiction('hong_kong')).toBe('hong-kong');
    expect(normalizeJurisdiction('HK')).toBe('hong-kong');
    expect(normalizeJurisdiction('Singapore')).toBe('singapore');
    expect(normalizeJurisdiction('SG')).toBe('singapore');
    expect(normalizeJurisdiction('Bahrain')).toBe('bahrain');
    expect(normalizeJurisdiction('Ireland')).toBe('ireland');
    expect(normalizeJurisdiction('IE')).toBe('ireland');
    expect(normalizeJurisdiction('BVI')).toBe('bvi');
    expect(normalizeJurisdiction('Cayman Islands')).toBe('cayman');
    expect(normalizeJurisdiction('unknown-country')).toBe('uae'); // fallback
  });
});

describe('AC1: Statutory Calculations Across All 6 Jurisdictions', () => {
  // 1. UAE
  it('computes UAE deadlines (Trade License, Corporate Tax, ESR Notification & Report)', () => {
    const deadlines = calculateStatutoryDeadlines({
      jurisdiction: 'uae',
      incorporationDate: '2024-03-15',
      fiscalYearEnd: '12-31',
      referenceDate: '2025-01-15',
      isVatRegistered: false,
    });

    const ids = deadlines.map((d) => d.id);
    expect(ids).toContain('uae-trade-license-renewal');
    expect(ids).toContain('uae-corporate-tax-return');
    expect(ids).toContain('uae-esr-notification');
    expect(ids).toContain('uae-esr-report');

    // License renewal: 12 months from inc = 2025-03-15
    const license = deadlines.find((d) => d.id === 'uae-trade-license-renewal')!;
    expect(license.deadlineDate).toBe('2025-03-15');
    expect(license.filingAuthority).toContain('Department of Economic Development');
    expect(license.filingPortalUrl).toBe('https://ded.ae');

    // Corporate tax: 9 months post FYE 2024-12-31 = 2025-09-30
    const ct = deadlines.find((d) => d.id === 'uae-corporate-tax-return')!;
    expect(ct.deadlineDate).toBe('2025-09-30');
    expect(ct.filingAuthority).toContain('Federal Tax Authority');
    expect(ct.penaltyExplanation).toContain('AED 10,000');

    // ESR Notification: 6 months post FYE = 2025-06-30
    const esrNotif = deadlines.find((d) => d.id === 'uae-esr-notification')!;
    expect(esrNotif.deadlineDate).toBe('2025-06-30');

    // ESR Report: 12 months post FYE = 2025-12-31
    const esrReport = deadlines.find((d) => d.id === 'uae-esr-report')!;
    expect(esrReport.deadlineDate).toBe('2025-12-31');
  });

  // 2. Hong Kong
  it('computes Hong Kong statutory deadlines (NAR1, BRC, BIR51)', () => {
    const deadlines = calculateStatutoryDeadlines({
      jurisdiction: 'hong-kong',
      incorporationDate: '2024-05-10',
      fiscalYearEnd: '03-31',
      referenceDate: '2025-04-01',
    });

    const nar1 = deadlines.find((d) => d.id === 'hk-annual-return-nar1')!;
    const brc = deadlines.find((d) => d.id === 'hk-brc-renewal')!;
    const bir = deadlines.find((d) => d.id === 'hk-profits-tax-bir51')!;

    expect(nar1).toBeDefined();
    expect(brc).toBeDefined();
    expect(bir).toBeDefined();

    // BRC is anniversary: 2025-05-10
    expect(brc.deadlineDate).toBe('2025-05-10');
    // NAR1 is anniversary + 42 days: 2025-05-10 + 42d = 2025-06-21
    expect(nar1.deadlineDate).toBe('2025-06-21');
    expect(nar1.filingAuthority).toBe('Companies Registry (CR)');
    expect(nar1.filingPortalUrl).toBe('https://www.e-services.cr.gov.hk');

    // First BIR51: 18 months post inc: 2024-05-10 + 18m = 2025-11-10
    expect(bir.deadlineDate).toBe('2025-11-10');
    expect(bir.penaltyExplanation).toContain('HK$10,000');
  });

  // 3. Singapore
  it('computes Singapore statutory deadlines (ECI, Form C/C-S, ACRA Annual Return)', () => {
    const deadlines = calculateStatutoryDeadlines({
      jurisdiction: 'singapore',
      incorporationDate: '2024-01-10',
      fiscalYearEnd: '12-31',
      referenceDate: '2025-01-15',
    });

    const eci = deadlines.find((d) => d.id === 'sg-eci-filing')!;
    const ar = deadlines.find((d) => d.id === 'sg-acra-annual-return')!;
    const cit = deadlines.find((d) => d.id === 'sg-corporate-tax-form-c')!;

    // ECI: 3 months post FYE 2024-12-31 = 2025-03-31
    expect(eci.deadlineDate).toBe('2025-03-31');
    expect(eci.filingAuthority).toContain('Inland Revenue Authority of Singapore');

    // AR: 7 months post FYE 2024-12-31 = 2025-07-31
    expect(ar.deadlineDate).toBe('2025-07-31');
    expect(ar.filingAuthority).toContain('ACRA');

    // Form C: Nov 30 of YA 2025 = 2025-11-30
    expect(cit.deadlineDate).toBe('2025-11-30');
  });

  // 4. Bahrain
  it('computes Bahrain statutory deadlines (CR Renewal, ESR Return, Corporate Tax/Nil)', () => {
    const deadlines = calculateStatutoryDeadlines({
      jurisdiction: 'bahrain',
      incorporationDate: '2024-04-20',
      fiscalYearEnd: '12-31',
      referenceDate: '2025-02-01',
    });

    const cr = deadlines.find((d) => d.id === 'bh-cr-renewal')!;
    const esr = deadlines.find((d) => d.id === 'bh-esr-return')!;
    const ct = deadlines.find((d) => d.id === 'bh-corporate-tax-return')!;

    // CR renewal: 12 months post inc = 2025-04-20
    expect(cr.deadlineDate).toBe('2025-04-20');
    expect(cr.filingPortalUrl).toBe('https://www.sijilat.bh');

    // ESR: 3 months post FYE 2024-12-31 = 2025-03-31
    expect(esr.deadlineDate).toBe('2025-03-31');

    // CT / Nil: 4 months post FYE 2024-12-31 = 2025-04-30
    expect(ct.deadlineDate).toBe('2025-04-30');
    expect(ct.filingAuthority).toContain('National Bureau for Revenue');
  });

  // 5. Ireland
  it('computes Ireland statutory deadlines (B1 Annual Return, CT1 Corporation Tax)', () => {
    const deadlines = calculateStatutoryDeadlines({
      jurisdiction: 'ireland',
      incorporationDate: '2024-02-01',
      fiscalYearEnd: '12-31',
      referenceDate: '2024-07-15', // 1.5 months before first ARD
    });

    const b1 = deadlines.find((d) => d.id === 'ie-annual-return-b1')!;
    const ct1 = deadlines.find((d) => d.id === 'ie-corporation-tax-ct1')!;

    // First ARD is 6 months post inc = 2024-08-01. Filing deadline + 28 days = 2024-08-29.
    expect(b1.deadlineDate).toBe('2024-08-29');
    expect(b1.daysRemaining).toBe(45);
    expect(b1.status).toBe('upcoming');
    expect(b1.filingPortalUrl).toBe('https://core.cro.ie');
    expect(b1.penaltyExplanation).toContain('€100 late filing penalty');

    // CT1: 23rd day of 9th month post FYE 2024-12-31 = 2025-09-23
    expect(ct1.deadlineDate).toBe('2025-09-23');
    expect(ct1.filingPortalUrl).toBe('https://www.ros.ie');

    // If referenceDate is past the first ARD (e.g. 2024-09-15), B1 becomes overdue
    const overdueDeadlines = calculateStatutoryDeadlines({
      jurisdiction: 'ireland',
      incorporationDate: '2024-02-01',
      fiscalYearEnd: '12-31',
      referenceDate: '2024-09-15',
    });
    const overdueB1 = overdueDeadlines.find((d) => d.id === 'ie-annual-return-b1')!;
    expect(overdueB1.status).toBe('overdue');
    expect(overdueB1.daysRemaining).toBe(-17);
  });

  // 6. BVI & Cayman
  it('computes BVI statutory deadlines with H1 vs H2 incorporation dates', () => {
    // H1 (March): May 31
    const bviH1 = calculateStatutoryDeadlines({
      jurisdiction: 'bvi',
      incorporationDate: '2024-03-10',
      referenceDate: '2025-01-15',
    });
    const feeH1 = bviH1.find((d) => d.id === 'bvi-annual-registry-fee')!;
    expect(feeH1.deadlineDate).toBe('2025-05-31');

    // H2 (August): November 30
    const bviH2 = calculateStatutoryDeadlines({
      jurisdiction: 'bvi',
      incorporationDate: '2024-08-10',
      referenceDate: '2025-01-15',
    });
    const feeH2 = bviH2.find((d) => d.id === 'bvi-annual-registry-fee')!;
    expect(feeH2.deadlineDate).toBe('2025-11-30');
  });

  it('computes Cayman Islands statutory deadlines (Jan 31 Annual Return & Fee)', () => {
    const cayman = calculateStatutoryDeadlines({
      jurisdiction: 'cayman',
      incorporationDate: '2024-06-15',
      referenceDate: '2025-01-10',
    });
    const fee = cayman.find((d) => d.id === 'cayman-annual-return-fee')!;
    expect(fee.deadlineDate).toBe('2025-01-31');
    expect(fee.filingPortalUrl).toBe('https://www.ciregistry.ky');
  });
});

describe('AC2: Status Categorization & Boundary Days', () => {
  const incDate = '2024-06-15';
  // With UAE trade license, 1st renewal is 2025-06-15.

  it('marks deadline as "due_soon" when exactly 0 days remaining (due today)', () => {
    const deadlines = calculateStatutoryDeadlines({
      jurisdiction: 'uae',
      incorporationDate: incDate,
      referenceDate: '2025-06-15', // exactly on the deadline
    });
    const license = deadlines.find((d) => d.id === 'uae-trade-license-renewal')!;
    expect(license.daysRemaining).toBe(0);
    expect(license.status).toBe('due_soon');
  });

  it('marks deadline as "due_soon" when exactly 1 day remaining', () => {
    const deadlines = calculateStatutoryDeadlines({
      jurisdiction: 'uae',
      incorporationDate: incDate,
      referenceDate: '2025-06-14',
    });
    const license = deadlines.find((d) => d.id === 'uae-trade-license-renewal')!;
    expect(license.daysRemaining).toBe(1);
    expect(license.status).toBe('due_soon');
  });

  it('marks deadline as "due_soon" at upper boundary (30 days remaining)', () => {
    // 30 days before 2025-06-15 is 2025-05-16
    const deadlines = calculateStatutoryDeadlines({
      jurisdiction: 'uae',
      incorporationDate: incDate,
      referenceDate: '2025-05-16',
    });
    const license = deadlines.find((d) => d.id === 'uae-trade-license-renewal')!;
    expect(license.daysRemaining).toBe(30);
    expect(license.status).toBe('due_soon');
  });

  it('marks deadline as "upcoming" at 31 days remaining', () => {
    // 31 days before 2025-06-15 is 2025-05-15
    const deadlines = calculateStatutoryDeadlines({
      jurisdiction: 'uae',
      incorporationDate: incDate,
      referenceDate: '2025-05-15',
    });
    const license = deadlines.find((d) => d.id === 'uae-trade-license-renewal')!;
    expect(license.daysRemaining).toBe(31);
    expect(license.status).toBe('upcoming');
  });

  it('marks deadline as "overdue" when 1 day past deadline (-1 day)', () => {
    const deadlines = calculateStatutoryDeadlines({
      jurisdiction: 'uae',
      incorporationDate: incDate,
      referenceDate: '2025-06-16',
    });
    const license = deadlines.find((d) => d.id === 'uae-trade-license-renewal')!;
    expect(license.daysRemaining).toBe(-1);
    expect(license.status).toBe('overdue');
  });

  it('marks deadline as "overdue" when 15 days past deadline (-15 days)', () => {
    const deadlines = calculateStatutoryDeadlines({
      jurisdiction: 'uae',
      incorporationDate: incDate,
      referenceDate: '2025-06-30',
    });
    const license = deadlines.find((d) => d.id === 'uae-trade-license-renewal')!;
    expect(license.daysRemaining).toBe(-15);
    expect(license.status).toBe('overdue');
  });
});

describe('Fiscal Year Alignments & Non-Calendar Alignments', () => {
  it('correctly shifts Corporate Tax deadline with March 31 FYE (due Dec 31)', () => {
    const deadlines = calculateStatutoryDeadlines({
      jurisdiction: 'uae',
      incorporationDate: '2024-01-10',
      fiscalYearEnd: '03-31',
      referenceDate: '2024-06-01',
    });
    // First FYE on or after inc is 2024-03-31, +9 months = 2024-12-31
    const ct = deadlines.find((d) => d.id === 'uae-corporate-tax-return')!;
    expect(ct.deadlineDate).toBe('2024-12-31');
  });

  it('correctly shifts Corporate Tax deadline with June 30 FYE (due March 31 next year)', () => {
    const deadlines = calculateStatutoryDeadlines({
      jurisdiction: 'uae',
      incorporationDate: '2024-01-10',
      fiscalYearEndMonth: 6,
      fiscalYearEndDay: 30,
      referenceDate: '2024-07-01',
    });
    // FYE 2024-06-30, +9 months = 2025-03-31
    const ct = deadlines.find((d) => d.id === 'uae-corporate-tax-return')!;
    expect(ct.deadlineDate).toBe('2025-03-31');
  });
});

describe('VAT Registration Toggle Across Jurisdictions', () => {
  it('omits VAT return when isVatRegistered is false or omitted', () => {
    const withoutVat = calculateStatutoryDeadlines({
      jurisdiction: 'uae',
      incorporationDate: '2024-01-10',
      isVatRegistered: false,
    });
    expect(withoutVat.some((d) => d.category === 'vat')).toBe(false);
  });

  it('includes quarterly VAT return in UAE when isVatRegistered is true', () => {
    const withVat = calculateStatutoryDeadlines({
      jurisdiction: 'uae',
      incorporationDate: '2024-01-10',
      isVatRegistered: true,
      referenceDate: '2025-04-10',
    });
    const vat = withVat.find((d) => d.category === 'vat')!;
    expect(vat).toBeDefined();
    expect(vat.id).toBe('uae-vat-return');
    expect(vat.deadlineDate).toBe('2025-04-28');
    expect(vat.daysRemaining).toBe(18);
    expect(vat.status).toBe('due_soon');
  });

  it('includes Singapore GST return when isVatRegistered is true', () => {
    const withGst = calculateStatutoryDeadlines({
      jurisdiction: 'singapore',
      incorporationDate: '2024-01-10',
      isVatRegistered: true,
      referenceDate: '2025-04-10',
    });
    const gst = withGst.find((d) => d.category === 'vat')!;
    expect(gst).toBeDefined();
    expect(gst.id).toBe('sg-gst-return');
    expect(gst.deadlineDate).toBe('2025-04-30');
  });

  it('includes Bahrain VAT return when isVatRegistered is true', () => {
    const withVat = calculateStatutoryDeadlines({
      jurisdiction: 'bahrain',
      incorporationDate: '2024-01-10',
      isVatRegistered: true,
      referenceDate: '2025-04-10',
    });
    const vat = withVat.find((d) => d.category === 'vat')!;
    expect(vat).toBeDefined();
    expect(vat.id).toBe('bh-vat-return');
    expect(vat.deadlineDate).toBe('2025-04-30');
  });

  it('includes Ireland VAT3 bi-monthly return when isVatRegistered is true', () => {
    const withVat3 = calculateStatutoryDeadlines({
      jurisdiction: 'ireland',
      incorporationDate: '2024-01-10',
      isVatRegistered: true,
      referenceDate: '2025-03-01',
    });
    const vat3 = withVat3.find((d) => d.category === 'vat')!;
    expect(vat3).toBeDefined();
    expect(vat3.id).toBe('ie-vat3-return');
    expect(vat3.deadlineDate).toBe('2025-03-23');
  });
});

describe('Leap Day Incorporation Handling', () => {
  it('correctly calculates anniversary deadlines for company incorporated on Feb 29', () => {
    const deadlines = calculateStatutoryDeadlines({
      jurisdiction: 'uae',
      incorporationDate: '2024-02-29', // leap day
      referenceDate: '2025-01-01',
    });
    const license = deadlines.find((d) => d.id === 'uae-trade-license-renewal')!;
    // 2025 is non-leap year: anniversary is 2025-02-28
    expect(license.deadlineDate).toBe('2025-02-28');
  });
});

describe('Missing Inputs & Graceful Fallbacks', () => {
  it('gracefully handles missing fiscalYearEnd and invalid dates', () => {
    expect(() => {
      calculateStatutoryDeadlines({
        jurisdiction: 'uae',
        incorporationDate: 'invalid-date',
      });
    }).not.toThrow();

    const result = calculateStatutoryDeadlines({
      jurisdiction: 'uae',
      incorporationDate: '2024-01-01',
    });
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('getComplianceSummary Engine', () => {
  it('handles empty deadlines gracefully', () => {
    const summary = getComplianceSummary([]);
    expect(summary.total).toBe(0);
    expect(summary.overdue).toBe(0);
    expect(summary.dueSoon).toBe(0);
    expect(summary.upcoming).toBe(0);
    expect(summary.nextDeadline).toBeNull();
    expect(summary.overallStatus).toBe('compliant');
  });

  it('summarizes deadlines correctly and determines overallStatus', () => {
    const items = calculateStatutoryDeadlines({
      jurisdiction: 'uae',
      incorporationDate: '2024-01-10',
      referenceDate: '2025-01-15',
    });

    const summary = getComplianceSummary(items);
    expect(summary.total).toBe(items.length);
    expect(summary.overdue + summary.dueSoon + summary.upcoming).toBe(items.length);
    expect(summary.nextDeadline).toBeDefined();

    // Critical status when at least one overdue item exists
    const overdueMockItems = [
      ...items,
      {
        id: 'test-overdue',
        title: 'Overdue Task',
        requirement: 'Overdue Task',
        category: 'other' as const,
        deadlineDate: '2025-01-01',
        daysRemaining: -14,
        status: 'overdue' as const,
        penaltyExplanation: 'Penalty test',
        filingAuthority: 'Tax Authority',
        filingPortalUrl: 'https://example.com',
        description: 'Test description',
      },
    ];
    const criticalSummary = getComplianceSummary(overdueMockItems);
    expect(criticalSummary.overallStatus).toBe('critical');
    expect(criticalSummary.overdue).toBeGreaterThan(0);
  });
});
