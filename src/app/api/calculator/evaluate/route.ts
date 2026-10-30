import { NextRequest, NextResponse } from 'next/server';
import { HOME_TAX_RATES, JURISDICTION_TAX_RATES } from '@/lib/tools/tax-calculator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EvaluateRequest {
  country_residence: string;
  annual_profit: number;
  business_model: string;
  target_jurisdiction: string;
}

interface EvaluateResponse {
  home_tax_rate: number;
  home_tax_amount: number;
  optimized_tax_rate: number;
  optimized_tax_amount: number;
  net_annual_savings: number;
  recommended_tier: string;
  recommended_package_usd: number;
}

// ---------------------------------------------------------------------------
// Tax rate lookup (mock – replace with live data or database table)
// ---------------------------------------------------------------------------

// HOME_TAX_RATES and JURISDICTION_TAX_RATES live in src/lib/tools/tax-calculator.ts (shared with the page).

const TIER_RECOMMENDATIONS: Record<string, { tier: string; package_usd: number }> = {
  hong_kong: { tier: 'tier_2_nominee', package_usd: 3000 },
  singapore: { tier: 'tier_2_nominee', package_usd: 3500 },
  uae: { tier: 'tier_1_fdi', package_usd: 2500 },
  delaware_usa: { tier: 'tier_3_corporate', package_usd: 4000 },
  uk_limited: { tier: 'tier_2_nominee', package_usd: 3000 },
  estonia_e_residency: { tier: 'tier_1_fdi', package_usd: 2000 },
  georgia: { tier: 'tier_1_fdi', package_usd: 2200 },
  cyprus: { tier: 'tier_2_nominee', package_usd: 3200 },
  malta: { tier: 'tier_3_corporate', package_usd: 4500 },
  bvi: { tier: 'tier_3_corporate', package_usd: 5000 },
  cayman: { tier: 'tier_3_corporate', package_usd: 5500 },
  labuan: { tier: 'tier_2_nominee', package_usd: 2800 },
};

// ---------------------------------------------------------------------------
// POST /api/calculator/evaluate
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as EvaluateRequest;

    const { country_residence, annual_profit, business_model, target_jurisdiction } = body;

    if (!country_residence || !annual_profit || !target_jurisdiction) {
      return NextResponse.json(
        { error: 'Missing required fields: country_residence, annual_profit, target_jurisdiction' },
        { status: 400 }
      );
    }

    if (annual_profit <= 0) {
      return NextResponse.json(
        { error: 'annual_profit must be greater than zero' },
        { status: 400 }
      );
    }

    const countryCode = country_residence.toUpperCase();

    // TODO: Replace with database lookup or external tax API call
    const homeTaxRate = HOME_TAX_RATES[countryCode];
    if (homeTaxRate === undefined) {
      return NextResponse.json(
        { error: `Unsupported country code: ${countryCode}` },
        { status: 400 }
      );
    }

    const optimizedTaxRate = JURISDICTION_TAX_RATES[target_jurisdiction];
    if (optimizedTaxRate === undefined) {
      return NextResponse.json(
        { error: `Unsupported target jurisdiction: ${target_jurisdiction}` },
        { status: 400 }
      );
    }

    const homeTaxAmount = Math.round(annual_profit * homeTaxRate);
    const optimizedTaxAmount = Math.round(annual_profit * optimizedTaxRate);
    const netAnnualSavings = homeTaxAmount - optimizedTaxAmount;

    const recommendation = TIER_RECOMMENDATIONS[target_jurisdiction] ?? {
      tier: 'tier_1_fdi',
      package_usd: 2000,
    };

    const response: EvaluateResponse = {
      home_tax_rate: homeTaxRate,
      home_tax_amount: homeTaxAmount,
      optimized_tax_rate: optimizedTaxRate,
      optimized_tax_amount: optimizedTaxAmount,
      net_annual_savings: netAnnualSavings,
      recommended_tier: recommendation.tier,
      recommended_package_usd: recommendation.package_usd,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[calculator/evaluate] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
