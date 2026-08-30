import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { documents, shareableLinks } from '@/lib/db/schema';

const LINK_TTL_DAYS = 7;

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('gcc_session')?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { document_id } = await request.json();
  if (!document_id) {
    return NextResponse.json({ error: 'document_id is required' }, { status: 400 });
  }

  const [document] = await db.select().from(documents).where(eq(documents.id, document_id)).limit(1);
  if (!document || document.user_id !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const shareToken = randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + LINK_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(shareableLinks).values({
    document_id: document.id,
    token: shareToken,
    expires_at: expiresAt,
    created_by: session.userId,
  });

  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005';
  return NextResponse.json({ url: `${origin}/vault/shared/${shareToken}`, expires_at: expiresAt });
}
