import { describe, expect, it } from 'vitest';
import {
  QUIZ_GOALS,
  QUIZ_GOAL_OPTIONS,
  QUIZ_TIMELINES,
  QUIZ_TIMELINE_OPTIONS,
  mapQuizResponse,
} from './jurisdiction-quiz';

describe('quiz options (AC4)', () => {
  it.each(QUIZ_GOAL_OPTIONS)('goal $value is understood by the server', ({ value }) => {
    expect(QUIZ_GOALS).toContain(value);
  });

  it.each(QUIZ_TIMELINE_OPTIONS)('timeline $value is understood by the server', ({ value }) => {
    expect(QUIZ_TIMELINES).toContain(value);
  });
});

describe('mapQuizResponse (AC4, AC5)', () => {
  it('maps score and rationale from the real response shape', () => {
    const cards = mapQuizResponse({
      recommendations: [{ jurisdiction: 'ireland', name: 'Ireland', score: 85, rationale: 'easier banking access' }],
    });
    expect(cards).toEqual([
      {
        jurisdiction: 'ireland',
        name: 'Ireland',
        matchScore: 85,
        whyFit: 'easier banking access',
        corporateTaxRate: '12.5%',
        timelineDays: '~3 days',
        serviceHref: '/services',
      },
    ]);
  });

  it('returns null for error bodies, empty lists and unknown shapes', () => {
    expect(mapQuizResponse({ error: 'Internal server error' })).toBeNull();
    expect(mapQuizResponse({ recommendations: [] })).toBeNull();
    expect(mapQuizResponse({ recommendations: [{ jurisdiction: 'uae', matchScore: 1, whyFit: 'x' }] })).toBeNull();
    expect(mapQuizResponse(null)).toBeNull();
  });
});
