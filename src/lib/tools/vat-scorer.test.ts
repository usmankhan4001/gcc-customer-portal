import { describe, expect, it } from 'vitest';
import {
  VAT_BELOW_DESCRIPTION,
  VAT_BELOW_TITLE,
  VAT_BUSINESS_TYPE_OPTIONS,
  VAT_MANDATORY_DESCRIPTION,
  VAT_MANDATORY_TITLE,
  VAT_THRESHOLD_MANDATORY,
  VAT_THRESHOLD_VOLUNTARY,
  VAT_VOLUNTARY_DESCRIPTION,
  VAT_VOLUNTARY_TITLE,
  evaluateVat,
  formatAED,
} from './vat-scorer';

describe('UAE VAT Scorer Pure Logic (Spec 011)', () => {
  // AC1 & AC5: Table-driven boundary classification tests
  describe('Valid revenue threshold boundary classifications (AC1, AC5)', () => {
    it.each([
      // [revenue, expectedStatus, isMandatory, isVoluntary, isBelow, desc]
      [400000, 'mandatory', true, false, false, 'default revenue (400,000)'],
      [1000000, 'mandatory', true, false, false, 'large revenue (1,000,000)'],
      [375001, 'mandatory', true, false, false, 'one above mandatory threshold (375,001)'],
      [375000, 'mandatory', true, false, false, 'exact mandatory threshold (375,000)'],
      [374999.99, 'voluntary', false, true, false, 'fractional below mandatory (374,999.99)'],
      [374999, 'voluntary', false, true, false, 'one below mandatory threshold (374,999)'],
      [250000, 'voluntary', false, true, false, 'mid-range voluntary revenue (250,000)'],
      [187501, 'voluntary', false, true, false, 'one above voluntary threshold (187,501)'],
      [187500, 'voluntary', false, true, false, 'exact voluntary threshold (187,500)'],
      [187499.99, 'below', false, false, true, 'fractional below voluntary (187,499.99)'],
      [187499, 'below', false, false, true, 'one below voluntary threshold (187,499)'],
      [50000, 'below', false, false, true, 'low turnover (50,000)'],
      [0, 'below', false, false, true, 'zero turnover (0)'],
    ])(
      'revenue %d (%s) -> status: %s',
      (revenue, expectedStatus, isMandatory, isVoluntary, isBelow) => {
        const res = evaluateVat(revenue);
        expect(res.success).toBe(true);
        if (res.success) {
          expect(res.status).toBe(expectedStatus);
          expect(res.isMandatory).toBe(isMandatory);
          expect(res.isVoluntary).toBe(isVoluntary);
          expect(res.isBelow).toBe(isBelow);

          if (expectedStatus === 'mandatory') {
            expect(res.title).toBe(VAT_MANDATORY_TITLE);
            expect(res.description).toBe(VAT_MANDATORY_DESCRIPTION);
          } else if (expectedStatus === 'voluntary') {
            expect(res.title).toBe(VAT_VOLUNTARY_TITLE);
            expect(res.description).toBe(VAT_VOLUNTARY_DESCRIPTION);
          } else {
            expect(res.title).toBe(VAT_BELOW_TITLE);
            expect(res.description).toBe(VAT_BELOW_DESCRIPTION);
          }
        }
      }
    );

    it('supports string numeric inputs as submitted by HTML forms', () => {
      const res = evaluateVat('375000');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.amount).toBe(375000);
        expect(res.status).toBe('mandatory');
      }
    });

    it('passes through optional businessType if provided', () => {
      const res = evaluateVat(200000, 'B2B_Foreign');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.businessType).toBe('B2B_Foreign');
      }
    });
  });

  // AC1: Negative or non-numeric revenue is rejected with a clear message
  describe('Input validation: rejects negative and non-numeric inputs (AC1)', () => {
    it.each([
      [-1, 'Annual taxable revenue cannot be negative.'],
      [-50000, 'Annual taxable revenue cannot be negative.'],
      ['-0.01', 'Annual taxable revenue cannot be negative.'],
      ['', 'Annual taxable revenue is required.'],
      ['   ', 'Annual taxable revenue is required.'],
      [null, 'Annual taxable revenue is required.'],
      [undefined, 'Annual taxable revenue is required.'],
      ['abc', 'Please enter a valid numeric revenue amount.'],
      ['$375,000', 'Please enter a valid numeric revenue amount.'],
      [NaN, 'Please enter a valid numeric revenue amount.'],
      [Infinity, 'Please enter a valid numeric revenue amount.'],
      [-Infinity, 'Please enter a valid numeric revenue amount.'],
    ])('rejects input %j with message matching %s', (input, expectedErrMsg) => {
      const res = evaluateVat(input);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe(expectedErrMsg);
      }
    });
  });

  // AC4: Pin statutory thresholds and labels against accidental drift
  describe('Statutory constants and label pinning (AC4)', () => {
    it('pins VAT mandatory and voluntary statutory thresholds', () => {
      expect(VAT_THRESHOLD_MANDATORY).toBe(375000);
      expect(VAT_THRESHOLD_VOLUNTARY).toBe(187500);
    });

    it('pins exact user-facing titles and descriptions verbatim', () => {
      expect(VAT_MANDATORY_TITLE).toBe('Mandatory VAT Registration Required');
      expect(VAT_MANDATORY_DESCRIPTION).toBe(
        'Your UAE annual turnover meets or exceeds AED 375,000. You must register with the Federal Tax Authority (FTA) within 30 days of reaching this threshold to avoid statutory late-registration penalties.'
      );

      expect(VAT_VOLUNTARY_TITLE).toBe('Eligible for Voluntary VAT Registration');
      expect(VAT_VOLUNTARY_DESCRIPTION).toBe(
        'Your turnover exceeds AED 187,500. Registration is optional but recommended if you want to recover input VAT on business expenses and local office equipment.'
      );

      expect(VAT_BELOW_TITLE).toBe('Below VAT Registration Threshold');
      expect(VAT_BELOW_DESCRIPTION).toBe(
        'Your turnover is below the voluntary threshold (AED 187,500). No VAT registration is currently required.'
      );
    });

    it('pins business type dropdown options', () => {
      expect(VAT_BUSINESS_TYPE_OPTIONS.length).toBe(3);
      expect(VAT_BUSINESS_TYPE_OPTIONS[0]).toEqual({
        value: 'B2B_Foreign',
        label: 'B2B Foreign Clients (Zero-Rated Export of Services)',
      });
      expect(VAT_BUSINESS_TYPE_OPTIONS[1]).toEqual({
        value: 'B2B_Local',
        label: 'B2B Local UAE Clients (Standard 5% VAT)',
      });
      expect(VAT_BUSINESS_TYPE_OPTIONS[2]).toEqual({
        value: 'B2C',
        label: 'B2C Retail / Direct Consumers',
      });
    });

    it('formats currency correctly in AED', () => {
      const formatted = formatAED(375000);
      expect(formatted).toContain('375,000');
      expect(formatted).toContain('AED');
    });
  });
});
