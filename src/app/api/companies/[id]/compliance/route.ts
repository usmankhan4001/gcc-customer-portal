import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getServerSession } from '@/lib/session';
import { db } from '@/lib/db';
import { companies } from '@/lib/db/schema';
import {
  calculateStatutoryDeadlines,
  getComplianceSummary,
} from '@/lib/compliance/stateful-calendar';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
  }

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, id))
    .limit(1);

  if (
    !company ||
    (company.user_id !== session.userId &&
      session.role !== 'admin' &&
      session.role !== 'super_admin')
  ) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const referenceDateParam = searchParams.get('referenceDate') ?? undefined;
  const isVatParam = searchParams.get('isVatRegistered');
  const isVatRegistered = isVatParam !== null ? isVatParam === 'true' : undefined;

  const deadlines = calculateStatutoryDeadlines({
    jurisdiction: company.jurisdiction,
    incorporationDate: company.incorporation_date ?? company.created_at,
    fiscalYearEnd: company.fiscal_year_end ?? undefined,
    referenceDate: referenceDateParam,
    isVatRegistered,
  });

  const summary = getComplianceSummary(deadlines);

  return NextResponse.json({
    companyId: company.id,
    companyName: company.company_name,
    jurisdiction: company.jurisdiction,
    deadlines,
    summary,
  });
}
