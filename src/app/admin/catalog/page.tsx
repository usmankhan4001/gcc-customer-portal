import { redirect } from 'next/navigation';
import { asc } from 'drizzle-orm';
import { PageHeader } from '@/components/admin/PageHeader';
import { CatalogManager } from '@/components/admin/CatalogManager';
import { db } from '@/lib/db';
import { catalogAddons, catalogDocumentRequirements, catalogPackages } from '@/lib/db/schema';
import { requireStaff } from '@/lib/staff/session';
import { can } from '@/lib/staff/roles';
import { JURISDICTIONS } from '@/lib/jurisdictions';

export const dynamic = 'force-dynamic';

const dollars = (cents: number | null) => (cents === null ? '' : (cents / 100).toFixed(2).replace(/\.00$/, ''));

export default async function CatalogPage() {
  const staff = await requireStaff();
  if (!staff) redirect('/auth?redirect=/admin/catalog');
  if (!can(staff.dbRole, 'prices.edit')) redirect('/admin/dashboard');

  const [packages, addons, requirements] = await Promise.all([
    db.select().from(catalogPackages).orderBy(asc(catalogPackages.sort), asc(catalogPackages.name)),
    db.select().from(catalogAddons).orderBy(asc(catalogAddons.sort), asc(catalogAddons.name)),
    db.select().from(catalogDocumentRequirements).orderBy(asc(catalogDocumentRequirements.sort), asc(catalogDocumentRequirements.label)),
  ]);

  return (
    <div className="wrap admin-page">
      <PageHeader eyebrow="Technical" title="Catalog" subtitle="Every price, timeline and document requirement a client sees comes from here. Changes apply to new quotes straight away and are recorded in the audit log." />
      <CatalogManager
        countries={JURISDICTIONS.map((j) => ({ id: j.id, name: j.name }))}
        packages={packages.map((p) => ({ ...p, price: dollars(p.price_cents) }))}
        addons={addons.map((a) => ({
          id: a.id, key: a.key, name: a.name, summary: a.summary, price: dollars(a.price_cents), max_quantity: a.max_quantity,
          options: Array.isArray(a.options) ? (a.options as string[]).join(', ') : '',
          jurisdictions: (a.jurisdictions ?? []).join(', '),
          package_keys: (a.package_keys ?? []).join(', '),
          active: a.active,
        }))}
        requirements={requirements.map((r) => ({ id: r.id, jurisdiction: r.jurisdiction, package_key: r.package_key, key: r.key, label: r.label, help: r.help, category: r.category, required: r.required, active: r.active, sort: r.sort }))}
      />
    </div>
  );
}
