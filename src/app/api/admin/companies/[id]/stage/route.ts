import { NextRequest, NextResponse } from 'next/server';
import { and, count, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companies, documents } from '@/lib/db/schema';
import { requireStaff } from '@/lib/staff/session';
import { recordAudit } from '@/lib/staff/audit';
import { canOnClient } from '@/lib/staff/roles';
import {
  COMPANY_STAGES,
  validateHold,
  validateStageMove,
  type AnyStage,
  type StageInput,
  type Verdict,
} from '@/lib/staff/stages';

const ALL_STAGES: readonly string[] = [...COMPANY_STAGES, 'cancelled', 'refunded'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Failures caused by who is asking are 403; every other broken rule is a 409 the screen can show as-is.
const forbidden = (v: Extract<Verdict, { ok: false }>) => v.code === 'forbidden' || v.code === 'not_assigned';

function text(value: unknown, max: number): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;
}

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/companies/:id/stage
 *   { action: 'move', to, input?: { reason, link, filingReference, finalName, registrationNumber, incorporationDate } }
 *   { action: 'hold', on: boolean, waitingOn?, reason? }
 */
export async function POST(request: NextRequest, { params }: Params) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  if (body.action !== 'move' && body.action !== 'hold') {
    return NextResponse.json({ error: 'action must be "move" or "hold"' }, { status: 400 });
  }

  const result = await db.transaction(async (tx) => {
    const [company] = await tx.select().from(companies).where(eq(companies.id, id)).for('update').limit(1);
    // A person who may not see this client gets the same answer as for one that does not exist.
    if (!company || !canOnClient(staff.dbRole, 'clients.view', staff.userId, company.assigned_to)) {
      return { status: 404 as const, error: 'Not found' };
    }

    if (body.action === 'hold') {
      if (!canOnClient(staff.dbRole, 'stage.change', staff.userId, company.assigned_to)) {
        return { status: 403 as const, error: 'You cannot put this company on hold.' };
      }
      const on = body.on === true;
      const waitingOn = on ? text(body.waitingOn, 20) : null;
      const reason = on ? text(body.reason, 500) : null;
      if (on) {
        const v = validateHold(waitingOn, reason);
        if (!v.ok) return { status: 409 as const, error: v.message, code: v.code };
      }
      await tx
        .update(companies)
        .set({ on_hold: on, waiting_on: waitingOn as typeof company.waiting_on, hold_reason: reason, updated_at: new Date() })
        .where(eq(companies.id, id));
      await recordAudit(tx, staff, {
        action: on ? 'company.hold' : 'company.hold_released',
        entityType: 'company',
        entityId: id,
        companyId: id,
        details: on ? { waitingOn, reason } : {},
      });
      return { status: 200 as const, stage: company.stage, onHold: on };
    }

    const to = typeof body.to === 'string' ? body.to : '';
    if (!ALL_STAGES.includes(to)) return { status: 400 as const, error: 'Unknown stage' };
    const raw = (body.input && typeof body.input === 'object' ? body.input : {}) as Record<string, unknown>;
    const input: StageInput = {
      reason: text(raw.reason, 500),
      link: text(raw.link, 500),
      filingReference: text(raw.filingReference, 100),
      finalName: text(raw.finalName, 200),
      registrationNumber: text(raw.registrationNumber, 100),
      incorporationDate: text(raw.incorporationDate, 40),
    };

    const [{ uploaded }] = await tx
      .select({ uploaded: count() })
      .from(documents)
      .where(and(eq(documents.company_id, id), eq(documents.kind, 'client_upload'), eq(documents.status, 'active')));
    const [{ delivered }] = await tx
      .select({ delivered: count() })
      .from(documents)
      .where(and(eq(documents.company_id, id), eq(documents.kind, 'deliverable'), eq(documents.status, 'active')));
    const [{ certs }] = await tx
      .select({ certs: count() })
      .from(documents)
      .where(
        and(
          eq(documents.company_id, id),
          eq(documents.kind, 'deliverable'),
          eq(documents.category, 'certificate_of_incorporation'),
          eq(documents.status, 'active'),
        ),
      );

    const verdict = validateStageMove({
      role: staff.dbRole,
      userId: staff.userId,
      assignedTo: company.assigned_to,
      from: company.stage as AnyStage,
      to: to as AnyStage,
      input,
      facts: { uploadedDocuments: uploaded, certificateUploaded: certs > 0, deliverablesUploaded: delivered > 0 },
    });
    if (!verdict.ok) {
      return { status: forbidden(verdict) ? (403 as const) : (409 as const), error: verdict.message, code: verdict.code };
    }

    const now = new Date();
    await tx
      .update(companies)
      .set({
        stage: to as typeof company.stage,
        stage_changed_at: now,
        updated_at: now,
        // Moving on clears a hold; the values typed in for this stage are recorded on the company.
        on_hold: false,
        waiting_on: null,
        hold_reason: null,
        ...(to === 'name_approved' && input.finalName ? { company_name: input.finalName } : {}),
        ...(to === 'filed_with_registry' ? { filing_reference: input.filingReference } : {}),
        ...(to === 'incorporated'
          ? { registration_number: input.registrationNumber, incorporation_date: new Date(input.incorporationDate!) }
          : {}),
      })
      .where(eq(companies.id, id));
    await recordAudit(tx, staff, {
      action: 'stage.changed',
      entityType: 'company',
      entityId: id,
      companyId: id,
      details: {
        from: company.stage,
        to,
        ...(input.reason ? { reason: input.reason } : {}),
        ...(input.link ? { link: input.link } : {}),
        ...(input.filingReference ? { filingReference: input.filingReference } : {}),
        ...(input.finalName ? { finalName: input.finalName } : {}),
        ...(input.registrationNumber ? { registrationNumber: input.registrationNumber } : {}),
      },
    });
    return { status: 200 as const, stage: to, onHold: false };
  });

  if (result.status === 200) return NextResponse.json({ stage: result.stage, onHold: result.onHold });
  return NextResponse.json({ error: result.error, code: 'code' in result ? result.code : undefined }, { status: result.status });
}
