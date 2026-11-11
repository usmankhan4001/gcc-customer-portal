import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth';
import { requireStaff } from '@/lib/staff/session';
import { recordAudit } from '@/lib/staff/audit';
import { can, STAFF_ROLES, toStaffRole } from '@/lib/staff/roles';

/**
 * Staff accounts (Super Admin only). Accounts are disabled, never deleted, so history keeps pointing at a person.
 *   create  { email, fullName, whatsapp, role }   -> { id, tempPassword }  (shown once; they change it after first sign-in)
 *   role    { userId, role }
 *   disable | enable | reset_2fa | reset_password   { userId }
 * Every action is written to the audit log in the same transaction.
 */
export async function POST(request: NextRequest) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!can(staff.dbRole, 'staff.manage')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

  if (body.action === 'create') {
    const email = str(body.email).toLowerCase();
    const fullName = str(body.fullName);
    const whatsapp = str(body.whatsapp);
    const role = str(body.role);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400 });
    if (!fullName) return NextResponse.json({ error: 'Enter the full name.' }, { status: 400 });
    if (!/^\+?\d{7,15}$/.test(whatsapp)) return NextResponse.json({ error: 'Enter a phone number with country code, digits only.' }, { status: 400 });
    if (!(STAFF_ROLES as readonly string[]).includes(role)) return NextResponse.json({ error: 'Choose a role.' }, { status: 400 });

    const tempPassword = randomBytes(9).toString('base64url');
    try {
      const id = await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(users)
          .values({ email, full_name: fullName, whatsapp_number: whatsapp, role: role as (typeof users.$inferInsert)['role'], password_hash: hashPassword(tempPassword) })
          .returning({ id: users.id });
        await recordAudit(tx, staff, { action: 'staff.created', entityType: 'user', entityId: row.id, details: { email, role } });
        return row.id;
      });
      return NextResponse.json({ id, tempPassword }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (e) {
      if (String((e as { code?: string }).code) === '23505') return NextResponse.json({ error: 'That email or phone number already has an account.' }, { status: 409 });
      throw e;
    }
  }

  const userId = str(body.userId);
  const [target] = userId ? await db.select().from(users).where(eq(users.id, userId)).limit(1) : [];
  if (!target || !toStaffRole(target.role)) return NextResponse.json({ error: 'Staff member not found.' }, { status: 404 });

  // Never leave the portal without an active Super Admin.
  const losesSuperAdmin = async () => {
    if (toStaffRole(target.role) !== 'super_admin' || target.account_status !== 'active') return false;
    const others = await db
      .select({ id: users.id })
      .from(users)
      .where(and(inArray(users.role, ['super_admin', 'admin']), eq(users.account_status, 'active')));
    return others.filter((u) => u.id !== target.id).length === 0;
  };

  const action = body.action;
  if (action === 'role') {
    const role = str(body.role);
    if (!(STAFF_ROLES as readonly string[]).includes(role)) return NextResponse.json({ error: 'Choose a role.' }, { status: 400 });
    if (role !== toStaffRole(target.role) && (await losesSuperAdmin())) return NextResponse.json({ error: 'There must be at least one active Super Admin.' }, { status: 409 });
    await db.transaction(async (tx) => {
      await tx.update(users).set({ role: role as (typeof users.$inferInsert)['role'], updated_at: new Date() }).where(eq(users.id, target.id));
      await recordAudit(tx, staff, { action: 'staff.role_changed', entityType: 'user', entityId: target.id, details: { from: target.role, to: role } });
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'disable' || action === 'enable') {
    if (action === 'disable' && target.id === staff.userId) return NextResponse.json({ error: 'You cannot disable your own account.' }, { status: 409 });
    if (action === 'disable' && (await losesSuperAdmin())) return NextResponse.json({ error: 'There must be at least one active Super Admin.' }, { status: 409 });
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ account_status: action === 'disable' ? 'disabled' : 'active', disabled_at: action === 'disable' ? new Date() : null, updated_at: new Date() })
        .where(eq(users.id, target.id));
      await recordAudit(tx, staff, { action: `staff.${action}d`, entityType: 'user', entityId: target.id });
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'reset_2fa') {
    await db.transaction(async (tx) => {
      await tx.update(users).set({ totp_secret: null, totp_enabled: false, updated_at: new Date() }).where(eq(users.id, target.id));
      await recordAudit(tx, staff, { action: 'staff.totp_reset', entityType: 'user', entityId: target.id });
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'reset_password') {
    const tempPassword = randomBytes(9).toString('base64url');
    await db.transaction(async (tx) => {
      await tx.update(users).set({ password_hash: hashPassword(tempPassword), updated_at: new Date() }).where(eq(users.id, target.id));
      await recordAudit(tx, staff, { action: 'staff.password_reset', entityType: 'user', entityId: target.id });
    });
    return NextResponse.json({ tempPassword }, { headers: { 'Cache-Control': 'no-store' } });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
