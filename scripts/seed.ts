/**
 * One-off dev seed for tables that need starter data to make the app usable
 * before real numbers arrive from the team (see "Open inputs needed" in the
 * rebuild plan). Safe to re-run — upserts on the natural key.
 *
 * Run with: npx tsx scripts/seed.ts   (requires a real DATABASE_URL)
 */
import 'dotenv/config';
import { db } from '../src/lib/db';
import { jurisdictionPricing, jurisdictionTaxRules } from '../src/lib/db/schema';
import { and, eq } from 'drizzle-orm';

// Placeholder pricing — mirrors what's currently hardcoded in
// src/app/(authenticated)/services/page.tsx and src/app/checkout/[id]/page.tsx.
// Only Hong Kong has confirmed real numbers per Discovery docs; everything
// else here is a placeholder until Farooq provides the real matrix.
const PRICING: { jurisdiction: string; tier: string; price_usd: number }[] = [
  { jurisdiction: 'uae', tier: 'tier_1_self', price_usd: 150000 },
  { jurisdiction: 'uae', tier: 'tier_2_nominee', price_usd: 350000 },
  { jurisdiction: 'bahrain', tier: 'tier_1_self', price_usd: 150000 },
  { jurisdiction: 'bahrain', tier: 'tier_2_nominee', price_usd: 350000 },
  { jurisdiction: 'hong-kong', tier: 'tier_1_self', price_usd: 150000 },
  { jurisdiction: 'hong-kong', tier: 'tier_2_nominee', price_usd: 350000 },
  { jurisdiction: 'singapore', tier: 'tier_1_self', price_usd: 200000 },
  { jurisdiction: 'singapore', tier: 'tier_2_nominee', price_usd: 400000 },
  { jurisdiction: 'ireland', tier: 'tier_1_self', price_usd: 150000 },
  { jurisdiction: 'ireland', tier: 'tier_2_nominee', price_usd: 350000 },
  { jurisdiction: 'bvi', tier: 'tier_1_self', price_usd: 250000 },
  { jurisdiction: 'bvi', tier: 'tier_2_nominee', price_usd: 450000 },
];

// Placeholder tax rules — directionally correct public figures, not verified
// with Farooq. The compliance snapshot must not ship to real users against
// this data without a review pass.
const TAX_RULES: (typeof jurisdictionTaxRules.$inferInsert)[] = [
  {
    jurisdiction: 'uae',
    tax_type: 'corporate',
    rate_percent: 900, // 9.00% — see convention note above
    threshold_amount: 37500000, // AED 375,000 profit threshold, in fils-equivalent cents
    currency: 'aed',
    filing_frequency: 'annual',
    filing_deadline_rule: '9 months after fiscal year end',
    notes: 'PLACEHOLDER — verify with Farooq. 0% below the profit threshold.',
  },
  {
    jurisdiction: 'uae',
    tax_type: 'vat',
    rate_percent: 500, // 5.00%
    threshold_amount: 37500000, // AED 375,000 mandatory registration threshold
    currency: 'aed',
    filing_frequency: 'quarterly',
    filing_deadline_rule: '28 days after the end of the tax period',
    notes: 'PLACEHOLDER — verify with Farooq.',
  },
  {
    jurisdiction: 'hong-kong',
    tax_type: 'corporate',
    rate_percent: 825, // 8.25% on first HKD 2M profit
    threshold_amount: null,
    currency: 'hkd',
    filing_frequency: 'annual',
    filing_deadline_rule: 'within 1 month of the profits tax return issue date',
    notes: 'PLACEHOLDER — two-tier rate (8.25%/16.5%) simplified to the lower tier. Verify with Farooq.',
  },
  {
    jurisdiction: 'singapore',
    tax_type: 'corporate',
    rate_percent: 1700, // 17.00%
    threshold_amount: null,
    currency: 'sgd',
    filing_frequency: 'annual',
    filing_deadline_rule: 'by 30 November following the fiscal year end',
    notes: 'PLACEHOLDER — verify with Farooq.',
  },
];

async function main() {
  console.log('Seeding jurisdiction_pricing...');
  for (const row of PRICING) {
    const existing = await db
      .select()
      .from(jurisdictionPricing)
      .where(and(eq(jurisdictionPricing.jurisdiction, row.jurisdiction as any), eq(jurisdictionPricing.tier, row.tier as any)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(jurisdictionPricing)
        .set({ price_usd: row.price_usd, updated_at: new Date() })
        .where(eq(jurisdictionPricing.id, existing[0].id));
    } else {
      await db.insert(jurisdictionPricing).values(row as any);
    }
  }

  console.log('Seeding jurisdiction_tax_rules...');
  for (const row of TAX_RULES) {
    const existing = await db
      .select()
      .from(jurisdictionTaxRules)
      .where(and(eq(jurisdictionTaxRules.jurisdiction, row.jurisdiction), eq(jurisdictionTaxRules.tax_type, row.tax_type)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(jurisdictionTaxRules)
        .set({ ...row, updated_at: new Date() })
        .where(eq(jurisdictionTaxRules.id, existing[0].id));
    } else {
      await db.insert(jurisdictionTaxRules).values(row);
    }
  }

  console.log('Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
