import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { and, asc, desc, eq, inArray, ne } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { PageHeader } from '@/components/admin/PageHeader';
import { StageControl } from '@/components/admin/StageControl';
import { DocumentActions } from '@/components/admin/DocumentActions';
import { AssignControl } from '@/components/admin/AssignControl';
import { db } from '@/lib/db';
import { companies, documents, users } from '@/lib/db/schema';
import { requireStaff } from '@/lib/staff/session';
import { can, canOnClient, STAFF_ROLES } from '@/lib/staff/roles';
import { auditFor } from '@/lib/staff/queries';
import { COMPANY_STAGES, capabilityForMove, STAGE_LABEL } from '@/lib/staff/stages';
import { REVIEW_LABEL } from '@/lib/staff/documents';
import { BANK_LABEL, formatDate, formatDateTime, stageBadgeClass, stageLabel, TIER_LABEL, WAITING_LABEL } from '@/lib/staff/ui';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TABS = [
  { key: 'timeline', label: 'Timeline' },
  { key: 'documents', label: 'Documents' },
  { key: 'company', label: 'Company' },
] as const;

/** One audit row as a sentence a person can read. */
function describe(action: string, d: Record<string, unknown> | null): string {
  const x = d ?? {};
  switch (action) {
    case 'stage.changed':
      return `Stage ${stageLabel(String(x.from))} → ${stageLabel(String(x.to))}${x.reason ? ` (${x.reason})` : ''}`;
    case 'company.hold':
      return `Put on hold, waiting on ${WAITING_LABEL[String(x.waitingOn)] ?? x.waitingOn}: ${x.reason}`;
    case 'company.hold_released':
      return 'Hold released';
    case 'company.assigned':
      return x.to ? 'Assigned to a staff member' : 'Unassigned';
    case 'document.accepted':
      return `Accepted ${x.fileName}`;
    case 'document.rejected':
      return `Rejected ${x.fileName}: ${x.reason}`;
    case 'document.viewed':
      return `Viewed ${x.fileName}`;
    default:
      return action;
  }
}

export default async function CompanyRecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const staff = await requireStaff();
  const { id } = await params;
  if (!staff) redirect(`/auth?redirect=/admin/companies/${id}`);
  if (!UUID.test(id)) notFound();
  const wanted = (await searchParams).tab;
  const tab = TABS.find((t) => t.key === wanted)?.key ?? 'timeline';

  const clientUser = alias(users, 'client_user');
  const [row] = await db
    .select({ company: companies, clientName: clientUser.full_name, clientEmail: clientUser.email, clientPhone: clientUser.whatsapp_number })
    .from(companies)
    .leftJoin(clientUser, eq(companies.user_id, clientUser.id))
    .where(eq(companies.id, id))
    .limit(1);
  // Not found and not yours look the same.
  if (!row || !canOnClient(staff.dbRole, 'clients.view', staff.userId, row.company.assigned_to)) notFound();
  const c = row.company;

  const docs =
    tab === 'documents'
      ? await db.select().from(documents).where(eq(documents.company_id, id)).orderBy(desc(documents.created_at))
      : [];
  const events = tab === 'timeline' ? await auditFor({ companyId: id, limit: 100 }) : [];
  const staffList = can(staff.dbRole, 'clients.assign')
    ? await db
        .select({ id: users.id, name: users.full_name, email: users.email })
        .from(users)
        .where(and(eq(users.account_status, 'active'), inArray(users.role, [...STAFF_ROLES, 'admin', 'staff']), ne(users.role, 'marketing_va')))
        .orderBy(asc(users.full_name))
    : [];
  const assignedName = c.assigned_to ? staffList.find((s) => s.id === c.assigned_to)?.name : null;

  const idx = COMPANY_STAGES.indexOf(c.stage as (typeof COMPANY_STAGES)[number]);
  const next = idx >= 0 ? COMPANY_STAGES[idx + 1] : undefined;
  const mayDoc = (cap: 'documents.review' | 'kyc.view') => canOnClient(staff.dbRole, cap, staff.userId, c.assigned_to);

  return (
    <div className="wrap admin-page">
      <PageHeader
        eyebrow="Client record"
        title={row.clientName ?? row.clientEmail ?? 'Client'}
        subtitle={`${c.company_name} · ${c.jurisdiction} · ${TIER_LABEL[c.tier] ?? c.tier}`}
        backHref="/admin/companies"
        backLabel="Clients & Companies"
      />

      <div className="admin-metrics-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card"><div className="admin-attention-label">Company stage</div><span className={stageBadgeClass(c.stage)}>{stageLabel(c.stage)}</span>{c.on_hold && <div>On hold · waiting on {WAITING_LABEL[c.waiting_on ?? ''] ?? c.waiting_on}</div>}</div>
        <div className="card"><div className="admin-attention-label">Bank stage</div>{c.bank_stage ? BANK_LABEL[c.bank_stage] : 'Not started'}</div>
        <div className="card">
          <div className="admin-attention-label">Assigned VA</div>
          {can(staff.dbRole, 'clients.assign') ? (
            <AssignControl companyId={id} assignedTo={c.assigned_to} staff={staffList.map((s) => ({ id: s.id, name: s.name ?? s.email ?? 'Staff' }))} />
          ) : (
            assignedName ?? (c.assigned_to === staff.userId ? 'You' : 'Assigned')
          )}
        </div>
        <div className="card"><div className="admin-attention-label">Next action</div>{c.next_action ?? (next ? `Move to ${STAGE_LABEL[next]}` : 'Done')}<div>{c.next_due_at ? `Due ${formatDate(c.next_due_at)}` : ''}</div></div>
      </div>

      <div className="admin-dash-columns">
        <div>
          <nav className="admin-actions" aria-label="Record sections" style={{ marginBottom: 'var(--space-4)' }}>
            {TABS.map((t) => (
              <Link key={t.key} href={`/admin/companies/${id}?tab=${t.key}`} className={`btn ${tab === t.key ? 'btn-primary' : ''}`} aria-current={tab === t.key ? 'page' : undefined}>
                {t.label}
              </Link>
            ))}
          </nav>

          {tab === 'timeline' && (
            <div className="admin-table-card">
              {events.length === 0 ? (
                <div className="cl-empty"><p>Nothing recorded yet.</p></div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead><tr><th>When</th><th>Who</th><th>What</th></tr></thead>
                    <tbody>
                      {events.map((e) => (
                        <tr key={e.id}>
                          <td>{formatDateTime(e.created_at)}</td>
                          <td>{e.actor_name ?? 'System'}</td>
                          <td>{describe(e.action, e.details as Record<string, unknown> | null)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'documents' && (
            <div className="admin-table-card">
              {docs.length === 0 ? (
                <div className="cl-empty"><p>No documents yet.</p></div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead><tr><th>Document</th><th>Status</th><th className="is-right">Actions</th></tr></thead>
                    <tbody>
                      {docs.map((d) => (
                        <tr key={d.id}>
                          <td>
                            <strong>{d.file_name}</strong>
                            <div>{d.kind === 'deliverable' ? 'Delivered to client' : 'From client'} · {d.category.replace(/_/g, ' ')} · {formatDate(d.created_at)}</div>
                          </td>
                          <td>
                            {d.kind === 'client_upload' ? REVIEW_LABEL[d.review_status] : 'In vault'}
                            {d.rejection_reason && <div>{d.rejection_reason}</div>}
                          </td>
                          <td className="is-right">
                            <DocumentActions
                              documentId={d.id}
                              reviewStatus={d.review_status}
                              canReview={d.kind === 'client_upload' && mayDoc('documents.review')}
                              canView={mayDoc(d.category === 'passport' || d.category === 'proof_of_address' ? 'kyc.view' : 'documents.review')}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'company' && (
            <div className="admin-table-card">
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <tbody>
                    <tr><td>Company name</td><td>{c.company_name}</td></tr>
                    <tr><td>Jurisdiction</td><td>{c.jurisdiction}</td></tr>
                    <tr><td>Package</td><td>{TIER_LABEL[c.tier] ?? c.tier}</td></tr>
                    <tr><td>Registration number</td><td>{c.registration_number ?? '–'}</td></tr>
                    <tr><td>Incorporation date</td><td>{formatDate(c.incorporation_date)}</td></tr>
                    <tr><td>Filing reference</td><td>{c.filing_reference ?? '–'}</td></tr>
                    <tr><td>Client email</td><td>{row.clientEmail ?? '–'}</td></tr>
                    <tr><td>Client WhatsApp</td><td>{row.clientPhone}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div>
          <StageControl
            companyId={id}
            stage={c.stage}
            onHold={c.on_hold}
            waitingOn={c.waiting_on}
            holdReason={c.hold_reason}
            canMoveForward={!!next && canOnClient(staff.dbRole, capabilityForMove(next), staff.userId, c.assigned_to)}
            canMoveBack={canOnClient(staff.dbRole, 'stage.change', staff.userId, c.assigned_to)}
            canHold={canOnClient(staff.dbRole, 'stage.change', staff.userId, c.assigned_to)}
            canCancel={can(staff.dbRole, 'stage.cancel')}
          />
        </div>
      </div>
    </div>
  );
}
