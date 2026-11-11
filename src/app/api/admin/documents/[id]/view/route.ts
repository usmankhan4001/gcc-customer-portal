import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companies, documentAccessLog, documents } from '@/lib/db/schema';
import { requireStaff } from '@/lib/staff/session';
import { recordAudit } from '@/lib/staff/audit';
import { canOnClient, type Capability } from '@/lib/staff/roles';
import { getPresignedDownloadUrl } from '@/lib/r2';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IDENTITY = new Set(['passport', 'proof_of_address']);

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/documents/:id/view -> { url }
 * Hands back a link that works for one minute, and records who asked. Staff never get a permanent link or a
 * bulk download; every view of a passport or other document is one row in the audit log.
 */
export async function GET(_request: Request, { params }: Params) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [company] = doc.company_id
    ? await db.select({ assigned_to: companies.assigned_to }).from(companies).where(eq(companies.id, doc.company_id)).limit(1)
    : [];
  const needed: Capability = IDENTITY.has(doc.category) ? 'kyc.view' : 'clients.view';
  if (!canOnClient(staff.dbRole, needed, staff.userId, company?.assigned_to)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Log first: if the log cannot be written, no link is issued.
  await db.transaction(async (tx) => {
    await recordAudit(tx, staff, {
      action: 'document.viewed',
      entityType: 'document',
      entityId: id,
      companyId: doc.company_id,
      details: { fileName: doc.file_name, category: doc.category },
    });
    await tx.insert(documentAccessLog).values({ document_id: id, accessed_by: staff.userId, action: 'viewed' });
  });

  const url = await getPresignedDownloadUrl(doc.r2_key, 60);
  return NextResponse.json({ url }, { headers: { 'Cache-Control': 'no-store' } });
}
