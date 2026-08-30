import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { and, desc, eq, ne } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { companies } from '@/lib/db/schema';

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('gcc_session')?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { annual_revenue_estimate, fiscal_year_end } = await request.json();
  if (typeof annual_revenue_estimate !== 'number' || annual_revenue_estimate < 0) {
    return NextResponse.json({ error: 'annual_revenue_estimate must be a non-negative number' }, { status: 400 });
  }

  const [company] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.user_id, session.userId), ne(companies.status, 'lead')))
    .orderBy(desc(companies.created_at))
    .limit(1);

  if (!company) {
    return NextResponse.json({ error: 'No active company found' }, { status: 404 });
  }

  const [updated] = await db
    .update(companies)
    .set({ annual_revenue_estimate, fiscal_year_end: fiscal_year_end ?? company.fiscal_year_end, updated_at: new Date() })
    .where(eq(companies.id, company.id))
    .returning();

  return NextResponse.json({ company: updated });
}
