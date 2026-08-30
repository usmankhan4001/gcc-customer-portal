import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { requireStaff, AuthError } from '@/lib/auth';
import type { Company, CompanyStatus } from '@/lib/db/schema';

const VALID_STATUSES: CompanyStatus[] = [
  'lead', 'onboarding', 'official_kyc_pending', 'filing_in_progress',
  'bank_opening', 'active', 'renewal_due', 'suspended', 'archived',
];

interface PatchBody {
  status?: CompanyStatus;
  assigned_to?: string | null;
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/companies/:id — Kanban drag-and-drop (status) and
// reassignment. Staff only.
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await requireStaff(request);
    const { id } = await params;
    const body = (await request.json()) as PatchBody;

    const existing = await queryOne<Company>(`SELECT id FROM companies WHERE id = $1`, [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
    }
    if (body.status === undefined && body.assigned_to === undefined) {
      return NextResponse.json({ error: 'Provide at least one of: status, assigned_to' }, { status: 400 });
    }

    const sets: string[] = [];
    const values: (string | null)[] = [];
    if (body.status !== undefined) {
      values.push(body.status);
      sets.push(`status = $${values.length}`);
    }
    if (body.assigned_to !== undefined) {
      values.push(body.assigned_to);
      sets.push(`assigned_to = $${values.length}`);
    }
    values.push(id);

    const [updated] = await query<Company>(
      `UPDATE companies SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );

    return NextResponse.json({ company: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[admin/companies/:id] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
