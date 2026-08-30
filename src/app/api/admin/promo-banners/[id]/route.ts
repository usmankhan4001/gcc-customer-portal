import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { promoBanners } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/admin-auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { active } = await request.json();
  const [banner] = await db
    .update(promoBanners)
    .set({ active: !!active })
    .where(eq(promoBanners.id, id))
    .returning();

  if (!banner) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ banner });
}
