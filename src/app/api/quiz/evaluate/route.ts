import { NextResponse } from 'next/server';

type Goal = 'tax_optimization' | 'banking_access' | 'relocation' | 'privacy' | 'exploring';
type Timeline = 'asap' | 'few_months' | 'no_rush';

interface QuizRequest {
  goal: Goal;
  budget_band: 'under_50k' | '50k_150k' | '150k_500k' | 'over_500k';
  timeline: Timeline;
  wants_relocation: boolean;
}

interface JurisdictionScore {
  jurisdiction: 'uae' | 'hong-kong' | 'singapore' | 'bahrain' | 'ireland' | 'bvi';
  name: string;
  score: number;
  rationale: string;
}

const JURISDICTION_ATTRIBUTES: Record<
  JurisdictionScore['jurisdiction'],
  { name: string; taxRate: string; setupDays: number; bankingDifficulty: 'easy' | 'medium' | 'hard'; residencyPathway: boolean }
> = {
  uae: { name: 'UAE', taxRate: '0-9%', setupDays: 30, bankingDifficulty: 'medium', residencyPathway: true },
  'hong-kong': { name: 'Hong Kong', taxRate: '0% on foreign income', setupDays: 18, bankingDifficulty: 'hard', residencyPathway: false },
  singapore: { name: 'Singapore', taxRate: '5-17%', setupDays: 18, bankingDifficulty: 'medium', residencyPathway: true },
  bahrain: { name: 'Bahrain', taxRate: '0%', setupDays: 30, bankingDifficulty: 'medium', residencyPathway: true },
  ireland: { name: 'Ireland', taxRate: '12.5%', setupDays: 3, bankingDifficulty: 'easy', residencyPathway: true },
  bvi: { name: 'BVI & Cayman', taxRate: '0%', setupDays: 45, bankingDifficulty: 'hard', residencyPathway: false },
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QuizRequest;
    const { goal, timeline, wants_relocation } = body;

    const scores: JurisdictionScore[] = (Object.keys(JURISDICTION_ATTRIBUTES) as JurisdictionScore['jurisdiction'][]).map(
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
