import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';
import { getPresignedDownloadUrl } from '@/lib/r2';
import { db } from '@/lib/db';
import { documentAccessLog, documents } from '@/lib/db/schema';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('gcc_session')?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [document] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!document || (document.user_id !== session.userId && session.role !== 'admin' && session.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const url = await getPresignedDownloadUrl(document.r2_key);

  await db.insert(documentAccessLog).values({
    document_id: document.id,
    accessed_by: session.userId,
    action: 'downloaded',
  });

  return NextResponse.json({ url });
}
