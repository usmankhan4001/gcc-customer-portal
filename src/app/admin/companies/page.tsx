import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { requireStaff } from '@/lib/staff/session';
import { can } from '@/lib/staff/roles';
import { companyList, type CompanyFilter } from '@/lib/staff/queries';
import { COMPANY_STAGES, STAGE_LABEL } from '@/lib/staff/stages';
import { ageDays, BANK_LABEL, formatDate, stageBadgeClass, stageLabel, TIER_LABEL, WAITING_LABEL } from '@/lib/staff/ui';

export const dynamic = 'force-dynamic';

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const staff = await requireStaff();
  if (!staff) redirect('/auth?redirect=/admin/companies');
  if (!can(staff.dbRole, 'clients.view')) redirect('/admin/dashboard');

  const sp = await searchParams;
  const stage = one(sp.stage);
  const hold = one(sp.hold);
  const filter: CompanyFilter = {
    stage: stage && (stage in STAGE_LABEL) ? stage : undefined,
    q: one(sp.q),
    hold: hold === 'us' || hold === 'client' || hold === 'client3' ? hold : undefined,
    bank: one(sp.bank) && one(sp.bank)! in BANK_LABEL ? one(sp.bank) : undefined,
  };
  const rows = await companyList(staff, filter);
  const filtered = !!(filter.stage || filter.q || filter.hold || filter.bank);

  return (
    <div className="wrap admin-page">
      <PageHeader
        eyebrow="Day to day"
        title="Clients & Companies"
        subtitle={can(staff.dbRole, 'clients.assign') || staff.role !== 'incorporation_va' ? 'Every client and their company.' : 'The clients assigned to you.'}
      />

      <div className="admin-table-card">
        <form method="get" className="cl-toolbar">
          <label className="cl-search">
            <Search size={16} aria-hidden="true" />
            <input type="text" name="q" defaultValue={filter.q ?? ''} aria-label="Search clients" placeholder="Search client, email or company..." />
          </label>
          <select name="stage" defaultValue={filter.stage ?? ''} aria-label="Filter by stage">
            <option value="">All stages</option>
            {[...COMPANY_STAGES, 'cancelled', 'refunded'].map((s) => (
              <option key={s} value={s}>{STAGE_LABEL[s as keyof typeof STAGE_LABEL]}</option>
            ))}
          </select>
          <button type="submit" className="btn">Filter</button>
          {filtered && <Link href="/admin/companies" className="btn">Clear</Link>}
        </form>

        {rows.length === 0 ? (
          <div className="cl-empty"><p>{filtered ? 'No clients match these filters.' : 'No clients yet.'}</p></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th className="hide-phone">Package</th>
                  <th>Stage</th>
                  <th className="hide-phone">Bank</th>
                  <th className="hide-phone">Waiting on</th>
                  <th className="hide-phone">Assigned to</th>
                  <th className="hide-phone">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/companies/${c.id}`}><strong>{c.clientName ?? c.clientEmail ?? 'Client'}</strong></Link>
                      <div>{c.companyName} · {c.jurisdiction}</div>
                    </td>
                    <td className="hide-phone">{TIER_LABEL[c.tier] ?? c.tier}</td>
                    <td><span className={stageBadgeClass(c.stage)}>{stageLabel(c.stage)}</span>{c.onHold && <div>On hold</div>}</td>
                    <td className="hide-phone">{c.bankStage ? BANK_LABEL[c.bankStage] : '–'}</td>
                    <td className="hide-phone">{c.onHold && c.waitingOn ? `${WAITING_LABEL[c.waitingOn]} · ${ageDays(c.stageChangedAt)}` : '–'}</td>
                    <td className="hide-phone">{c.assignedName ?? <em>Unassigned</em>}</td>
                    <td className="hide-phone">{formatDate(c.updatedAt)}</td>
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
