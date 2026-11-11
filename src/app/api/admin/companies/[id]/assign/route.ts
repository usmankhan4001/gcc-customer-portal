import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companies, users } from '@/lib/db/schema';
import { requireStaff } from '@/lib/staff/session';
import { recordAudit } from '@/lib/staff/audit';
import { can, canOnClient, toStaffRole } from '@/lib/staff/roles';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Params = { params: Promise<{ id: string }> };

/** POST /api/admin/companies/:id/assign  { userId: string | null }  (null = unassign) */
export async function POST(request: NextRequest, { params }: Params) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!can(staff.dbRole, 'clients.assign')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let body: { userId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const target = body.userId === null ? null : typeof body.userId === 'string' && UUID.test(body.userId) ? body.userId : undefined;
  if (target === undefined) return NextResponse.json({ error: 'userId must be a user id or null' }, { status: 400 });

  const result = await db.transaction(async (tx) => {
    const [company] = await tx.select().from(companies).where(eq(companies.id, id)).for('update').limit(1);
    if (!company || !canOnClient(staff.dbRole, 'clients.view', staff.userId, company.assigned_to)) {
      return { status: 404 as const, error: 'Not found' };
    }
    if (target) {
      const [person] = await tx
        .select({ role: users.role, status: users.account_status, name: users.full_name })
        .from(users)
        .where(eq(users.id, target))
        .limit(1);
      if (!person || person.status !== 'active' || !toStaffRole(person.role)) {
        return { status: 409 as const, error: 'Choose an active staff member.' };
      }
    }
    await tx.update(companies).set({ assigned_to: target, updated_at: new Date() }).where(eq(companies.id, id));
    await recordAudit(tx, staff, {
      action: 'company.assigned',
      entityType: 'company',
      entityId: id,
      companyId: id,
      details: { from: company.assigned_to, to: target },
    });
    return { status: 200 as const };
  });

  if (result.status === 200) return NextResponse.json({ ok: true });
  return NextResponse.json({ error: result.error }, { status: result.status });
}
