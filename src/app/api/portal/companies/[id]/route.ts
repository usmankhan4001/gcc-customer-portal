import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { requireUser, AuthError, isStaffRole } from '@/lib/auth';
import type { Company, Milestone, Document, Order, Renewal } from '@/lib/db/schema';

// ---------------------------------------------------------------------------
// GET /api/portal/companies/:id — full detail for one company: the record
// itself plus its milestones, documents, orders and renewals. Scoped to the
// owning client, or any staff role.
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await requireUser(request);
    const { id } = await params;

    const company = await queryOne<Company>(`SELECT * FROM companies WHERE id = $1`, [id]);
    if (!company) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (!isStaffRole(user.role) && company.user_id !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [milestones, documents, orders, renewals] = await Promise.all([
      query<Milestone>(`SELECT * FROM milestones WHERE company_id = $1 ORDER BY stage_index ASC`, [id]),
      query<Document>(`SELECT * FROM documents WHERE company_id = $1 AND status = 'active' ORDER BY created_at DESC`, [id]),
      query<Order>(`SELECT * FROM orders WHERE company_id = $1 ORDER BY created_at DESC`, [id]),
      query<Renewal>(`SELECT * FROM renewals WHERE company_id = $1 ORDER BY due_date ASC`, [id]),
    ]);

    return NextResponse.json({ company, milestones, documents, orders, renewals });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[portal/companies/:id] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
