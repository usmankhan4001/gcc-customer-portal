import { headers } from 'next/headers';

export interface ServerSession {
  userId: string;
  email: string;
  role: string;
}

/**
 * Reads the identity headers src/middleware.ts sets on every request to a
 * protected route (x-user-id/x-user-email/x-user-role) after verifying the
 * gcc_session JWT — so server components don't need to re-verify the token
 * themselves. Only valid inside routes middleware actually protects.
 */
export async function getServerSession(): Promise<ServerSession | null> {
  const headerList = await headers();
  const userId = headerList.get('x-user-id');
  if (!userId) return null;

  return {
    userId,
    email: headerList.get('x-user-email') ?? '',
    role: headerList.get('x-user-role') ?? 'client',
  };
}
