import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/admin/PageHeader';
import { requireStaff } from '@/lib/staff/session';
import { can, ROLE_LABEL, toStaffRole } from '@/lib/staff/roles';
import { auditFor } from '@/lib/staff/queries';
import { formatDateTime } from '@/lib/staff/ui';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The audit log: who did what, to which item, and when. Append-only; this page only reads it. */
export default async function AuditPage({ searchParams }: { searchParams: Promise<{ company?: string }> }) {
  const staff = await requireStaff();
  if (!staff) redirect('/auth?redirect=/admin/audit');
  if (!can(staff.dbRole, 'audit.view')) redirect('/admin/dashboard');

  const company = (await searchParams).company;
  const events = await auditFor({ companyId: company && UUID.test(company) ? company : undefined, limit: 300 });

  return (
    <div className="wrap admin-page">
      <PageHeader
        eyebrow="Technical"
        title="Audit log"
        subtitle="Every change, document view and sign-in action, newest first. Nothing here can be edited or deleted."
        actions={company ? <Link href="/admin/audit" className="btn">Show everything</Link> : undefined}
      />
      <div className="admin-table-card">
        {events.length === 0 ? (
          <div className="cl-empty"><p>Nothing recorded yet.</p></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>When</th><th>Who</th><th>Action</th><th className="hide-phone">Item</th><th className="hide-phone">Details</th></tr></thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td>{formatDateTime(e.created_at)}</td>
                    <td>{e.actor_name ?? 'System'}<div>{toStaffRole(e.actor_role) ? ROLE_LABEL[toStaffRole(e.actor_role)!] : e.actor_role}</div></td>
                    <td><code>{e.action}</code></td>
                    <td className="hide-phone">
                      {e.company_id ? <Link href={`/admin/companies/${e.company_id}`}>{e.entity_type}</Link> : e.entity_type}
                    </td>
                    <td className="hide-phone"><code>{e.details ? JSON.stringify(e.details) : ''}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
