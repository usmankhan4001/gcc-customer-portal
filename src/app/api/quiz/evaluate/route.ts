import { NextResponse } from 'next/server';

import { JURISDICTION_ATTRIBUTES, type Goal, type JurisdictionId, type Timeline } from '@/lib/tools/jurisdiction-quiz';

interface QuizRequest {
  goal: Goal;
  budget_band: 'under_50k' | '50k_150k' | '150k_500k' | 'over_500k';
  timeline: Timeline;
  wants_relocation: boolean;
}

interface JurisdictionScore {
  jurisdiction: JurisdictionId;
  name: string;
  score: number;
  rationale: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QuizRequest;
    const { goal, timeline, wants_relocation } = body;

    const scores: JurisdictionScore[] = (Object.keys(JURISDICTION_ATTRIBUTES) as JurisdictionId[]).map(
      (id) => {
        const attrs = JURISDICTION_ATTRIBUTES[id];
        let score = 50;
        const reasons: string[] = [];

        if (goal === 'tax_optimization' && (attrs.taxRate.startsWith('0') )) {
          score += 20;
          reasons.push(`${attrs.taxRate} tax rate`);
        }
        if (goal === 'banking_access' && attrs.bankingDifficulty === 'easy') {
          score += 20;
          reasons.push('easier banking access');
        }
        if (goal === 'relocation' && attrs.residencyPathway) {
          score += 20;
          reasons.push('has a residency pathway');
        }
        if (goal === 'privacy' && (id === 'bvi' || id === 'uae')) {
          score += 15;
          reasons.push('strong privacy/nominee options');
        }

        if (wants_relocation && attrs.residencyPathway) {
          score += 15;
          reasons.push('residency available if you relocate');
        }
        if (!wants_relocation && !attrs.residencyPathway) {
          score += 5;
        }

        if (timeline === 'asap' && attrs.setupDays <= 20) {
          score += 15;
          reasons.push(`fast setup (~${attrs.setupDays} days)`);
        } else if (timeline === 'no_rush') {
          score += 2;
        }

        return {
          jurisdiction: id,
          name: attrs.name,
          score,
          rationale: reasons.length ? reasons.join(', ') : `${attrs.taxRate} tax, ~${attrs.setupDays} day setup`,
        };
      }
    );

    scores.sort((a, b) => b.score - a.score);

    return NextResponse.json({ recommendations: scores.slice(0, 3) });
  } catch (error) {
    console.error('[api/quiz/evaluate] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
