import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { catalogAddons, catalogDocumentRequirements, catalogPackages } from '@/lib/db/schema';

/** Everything a client may see for one jurisdiction: only active, priced items. Nothing is hard-coded. */
export async function loadCatalog(jurisdiction: string) {
  const [packages, addons, requirements] = await Promise.all([
    db.select().from(catalogPackages).where(eq(catalogPackages.jurisdiction, jurisdiction)).orderBy(asc(catalogPackages.sort)),
    db.select().from(catalogAddons).orderBy(asc(catalogAddons.sort)),
    db
      .select()
      .from(catalogDocumentRequirements)
      .where(and(eq(catalogDocumentRequirements.jurisdiction, jurisdiction), eq(catalogDocumentRequirements.active, true)))
      .orderBy(asc(catalogDocumentRequirements.sort)),
  ]);
  return { packages, addons, requirements };
}

/** What the public Start page shows. Inactive or unpriced packages and add-ons are left out entirely. */
export async function loadPublicCatalog(jurisdiction: string) {
  const { packages, addons, requirements } = await loadCatalog(jurisdiction);
  return {
    packages: packages.filter((p) => p.active && p.price_cents !== null),
    addons: addons.filter(
      (a) => a.active && a.price_cents !== null && (!a.jurisdictions || a.jurisdictions.includes(jurisdiction)),
    ),
    requirements,
  };
}
