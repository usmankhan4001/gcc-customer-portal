import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companies, documents } from '@/lib/db/schema';
import { requireStaff } from '@/lib/staff/session';
import { recordAudit } from '@/lib/staff/audit';
import { canOnClient } from '@/lib/staff/roles';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Params = { params: Promise<{ id: string }> };

/** POST /api/admin/documents/:id/review  { decision: 'accept' | 'reject', reason?: string } */
export async function POST(request: NextRequest, { params }: Params) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let body: { decision?: unknown; reason?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  if (body.decision !== 'accept' && body.decision !== 'reject') {
    return NextResponse.json({ error: 'decision must be "accept" or "reject"' }, { status: 400 });
  }
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : '';
  if (body.decision === 'reject' && reason.length < 3) {
    return NextResponse.json({ error: 'Give a reason for the rejection.' }, { status: 400 });
  }

  const result = await db.transaction(async (tx) => {
    const [doc] = await tx.select().from(documents).where(eq(documents.id, id)).for('update').limit(1);
    if (!doc) return { status: 404 as const, error: 'Not found' };

    const [company] = doc.company_id
      ? await tx.select({ assigned_to: companies.assigned_to }).from(companies).where(eq(companies.id, doc.company_id)).limit(1)
      : [];
    // A document with no company has no assignee, so only roles that see every client may review it.
    if (!canOnClient(staff.dbRole, 'documents.review', staff.userId, company?.assigned_to)) {
      return { status: 404 as const, error: 'Not found' };
    }
    if (doc.kind !== 'client_upload') {
      return { status: 409 as const, error: 'Only client uploads are reviewed.' };
    }

    const accept = body.decision === 'accept';
    const now = new Date();
    await tx
      .update(documents)
      .set({
        review_status: accept ? 'accepted' : 'rejected',
        reviewed_by: staff.userId,
        reviewed_at: now,
        rejection_reason: accept ? null : reason,
      })
      .where(eq(documents.id, id));
    await recordAudit(tx, staff, {
      action: accept ? 'document.accepted' : 'document.rejected',
      entityType: 'document',
      entityId: id,
      companyId: doc.company_id,
      details: { fileName: doc.file_name, category: doc.category, ...(accept ? {} : { reason }) },
    });
    return { status: 200 as const, reviewStatus: accept ? 'accepted' : 'rejected' };
  });

  if (result.status === 200) return NextResponse.json({ reviewStatus: result.reviewStatus });
  return NextResponse.json({ error: result.error }, { status: result.status });
}
