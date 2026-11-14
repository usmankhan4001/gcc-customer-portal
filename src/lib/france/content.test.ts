import { describe, expect, it } from 'vitest';
import { captureRequestSchema } from '@/lib/tools/lead-capture';
import { PAGES, REVIEW_MODE, UI, pagePath, type Locale } from './content';

function strings(locale: Locale): string[] {
  const out: string[] = [];
  for (const p of PAGES) {
    const c = p[locale];
    out.push(c.adLine, c.h1, c.lede, c.cta);
    for (const s of c.sections) out.push(s.title, ...(s.body ? [s.body] : []), ...(s.bullets ?? []));
  }
  out.push(UI[locale].disclaimer, UI[locale].trust, UI[locale].stayBody, UI[locale].okBody);
  return out;
}

describe('France landing content', () => {
  it('has six pages with unique slugs and both languages', () => {
    expect(PAGES).toHaveLength(6);
    expect(new Set(PAGES.map((p) => p.slug)).size).toBe(6);
  });

  it('keeps French and English structurally identical', () => {
    for (const p of PAGES) {
      expect(p.en.sections.length, p.slug).toBe(p.fr.sections.length);
      p.fr.sections.forEach((s, i) => expect(p.en.sections[i].bullets?.length, `${p.slug}#${i}`).toBe(s.bullets?.length));
    }
  });

  it.each(['fr', 'en'] as const)('never promises a guarantee (%s)', (locale) => {
    for (const s of strings(locale)) {
      if (/garant|guarant/i.test(s)) expect(s, s).toMatch(/\b(ne|pas|aucune|not|no|cannot)\b/i);
    }
  });

  it.each(['fr', 'en'] as const)('shows no prices or fixed timelines until the pricing decisions close (%s)', (locale) => {
    for (const s of strings(locale)) {
      expect(s, s).not.toMatch(/[€$£]\s?\d|\d\s?(€|\$|£|USD|EUR|HKD)/);
      expect(s, s).not.toMatch(/\d+\s?(jours|days|semaines|weeks)/i);
    }
  });

  it('only mentions a zero-tax figure together with its condition', () => {
    for (const locale of ['fr', 'en'] as const) {
      for (const s of strings(locale)) {
        if (/\b0\s?%/.test(s)) expect(s, s).toMatch(/(pas automatiquement|en général|generally|not automatically|Generally not|En général non)/i);
      }
    }
  });

  it('builds the review paths', () => {
    expect(pagePath('tarifs-hong-kong', 'fr')).toBe('/france/tarifs-hong-kong');
    expect(pagePath('tarifs-hong-kong', 'en')).toBe('/france/en/tarifs-hong-kong');
  });

  it('stays noindex until reviewed', () => {
    expect(REVIEW_MODE).toBe(true);
  });

  it('lead payload from the form passes the capture schema', () => {
    const res = captureRequestSchema.safeParse({
      source_tool: 'france_landing',
      email: 'test@example.com',
      tool_input: { landing_slug: 'tarifs-hong-kong', locale: 'fr', residency: 'moving_12m', consent: false },
      tool_result: { qualified: true },
      signals: { primaryInterestJurisdiction: 'hong-kong', wantsRelocation: true },
    });
    expect(res.success).toBe(true);
  });
});
