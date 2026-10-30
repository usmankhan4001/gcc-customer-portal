// src/lib/tools/ubo-privacy.ts
// Pure calculation and lookup module for UBO privacy assessment.
// Shared by /tools/ubo-privacy and unit tests to ensure consistent exposure classification.

export type UboJurisdictionKey = 'uae' | 'bvi' | 'uk' | 'us';
export type ExposureLevel = 'low' | 'high';

export interface UboJurisdictionProfile {
  key: UboJurisdictionKey;
  jurisdiction: string;
  selectLabel: string;
  exposureScore: number;
  publicRegistry: boolean;
  crsReporting: boolean;
  uboConfidential: boolean;
  recommendation: string;
}

export interface PrivacyResult {
  jurisdiction: string;
  exposureScore: number;
  publicRegistry: boolean;
  crsReporting: boolean;
  uboConfidential: boolean;
  recommendation: string;
  exposureLevel: ExposureLevel;
  exposureLabel: string;
  publicRegistryLabel: string;
  uboProtectionLabel: string;
}

export const UBO_EXPOSURE_THRESHOLD = 40;

export const UBO_JURISDICTION_PROFILES: Record<UboJurisdictionKey, UboJurisdictionProfile> = {
  uae: {
    key: 'uae',
    jurisdiction: 'UAE Free Zone',
    selectLabel: 'UAE Free Zone (Dubai / RAK)',
    exposureScore: 20,
    publicRegistry: false,
    crsReporting: true,
    uboConfidential: true,
    recommendation:
      'UAE maintains high privacy: Shareholder and UBO registries are private and not accessible to the general public.',
  },
  bvi: {
    key: 'bvi',
    jurisdiction: 'British Virgin Islands (BVI)',
    selectLabel: 'British Virgin Islands (BVI)',
    exposureScore: 15,
    publicRegistry: false,
    crsReporting: true,
    uboConfidential: true,
    recommendation:
      'Complete public anonymity. Director & UBO registers are held securely by registered agents and closed to public inspection.',
  },
  uk: {
    key: 'uk',
    jurisdiction: 'United Kingdom (Companies House)',
    selectLabel: 'United Kingdom (Companies House)',
    exposureScore: 95,
    publicRegistry: true,
    crsReporting: true,
    uboConfidential: false,
    recommendation:
      'High Public Exposure: Persons of Significant Control (PSC) including full name, birth month, and home nationality are published publicly online.',
  },
  us: {
    key: 'us',
    jurisdiction: 'United States (Delaware / Wyoming)',
    selectLabel: 'United States (Delaware / Wyoming)',
    exposureScore: 40,
    publicRegistry: false,
    crsReporting: false,
    uboConfidential: true,
    recommendation:
      'No public shareholder listing in Wyoming/Delaware; Corporate Transparency Act (CTA) FinCEN filing required internally.',
  },
};

export const UBO_JURISDICTION_OPTIONS: { value: UboJurisdictionKey; label: string }[] = [
  { value: 'uae', label: UBO_JURISDICTION_PROFILES.uae.selectLabel },
  { value: 'bvi', label: UBO_JURISDICTION_PROFILES.bvi.selectLabel },
  { value: 'uk', label: UBO_JURISDICTION_PROFILES.uk.selectLabel },
  { value: 'us', label: UBO_JURISDICTION_PROFILES.us.selectLabel },
];

/**
 * Determines whether an exposure score falls in the low-exposure (private) category.
 * A score <= 40 is classified as low exposure (including US Delaware/Wyoming at 40).
 */
export function isLowExposure(score: number): boolean {
  return score <= UBO_EXPOSURE_THRESHOLD;
}

/**
 * Classifies a numerical exposure score into low or high exposure with corresponding badge label.
 */
export function classifyExposure(score: number): {
  level: ExposureLevel;
  label: string;
  isLow: boolean;
} {
  const low = isLowExposure(score);
  return {
    level: low ? 'low' : 'high',
    label: low ? 'Low Exposure (Private)' : 'High Public Exposure',
    isLow: low,
  };
}

/**
 * Returns formatted tile label for public online registry status.
 */
export function getPublicRegistryLabel(publicRegistry: boolean): string {
  return publicRegistry ? 'YES (Publicly Searchable)' : 'NO (Confidential)';
}

/**
 * Returns formatted tile label for UBO protection status.
 */
export function getUboProtectionLabel(uboConfidential: boolean): string {
  return uboConfidential ? 'Protected' : 'Disclosed Online';
}

/**
 * Invariant verification helper: verifies that the exposure score classification
 * never contradicts the public registry and UBO confidentiality facts.
 */
export function isConsistent(
  score: number,
  publicRegistry: boolean,
  uboConfidential: boolean
): boolean {
  const low = isLowExposure(score);
  if (low) {
    // Low exposure must not be public and must be confidential
    return !publicRegistry && uboConfidential;
  } else {
    // High exposure must have public registry or disclosed UBO
    return publicRegistry || !uboConfidential;
  }
}

/**
 * Retrieves the privacy result for a given jurisdiction.
 * Unknown or unrecognised jurisdiction keys fall back gracefully to 'uae'.
 */
export function checkExposure(jurisdiction: string): PrivacyResult {
  const normalizedKey = (jurisdiction || '').trim().toLowerCase() as UboJurisdictionKey;
  const profile = UBO_JURISDICTION_PROFILES[normalizedKey] ?? UBO_JURISDICTION_PROFILES.uae;
  const classification = classifyExposure(profile.exposureScore);

  return {
    jurisdiction: profile.jurisdiction,
    exposureScore: profile.exposureScore,
    publicRegistry: profile.publicRegistry,
    crsReporting: profile.crsReporting,
    uboConfidential: profile.uboConfidential,
    recommendation: profile.recommendation,
    exposureLevel: classification.level,
    exposureLabel: classification.label,
    publicRegistryLabel: getPublicRegistryLabel(profile.publicRegistry),
    uboProtectionLabel: getUboProtectionLabel(profile.uboConfidential),
  };
}
