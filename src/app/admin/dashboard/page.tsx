import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Banknote, Clock, FileCheck2, PenLine, RefreshCcw, UserRound, Hourglass } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { requireStaff } from '@/lib/staff/session';
import { can, ROLE_LABEL } from '@/lib/staff/roles';
import { attentionCounts, businessOverview, companyList } from '@/lib/staff/queries';
import { COMPANY_STAGES, STAGE_LABEL } from '@/lib/staff/stages';
import { ageDays, formatDate, stageBadgeClass, stageLabel, TIER_LABEL, WAITING_LABEL } from '@/lib/staff/ui';

export const dynamic = 'force-dynamic';

type Card = { label: string; n: number; href: string; icon: typeof Clock };

function Cards({ cards }: { cards: Card[] }) {
  return (
    <div className="admin-attention-grid">
      {cards.map((c) => (
        <Link key={c.label} href={c.href} className="card admin-attention-card">
          <span className="admin-attention-icon" style={{ background: c.n > 0 ? 'var(--orange-lt)' : 'var(--surface-alt)' }}>
            <c.icon size={22} />
          </span>
          <span className="admin-attention-text">
            <span className="admin-attention-count">{c.n}</span>
            <span className="admin-attention-label">{c.label}</span>
          </span>
          <ArrowRight size={18} className="admin-attention-arrow" aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const staff = await requireStaff();
  if (!staff) redirect('/auth?redirect=/admin/dashboard');

  // Marketing and Website VA: no client data at all. Their tools arrive with the website work in Phase 4.
  if (!can(staff.dbRole, 'clients.view')) {
    return (
      <div className="wrap admin-page">
        <PageHeader eyebrow={ROLE_LABEL[staff.role]} title={`Hello ${staff.name ?? ''}`.trim()} subtitle="Content and campaigns" />
        <div className="admin-state-card">
          <p>Your content and campaign tools are coming in a later phase. Leads and lead sources are under Leads.</p>
        </div>
      </div>
    );
  }

  const [counts, mine, overview] = await Promise.all([
    attentionCounts(staff),
    companyList(staff, { limit: 15 }),
    staff.role === 'super_admin' ? businessOverview() : Promise.resolve(null),
  ]);

  const cards: Card[] = [
    { label: 'Documents to review', n: counts.documentsToReview, href: '/admin/documents', icon: FileCheck2 },
    { label: 'Waiting on us', n: counts.waitingOnUs, href: '/admin/companies?hold=us', icon: Hourglass },
    { label: 'Waiting on client for more than 3 days', n: counts.waitingOnClient3d, href: '/admin/companies?hold=client3', icon: Clock },
    { label: 'Signatures pending', n: counts.signaturesPending, href: '/admin/companies?stage=signatures_pending', icon: PenLine },
    { label: 'Bank KYC pending', n: counts.bankKycPending, href: '/admin/companies?bank=provider_kyc_required', icon: Banknote },
    { label: 'Renewals due in 30 days', n: counts.renewalsDue30, href: '/admin/renewals', icon: RefreshCcw },
  ];

  const stageCount = new Map((overview?.byStage ?? []).map((s) => [s.stage, s.n]));

  return (
    <div className="wrap admin-page">
      <PageHeader
        eyebrow={ROLE_LABEL[staff.role]}
        title={staff.role === 'incorporation_va' ? 'My clients' : `Hello ${staff.name ?? ''}`.trim()}
        subtitle={staff.role === 'super_admin' ? 'Business overview' : 'What needs you today'}
      />

      <section aria-label="Needs attention">
        <Cards cards={cards} />
      </section>

      {overview && (
        <>
          <section className="admin-dash-section" aria-label="Business health">
            <h2 className="admin-section-head">Business health</h2>
            <div className="admin-metrics-grid">
              <div className="card"><div className="admin-attention-count">{overview.newLeads}</div><div className="admin-attention-label">New leads this week</div></div>
              <div className="card"><div className="admin-attention-count">${(overview.revenueCents / 100).toLocaleString('en-US')}</div><div className="admin-attention-label">Revenue this month</div></div>
              <div className="card"><div className="admin-attention-count">{overview.overdue}</div><div className="admin-attention-label">Open for over 7 days in a stage</div></div>
            </div>
          </section>

          <section className="admin-dash-section" aria-label="Applications by stage">
            <h2 className="admin-section-head">Applications by stage</h2>
            <div className="admin-table-card">
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <tbody>
                    {COMPANY_STAGES.map((s) => (
                      <tr key={s}>
                        <td><Link href={`/admin/companies?stage=${s}`}>{STAGE_LABEL[s]}</Link></td>
                        <td className="is-right">{stageCount.get(s) ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="admin-dash-section" aria-label="Team workload">
            <h2 className="admin-section-head">Team workload</h2>
            <div className="admin-table-card">
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Staff member</th><th>Open clients</th><th className="hide-phone">Oldest waiting</th></tr>
                  </thead>
                  <tbody>
                    {overview.workload.map((w) => (
                      <tr key={w.userId}>
                        <td><UserRound size={14} aria-hidden="true" /> {w.name ?? 'Unnamed'}</td>
                        <td>{w.open}</td>
                        <td className="hide-phone">{w.oldest ? ageDays(w.oldest) : '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}

      <section className="admin-dash-section" aria-label="Clients">
        <h2 className="admin-section-head">{staff.role === 'incorporation_va' ? 'My clients' : 'Recent clients'}</h2>
        <div className="admin-table-card">
          {mine.length === 0 ? (
            <div className="cl-empty"><p>No clients yet.</p></div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Client</th><th className="hide-phone">Package</th><th>Stage</th>
                    <th className="hide-phone">Waiting on</th><th className="hide-phone">Next due</th>
                  </tr>
                </thead>
                <tbody>
                  {mine.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/admin/companies/${c.id}`}><strong>{c.clientName ?? c.clientEmail ?? 'Client'}</strong></Link>
                        <div>{c.companyName}</div>
                      </td>
                      <td className="hide-phone">{TIER_LABEL[c.tier] ?? c.tier}</td>
                      <td><span className={stageBadgeClass(c.stage)}>{stageLabel(c.stage)}</span></td>
                      <td className="hide-phone">{c.onHold && c.waitingOn ? WAITING_LABEL[c.waitingOn] : '–'}</td>
                      <td className="hide-phone">{formatDate(c.nextDueAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
