import { describe, expect, it } from 'vitest';
import {
  MAX_VISA_COUNT,
  MIN_VISA_COUNT,
  VISA_FEE_SCHEDULE,
  VISA_JURISDICTION_OPTIONS,
  VisaJurisdiction,
  estimateVisaCosts,
  formatAED,
} from './visa-estimator';

describe('UAE Residence Visa Estimator Pure Logic (Spec 011)', () => {
  // AC2 & AC5: Table-driven valid calculation tests
  describe('Valid visa count calculations matching previous totals (AC2, AC5)', () => {
    it.each([
      // [jurisdiction, count, expectedPerVisa, expectedGrandTotal, desc]
      ['FreeZone', 1, 3480, 3480, 'FreeZone 1 visa (minimum bound)'],
      ['FreeZone', 2, 3480, 6960, 'FreeZone 2 visas (default count)'],
      ['FreeZone', 5, 3480, 17400, 'FreeZone 5 visas'],
      ['FreeZone', 10, 3480, 34800, 'FreeZone 10 visas'],
      ['FreeZone', 49, 3480, 170520, 'FreeZone 49 visas (one below max)'],
      ['FreeZone', 50, 3480, 174000, 'FreeZone 50 visas (maximum bound)'],
      ['Mainland', 1, 4330, 4330, 'Mainland 1 visa (minimum bound)'],
      ['Mainland', 2, 4330, 8660, 'Mainland 2 visas'],
      ['Mainland', 3, 4330, 12990, 'Mainland 3 visas'],
      ['Mainland', 10, 4330, 43300, 'Mainland 10 visas'],
      ['Mainland', 49, 4330, 212170, 'Mainland 49 visas (one below max)'],
      ['Mainland', 50, 4330, 216500, 'Mainland 50 visas (maximum bound)'],
    ])(
      '%s with %i visa(s) -> perVisa: %d, grandTotal: %d (%s)',
      (jurisdiction, count, expectedPerVisa, expectedGrandTotal) => {
        const res = estimateVisaCosts(jurisdiction, count);
        expect(res.success).toBe(true);
        if (res.success) {
          expect(res.count).toBe(count);
          expect(res.jurisdiction).toBe(jurisdiction as VisaJurisdiction);
          expect(res.fees.perVisaTotal).toBe(expectedPerVisa);
          expect(res.fees.grandTotal).toBe(expectedGrandTotal);

          // Verify itemized breakdowns
          const schedule = VISA_FEE_SCHEDULE[jurisdiction as VisaJurisdiction];
          expect(res.fees.entryPermit).toBe(schedule.entryPermit * count);
          expect(res.fees.medicalFitness).toBe(schedule.medicalFitness * count);
          expect(res.fees.emiratesId).toBe(schedule.emiratesId * count);
          expect(res.fees.visaStamping).toBe(schedule.visaStamping * count);
        }
      }
    );

    it('supports string numeric inputs as submitted by HTML forms', () => {
      const res = estimateVisaCosts('FreeZone', '2');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.count).toBe(2);
        expect(res.fees.grandTotal).toBe(6960);
      }
    });

    it('defaults unknown jurisdiction gracefully to FreeZone', () => {
      const res = estimateVisaCosts('UnknownZone', 1);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.jurisdiction).toBe('FreeZone');
        expect(res.fees.perVisaTotal).toBe(3480);
      }
    });
  });

  // AC2: Rejection of counts outside 1..50 and non-integers
  describe('Input validation: rejects out-of-range, non-integers, and non-numeric inputs (AC2)', () => {
    it.each([
      // Out of range (counts outside 1 to 50)
      [0, 'Number of visas must be between 1 and 50.'],
      [-1, 'Number of visas must be between 1 and 50.'],
      [-10, 'Number of visas must be between 1 and 50.'],
      [51, 'Number of visas must be between 1 and 50.'],
      [100, 'Number of visas must be between 1 and 50.'],
      ['0', 'Number of visas must be between 1 and 50.'],
      ['-3', 'Number of visas must be between 1 and 50.'],
      ['51', 'Number of visas must be between 1 and 50.'],
      ['999', 'Number of visas must be between 1 and 50.'],

      // Non-integers (decimals / fractions)
      [2.5, 'Number of visas must be a whole number (integer).'],
      [1.1, 'Number of visas must be a whole number (integer).'],
      [49.99, 'Number of visas must be a whole number (integer).'],
      ['2.9', 'Number of visas must be a whole number (integer).'],
      ['1.0001', 'Number of visas must be a whole number (integer).'],

      // Non-numeric or missing
      ['', 'Number of visas is required.'],
      ['   ', 'Number of visas is required.'],
      [null, 'Number of visas is required.'],
      [undefined, 'Number of visas is required.'],
      ['abc', 'Please enter a valid numeric number of visas.'],
      ['two', 'Please enter a valid numeric number of visas.'],
      [NaN, 'Please enter a valid numeric number of visas.'],
      [Infinity, 'Please enter a valid numeric number of visas.'],
    ])('rejects input %j with message: %s', (input, expectedErrMsg) => {
      const res = estimateVisaCosts('FreeZone', input);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe(expectedErrMsg);
      }
    });
  });

  // AC4: Pin fee schedule and constants against accidental drift
  describe('Fee schedule and constants pinning (AC4)', () => {
    it('pins range constants to exactly 1 and 50', () => {
      expect(MIN_VISA_COUNT).toBe(1);
      expect(MAX_VISA_COUNT).toBe(50);
    });

    it('pins FreeZone fee schedule item numbers verbatim', () => {
      const fz = VISA_FEE_SCHEDULE.FreeZone;
      expect(fz.entryPermit).toBe(1100);
      expect(fz.medicalFitness).toBe(350);
      expect(fz.emiratesId).toBe(380);
      expect(fz.visaStamping).toBe(1650);
      expect(fz.perVisaTotal).toBe(3480);
    });

    it('pins Mainland fee schedule item numbers verbatim', () => {
      const ml = VISA_FEE_SCHEDULE.Mainland;
      expect(ml.entryPermit).toBe(1500);
      expect(ml.medicalFitness).toBe(350);
      expect(ml.emiratesId).toBe(380);
      expect(ml.visaStamping).toBe(2100);
      expect(ml.perVisaTotal).toBe(4330);
    });

    it('pins jurisdiction option values and labels', () => {
      expect(VISA_JURISDICTION_OPTIONS.length).toBe(2);
      expect(VISA_JURISDICTION_OPTIONS[0]).toEqual({
        value: 'FreeZone',
        label: 'UAE Free Zone (Dubai / RAK / IFZA / Meydan)',
      });
      expect(VISA_JURISDICTION_OPTIONS[1]).toEqual({
        value: 'Mainland',
        label: 'Dubai Mainland (DED)',
      });
    });

    it('formats currency correctly in AED', () => {
      const formatted = formatAED(3480);
      expect(formatted).toContain('3,480');
      expect(formatted).toContain('AED');
    });
  });
});
