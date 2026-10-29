import { describe, expect, it } from 'vitest';
import {
  bandFromAnnualProfit,
  classifyPersona,
  funnelTrackFromSignals,
  industryRiskTier,
  trackTypeFromSignals,
} from './persona';

describe('bandFromAnnualProfit', () => {
  it.each([
    [0, 'under_50k'],
    [49_999, 'under_50k'],
    [50_000, '50k_150k'],
    [149_999, '50k_150k'],
    [150_000, '150k_500k'],
    [500_000, 'over_500k'],
  ])('%i -> %s', (profit, band) => {
    expect(bandFromAnnualProfit(profit)).toBe(band);
  });

  it('returns undefined for missing or NaN input', () => {
    expect(bandFromAnnualProfit(undefined)).toBeUndefined();
    expect(bandFromAnnualProfit(null)).toBeUndefined();
    expect(bandFromAnnualProfit(NaN)).toBeUndefined();
  });
});

describe('industryRiskTier', () => {
  it('flags high-risk industries', () => {
    expect(industryRiskTier('Crypto Exchange')).toBe('high');
  });
  it('flags low-risk industries', () => {
    expect(industryRiskTier('SaaS')).toBe('low');
  });
  it('defaults unknown industries to medium and empty to undefined', () => {
    expect(industryRiskTier('Agriculture')).toBe('medium');
    expect(industryRiskTier('')).toBeUndefined();
  });
});

describe('track routing', () => {
  it('relocation always means gulf', () => {
    expect(trackTypeFromSignals({ wantsRelocation: true, revenueBand: 'under_50k' })).toBe('gulf');
  });
  it('high revenue means gulf, otherwise remote', () => {
    expect(trackTypeFromSignals({ revenueBand: '150k_500k' })).toBe('gulf');
    expect(trackTypeFromSignals({ revenueBand: '50k_150k' })).toBe('remote');
  });
  it('gulf or over_500k goes consultation-led', () => {
    expect(funnelTrackFromSignals({ trackType: 'gulf' })).toBe('consultation_led');
    expect(funnelTrackFromSignals({ revenueBand: 'over_500k' })).toBe('consultation_led');
    expect(funnelTrackFromSignals({ revenueBand: 'under_50k', trackType: 'remote' })).toBe('self_serve');
  });
});

describe('classifyPersona', () => {
  it('builds a tag from signals', () => {
    const p = classifyPersona({
      revenueBand: 'under_50k',
      industryRiskTier: 'high',
      primaryInterestJurisdiction: 'uae',
    });
    expect(p.persona_tag).toBe('Offshore Optimizer, high-risk industry, interested in uae');
    expect(p.funnel_track).toBe('self_serve');
  });

  it('fills gaps from an existing classification without overwriting new signals', () => {
    const p = classifyPersona(
      { primaryInterestJurisdiction: 'singapore' },
      { estimated_revenue_band: 'over_500k', industry_risk_tier: 'low' }
    );
    expect(p.estimated_revenue_band).toBe('over_500k');
    expect(p.primary_interest_jurisdiction).toBe('singapore');
    expect(p.track_type).toBe('gulf');
    expect(p.funnel_track).toBe('consultation_led');
  });
});
