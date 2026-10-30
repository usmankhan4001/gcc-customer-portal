// src/lib/tools/visa-estimator.ts
// Pure calculation and schedule estimator for UAE residency visa packages.
// Shared by /tools/visa-estimator and unit tests to ensure schedule consistency.

export type VisaJurisdiction = 'FreeZone' | 'Mainland';

export interface VisaScheduleItem {
  entryPermit: number;
  medicalFitness: number;
  emiratesId: number;
  visaStamping: number;
  perVisaTotal: number;
}

export interface VisaFeeBreakdown {
  entryPermit: number;
  medicalFitness: number;
  emiratesId: number;
  visaStamping: number;
  perVisaTotal: number;
  grandTotal: number;
}

export interface VisaEstimateSuccess {
  success: true;
  count: number;
  jurisdiction: VisaJurisdiction;
  fees: VisaFeeBreakdown;
}

export interface VisaEstimateError {
  success: false;
  error: string;
}

export type VisaEstimateResult = VisaEstimateSuccess | VisaEstimateError;

export const MIN_VISA_COUNT = 1;
export const MAX_VISA_COUNT = 50;

export const VISA_JURISDICTION_OPTIONS = [
  { value: 'FreeZone', label: 'UAE Free Zone (Dubai / RAK / IFZA / Meydan)' },
  { value: 'Mainland', label: 'Dubai Mainland (DED)' },
] as const;

export const VISA_FEE_SCHEDULE: Record<VisaJurisdiction, VisaScheduleItem> = {
  FreeZone: {
    entryPermit: 1100,
    medicalFitness: 350,
    emiratesId: 380,
    visaStamping: 1650,
    perVisaTotal: 3480, // 1100 + 350 + 380 + 1650
  },
  Mainland: {
    entryPermit: 1500,
    medicalFitness: 350,
    emiratesId: 380,
    visaStamping: 2100,
    perVisaTotal: 4330, // 1500 + 350 + 380 + 2100
  },
};

/**
 * Validates visa count and calculates itemized fee schedule and grand total.
 * Rejects non-integers, counts outside 1..50, negatives, and non-numeric values.
 */
export function estimateVisaCosts(
  jurisdictionInput: string,
  countInput: unknown
): VisaEstimateResult {
  if (
    countInput === null ||
    countInput === undefined ||
    (typeof countInput === 'string' && countInput.trim() === '')
  ) {
    return { success: false, error: 'Number of visas is required.' };
  }

  const num =
    typeof countInput === 'number'
      ? countInput
      : Number(String(countInput).trim());

  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return { success: false, error: 'Please enter a valid numeric number of visas.' };
  }

  if (!Number.isInteger(num)) {
    return { success: false, error: 'Number of visas must be a whole number (integer).' };
  }

  if (num < MIN_VISA_COUNT || num > MAX_VISA_COUNT) {
    return {
      success: false,
      error: `Number of visas must be between ${MIN_VISA_COUNT} and ${MAX_VISA_COUNT}.`,
    };
  }

  const jurisdiction: VisaJurisdiction =
    jurisdictionInput === 'Mainland' ? 'Mainland' : 'FreeZone';

  const schedule = VISA_FEE_SCHEDULE[jurisdiction];

  return {
    success: true,
    count: num,
    jurisdiction,
    fees: {
      entryPermit: schedule.entryPermit * num,
      medicalFitness: schedule.medicalFitness * num,
      emiratesId: schedule.emiratesId * num,
      visaStamping: schedule.visaStamping * num,
      perVisaTotal: schedule.perVisaTotal,
      grandTotal: schedule.perVisaTotal * num,
    },
  };
}

/**
 * Currency formatter matching the standard UAE format used across tools.
 */
export function formatAED(n: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(n);
}
