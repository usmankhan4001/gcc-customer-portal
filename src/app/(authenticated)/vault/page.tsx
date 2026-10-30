import { and, desc, eq, ne } from 'drizzle-orm';
import { CheckCircle, Clock, UploadSimple } from '@phosphor-icons/react/dist/ssr';
import BannerHeader from '@/components/portal/BannerHeader';
import VaultUploader from '@/components/portal/VaultUploader';
import DocumentLocker from '@/components/portal/DocumentLocker';
import { getServerSession } from '@/lib/session';
import { db } from '@/lib/db';
import { companies, documents } from '@/lib/db/schema';

export default async function Vault() {
  const session = await getServerSession();

  // 1. Fetch active company documents
  const rows = session
    ? await db
        .select()
        .from(documents)
        .where(and(eq(documents.user_id, session.userId), eq(documents.status, 'active')))
        .orderBy(desc(documents.created_at))
    : [];

  // 2. Fetch user's company profile for jurisdiction and KYC status
  const [company] = session
    ? await db
        .select()
        .from(companies)
        .where(and(eq(companies.user_id, session.userId), ne(companies.status, 'lead')))
        .orderBy(desc(companies.created_at))
        .limit(1)
    : [];

  const kycCompleted = company?.official_kyc_completed ?? false;
  const kycRef = company?.official_kyc_reference;

  return (
    <div className="pb-24">
      <BannerHeader
        title="DOCUMENT LOCKER & VAULT"
        subtitle="Bank-grade encrypted corporate repository and KYC verification center."
      />

      <div className="p-4 md:p-8 max-w-5xl mx-auto -mt-6 relative z-10 space-y-6">
        {/* Top KYC Upload & Verification Section */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                kycCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-primary-50 text-primary'
              }`}
            >
              {kycCompleted ? (
                <CheckCircle size={22} weight="fill" />
              ) : (
                <Clock size={22} weight="duotone" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-sm md:text-base">
                  KYC Verification & Document Intake
                </h3>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    kycCompleted
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {kycCompleted ? 'KYC Verified' : 'KYC Under Review'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {kycCompleted
                  ? `Official identity verification complete${kycRef ? ` (Ref: ${kycRef})` : ''}. All entity files archived.`
                  : 'Submit identification, proof of address, or incorporation filings for compliance certification.'}
              </p>
            </div>
          </div>

          {/* Quick Upload Action */}
          <div className="shrink-0 flex items-center justify-end">
            <VaultUploader />
          </div>
        </div>

        {/* Organized Corporate Kit Document Locker */}
        <DocumentLocker
          documents={rows}
          jurisdiction={company?.jurisdiction ?? 'uae'}
          companyName={company?.company_name}
        />
      </div>
    </div>
  );
}
