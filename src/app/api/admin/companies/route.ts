import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireStaff, AuthError } from '@/lib/auth';
import type { Company, CompanyStatus } from '@/lib/db/schema';

const VALID_STATUSES: CompanyStatus[] = [
  'lead', 'onboarding', 'official_kyc_pending', 'filing_in_progress',
  'bank_opening', 'active', 'renewal_due', 'suspended', 'archived',
];

// ---------------------------------------------------------------------------
// GET /api/admin/companies — every company, for the Kanban board and the
// client list. Optional ?status= and ?assigned_to= filters.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireStaff(request);

    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assigned_to');

    if (status && !VALID_STATUSES.includes(status as CompanyStatus)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
    }

    const conditions: string[] = [];
    const values: string[] = [];
    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }
    if (assignedTo) {
      values.push(assignedTo);
      conditions.push(`assigned_to = $${values.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const companies = await query<Company & { owner_name: string; owner_email: string; owner_whatsapp: string }>(
      `SELECT c.*, u.full_name AS owner_name, u.email AS owner_email, u.whatsapp_number AS owner_whatsapp
       FROM companies c JOIN users u ON u.id = c.user_id
       ${where}
       ORDER BY c.updated_at DESC`,
      values
    );

    return NextResponse.json({ companies });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[admin/companies] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
