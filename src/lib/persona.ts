export type RevenueBand = 'under_50k' | '50k_150k' | '150k_500k' | 'over_500k';
export type IndustryRiskTier = 'low' | 'medium' | 'high';
export type TrackType = 'remote' | 'gulf';
export type FunnelTrack = 'self_serve' | 'consultation_led';
export type Jurisdiction = 'uae' | 'hong-kong' | 'singapore' | 'bahrain' | 'ireland' | 'bvi';

const HIGH_RISK_INDUSTRIES = ['crypto', 'forex', 'gambling', 'trading'];
const LOW_RISK_INDUSTRIES = ['e-commerce', 'ecommerce', 'consulting', 'technology', 'tech', 'saas'];

export function bandFromAnnualProfit(annualProfit: number | undefined | null): RevenueBand | undefined {
  if (annualProfit == null || Number.isNaN(annualProfit)) return undefined;
  if (annualProfit < 50000) return 'under_50k';
  if (annualProfit < 150000) return '50k_150k';
  if (annualProfit < 500000) return '150k_500k';
  return 'over_500k';
}

export function industryRiskTier(industry: string | undefined | null): IndustryRiskTier | undefined {
  if (!industry) return undefined;
  const normalized = industry.toLowerCase();
  if (HIGH_RISK_INDUSTRIES.some((i) => normalized.includes(i))) return 'high';
  if (LOW_RISK_INDUSTRIES.some((i) => normalized.includes(i))) return 'low';
  return 'medium';
}

export function trackTypeFromSignals(params: {
  revenueBand?: RevenueBand;
  wantsRelocation?: boolean;
}): TrackType {
  if (params.wantsRelocation) return 'gulf';
  if (params.revenueBand === '150k_500k' || params.revenueBand === 'over_500k') return 'gulf';
  return 'remote';
}

export function funnelTrackFromSignals(params: {
  revenueBand?: RevenueBand;
  trackType?: TrackType;
}): FunnelTrack {
  if (params.trackType === 'gulf') return 'consultation_led';
  if (params.revenueBand === 'over_500k') return 'consultation_led';
  return 'self_serve';
}

export interface PersonaSignals {
  revenueBand?: RevenueBand;
  industryRiskTier?: IndustryRiskTier;
  primaryInterestJurisdiction?: Jurisdiction;
  trackType?: TrackType;
  wantsRelocation?: boolean;
}

export interface PersonaClassification {
  persona_tag: string;
  track_type: TrackType;
  funnel_track: FunnelTrack;
  estimated_revenue_band?: RevenueBand;
  industry_risk_tier?: IndustryRiskTier;
  primary_interest_jurisdiction?: Jurisdiction;
}

/**
 * Combines whatever signals a single tool submission produced into a
 * persona classification. Called again (merging with existing values) if
 * the same lead uses a second tool — multi-tool usage in one session is
 * itself a strong intent signal, so later signals fill in gaps rather than
 * overwriting earlier ones outright.
 */
export function classifyPersona(
  signals: PersonaSignals,
  existing?: Partial<PersonaClassification>
): PersonaClassification {
  const revenueBand = signals.revenueBand ?? existing?.estimated_revenue_band;
  const risk = signals.industryRiskTier ?? existing?.industry_risk_tier;
  const jurisdiction = signals.primaryInterestJurisdiction ?? existing?.primary_interest_jurisdiction;

  const trackType =
    signals.trackType ??
    (existing?.track_type as TrackType | undefined) ??
    trackTypeFromSignals({ revenueBand, wantsRelocation: signals.wantsRelocation });

  const funnelTrack = funnelTrackFromSignals({ revenueBand, trackType });

  const tagParts = [
    trackType === 'gulf' ? 'Gulf Relocator' : 'Offshore Optimizer',
    risk === 'high' ? 'high-risk industry' : undefined,
    jurisdiction ? `interested in ${jurisdiction}` : undefined,
  ].filter(Boolean);

  return {
    persona_tag: tagParts.join(', '),
    track_type: trackType,
    funnel_track: funnelTrack,
    estimated_revenue_band: revenueBand,
    industry_risk_tier: risk,
    primary_interest_jurisdiction: jurisdiction,
  };
}
