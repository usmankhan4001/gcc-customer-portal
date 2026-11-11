import { and, count, desc, eq, gte, inArray, isNotNull, lt, lte, min, notInArray, or, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/lib/db';
import { auditEvents, companies, documents, leads, orders, renewals, users } from '@/lib/db/schema';
import { accessFor } from './roles';
import type { StaffSession } from './session';

/** A finished or ended company stops counting as "open work". */
export const CLOSED_STAGES = ['documents_delivered', 'cancelled', 'refunded'] as const;
const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(Date.now() - days * DAY);

/** Rows this person may see: everything for roles with `all` scope, only their own clients for a VA. */
export function companyScope(staff: StaffSession): SQL | undefined {
  const scope = accessFor(staff.dbRole, 'clients.view');
  if (scope === 'all') return undefined;
  if (scope === 'assigned') return eq(companies.assigned_to, staff.userId);
  return sql`false`;
}

const openOnly = notInArray(companies.stage, [...CLOSED_STAGES]);

export interface CompanyFilter {
  stage?: string;
  q?: string;
  /** us / client = on hold waiting on them; client3 = waiting on the client for more than 3 days. */
  hold?: 'us' | 'client' | 'client3';
  bank?: string;
  limit?: number;
}

export async function companyList(staff: StaffSession, opts: CompanyFilter = {}) {
  const client = alias(users, 'client_user');
  const va = alias(users, 'assigned_user');
  const q = opts.q?.trim();
  const rows = await db
    .select({
      id: companies.id,
      companyName: companies.company_name,
      jurisdiction: companies.jurisdiction,
      tier: companies.tier,
      stage: companies.stage,
      bankStage: companies.bank_stage,
      onHold: companies.on_hold,
      waitingOn: companies.waiting_on,
      updatedAt: companies.updated_at,
      stageChangedAt: companies.stage_changed_at,
      nextDueAt: companies.next_due_at,
      clientName: client.full_name,
      clientEmail: client.email,
      assignedName: va.full_name,
    })
    .from(companies)
    .leftJoin(client, eq(companies.user_id, client.id))
    .leftJoin(va, eq(companies.assigned_to, va.id))
    .where(
      and(
        companyScope(staff),
        opts.stage ? eq(companies.stage, opts.stage as typeof companies.$inferSelect.stage) : undefined,
        opts.bank ? eq(companies.bank_stage, opts.bank as NonNullable<typeof companies.$inferSelect.bank_stage>) : undefined,
        opts.hold
          ? and(
              openOnly,
              eq(companies.on_hold, true),
              eq(companies.waiting_on, opts.hold === 'us' ? 'us' : 'client'),
              opts.hold === 'client3' ? lt(companies.stage_changed_at, ago(3)) : undefined,
            )
          : undefined,
        q
          ? or(sql`${companies.company_name} ilike ${'%' + q.replace(/[%_]/g, '\\$&') + '%'}`, sql`${client.full_name} ilike ${'%' + q.replace(/[%_]/g, '\\$&') + '%'}`, sql`${client.email} ilike ${'%' + q.replace(/[%_]/g, '\\$&') + '%'}`)
          : undefined,
      ),
    )
    .orderBy(desc(companies.updated_at))
    .limit(opts.limit ?? 200);
  return rows;
}

/** The counts behind the attention cards. Scoped, so a VA's numbers are only their own clients. */
export async function attentionCounts(staff: StaffSession) {
  const scope = companyScope(staff);
  const pendingDocs = await db
    .select({ n: count() })
    .from(documents)
    .innerJoin(companies, eq(documents.company_id, companies.id))
    .where(
      and(
        scope,
        eq(documents.kind, 'client_upload'),
        eq(documents.status, 'active'),
        inArray(documents.review_status, ['uploaded', 'under_review']),
      ),
    );
  const one = async (extra: SQL | undefined) => {
    const [row] = await db.select({ n: count() }).from(companies).where(and(scope, openOnly, extra));
    return row.n;
  };
  const [renewalsDue] = await db
    .select({ n: count() })
    .from(renewals)
    .innerJoin(companies, eq(renewals.company_id, companies.id))
    .where(and(scope, inArray(renewals.status, ['upcoming', 'invoiced', 'overdue']), lte(renewals.due_date, new Date(Date.now() + 30 * DAY))));
  return {
    documentsToReview: pendingDocs[0].n,
    waitingOnUs: await one(and(eq(companies.on_hold, true), eq(companies.waiting_on, 'us'))),
    waitingOnClient3d: await one(and(eq(companies.on_hold, true), eq(companies.waiting_on, 'client'), lt(companies.stage_changed_at, ago(3)))),
    signaturesPending: await one(eq(companies.stage, 'signatures_pending')),
    bankKycPending: await one(eq(companies.bank_stage, 'provider_kyc_required')),
    renewalsDue30: renewalsDue.n,
  };
}

/** Super Admin's business view: stage counts, overdue work, team workload, leads and revenue. */
export async function businessOverview() {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const byStage = await db.select({ stage: companies.stage, n: count() }).from(companies).groupBy(companies.stage);
  const [overdue] = await db.select({ n: count() }).from(companies).where(and(openOnly, lt(companies.stage_changed_at, ago(7))));
  const [newLeads] = await db.select({ n: count() }).from(leads).where(gte(leads.created_at, ago(7)));
  const [revenue] = await db
    .select({ cents: sql<number>`coalesce(sum(${orders.amount_total}), 0)::int` })
    .from(orders)
    .where(and(eq(orders.payment_status, 'paid'), gte(orders.paid_at, monthStart)));
  const workload = await db
    .select({
      userId: users.id,
      name: users.full_name,
      role: users.role,
      open: count(companies.id),
      oldest: min(companies.stage_changed_at),
    })
    .from(users)
    .leftJoin(companies, and(eq(companies.assigned_to, users.id), openOnly))
    .where(and(isNotNull(users.id), notInArray(users.role, ['client']), eq(users.account_status, 'active')))
    .groupBy(users.id, users.full_name, users.role)
    .orderBy(users.full_name);
  return { byStage, overdue: overdue.n, newLeads: newLeads.n, revenueCents: revenue.cents, workload };
}

export async function auditFor(opts: { companyId?: string; limit?: number }) {
  return db
    .select()
    .from(auditEvents)
    .where(opts.companyId ? eq(auditEvents.company_id, opts.companyId) : undefined)
    .orderBy(desc(auditEvents.created_at))
    .limit(opts.limit ?? 200);
}
