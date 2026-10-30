/**
 * UAE Qualifying Free Zone Person (QFZP) 0% Corporate Tax Eligibility Engine
 * Based on UAE Cabinet Decision No. 55/2023.
 */

export type QFZPActivity = 'Tech' | 'Trading' | 'Holding' | 'Logistics' | 'Excluded';

export interface QFZPActivityOption {
  value: QFZPActivity;
  label: string;
  isQualifying: boolean;
}

export const QFZP_ACTIVITIES: readonly QFZPActivityOption[] = [
  { value: 'Tech', label: 'Software Development & Cloud Services', isQualifying: true },
  { value: 'Trading', label: 'Qualifying Commodity & Goods Trading', isQualifying: true },
  { value: 'Holding', label: 'Headquarter & Holding Company Services', isQualifying: true },
  { value: 'Logistics', label: 'Logistics & Freight Forwarding', isQualifying: false },
  { value: 'Excluded', label: 'Direct Mainland UAE B2C Retail (Excluded)', isQualifying: false },
];

export interface QFZPEvaluationInput {
  activity: QFZPActivity;
  hasSubstance: boolean;
}

export interface QFZPEvaluationResult {
  isLikelyEligible: boolean;
  headline: string;
  description: string;
}

/**
 * Evaluates whether a free zone company is likely eligible for 0% corporate tax as a QFZP.
 * Qualifying activities: Tech, Trading, and Holding (HQ/Holding services).
 * Requires adequate substance (e.g. physical/flexi office lease in UAE Free Zone).
 */
export function evaluateQFZPEligibility(input: QFZPEvaluationInput): QFZPEvaluationResult {
  const activityOption = QFZP_ACTIVITIES.find((opt) => opt.value === input.activity);
  const isQualifyingActivity = activityOption ? activityOption.isQualifying : false;

  const isLikelyEligible = Boolean(input.hasSubstance && isQualifyingActivity);

  return {
    isLikelyEligible,
    headline: isLikelyEligible
      ? 'High Likelihood: Eligible for 0% UAE Corporate Tax'
      : 'Standard 9% Rate Applies / Non-Qualifying Activity',
    description: isLikelyEligible
      ? 'Your business model meets the Qualifying Free Zone Person (QFZP) criteria: Qualifying activity and adequate UAE economic substance.'
      : 'Activities involving direct mainland UAE consumer trade or lacking registered substance are taxed at the standard 9% UAE corporate tax rate (first AED 375k profit still 0%).',
  };
}
