import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('gcc_session')?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { endpoint, keys } = await request.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint))
    .limit(1);

  if (existing) {
    await db
      .update(pushSubscriptions)
      .set({ user_id: session.userId, p256dh_key: keys.p256dh, auth_key: keys.auth })
      .where(eq(pushSubscriptions.id, existing.id));
  } else {
    await db.insert(pushSubscriptions).values({
      user_id: session.userId,
      endpoint,
      p256dh_key: keys.p256dh,
      auth_key: keys.auth,
    });
  }

  return NextResponse.json({ success: true });
}
