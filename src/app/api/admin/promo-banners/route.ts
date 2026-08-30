import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { promoBanners } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db.select().from(promoBanners).orderBy(desc(promoBanners.created_at));
  return NextResponse.json({ banners: rows });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, body, link_url } = await request.json();
  if (!title || !body) {
    return NextResponse.json({ error: 'title and body are required' }, { status: 400 });
  }

  const [banner] = await db
    .insert(promoBanners)
    .values({ title, body, link_url: link_url || null, created_by: admin.userId })
    .returning();

  return NextResponse.json({ banner });
}
