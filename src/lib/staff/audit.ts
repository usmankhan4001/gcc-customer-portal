import type { db } from '@/lib/db';
import { auditEvents } from '@/lib/db/schema';

/** Either the database or an open transaction, so the audit row commits or rolls back with the change. */
type Executor = Pick<typeof db, 'insert'>;

/** Who did it: a staff member or client, or the system (userId null) for payments and automatic steps. */
export interface AuditActor {
  userId: string | null;
  name: string | null;
  role: string | null;
}

export const SYSTEM_ACTOR: AuditActor = { userId: null, name: 'System', role: 'system' };

export interface AuditInput {
  action: string; // stage.changed, company.hold, document.accepted, document.rejected, document.viewed
  entityType: 'company' | 'document' | 'user' | 'order' | 'catalog';
  entityId: string;
  companyId?: string | null;
  details?: Record<string, unknown>;
}

/**
 * Append one row to the audit log. Always call this inside the same transaction as the change it records:
 * if the change rolls back, so does the row, and a change can never commit without its row.
 */
export async function recordAudit(exec: Executor, actor: AuditActor, event: AuditInput) {
  await exec.insert(auditEvents).values({
    actor_id: actor.userId,
    actor_name: actor.name,
    actor_role: actor.role,
    action: event.action,
    entity_type: event.entityType,
    entity_id: event.entityId,
    company_id: event.companyId ?? null,
    details: event.details ?? null,
  });
}
