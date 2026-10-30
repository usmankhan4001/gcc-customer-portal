import { describe, it, expect } from 'vitest';
import {
  computeBankOdds,
  calculateBankingOddsForIndustry,
  getTurnoverBonus,
  clampOdds,
  getOddsCategory,
  BANKING_INDUSTRY_OPTIONS,
} from './banking-odds';
import type { IndustryRiskTier } from '@/lib/persona';

describe('Banking Odds Engine', () => {
  describe('Turnover Bonus and Boundaries', () => {
    it('applies -10% penalty for turnover < 50,000', () => {
      expect(getTurnoverBonus(0)).toBe(-10);
      expect(getTurnoverBonus(10000)).toBe(-10);
      expect(getTurnoverBonus(49999)).toBe(-10);
      expect(getTurnoverBonus(-500)).toBe(-10);
    });

    it('applies 0% adjustment for 50,000 <= turnover < 500,000', () => {
      expect(getTurnoverBonus(50000)).toBe(0);
      expect(getTurnoverBonus(150000)).toBe(0);
      expect(getTurnoverBonus(499999)).toBe(0);
    });

    it('applies +5% bonus for turnover >= 500,000', () => {
      expect(getTurnoverBonus(500000)).toBe(5);
      expect(getTurnoverBonus(1000000)).toBe(5);
    });
  });

  describe('Clamping Constraints', () => {
    it('clamps odds between 5 and 99', () => {
      expect(clampOdds(0)).toBe(5);
      expect(clampOdds(-10)).toBe(5);
      expect(clampOdds(4)).toBe(5);
      expect(clampOdds(5)).toBe(5);
      expect(clampOdds(50)).toBe(50);
      expect(clampOdds(99)).toBe(99);
      expect(clampOdds(100)).toBe(99);
      expect(clampOdds(120)).toBe(99);
    });
  });

  describe('Category and Label Thresholds', () => {
    it('returns High Likelihood for odds > 80', () => {
      expect(getOddsCategory(81)).toEqual({ category: 'high', label: 'High Likelihood' });
      expect(getOddsCategory(99)).toEqual({ category: 'high', label: 'High Likelihood' });
    });

    it('returns Moderate Odds for 50 < odds <= 80', () => {
      expect(getOddsCategory(80)).toEqual({ category: 'moderate', label: 'Moderate Odds' });
      expect(getOddsCategory(75)).toEqual({ category: 'moderate', label: 'Moderate Odds' });
      expect(getOddsCategory(51)).toEqual({ category: 'moderate', label: 'Moderate Odds' });
    });

    it('returns Special Approval Needed for odds <= 50', () => {
      expect(getOddsCategory(50)).toEqual({ category: 'special', label: 'Special Approval Needed' });
      expect(getOddsCategory(40)).toEqual({ category: 'special', label: 'Special Approval Needed' });
      expect(getOddsCategory(5)).toEqual({ category: 'special', label: 'Special Approval Needed' });
    });
  });

  describe('AC2: Full Input Space Enumeration (3 Risk Tiers x 3 Turnover Bands = 9 Matrix Cells)', () => {
    const matrix: Array<{
      risk: IndustryRiskTier;
      turnover: number;
      expected: { wio: number; enbd: number; mashreq: number; adcb: number };
    }> = [
      // low risk: base { wio: 95, enbd: 85, mashreq: 90, adcb: 75 }
      {
        risk: 'low',
        turnover: 25000, // bonus -10
        expected: { wio: 85, enbd: 75, mashreq: 80, adcb: 65 },
      },
      {
        risk: 'low',
        turnover: 150000, // bonus 0
        expected: { wio: 95, enbd: 85, mashreq: 90, adcb: 75 },
      },
      {
        risk: 'low',
        turnover: 600000, // bonus +5 -> wio clamped from 100 to 99
        expected: { wio: 99, enbd: 90, mashreq: 95, adcb: 80 },
      },

      // medium risk: base { wio: 75, enbd: 60, mashreq: 70, adcb: 50 }
      {
        risk: 'medium',
        turnover: 30000, // bonus -10
        expected: { wio: 65, enbd: 50, mashreq: 60, adcb: 40 },
      },
      {
        risk: 'medium',
        turnover: 100000, // bonus 0
        expected: { wio: 75, enbd: 60, mashreq: 70, adcb: 50 },
      },
      {
        risk: 'medium',
        turnover: 750000, // bonus +5
        expected: { wio: 80, enbd: 65, mashreq: 75, adcb: 55 },
      },

      // high risk: base { wio: 40, enbd: 20, mashreq: 35, adcb: 10 }
      {
        risk: 'high',
        turnover: 10000, // bonus -10 -> adcb clamped from 0 to 5
        expected: { wio: 30, enbd: 10, mashreq: 25, adcb: 5 },
      },
      {
        risk: 'high',
        turnover: 200000, // bonus 0
        expected: { wio: 40, enbd: 20, mashreq: 35, adcb: 10 },
      },
      {
        risk: 'high',
        turnover: 500000, // bonus +5
        expected: { wio: 45, enbd: 25, mashreq: 40, adcb: 15 },
      },
    ];

    it.each(matrix)(
      'evaluates risk="$risk" with turnover=$turnover matching exact current behavior',
      ({ risk, turnover, expected }) => {
        const results = computeBankOdds(risk, turnover);
        expect(results).toHaveLength(4);

        const wio = results.find((r) => r.bank === 'Wio Bank');
        const enbd = results.find((r) => r.bank === 'Emirates NBD');
        const mashreq = results.find((r) => r.bank === 'Mashreq NeoBiz');
        const adcb = results.find((r) => r.bank === 'ADCB Commercial');

        expect(wio?.odds).toBe(expected.wio);
        expect(enbd?.odds).toBe(expected.enbd);
        expect(mashreq?.odds).toBe(expected.mashreq);
        expect(adcb?.odds).toBe(expected.adcb);
      }
    );
  });

  describe('AC5: Table-Driven Cases via calculateBankingOddsForIndustry (>= 6 cases)', () => {
    const tableCases = [
      {
        industry: 'Consulting',
        turnover: 150000,
        expectedWio: 95,
        expectedEnbd: 85,
        expectedMashreq: 90,
        expectedAdcb: 75,
      },
      {
        industry: 'Technology',
        turnover: 500000,
        expectedWio: 99, // clamped from 100
        expectedEnbd: 90,
        expectedMashreq: 95,
        expectedAdcb: 80,
      },
      {
        industry: 'Other',
        turnover: 49999,
        expectedWio: 65,
        expectedEnbd: 50,
        expectedMashreq: 60,
        expectedAdcb: 40,
      },
      {
        industry: 'Real Estate',
        turnover: 50000,
        expectedWio: 75,
        expectedEnbd: 60,
        expectedMashreq: 70,
        expectedAdcb: 50,
      },
      {
        industry: 'Crypto',
        turnover: 30000,
        expectedWio: 30,
        expectedEnbd: 10,
        expectedMashreq: 25,
        expectedAdcb: 5, // clamped floor
      },
      {
        industry: 'Crypto',
        turnover: 500000,
        expectedWio: 45,
        expectedEnbd: 25,
        expectedMashreq: 40,
        expectedAdcb: 15,
      },
      {
        industry: 'E-commerce',
        turnover: -100, // treated as < 50000
        expectedWio: 85,
        expectedEnbd: 75,
        expectedMashreq: 80,
        expectedAdcb: 65,
      },
    ];

    it.each(tableCases)(
      'computes odds for industry="$industry" and turnover=$turnover',
      ({ industry, turnover, expectedWio, expectedEnbd, expectedMashreq, expectedAdcb }) => {
        const results = calculateBankingOddsForIndustry(industry, turnover);
        expect(results.find((r) => r.bank === 'Wio Bank')?.odds).toBe(expectedWio);
        expect(results.find((r) => r.bank === 'Emirates NBD')?.odds).toBe(expectedEnbd);
        expect(results.find((r) => r.bank === 'Mashreq NeoBiz')?.odds).toBe(expectedMashreq);
        expect(results.find((r) => r.bank === 'ADCB Commercial')?.odds).toBe(expectedAdcb);
      }
    );
  });

  describe('AC1: Form field independence and clean contracts', () => {
    it('confirms computeBankOdds and calculateBankingOddsForIndustry do not require or accept nationality', () => {
      // The function signature takes exactly (risk: IndustryRiskTier, turnover: number)
      expect(computeBankOdds.length).toBe(2);
      expect(calculateBankingOddsForIndustry.length).toBe(2);
    });

    it('contains all 7 expected industry options in BANKING_INDUSTRY_OPTIONS', () => {
      expect(BANKING_INDUSTRY_OPTIONS.map((o) => o.value)).toEqual([
        'Consulting',
        'Technology',
        'E-commerce',
        'Marketing',
        'Crypto',
        'Real Estate',
        'Other',
      ]);
    });
  });
});
