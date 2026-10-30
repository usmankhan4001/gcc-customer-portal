import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { getServerSession } from '@/lib/session';

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { endpoint } = await request.json().catch(() => ({}));
  if (!endpoint) {
    return NextResponse.json({ error: 'endpoint is required' }, { status: 400 });
  }
  // Scoped to the caller: nobody can remove another user's subscription.
  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.user_id, session.userId)));
  return NextResponse.json({ success: true });
}
