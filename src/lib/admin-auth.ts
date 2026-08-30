import { cookies } from 'next/headers';
import { verifyToken, type TokenPayload } from '@/lib/auth';

/**
 * Verifies the caller is an authenticated admin/super_admin via the
 * gcc_session cookie. Route handlers under /api/** aren't covered by
 * src/middleware.ts (it treats /api/ as a public path), so every
 * admin-only API route needs to check this itself.
 */
export async function requireAdmin(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('gcc_session')?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;
  if (payload.role !== 'admin' && payload.role !== 'super_admin') return null;

  return payload;
}
