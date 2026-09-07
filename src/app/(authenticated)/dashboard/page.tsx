import React from 'react';
import Link from 'next/link';
import { desc, eq, ne, and, or, isNull, gte, lte, count } from 'drizzle-orm';
import BannerHeader from '@/components/portal/BannerHeader';
import PipelineStepTracker from '@/components/portal/PipelineStepTracker';
import ComplianceSnapshot from '@/components/portal/ComplianceSnapshot';
import PromoBanner from '@/components/portal/PromoBanner';
import EmptyState from '@/components/portal/EmptyState';
import ServiceTile from '@/components/portal/ServiceTile';
import { getServerSession } from '@/lib/session';
import { db } from '@/lib/db';
import { companies, notifications, promoBanners, users, documents, orders, renewals, referrals } from '@/lib/db/schema';
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
  Tray,
  FileText,
  CurrencyDollar,
  ArrowRight,
  CheckCircle,
  WarningCircle,
  Clock,
  Copy,
  ShareNetwork,
  SealCheck,
  Receipt,
  Upload,
  CaretRight,
} from '@phosphor-icons/react/dist/ssr';

const STAGE_LABELS = ['Onboarding', 'Official KYC', 'Government Filing', 'Bank Setup', 'Active'];

const STATUS_TO_STEP: Record<string, number> = {
  onboarding: 0,
  official_kyc_pending: 1,
  filing_in_progress: 2,
  bank_opening: 3,
  active: 4,
  renewal_due: 4,
  suspended: 4,
  archived: 4,
};

function healthStatus(company: typeof companies.$inferSelect | undefined): {
  label: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
} {
  if (!company) return { label: 'No Company', color: 'text-gray-500', bg: 'bg-gray-100', icon: <Clock size={16} /> };
  const now = new Date();
  const expiry = company.license_expiry_date;
  if (expiry) {
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { label: 'Renewal Overdue', color: 'text-destructive', bg: 'bg-destructive/10', icon: <WarningCircle size={16} /> };
    if (daysLeft < 30) return { label: 'Renewal Due Soon', color: 'text-warning', bg: 'bg-warning/10', icon: <WarningCircle size={16} /> };
  }
  if (company.status === 'active') return { label: 'Active', color: 'text-success', bg: 'bg-success-light', icon: <SealCheck size={16} /> };
  if (company.status === 'renewal_due') return { label: 'Renewal Due', color: 'text-warning', bg: 'bg-warning/10', icon: <WarningCircle size={16} /> };
  if (company.status === 'suspended') return { label: 'Suspended', color: 'text-destructive', bg: 'bg-destructive/10', icon: <WarningCircle size={16} /> };
  return { label: 'In Progress', color: 'text-info', bg: 'bg-info-light', icon: <Clock size={16} /> };
}

function daysUntil(date: Date): { days: number; label: string; color: string } {
  const now = new Date();
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { days: diff, label: `${Math.abs(diff)} days overdue`, color: 'text-destructive bg-destructive/10 border-destructive/20' };
  if (diff <= 7) return { days: diff, label: `${diff} day${diff === 1 ? '' : 's'} left`, color: 'text-destructive bg-destructive/10 border-destructive/20' };
  if (diff <= 30) return { days: diff, label: `${diff} days left`, color: 'text-warning bg-warning/10 border-warning/20' };
  return { days: diff, label: `${diff} days left`, color: 'text-success bg-success-light border-success/20' };
}

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
  const documentCount = allDocuments.length;
  const hasExpiringDocs = allDocuments.some((d) => d.expiry_date && d.expiry_date < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && d.expiry_date > new Date());
  const referralLink = session ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://portal.gccstartup.com'}/?ref=${session.userId.slice(0, 8)}` : '';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24 lg:pb-8">
      <BannerHeader title="DASHBOARD" subtitle={`Welcome back, ${firstName}`} />

      {activeBanners.length > 0 && (
        <div className="px-4 -mt-4 relative z-10 max-w-5xl mx-auto w-full space-y-2">
          {activeBanners.map((banner) => (
            <PromoBanner
              key={banner.id}
              banner={{ id: banner.id, title: banner.title, body: banner.body, link_url: banner.link_url }}
            />
          ))}
        </div>
      )}

      <div className="px-4 mt-4 max-w-5xl mx-auto w-full space-y-6">

        {/* SECTION 1: Company Health Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${status.bg} flex items-center justify-center ${status.color}`}>
                {status.icon}
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Company Status</p>
                <h2 className="text-lg font-bold text-gray-900">
                  {activeCompany ? activeCompany.company_name : 'No Active Company'}
                </h2>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${status.color} ${status.bg}`}>
              {status.icon}
              {status.label}
            </span>
          </div>

          {activeCompany && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs font-medium">Jurisdiction</p>
                <p className="font-bold text-gray-900 capitalize">{activeCompany.jurisdiction.replace('-', ' ')}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium">Package</p>
                <p className="font-bold text-gray-900 capitalize">{activeCompany.tier.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium">Incorporation</p>
                <p className="font-bold text-gray-900">{activeCompany.incorporation_date ? activeCompany.incorporation_date.toLocaleDateString() : 'In progress'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium">License Expiry</p>
                <p className="font-bold text-gray-900">{activeCompany.license_expiry_date ? activeCompany.license_expiry_date.toLocaleDateString() : '—'}</p>
              </div>
            </div>
          )}

          {activeCompany && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/api/companies/good-standing?companyId=${activeCompany.id}`} className="inline-flex items-center gap-1.5 bg-primary/5 text-primary text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-primary/10 transition-colors">
                <SealCheck size={14} />
                Download Good Standing Letter
              </Link>
              <Link href={`/api/companies/good-standing?companyId=${activeCompany.id}`} className="inline-flex items-center gap-1.5 bg-primary/5 text-primary text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-primary/10 transition-colors">
                <Receipt size={14} />
                Company Summary PDF
              </Link>
            </div>
          )}
        </div>

        {/* SECTION 2: Pipeline Progress */}
        {activeCompany && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Application Progress</h3>
            <PipelineStepTracker steps={STAGE_LABELS} currentStep={STATUS_TO_STEP[activeCompany.status] ?? 0} />
          </div>
        )}

        {/* SECTION 3: Deadline Tracker */}
        {allRenewals.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">
              <CalendarCheck size={16} className="inline mr-1.5 text-primary" />
              Upcoming Deadlines
            </h3>
            <div className="space-y-2">
              {allRenewals.slice(0, 5).map((r) => {
                const d = daysUntil(r.due_date);
                return (
                  <div key={r.id} className={`flex items-center justify-between p-3 rounded-lg border ${d.color}`}>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {r.status === 'renewed' ? 'Renewed' : `Year ${r.renewal_year} Renewal`}
                      </p>
                      <p className="text-xs text-gray-500">{r.due_date.toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${d.color}`}>
                      {r.status === 'renewed' ? 'Completed' : r.status === 'paid' ? 'Paid' : d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 4: Documents */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">
              <FolderOpen size={16} className="inline mr-1.5 text-primary" />
              My Documents
            </h3>
            <Link href="/vault" className="text-xs font-semibold text-primary hover:text-primary-600 transition-colors flex items-center gap-1">
              View All <CaretRight size={12} />
            </Link>
          </div>

          {hasExpiringDocs && (
            <div className="mb-3 p-3 rounded-lg border border-warning/20 bg-warning/5 flex items-start gap-2">
              <WarningCircle size={16} className="text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-warning font-medium">Some documents are expiring soon. Please re-upload updated copies.</p>
            </div>
          )}

          {allDocuments.length === 0 ? (
            <EmptyState
              icon={<FolderOpen size={22} weight="duotone" />}
              title="No documents uploaded"
              description="Upload your KYC documents to proceed with your application."
              action={
                <Link
                  href="/vault"
                  className="inline-flex items-center gap-1.5 bg-cta hover:bg-cta-600 text-cta-foreground text-xs font-bold px-4 py-2 rounded-md transition-colors"
                >
                  <Upload size={14} />
                  Upload Documents
                </Link>
              }
            />
          ) : (
            <div className="space-y-2">
              {allDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-primary-50 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{doc.file_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                        {doc.expiry_date && ` · Expires ${new Date(doc.expiry_date).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    doc.status === 'active' ? 'bg-success-light text-success' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {doc.status === 'active' ? 'Active' : 'Archived'}
                  </span>
                </div>
              ))}
              <Link
                href="/vault"
                className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-500 hover:text-primary hover:border-primary transition-colors"
              >
                <Upload size={14} />
                Upload Next Required Document
              </Link>
            </div>
          )}
        </div>

        {/* SECTION 5: Payments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">
              <CurrencyDollar size={16} className="inline mr-1.5 text-primary" />
              Payments & Invoices
            </h3>
          </div>

          {allOrders.length === 0 ? (
            <EmptyState
              icon={<CurrencyDollar size={22} weight="duotone" />}
              title="No payments yet"
              description="Payments will appear here once you select a service."
            />
          ) : (
            <div className="space-y-2">
              {allOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-primary-50 flex items-center justify-center shrink-0">
                      <Receipt size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {o.order_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </p>
                      <p className="text-xs text-gray-500">
                        ${(o.amount_total / 100).toLocaleString()} · {new Date(o.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      o.payment_status === 'paid' ? 'bg-success-light text-success' :
                      o.payment_status === 'processing' ? 'bg-warning/10 text-warning' :
                      o.payment_status === 'failed' ? 'bg-destructive/10 text-destructive' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {o.payment_status === 'paid' ? 'Paid' :
                       o.payment_status === 'processing' ? 'Processing' :
                       o.payment_status === 'failed' ? 'Failed' :
                       o.payment_status === 'refunded' ? 'Refunded' : 'Unpaid'}
                    </span>
                    {o.payment_status === 'unpaid' && (
                      <Link
                        href={`/checkout/${o.id}`}
                        className="text-xs font-bold bg-cta hover:bg-cta-600 text-cta-foreground px-3 py-1.5 rounded-md transition-colors"
                      >
                        Pay Now
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 6: Affiliate / Referral Tracker */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">
              <ShareNetwork size={16} className="inline mr-1.5 text-primary" />
              Referral Program
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center p-3 rounded-lg bg-primary-50">
              <p className="text-2xl font-bold text-primary">{referralCount}</p>
              <p className="text-xs text-gray-600 font-medium">Referred</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-success-light">
              <p className="text-2xl font-bold text-success">{paidReferralCount}</p>
              <p className="text-xs text-gray-600 font-medium">Converted</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-cta-50">
              <p className="text-2xl font-bold text-cta-600">$0</p>
              <p className="text-xs text-gray-600 font-medium">Earned</p>
            </div>
          </div>

          {referralLink && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-200">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="flex-1 text-xs bg-transparent border-none outline-none text-gray-700 font-mono"
              />
              <button
                onClick={() => navigator.clipboard?.writeText(referralLink)}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-600 transition-colors px-2 py-1 rounded hover:bg-primary-50"
              >
                <Copy size={14} />
                Copy
              </button>
            </div>
          )}
        </div>

        {/* SECTION 7: Compliance Snapshot */}
        {activeCompany && (
          <ComplianceSnapshot
            jurisdiction={activeCompany.jurisdiction}
            annualRevenueEstimate={activeCompany.annual_revenue_estimate}
            fiscalYearEnd={activeCompany.fiscal_year_end}
          />
        )}

        {/* SECTION 8: Recent Notifications / Jurisdiction Updates */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">
              <Bell size={16} className="inline mr-1.5 text-primary" />
              Updates & Alerts
            </h3>
            {allNotifications.length > 0 && (
              <Link href="/notifications" className="text-xs font-semibold text-primary hover:text-primary-600 transition-colors flex items-center gap-1">
                View All <CaretRight size={12} />
              </Link>
            )}
          </div>

          {allNotifications.length === 0 ? (
            <EmptyState icon={<Bell size={22} weight="duotone" />} title="No updates yet" description="Jurisdiction alerts and compliance updates will appear here." />
          ) : (
            <div className="space-y-2">
              {allNotifications.map((n) => (
                <div key={n.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                    n.type === 'action_required' ? 'bg-destructive' :
                    n.type === 'success' ? 'bg-success' :
                    n.type === 'warning' ? 'bg-warning' : 'bg-info'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{new Date(n.created_at).toLocaleDateString()}</p>
                  </div>
                  {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 9: Quick Services */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-3">
            <SquaresFour size={16} className="inline mr-1.5 text-primary" />
            Quick Services
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <ServiceTile icon={<Calculator size={20} weight="duotone" />} title="Tax Calculator" href="/tools/tax-calculator" />
            <ServiceTile icon={<MagnifyingGlass size={20} weight="duotone" />} title="Name Checker" href="/tools/name-checker" />
            <ServiceTile icon={<Buildings size={20} weight="duotone" />} title="Start a Company" href="/services" />
            <ServiceTile icon={<FolderOpen size={20} weight="duotone" />} title="Vault" href="/vault" />
            <ServiceTile icon={<Bank size={20} weight="duotone" />} title="Banking Odds" href="/tools/banking-odds" />
            <ServiceTile icon={<CalendarCheck size={20} weight="duotone" />} title="Compliance" href="/tools/compliance-calendar" />
            <ServiceTile icon={<UsersIcon size={20} weight="duotone" />} title="Visa Costs" href="/tools/visa-estimator" />
            <ServiceTile icon={<FileText size={20} weight="duotone" />} title="Invoice Gen" href="/tools/invoice-generator" />
            <ServiceTile icon={<SquaresFour size={20} weight="duotone" />} title="More Tools" href="/tools" />
          </div>
        </div>

      </div>
    </div>
  );
}