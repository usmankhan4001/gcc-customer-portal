import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth';
import { toStaffRole, type StaffRole } from './roles';

export interface StaffSession {
  userId: string;
  name: string | null;
  /** The role as stored (may be a legacy `admin` / `staff`); pass this to the permission helpers. */
  dbRole: string;
  role: StaffRole;
}

/**
 * The signed-in staff member, or null. The role and the disabled flag are read from the database on every
 * call, not from the cookie, so disabling an account or changing a role takes effect immediately instead of
 * when the 7-day cookie expires ("offboarding disables the account the same day").
 * Route handlers under /api are not covered by the middleware, so each staff route calls this itself.
 */
export async function requireStaff(): Promise<StaffSession | null> {
  const token = (await cookies()).get('gcc_session')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload?.userId) return null;

  const [user] = await db
    .select({ id: users.id, name: users.full_name, role: users.role, status: users.account_status })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);
  if (!user || user.status !== 'active') return null;
  const role = toStaffRole(user.role);
  return role ? { userId: user.id, name: user.name, dbRole: user.role, role } : null;
}
