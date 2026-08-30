import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db.select().from(leads).orderBy(desc(leads.created_at)).limit(200);
  return NextResponse.json({ leads: rows });
}
