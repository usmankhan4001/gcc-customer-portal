import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { requireStaff } from '@/lib/staff/session';
import { recordAudit } from '@/lib/staff/audit';
import { decryptSecret, encryptSecret, generateTotpSecret, otpauthUri, verifyTotp } from '@/lib/staff/totp';
import { clientIp, rateLimit } from '@/lib/rate-limit';

/**
 * Two-factor setup for the signed-in staff member.
 *   POST { action: 'start' }            -> { secret, uri }   (stores a pending secret; not active yet)
 *   POST { action: 'confirm', code }    -> { enabled: true } (the code proves the authenticator app works)
 * After this, /api/auth/login asks for the 6-digit code on every sign-in.
 */
export async function POST(request: NextRequest) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { action?: unknown; code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const [me] = await db
    .select({ email: users.email, secret: users.totp_secret, enabled: users.totp_enabled })
    .from(users)
    .where(eq(users.id, staff.userId))
    .limit(1);
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (body.action === 'start') {
    // Replacing a live authenticator needs a super admin reset (Staff accounts), so a stolen session
    // cannot swap in the thief's own app.
    if (me.enabled) return NextResponse.json({ error: 'Two-factor is already on. Ask a Super Admin to reset it.' }, { status: 409 });
    const secret = generateTotpSecret();
    await db.update(users).set({ totp_secret: encryptSecret(secret), updated_at: new Date() }).where(eq(users.id, staff.userId));
    return NextResponse.json({ secret, uri: otpauthUri(secret, me.email ?? staff.name ?? 'staff') }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (body.action === 'confirm') {
    if (!rateLimit(`totp-confirm:${staff.userId}|${clientIp(request)}`, 8, 15 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
    }
    if (me.enabled || !me.secret) return NextResponse.json({ error: 'Start the setup first.' }, { status: 409 });
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    if (!verifyTotp(decryptSecret(me.secret), code)) {
      return NextResponse.json({ error: 'That code is not right. Check the app and try the new code.' }, { status: 400 });
    }
    await db.transaction(async (tx) => {
      await tx.update(users).set({ totp_enabled: true, updated_at: new Date() }).where(eq(users.id, staff.userId));
      await recordAudit(tx, staff, { action: 'user.totp_enabled', entityType: 'user', entityId: staff.userId });
    });
    return NextResponse.json({ enabled: true });
  }

  return NextResponse.json({ error: 'action must be "start" or "confirm"' }, { status: 400 });
}
