import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { catalogAddons, catalogDocumentRequirements, catalogPackages } from '@/lib/db/schema';
import { requireStaff } from '@/lib/staff/session';
import { recordAudit } from '@/lib/staff/audit';
import { can } from '@/lib/staff/roles';
import { JURISDICTIONS } from '@/lib/jurisdictions';
import { parseAddonPatch, parseNewKey, parsePackagePatch, parseRequirementPatch, type Parsed } from '@/lib/catalog/admin';

/**
 * Catalog edits (prices.edit). Every change is written to the audit log in the same transaction, with the
 * row before and after, so "who changed this price and when" can always be answered.
 *   package.update | package.create | addon.update | addon.create | requirement.update | requirement.create
 * Nothing is hard-deleted: switch an item off instead, so old orders still read correctly.
 */
const TIERS = ['tier_1_self', 'tier_2_nominee', 'tier_3_shelf'] as const;
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export async function POST(request: NextRequest) {
  const staff = await requireStaff();
  if (!staff) return bad('Unauthorized', 401);
  if (!can(staff.dbRole, 'prices.edit')) return bad('Forbidden', 403);

  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return bad('Invalid request');
  }
  const action = str(b.action);
  const id = str(b.id);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const need = <T,>(p: Parsed<T>) => (p.ok ? null : bad(p.error));

  const done = async (kind: string, rowId: string, name: string, before: unknown, after: unknown, act: 'created' | 'updated') => {
    await db.transaction(async (tx) => {
      await recordAudit(tx, staff, { action: `catalog.${kind}_${act}`, entityType: 'catalog', entityId: rowId, details: { name, before, after } });
    });
  };

  try {
    if (action === 'package.update' || action === 'package.create') {
      const p = parsePackagePatch(b);
      if (!p.ok) return bad(p.error);
      if (action === 'package.update') {
        if (!isUuid) return bad('Package not found.', 404);
        const out = await db.transaction(async (tx) => {
          const [before] = await tx.select().from(catalogPackages).where(eq(catalogPackages.id, id)).limit(1);
          if (!before) return null;
          const [after] = await tx.update(catalogPackages).set({ ...p.value, updated_at: new Date() }).where(eq(catalogPackages.id, id)).returning();
          await recordAudit(tx, staff, { action: 'catalog.package_updated', entityType: 'catalog', entityId: id, details: { name: after.name, before, after } });
          return after;
        });
        return out ? NextResponse.json({ ok: true }) : bad('Package not found.', 404);
      }
      const jurisdiction = str(b.jurisdiction);
      const tier = str(b.tier);
      const key = parseNewKey(b.key);
      if (!JURISDICTIONS.some((j) => j.id === jurisdiction)) return bad('Choose a country.');
      if (!(TIERS as readonly string[]).includes(tier)) return bad('Choose who holds the shares.');
      const k = need(key);
      if (k) return k;
      const [row] = await db.insert(catalogPackages).values({ ...p.value, jurisdiction, tier: tier as (typeof TIERS)[number], key: (key as { value: string }).value }).returning();
      await done('package', row.id, row.name, null, row, 'created');
      return NextResponse.json({ ok: true });
    }

    if (action === 'addon.update' || action === 'addon.create') {
      const p = parseAddonPatch(b);
      if (!p.ok) return bad(p.error);
      if (action === 'addon.update') {
        if (!isUuid) return bad('Add-on not found.', 404);
        const out = await db.transaction(async (tx) => {
          const [before] = await tx.select().from(catalogAddons).where(eq(catalogAddons.id, id)).limit(1);
          if (!before) return null;
          const [after] = await tx.update(catalogAddons).set({ ...p.value, updated_at: new Date() }).where(eq(catalogAddons.id, id)).returning();
          await recordAudit(tx, staff, { action: 'catalog.addon_updated', entityType: 'catalog', entityId: id, details: { name: after.name, before, after } });
          return after;
        });
        return out ? NextResponse.json({ ok: true }) : bad('Add-on not found.', 404);
      }
      const key = parseNewKey(b.key);
      const k = need(key);
      if (k) return k;
      const [row] = await db.insert(catalogAddons).values({ ...p.value, key: (key as { value: string }).value }).returning();
      await done('addon', row.id, row.name, null, row, 'created');
      return NextResponse.json({ ok: true });
    }

    if (action === 'requirement.update' || action === 'requirement.create') {
      const p = parseRequirementPatch(b);
      if (!p.ok) return bad(p.error);
      if (action === 'requirement.update') {
        if (!isUuid) return bad('Requirement not found.', 404);
        const out = await db.transaction(async (tx) => {
          const [before] = await tx.select().from(catalogDocumentRequirements).where(eq(catalogDocumentRequirements.id, id)).limit(1);
          if (!before) return null;
          const [after] = await tx.update(catalogDocumentRequirements).set({ ...p.value, updated_at: new Date() }).where(eq(catalogDocumentRequirements.id, id)).returning();
          await recordAudit(tx, staff, { action: 'catalog.requirement_updated', entityType: 'catalog', entityId: id, details: { name: after.label, before, after } });
          return after;
        });
        return out ? NextResponse.json({ ok: true }) : bad('Requirement not found.', 404);
      }
      const jurisdiction = str(b.jurisdiction);
      const packageKey = str(b.package_key) || null;
      const key = parseNewKey(b.key);
      if (!JURISDICTIONS.some((j) => j.id === jurisdiction)) return bad('Choose a country.');
      const k = need(key);
      if (k) return k;
      const code = (key as { value: string }).value;
      // The unique index treats a missing package as "different every time", so check by hand.
      const [dup] = await db
        .select({ id: catalogDocumentRequirements.id })
        .from(catalogDocumentRequirements)
        .where(
          and(
            eq(catalogDocumentRequirements.jurisdiction, jurisdiction),
            eq(catalogDocumentRequirements.key, code),
            packageKey ? eq(catalogDocumentRequirements.package_key, packageKey) : isNull(catalogDocumentRequirements.package_key),
          ),
        )
        .limit(1);
      if (dup) return bad('That document already exists for this country and package.', 409);
      const [row] = await db.insert(catalogDocumentRequirements).values({ ...p.value, jurisdiction, package_key: packageKey, key: code }).returning();
      await done('requirement', row.id, row.label, null, row, 'created');
      return NextResponse.json({ ok: true });
    }

    return bad('Unknown action.');
  } catch (e) {
    if (String((e as { code?: string }).code) === '23505') return bad('That code is already used.', 409);
    console.error('[admin/catalog]', e);
    return bad('Something went wrong. Nothing was saved.', 500);
  }
}
