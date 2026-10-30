import { describe, it, expect } from 'vitest';
import {
  evaluateQFZPEligibility,
  QFZP_ACTIVITIES,
  type QFZPActivity,
  type QFZPEvaluationInput,
} from './qfzp-eligibility';

describe('QFZP Eligibility Engine', () => {
  describe('AC3: Option Value vs Label Alignment', () => {
    it('maps "Headquarter & Holding Company Services" to value "Holding" (not "Consulting")', () => {
      const holdingOption = QFZP_ACTIVITIES.find(
        (opt) => opt.label === 'Headquarter & Holding Company Services'
      );
      expect(holdingOption).toBeDefined();
      expect(holdingOption?.value).toBe('Holding');
      expect(holdingOption?.isQualifying).toBe(true);
    });

    it('ensures no activity option retains the legacy "Consulting" value', () => {
      const legacyConsulting = QFZP_ACTIVITIES.find(
        (opt) => (opt.value as string) === 'Consulting'
      );
      expect(legacyConsulting).toBeUndefined();
    });

    it('defines exactly the 5 expected options with correct labels and qualifying flags', () => {
      expect(QFZP_ACTIVITIES).toEqual([
        { value: 'Tech', label: 'Software Development & Cloud Services', isQualifying: true },
        { value: 'Trading', label: 'Qualifying Commodity & Goods Trading', isQualifying: true },
        { value: 'Holding', label: 'Headquarter & Holding Company Services', isQualifying: true },
        { value: 'Logistics', label: 'Logistics & Freight Forwarding', isQualifying: false },
        { value: 'Excluded', label: 'Direct Mainland UAE B2C Retail (Excluded)', isQualifying: false },
      ]);
    });
  });

  describe('AC2: Full Input Space Enumeration (10 combinations)', () => {
    const allActivities: QFZPActivity[] = ['Tech', 'Trading', 'Holding', 'Logistics', 'Excluded'];
    const substanceStates: boolean[] = [true, false];

    const expectedResults: Record<QFZPActivity, { withSubstance: boolean; withoutSubstance: boolean }> = {
      Tech: { withSubstance: true, withoutSubstance: false },
      Trading: { withSubstance: true, withoutSubstance: false },
      Holding: { withSubstance: true, withoutSubstance: false },
      Logistics: { withSubstance: false, withoutSubstance: false },
      Excluded: { withSubstance: false, withoutSubstance: false },
    };

    allActivities.forEach((activity) => {
      substanceStates.forEach((hasSubstance) => {
        const expected = hasSubstance
          ? expectedResults[activity].withSubstance
          : expectedResults[activity].withoutSubstance;

        it(`evaluates activity="${activity}" with hasSubstance=${hasSubstance} -> isLikelyEligible=${expected}`, () => {
          const result = evaluateQFZPEligibility({ activity, hasSubstance });
          expect(result.isLikelyEligible).toBe(expected);

          if (expected) {
            expect(result.headline).toBe('High Likelihood: Eligible for 0% UAE Corporate Tax');
            expect(result.description).toContain('QFZP');
          } else {
            expect(result.headline).toBe('Standard 9% Rate Applies / Non-Qualifying Activity');
            expect(result.description).toContain('standard 9% UAE corporate tax rate');
          }
        });
      });
    });
  });

  describe('AC5: Table-Driven Cases (>= 6 cases)', () => {
    const tableCases: Array<{
      description: string;
      input: QFZPEvaluationInput;
      expectedEligible: boolean;
      expectedHeadline: string;
    }> = [
      {
        description: 'Tech business with registered free zone substance',
        input: { activity: 'Tech', hasSubstance: true },
        expectedEligible: true,
        expectedHeadline: 'High Likelihood: Eligible for 0% UAE Corporate Tax',
      },
      {
        description: 'Trading business with registered free zone substance',
        input: { activity: 'Trading', hasSubstance: true },
        expectedEligible: true,
        expectedHeadline: 'High Likelihood: Eligible for 0% UAE Corporate Tax',
      },
      {
        description: 'Holding / HQ company with registered free zone substance',
        input: { activity: 'Holding', hasSubstance: true },
        expectedEligible: true,
        expectedHeadline: 'High Likelihood: Eligible for 0% UAE Corporate Tax',
      },
      {
        description: 'Tech business without registered free zone substance (fails substance requirement)',
        input: { activity: 'Tech', hasSubstance: false },
        expectedEligible: false,
        expectedHeadline: 'Standard 9% Rate Applies / Non-Qualifying Activity',
      },
      {
        description: 'Logistics freight forwarding even with substance (non-qualifying activity)',
        input: { activity: 'Logistics', hasSubstance: true },
        expectedEligible: false,
        expectedHeadline: 'Standard 9% Rate Applies / Non-Qualifying Activity',
      },
      {
        description: 'Direct mainland UAE B2C retail with substance (explicitly excluded activity)',
        input: { activity: 'Excluded', hasSubstance: true },
        expectedEligible: false,
        expectedHeadline: 'Standard 9% Rate Applies / Non-Qualifying Activity',
      },
      {
        description: 'Direct mainland UAE B2C retail without substance (excluded and no substance)',
        input: { activity: 'Excluded', hasSubstance: false },
        expectedEligible: false,
        expectedHeadline: 'Standard 9% Rate Applies / Non-Qualifying Activity',
      },
    ];

    it.each(tableCases)(
      '$description',
      ({ input, expectedEligible, expectedHeadline }) => {
        const result = evaluateQFZPEligibility(input);
        expect(result.isLikelyEligible).toBe(expectedEligible);
        expect(result.headline).toBe(expectedHeadline);
      }
    );
  });
});
