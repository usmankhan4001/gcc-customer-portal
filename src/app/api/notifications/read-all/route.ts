import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';

export async function PATCH() {
  const cookieStore = await cookies();
  const token = cookieStore.get('gcc_session')?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await db.update(notifications).set({ is_read: true }).where(eq(notifications.user_id, session.userId));

  return NextResponse.json({ success: true });
}
