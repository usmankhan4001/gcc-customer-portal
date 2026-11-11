import { and, count, eq, inArray, notInArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companies, users } from '@/lib/db/schema';

export interface Candidate {
  id: string;
  open: number; // open applications already assigned
  name?: string | null;
}

/** The person with the fewest open applications; ties go to the first in the list, so the choice is stable. */
export function pickLeastLoaded(candidates: Candidate[]): string | null {
  if (candidates.length === 0) return null;
  return candidates.reduce((best, c) => (c.open < best.open ? c : best)).id;
}

const FINISHED = ['documents_delivered', 'cancelled', 'refunded'] as const;

/**
 * A new paid application goes to the active Incorporation VA with the least open work. Returns null when there is
 * no active VA, in which case the application waits unassigned and shows on the Super Admin dashboard.
 * (Open decision: named clients per VA versus a shared queue. Least-loaded works for both until that is decided.)
 */
export async function pickAssignee(): Promise<string | null> {
  const vas = await db
    .select({ id: users.id, name: users.full_name })
    .from(users)
    .where(and(inArray(users.role, ['incorporation_va', 'staff']), eq(users.account_status, 'active')))
    .orderBy(users.created_at);
  if (vas.length === 0) return null;

  const loads = await db
    .select({ id: companies.assigned_to, n: count() })
    .from(companies)
    .where(and(inArray(companies.assigned_to, vas.map((v) => v.id)), notInArray(companies.stage, [...FINISHED])))
    .groupBy(companies.assigned_to);
  const byId = new Map(loads.map((l) => [l.id, l.n]));
  return pickLeastLoaded(vas.map((v) => ({ id: v.id, name: v.name, open: byId.get(v.id) ?? 0 })));
}
