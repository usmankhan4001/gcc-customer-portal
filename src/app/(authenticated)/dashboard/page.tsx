import React from 'react';
import Link from 'next/link';
import { desc, eq, ne, and } from 'drizzle-orm';
import BannerHeader from '@/components/portal/BannerHeader';
import SummaryCard from '@/components/portal/SummaryCard';
import ServiceTile from '@/components/portal/ServiceTile';
import PipelineStepTracker from '@/components/portal/PipelineStepTracker';
import ComplianceSnapshot from '@/components/portal/ComplianceSnapshot';
import { getServerSession } from '@/lib/session';
import { db } from '@/lib/db';
import { companies, notifications, users } from '@/lib/db/schema';
import { Calculator, Search, Building, FileText, Receipt, Calendar, Users as UsersIcon, LayoutDashboard, Bell } from 'lucide-react';

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

  const unreadCount = recentNotifications.filter((n) => !n.is_read).length;
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-8">
      <BannerHeader title="PERSONALIZED DASHBOARD" subtitle={`Welcome back, ${firstName}`} />

      {activeCompany ? (
        <>
          <div className="px-4 -mt-8 relative z-10 max-w-4xl mx-auto w-full">
            <SummaryCard
              title={activeCompany.company_name}
              balance={activeCompany.status.replace(/_/g, ' ').toUpperCase()}
              totalIncome={activeCompany.jurisdiction.replace('-', ' ').toUpperCase()}
              totalExpense={activeCompany.tier.replace(/_/g, ' ')}
            />
          </div>

          <div className="px-4 mt-6 max-w-4xl mx-auto w-full">
            <PipelineStepTracker steps={STAGE_LABELS} currentStep={STATUS_TO_STEP[activeCompany.status] ?? 0} />
          </div>

          <div className="px-4 mt-6 max-w-4xl mx-auto w-full">
            <ComplianceSnapshot
              jurisdiction={activeCompany.jurisdiction}
              annualRevenueEstimate={activeCompany.annual_revenue_estimate}
              fiscalYearEnd={activeCompany.fiscal_year_end}
            />
          </div>
        </>
      ) : (
        <div className="px-4 -mt-8 relative z-10 max-w-4xl mx-auto w-full">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <h2 className="text-lg font-bold text-gray-900 mb-1">No active structure yet</h2>
            <p className="text-sm text-gray-500 mb-4">Start your incorporation to see your progress here.</p>
            <Link
              href="/services"
              className="inline-block bg-primary hover:bg-primary/90 text-white text-sm font-bold py-2 px-6 rounded-md transition-colors"
            >
              Browse Jurisdictions
            </Link>
          </div>
        </div>
      )}

      <div className="px-4 mt-8 max-w-4xl mx-auto w-full">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Services</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          <ServiceTile icon={<Calculator className="w-6 h-6 text-blue-600" />} title="Tax Calculator" href="/tools/tax-calculator" />
          <ServiceTile icon={<Search className="w-6 h-6 text-purple-600" />} title="Name Checker" href="/tools/name-checker" />
          <ServiceTile icon={<Building className="w-6 h-6 text-green-600" />} title="Start a Company" href="/services" />
          <ServiceTile icon={<FileText className="w-6 h-6 text-orange-600" />} title="Vault" href="/vault" />
          <ServiceTile icon={<Receipt className="w-6 h-6 text-red-600" />} title="Banking Odds" href="/tools/banking-odds" />
          <ServiceTile icon={<Calendar className="w-6 h-6 text-teal-600" />} title="Compliance" href="/tools/compliance-calendar" />
          <ServiceTile icon={<UsersIcon className="w-6 h-6 text-pink-600" />} title="Visa Costs" href="/tools/visa-estimator" />
          <ServiceTile icon={<LayoutDashboard className="w-6 h-6 text-indigo-600" />} title="More Tools" href="/tools" />
        </div>
      </div>

      <div className="px-4 mt-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
          <Link href="/notifications" className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80">
            <Bell className="w-4 h-4" />
            View all
            {unreadCount > 0 && (
              <span className="bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>
        </div>
        {recentNotifications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-400">
            No activity yet.
          </div>
        ) : (
          <div className="space-y-2">
            {recentNotifications.map((n) => (
              <div key={n.id} className="bg-white rounded-md border border-gray-200 p-3 flex items-start gap-3">
                <span
                  className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                    n.type === 'action_required'
                      ? 'bg-red-500'
                      : n.type === 'success'
                        ? 'bg-green-500'
                        : n.type === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-blue-400'
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
