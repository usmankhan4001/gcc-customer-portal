// src/lib/tools/vat-scorer.ts
// Pure calculation and threshold evaluation module for UAE VAT obligations.
// Shared by /tools/vat-scorer and unit tests to ensure threshold and classification consistency.

export const VAT_THRESHOLD_MANDATORY = 375000; // AED 375k mandatory
export const VAT_THRESHOLD_VOLUNTARY = 187500; // AED 187.5k voluntary

export type VatStatus = 'mandatory' | 'voluntary' | 'below';

export const VAT_BUSINESS_TYPE_OPTIONS = [
  { value: 'B2B_Foreign', label: 'B2B Foreign Clients (Zero-Rated Export of Services)' },
  { value: 'B2B_Local', label: 'B2B Local UAE Clients (Standard 5% VAT)' },
  { value: 'B2C', label: 'B2C Retail / Direct Consumers' },
] as const;

export type VatBusinessTypeValue = (typeof VAT_BUSINESS_TYPE_OPTIONS)[number]['value'];

export interface VatResultSuccess {
  success: true;
  amount: number;
  status: VatStatus;
  isMandatory: boolean;
  isVoluntary: boolean;
  isBelow: boolean;
  title: string;
  description: string;
  businessType?: string;
}

export interface VatResultError {
  success: false;
  error: string;
}

export type VatEvaluationResult = VatResultSuccess | VatResultError;

export const VAT_MANDATORY_TITLE = 'Mandatory VAT Registration Required';
export const VAT_MANDATORY_DESCRIPTION =
  'Your UAE annual turnover meets or exceeds AED 375,000. You must register with the Federal Tax Authority (FTA) within 30 days of reaching this threshold to avoid statutory late-registration penalties.';

export const VAT_VOLUNTARY_TITLE = 'Eligible for Voluntary VAT Registration';
export const VAT_VOLUNTARY_DESCRIPTION =
  'Your turnover exceeds AED 187,500. Registration is optional but recommended if you want to recover input VAT on business expenses and local office equipment.';

export const VAT_BELOW_TITLE = 'Below VAT Registration Threshold';
export const VAT_BELOW_DESCRIPTION =
  'Your turnover is below the voluntary threshold (AED 187,500). No VAT registration is currently required.';

/**
 * Evaluates UAE VAT registration obligation based on annual taxable revenue.
 * Rejects negative numbers and non-numeric inputs with clear user-facing messages.
 */
export function evaluateVat(
  revenueInput: unknown,
  businessType?: string
): VatEvaluationResult {
  if (
    revenueInput === null ||
    revenueInput === undefined ||
    (typeof revenueInput === 'string' && revenueInput.trim() === '')
  ) {
    return { success: false, error: 'Annual taxable revenue is required.' };
  }

  const num =
    typeof revenueInput === 'number'
      ? revenueInput
      : Number(String(revenueInput).trim());

  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return { success: false, error: 'Please enter a valid numeric revenue amount.' };
  }

  if (num < 0) {
    return { success: false, error: 'Annual taxable revenue cannot be negative.' };
  }

  const isMandatory = num >= VAT_THRESHOLD_MANDATORY;
  const isVoluntary = !isMandatory && num >= VAT_THRESHOLD_VOLUNTARY;
  const isBelow = !isMandatory && !isVoluntary;

  let status: VatStatus = 'below';
  let title = VAT_BELOW_TITLE;
  let description = VAT_BELOW_DESCRIPTION;

  if (isMandatory) {
    status = 'mandatory';
    title = VAT_MANDATORY_TITLE;
    description = VAT_MANDATORY_DESCRIPTION;
  } else if (isVoluntary) {
    status = 'voluntary';
    title = VAT_VOLUNTARY_TITLE;
    description = VAT_VOLUNTARY_DESCRIPTION;
  }

  return {
    success: true,
    amount: num,
    status,
    isMandatory,
    isVoluntary,
    isBelow,
    title,
    description,
    businessType,
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
