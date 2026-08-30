import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireUser, AuthError } from '@/lib/auth';
import type { Company } from '@/lib/db/schema';

// ---------------------------------------------------------------------------
// GET /api/portal/companies — the logged-in user's own companies.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireUser(request);

    const companies = await query<Company>(
      `SELECT * FROM companies WHERE user_id = $1 ORDER BY created_at DESC`,
      [user.userId]
    );

    return NextResponse.json({ companies });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[portal/companies] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
