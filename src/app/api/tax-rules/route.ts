import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { jurisdictionTaxRules } from '@/lib/db/schema';

// Public, read-only reference data (tax rates/thresholds/deadlines) — used
// by the VAT scorer, compliance calendar, and the dashboard's
// ComplianceSnapshot so none of them duplicate this table's numbers.
export async function GET(request: NextRequest) {
  const jurisdiction = request.nextUrl.searchParams.get('jurisdiction');
  if (!jurisdiction) {
    return NextResponse.json({ error: 'jurisdiction query param is required' }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(jurisdictionTaxRules)
    .where(eq(jurisdictionTaxRules.jurisdiction, jurisdiction as any));

  return NextResponse.json({ rules: rows });
}
