import React from 'react';
import Link from 'next/link';
import { desc, eq, ne, and, or, isNull, gte, lte } from 'drizzle-orm';
import BannerHeader from '@/components/portal/BannerHeader';
import SummaryCard from '@/components/portal/SummaryCard';
import ServiceTile from '@/components/portal/ServiceTile';
import PipelineStepTracker from '@/components/portal/PipelineStepTracker';
import ComplianceSnapshot from '@/components/portal/ComplianceSnapshot';
import PromoBanner from '@/components/portal/PromoBanner';
import EmptyState from '@/components/portal/EmptyState';
import { getServerSession } from '@/lib/session';
import { db } from '@/lib/db';
import { companies, notifications, promoBanners, users } from '@/lib/db/schema';
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

  const recentNotifications = session
    ? await db
        .select()
        .from(notifications)
        .where(eq(notifications.user_id, session.userId))
        .orderBy(desc(notifications.created_at))
        .limit(5)
    : [];

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

  const unreadCount = recentNotifications.filter((n) => !n.is_read).length;
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-8">
      <BannerHeader title="PERSONALIZED DASHBOARD" subtitle={`Welcome back, ${firstName}`} />

      {activeBanners.length > 0 && (
        <div className="px-4 -mt-4 relative z-10 max-w-4xl mx-auto w-full lg:max-w-none space-y-2">
          {activeBanners.map((banner) => (
            <PromoBanner
              key={banner.id}
              banner={{ id: banner.id, title: banner.title, body: banner.body, link_url: banner.link_url }}
            />
          ))}
        </div>
      )}

      {activeCompany ? (
        <>
          <div className="px-4 -mt-8 relative z-10 max-w-4xl mx-auto w-full lg:max-w-none">
            <SummaryCard
              title={activeCompany.company_name}
              balance={activeCompany.status.replace(/_/g, ' ').toUpperCase()}
              totalIncome={activeCompany.jurisdiction.replace('-', ' ').toUpperCase()}
              totalExpense={activeCompany.tier.replace(/_/g, ' ')}
            />
          </div>

          <div className="px-4 mt-6 max-w-4xl mx-auto w-full lg:max-w-none">
            <PipelineStepTracker steps={STAGE_LABELS} currentStep={STATUS_TO_STEP[activeCompany.status] ?? 0} />
          </div>

          <div className="px-4 mt-6 max-w-4xl mx-auto w-full lg:max-w-none">
            <ComplianceSnapshot
              jurisdiction={activeCompany.jurisdiction}
              annualRevenueEstimate={activeCompany.annual_revenue_estimate}
              fiscalYearEnd={activeCompany.fiscal_year_end}
            />
          </div>
        </>
      ) : (
        <div className="px-4 -mt-8 relative z-10 max-w-4xl mx-auto w-full lg:max-w-none">
          <EmptyState
            icon={<Buildings size={24} weight="duotone" />}
            title="No active structure yet"
            description="Start your incorporation to see your progress here."
            action={
              <Link
                href="/services"
                className="inline-block bg-primary hover:bg-primary/90 text-white text-sm font-bold py-2 px-6 rounded-md transition-colors"
              >
                Browse Jurisdictions
              </Link>
            }
          />
        </div>
      )}

      <div className="px-4 mt-8 max-w-4xl mx-auto w-full lg:max-w-none">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Services</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          <ServiceTile icon={<Calculator size={22} weight="duotone" className="text-blue-600" />} title="Tax Calculator" href="/tools/tax-calculator" />
          <ServiceTile icon={<MagnifyingGlass size={22} weight="duotone" className="text-purple-600" />} title="Name Checker" href="/tools/name-checker" />
          <ServiceTile icon={<Buildings size={22} weight="duotone" className="text-green-600" />} title="Start a Company" href="/services" />
          <ServiceTile icon={<FolderOpen size={22} weight="duotone" className="text-orange-600" />} title="Vault" href="/vault" />
          <ServiceTile icon={<Bank size={22} weight="duotone" className="text-red-600" />} title="Banking Odds" href="/tools/banking-odds" />
          <ServiceTile icon={<CalendarCheck size={22} weight="duotone" className="text-teal-600" />} title="Compliance" href="/tools/compliance-calendar" />
          <ServiceTile icon={<UsersIcon size={22} weight="duotone" className="text-pink-600" />} title="Visa Costs" href="/tools/visa-estimator" />
          <ServiceTile icon={<SquaresFour size={22} weight="duotone" className="text-indigo-600" />} title="More Tools" href="/tools" />
        </div>
      </div>

      <div className="px-4 mt-8 max-w-4xl mx-auto w-full lg:max-w-none">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
          <Link href="/notifications" className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80">
            <Bell size={16} />
            View all
            {unreadCount > 0 && (
              <span className="bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>
        </div>
        {recentNotifications.length === 0 ? (
          <EmptyState icon={<Tray size={22} weight="duotone" />} title="No activity yet" />
        ) : (
          <div className="space-y-2">
            {recentNotifications.map((n) => (
              <div key={n.id} className="bg-white rounded-md border border-gray-200 p-3 flex items-start gap-3">
                <span
                  className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                    n.type === 'action_required'
                      ? 'bg-destructive'
                      : n.type === 'success'
                        ? 'bg-success'
                        : n.type === 'warning'
                          ? 'bg-warning'
                          : 'bg-info'
                  }`}
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
