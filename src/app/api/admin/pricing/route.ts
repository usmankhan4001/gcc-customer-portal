import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { jurisdictionPricing } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db.select().from(jurisdictionPricing).orderBy(jurisdictionPricing.jurisdiction);
  return NextResponse.json({ pricing: rows });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, price_usd } = await request.json();
  if (!id || typeof price_usd !== 'number' || price_usd < 0) {
    return NextResponse.json({ error: 'id and a non-negative price_usd (cents) are required' }, { status: 400 });
  }

  const [updated] = await db
    .update(jurisdictionPricing)
    .set({ price_usd, updated_by: admin.userId, updated_at: new Date() })
    .where(eq(jurisdictionPricing.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ pricing: updated });
}
