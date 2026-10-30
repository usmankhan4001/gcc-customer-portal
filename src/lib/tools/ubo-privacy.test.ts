import { describe, expect, it } from 'vitest';
import {
  UBO_EXPOSURE_THRESHOLD,
  UBO_JURISDICTION_OPTIONS,
  UBO_JURISDICTION_PROFILES,
  UboJurisdictionKey,
  checkExposure,
  classifyExposure,
  getPublicRegistryLabel,
  getUboProtectionLabel,
  isConsistent,
  isLowExposure,
} from './ubo-privacy';

describe('UBO Privacy Checker Pure Logic (Spec 010)', () => {
  // AC1: Label and tile texts never contradict each other
  describe('No contradiction between exposure label and tile texts (AC1)', () => {
    it.each(Object.keys(UBO_JURISDICTION_PROFILES) as UboJurisdictionKey[])(
      'jurisdiction option %s has consistent label and tile attributes',
      (key) => {
        const result = checkExposure(key);

        // Verify the invariant helper returns true
        expect(isConsistent(result.exposureScore, result.publicRegistry, result.uboConfidential)).toBe(true);

        if (result.exposureLevel === 'low') {
          // Low exposure must have private/confidential registry and protected UBO
          expect(result.exposureLabel).toBe('Low Exposure (Private)');
          expect(result.publicRegistry).toBe(false);
          expect(result.publicRegistryLabel).toBe('NO (Confidential)');
          expect(result.uboConfidential).toBe(true);
          expect(result.uboProtectionLabel).toBe('Protected');
        } else {
          // High exposure must not have both private registry and protected UBO
          expect(result.exposureLabel).toBe('High Public Exposure');
          expect(result.publicRegistry).toBe(true);
          expect(result.publicRegistryLabel).toBe('YES (Publicly Searchable)');
          expect(result.uboConfidential).toBe(false);
          expect(result.uboProtectionLabel).toBe('Disclosed Online');
        }
      }
    );

    it.each([
      { score: 39, publicRegistry: false, uboConfidential: true, expectedConsistent: true, desc: 'score 39 confidential (below threshold)' },
      { score: 40, publicRegistry: false, uboConfidential: true, expectedConsistent: true, desc: 'score 40 confidential (at threshold - US)' },
      { score: 41, publicRegistry: true, uboConfidential: false, expectedConsistent: true, desc: 'score 41 public (above threshold)' },
      { score: 40, publicRegistry: true, uboConfidential: false, expectedConsistent: false, desc: 'score 40 with public tiles (contradiction)' },
      { score: 41, publicRegistry: false, uboConfidential: true, expectedConsistent: false, desc: 'score 41 with private tiles (contradiction)' },
    ])('boundary consistency invariant: $desc', ({ score, publicRegistry, uboConfidential, expectedConsistent }) => {
      expect(isConsistent(score, publicRegistry, uboConfidential)).toBe(expectedConsistent);
    });
  });

  // AC2: US case (score 40) is classified consistently with its tiles
  describe('US case (score 40) classified consistently with its tiles (AC2)', () => {
    it('evaluates US (score 40) as Low Exposure (Private) matching its confidential tiles', () => {
      const usResult = checkExposure('us');

      expect(usResult.exposureScore).toBe(40);
      expect(usResult.exposureLevel).toBe('low');
      expect(usResult.exposureLabel).toBe('Low Exposure (Private)');
      expect(usResult.publicRegistry).toBe(false);
      expect(usResult.publicRegistryLabel).toBe('NO (Confidential)');
      expect(usResult.uboConfidential).toBe(true);
      expect(usResult.uboProtectionLabel).toBe('Protected');
      expect(usResult.crsReporting).toBe(false);
    });

    it('evaluates threshold boundary condition for score 40', () => {
      expect(isLowExposure(40)).toBe(true);
      expect(isLowExposure(UBO_EXPOSURE_THRESHOLD)).toBe(true);
      const classification = classifyExposure(40);
      expect(classification.level).toBe('low');
      expect(classification.label).toBe('Low Exposure (Private)');
      expect(classification.isLow).toBe(true);
    });
  });

  // AC5: Boundary and table-driven test cases (at least 8 cases)
  describe('Table-driven score boundary and classification checks (AC5)', () => {
    it.each([
      [0, 'low', 'Low Exposure (Private)', true],
      [15, 'low', 'Low Exposure (Private)', true],
      [20, 'low', 'Low Exposure (Private)', true],
      [39, 'low', 'Low Exposure (Private)', true],
      [40, 'low', 'Low Exposure (Private)', true],
      [41, 'high', 'High Public Exposure', false],
      [50, 'high', 'High Public Exposure', false],
      [95, 'high', 'High Public Exposure', false],
      [100, 'high', 'High Public Exposure', false],
    ])('score %i -> level: %s, label: %s, isLow: %s', (score, level, label, isLow) => {
      const c = classifyExposure(score);
      expect(c.level).toBe(level);
      expect(c.label).toBe(label);
      expect(c.isLow).toBe(isLow);
      expect(isLowExposure(score)).toBe(isLow);
    });
  });

  describe('Fallback and case-insensitivity handling', () => {
    it.each(['unknown', 'xyz', '', 'germany'])('falls back to UAE for unknown key: %s', (key) => {
      const res = checkExposure(key);
      expect(res.jurisdiction).toBe('UAE Free Zone');
      expect(res.exposureScore).toBe(20);
      expect(res.exposureLevel).toBe('low');
      expect(res.exposureLabel).toBe('Low Exposure (Private)');
    });

    it.each([
      ['UAE', 'UAE Free Zone'],
      ['Bvi', 'British Virgin Islands (BVI)'],
      ['US', 'United States (Delaware / Wyoming)'],
      ['uK', 'United Kingdom (Companies House)'],
    ])('handles case-insensitive inputs: %s -> %s', (input, expectedName) => {
      const res = checkExposure(input);
      expect(res.jurisdiction).toBe(expectedName);
    });
  });

  describe('Option registry and statutory data pinning', () => {
    it('pins existing statutory facts and scores against accidental drift', () => {
      expect(UBO_EXPOSURE_THRESHOLD).toBe(40);
      expect(UBO_JURISDICTION_PROFILES.uae.exposureScore).toBe(20);
      expect(UBO_JURISDICTION_PROFILES.bvi.exposureScore).toBe(15);
      expect(UBO_JURISDICTION_PROFILES.us.exposureScore).toBe(40);
      expect(UBO_JURISDICTION_PROFILES.uk.exposureScore).toBe(95);

      expect(UBO_JURISDICTION_PROFILES.uae.publicRegistry).toBe(false);
      expect(UBO_JURISDICTION_PROFILES.bvi.publicRegistry).toBe(false);
      expect(UBO_JURISDICTION_PROFILES.us.publicRegistry).toBe(false);
      expect(UBO_JURISDICTION_PROFILES.uk.publicRegistry).toBe(true);

      expect(UBO_JURISDICTION_PROFILES.uae.uboConfidential).toBe(true);
      expect(UBO_JURISDICTION_PROFILES.bvi.uboConfidential).toBe(true);
      expect(UBO_JURISDICTION_PROFILES.us.uboConfidential).toBe(true);
      expect(UBO_JURISDICTION_PROFILES.uk.uboConfidential).toBe(false);
    });

    it('has matching option keys and profiles in shared registry', () => {
      expect(UBO_JURISDICTION_OPTIONS.length).toBe(4);
      for (const opt of UBO_JURISDICTION_OPTIONS) {
        expect(UBO_JURISDICTION_PROFILES[opt.value]).toBeDefined();
        expect(opt.label).toBe(UBO_JURISDICTION_PROFILES[opt.value].selectLabel);
      }
    });

    it('verifies helper tile label formatters', () => {
      expect(getPublicRegistryLabel(true)).toBe('YES (Publicly Searchable)');
      expect(getPublicRegistryLabel(false)).toBe('NO (Confidential)');
      expect(getUboProtectionLabel(true)).toBe('Protected');
      expect(getUboProtectionLabel(false)).toBe('Disclosed Online');
    });
  });
});
