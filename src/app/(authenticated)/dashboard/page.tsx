import React from 'react';
import Link from 'next/link';
import { desc, eq, ne, and, or, isNull, gte, lte } from 'drizzle-orm';
import { PageHeader } from '@/components/admin/PageHeader';
import s from '@/components/portal/dash.module.css';
import PipelineStepTracker from '@/components/portal/PipelineStepTracker';
import ComplianceSnapshot from '@/components/portal/ComplianceSnapshot';
import PromoBanner from '@/components/portal/PromoBanner';
import EmptyState from '@/components/portal/EmptyState';
import CopyButton from '@/components/portal/CopyButton';
import { getServerSession } from '@/lib/session';
import { db } from '@/lib/db';
import { catalogDocumentRequirements, companies, notifications, promoBanners, users, documents, orders, renewals, referrals } from '@/lib/db/schema';
import DocumentChecklist from '@/components/portal/DocumentChecklist';
import { buildChecklist, nextClientAction } from '@/lib/catalog/checklist';
import { COMPANY_STAGES, STAGE_LABEL, type CompanyStage } from '@/lib/staff/stages';
import { buildPayNowUrl } from '@/lib/dashboard/pay-now';
import {
  Calculator,
  MagnifyingGlass,
  Buildings,
  FolderOpen,
  Bank,
  CalendarCheck,
  Users as UsersIcon,
  SquaresFour,
  Bell,
  FileText,
  CurrencyDollar,
  WarningCircle,
  ShareNetwork,
  SealCheck,
  Receipt,
  Upload,
  CaretRight,
} from '@phosphor-icons/react/dist/ssr';

const QUICK_SERVICES = [
  { title: 'Tax calculator', href: '/tools/tax-calculator', Icon: Calculator },
  { title: 'Name checker', href: '/tools/name-checker', Icon: MagnifyingGlass },
  { title: 'Start a company', href: '/services', Icon: Buildings },
  { title: 'Vault', href: '/vault', Icon: FolderOpen },
  { title: 'Banking odds', href: '/tools/banking-odds', Icon: Bank },
  { title: 'Compliance', href: '/tools/compliance-calendar', Icon: CalendarCheck },
  { title: 'Visa costs', href: '/tools/visa-estimator', Icon: UsersIcon },
  { title: 'Invoice generator', href: '/tools/invoice-generator', Icon: FileText },
  { title: 'More tools', href: '/tools', Icon: SquaresFour },
];

function healthStatus(company: typeof companies.$inferSelect | undefined): { label: string; badge: string } {
  if (!company) return { label: 'No company', badge: 'badge-neutral' };
  const expiry = company.license_expiry_date;
  if (expiry) {
    const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { label: 'Renewal overdue', badge: 'badge-danger' };
    if (daysLeft < 30) return { label: 'Renewal due soon', badge: 'badge-accent' };
  }
  if (company.status === 'active') return { label: 'Active', badge: 'badge-success' };
  if (company.status === 'renewal_due') return { label: 'Renewal due', badge: 'badge-accent' };
  if (company.status === 'suspended') return { label: 'Suspended', badge: 'badge-danger' };
  return { label: 'In progress', badge: 'badge-info' };
}

function daysUntil(date: Date): { label: string; badge: string } {
  const diff = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: `${Math.abs(diff)} days overdue`, badge: 'badge-danger' };
  if (diff <= 7) return { label: `${diff} day${diff === 1 ? '' : 's'} left`, badge: 'badge-danger' };
  if (diff <= 30) return { label: `${diff} days left`, badge: 'badge-accent' };
  return { label: `${diff} days left`, badge: 'badge-success' };
}

function paymentBadge(status: string): { label: string; badge: string } {
  switch (status) {
    case 'paid': return { label: 'Paid', badge: 'badge-success' };
    case 'processing': return { label: 'Processing', badge: 'badge-accent' };
    case 'failed': return { label: 'Failed', badge: 'badge-danger' };
    case 'refunded': return { label: 'Refunded', badge: 'badge-neutral' };
    default: return { label: 'Unpaid', badge: 'badge-neutral' };
  }
}

const NOTIFICATION_DOT: Record<string, string> = {
  action_required: s.dotDanger,
  success: s.dotSuccess,
  warning: s.dotWarn,
};

export default async function DashboardPage() {
  const session = await getServerSession();

  const [user] = session
    ? await db.select().from(users).where(eq(users.id, session.userId)).limit(1)
    : [];

  const [activeCompany] = session
    ? await db
        .select()
        .from(companies)
        .where(and(eq(companies.user_id, session.userId), ne(companies.status, 'lead')))
        .orderBy(desc(companies.created_at))
        .limit(1)
    : [];

  const allUserCompanies = session
    ? await db
        .select()
        .from(companies)
        .where(eq(companies.user_id, session.userId))
        .orderBy(desc(companies.created_at))
    : [];

  const allDocuments = session
    ? await db
        .select()
        .from(documents)
        .where(eq(documents.user_id, session.userId))
        .orderBy(desc(documents.created_at))
        .limit(5)
    : [];

  const allOrders = session
    ? await db
        .select()
        .from(orders)
        .where(eq(orders.user_id, session.userId))
        .orderBy(desc(orders.created_at))
        .limit(5)
    : [];

  const allRenewals = activeCompany?.id
    ? await db
        .select()
        .from(renewals)
        .where(eq(renewals.company_id, activeCompany.id))
        .orderBy(desc(renewals.due_date))
    : [];

  const allNotifications = session
    ? await db
        .select()
        .from(notifications)
        .where(eq(notifications.user_id, session.userId))
        .orderBy(desc(notifications.created_at))
        .limit(5)
    : [];

  const referralCount = session
    ? (
        await db
          .select()
          .from(referrals)
          .where(eq(referrals.referrer_user_id, session.userId))
      ).length
    : 0;

  const paidReferralCount = session
    ? (
        await db
          .select()
          .from(referrals)
          .where(and(eq(referrals.referrer_user_id, session.userId), eq(referrals.status, 'paid')))
      ).length
    : 0;

  // The checklist comes from managed catalog data, not from anything hard-coded here.
  const checklist = activeCompany?.package_key
    ? buildChecklist(
        activeCompany.package_key,
        (
          await db
            .select()
            .from(catalogDocumentRequirements)
            .where(
              and(
                eq(catalogDocumentRequirements.jurisdiction, activeCompany.jurisdiction),
                eq(catalogDocumentRequirements.active, true),
              ),
            )
        ).map((r) => ({ key: r.key, label: r.label, help: r.help, required: r.required, package_key: r.package_key, sort: r.sort })),
        await db
          .select({
            id: documents.id,
            requirement_key: documents.requirement_key,
            review_status: documents.review_status,
            rejection_reason: documents.rejection_reason,
            created_at: documents.created_at,
          })
          .from(documents)
          .where(
            and(
              eq(documents.company_id, activeCompany.id),
              eq(documents.kind, 'client_upload'),
              eq(documents.status, 'active'),
            ),
          ),
      )
    : [];
  const nextAction = nextClientAction(checklist);
  const stageStep = activeCompany ? COMPANY_STAGES.indexOf(activeCompany.stage as CompanyStage) : -1;

  const now = new Date();
  const activeBanners = session
    ? await db
        .select()
        .from(promoBanners)
        .where(
          and(
            eq(promoBanners.active, true),
            lte(promoBanners.starts_at, now),
            or(isNull(promoBanners.ends_at), gte(promoBanners.ends_at, now))
          )
        )
        .orderBy(desc(promoBanners.starts_at))
        .limit(3)
    : [];

  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const status = healthStatus(activeCompany);
  const hasExpiringDocs = allDocuments.some((d) => d.expiry_date && d.expiry_date < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && d.expiry_date > new Date());
  const referralLink = session ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://portal.gccstartup.com'}/?ref=${session.userId.slice(0, 8)}` : '';

  return (
    <div className="wrap admin-page">
      <PageHeader title="Dashboard" subtitle={`Welcome back, ${firstName}`} />

      {activeBanners.length > 0 && (
        <div className={s.banners}>
          {activeBanners.map((banner) => (
            <PromoBanner
              key={banner.id}
              banner={{ id: banner.id, title: banner.title, body: banner.body, link_url: banner.link_url }}
            />
          ))}
        </div>
      )}

      <div className={s.stack}>
        {/* Company status */}
        <section className="card">
          <div className={s.head}>
            <h2>
              <Buildings size={20} />
              {activeCompany ? activeCompany.company_name : 'No active company'}
            </h2>
            <span className={`badge ${status.badge}`}>{status.label}</span>
          </div>

          {activeCompany && (
            <>
              <dl className={s.facts}>
                <div>
                  <dt>Jurisdiction</dt>
                  <dd>{activeCompany.jurisdiction.replace('-', ' ')}</dd>
                </div>
                <div>
                  <dt>Package</dt>
                  <dd>{activeCompany.tier.replace(/_/g, ' ')}</dd>
                </div>
                <div>
                  <dt>Incorporation</dt>
                  <dd>{activeCompany.incorporation_date ? activeCompany.incorporation_date.toLocaleDateString() : 'In progress'}</dd>
                </div>
                <div>
                  <dt>License expiry</dt>
                  <dd>{activeCompany.license_expiry_date ? activeCompany.license_expiry_date.toLocaleDateString() : '—'}</dd>
                </div>
              </dl>
              <div className={s.actions}>
                <Link href={`/api/companies/good-standing?companyId=${activeCompany.id}`} className="btn">
                  <SealCheck size={18} />
                  Download good standing letter
                </Link>
              </div>
            </>
          )}
        </section>

        {/* Pipeline progress */}
        {activeCompany && nextAction && (
          <section className="card" role="status">
            <div className={s.head}>
              <h2>
                <WarningCircle size={20} />
                Action needed
              </h2>
            </div>
            <p style={{ margin: 0 }}>
              {nextAction.status === 'rejected'
                ? `Please upload "${nextAction.label}" again${nextAction.reason ? `: ${nextAction.reason}` : '.'}`
                : `Please upload "${nextAction.label}" so we can continue your application.`}
            </p>
          </section>
        )}

        {activeCompany && (
          <section className="card">
            <div className={s.head}>
              <h2>Application progress</h2>
              {activeCompany.on_hold && <span className="badge badge-accent">On hold</span>}
            </div>
            {stageStep < 0 ? (
              <p style={{ margin: 0 }}>This application is {STAGE_LABEL[activeCompany.stage].toLowerCase()}.</p>
            ) : (
              <PipelineStepTracker steps={COMPANY_STAGES.map((st) => STAGE_LABEL[st])} currentStep={stageStep} />
            )}
          </section>
        )}

        {activeCompany && checklist.length > 0 && (
          <section className="card">
            <div className={s.head}>
              <h2>
                <FileText size={20} />
                Documents we need
              </h2>
            </div>
            <DocumentChecklist companyId={activeCompany.id} items={checklist} />
          </section>
        )}

        {/* Deadlines */}
        {allRenewals.length > 0 && (
          <section className="card">
            <div className={s.head}>
              <h2>
                <CalendarCheck size={20} />
                Upcoming deadlines
              </h2>
            </div>
            <ul className={s.list}>
              {allRenewals.slice(0, 5).map((r) => {
                const d = daysUntil(r.due_date);
                const pill =
                  r.status === 'renewed' ? { label: 'Completed', badge: 'badge-success' }
                  : r.status === 'paid' ? { label: 'Paid', badge: 'badge-success' }
                  : d;
                return (
                  <li key={r.id} className={s.row}>
                    <div className={s.rowText}>
                      <p className={s.rowTitle}>{r.status === 'renewed' ? 'Renewed' : `Year ${r.renewal_year} renewal`}</p>
                      <p className={s.rowMeta}>{r.due_date.toLocaleDateString()}</p>
                    </div>
                    <span className={`badge ${pill.badge}`}>{pill.label}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Documents */}
        <section className="card">
          <div className={s.head}>
            <h2>
              <FolderOpen size={20} />
              My documents
            </h2>
            <Link href="/vault" className={s.link}>
              View all <CaretRight size={14} />
            </Link>
          </div>

          {hasExpiringDocs && (
            <div className="admin-callout is-warn" style={{ marginBottom: 'var(--space-4)' }}>
              <WarningCircle size={18} />
              <span>Some documents are expiring soon. Please re-upload updated copies.</span>
            </div>
          )}

          {allDocuments.length === 0 ? (
            <EmptyState
              icon={<FolderOpen size={24} weight="duotone" />}
              title="No documents uploaded"
              description="Upload your KYC documents to proceed with your application."
              action={
                <Link href="/vault" className="btn btn-primary">
                  <Upload size={18} />
                  Upload documents
                </Link>
              }
            />
          ) : (
            <>
              <ul className={s.list}>
                {allDocuments.map((doc) => (
                  <li key={doc.id} className={s.row}>
                    <div className={s.rowMain}>
                      <FileText size={20} />
                      <div className={s.rowText}>
                        <p className={s.rowTitle}>{doc.file_name}</p>
                        <p className={s.rowMeta}>
                          {new Date(doc.created_at).toLocaleDateString()}
                          {doc.expiry_date && ` · Expires ${new Date(doc.expiry_date).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${doc.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                      {doc.status === 'active' ? 'Active' : 'Archived'}
                    </span>
                  </li>
                ))}
              </ul>
              <div className={s.actions}>
                <Link href="/vault" className="btn">
                  <Upload size={18} />
                  Upload next required document
                </Link>
              </div>
            </>
          )}
        </section>

        {/* Payments */}
        <section className="card">
          <div className={s.head}>
            <h2>
              <CurrencyDollar size={20} />
              Payments &amp; invoices
            </h2>
          </div>

          {allOrders.length === 0 ? (
            <EmptyState
              icon={<CurrencyDollar size={24} weight="duotone" />}
              title="No payments yet"
              description="Payments will appear here once you select a service."
            />
          ) : (
            <ul className={s.list}>
              {allOrders.map((o) => {
                const pay = paymentBadge(o.payment_status);
                return (
                  <li key={o.id} className={s.row}>
                    <div className={s.rowMain}>
                      <Receipt size={20} />
                      <div className={s.rowText}>
                        <p className={s.rowTitle}>
                          {o.order_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </p>
                        <p className={s.rowMeta}>
                          ${(o.amount_total / 100).toLocaleString()} · {new Date(o.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={s.rowEnd}>
                      <span className={`badge ${pay.badge}`}>{pay.label}</span>
                      {o.payment_status === 'unpaid' && (
                        <Link
                          href={buildPayNowUrl(o, allUserCompanies.length > 0 ? allUserCompanies : activeCompany)}
                          className="btn btn-primary"
                        >
                          Pay now
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Referrals */}
        <section className="card">
          <div className={s.head}>
            <h2>
              <ShareNetwork size={20} />
              Referral program
            </h2>
          </div>

          <div className={s.metrics}>
            <div className={s.stat}>
              <strong>{referralCount}</strong>
              <span>Referred</span>
            </div>
            <div className={s.stat}>
              <strong>{paidReferralCount}</strong>
              <span>Converted</span>
            </div>
            <div className={s.stat}>
              <strong>$0</strong>
              <span>Earned</span>
            </div>
          </div>

          {referralLink && (
            <div className={s.copyRow}>
              <input type="text" readOnly value={referralLink} aria-label="Your referral link" />
              <CopyButton text={referralLink} />
            </div>
          )}
        </section>

        {/* Compliance */}
        {activeCompany && (
          <ComplianceSnapshot
            jurisdiction={activeCompany.jurisdiction}
            annualRevenueEstimate={activeCompany.annual_revenue_estimate}
            fiscalYearEnd={activeCompany.fiscal_year_end}
          />
        )}

        {/* Notifications */}
        <section className="card">
          <div className={s.head}>
            <h2>
              <Bell size={20} />
              Updates &amp; alerts
            </h2>
            {allNotifications.length > 0 && (
              <Link href="/notifications" className={s.link}>
                View all <CaretRight size={14} />
              </Link>
            )}
          </div>

          {allNotifications.length === 0 ? (
            <EmptyState
              icon={<Bell size={24} weight="duotone" />}
              title="No updates yet"
              description="Jurisdiction alerts and compliance updates will appear here."
            />
          ) : (
            <ul className={s.list}>
              {allNotifications.map((n) => (
                <li key={n.id} className={s.row}>
                  <div className={s.rowMain}>
                    <span className={`${s.dot} ${NOTIFICATION_DOT[n.type] ?? ''}`} aria-hidden="true" />
                    <div className={s.rowText}>
                      <p className={s.rowTitle}>{n.title}</p>
                      <p className={s.rowMeta}>{n.message}</p>
                      <p className={s.rowMeta}>{new Date(n.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {!n.is_read && <span className="badge badge-accent">New</span>}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Quick services */}
        <section>
          <div className="admin-section-head">
            <h2>Quick services</h2>
          </div>
          <div className={s.tiles}>
            {QUICK_SERVICES.map(({ title, href, Icon }) => (
              <Link key={href} href={href} className={s.tile}>
                <Icon size={20} weight="duotone" />
                {title}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
