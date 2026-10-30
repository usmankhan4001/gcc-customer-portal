import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export interface ServerSession {
  userId: string;
  email: string;
  role: string;
}

/**
 * Identity of the current request, taken from the verified gcc_session cookie.
 * Never read from request headers: clients can send any header, and /api/ paths
 * are not covered by src/middleware.ts.
 */
export async function getServerSession(): Promise<ServerSession | null> {
  const token = (await cookies()).get('gcc_session')?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload?.userId) return null;

  return { userId: payload.userId, email: payload.email ?? '', role: payload.role ?? 'client' };
}
