import { and, desc, eq, ne } from 'drizzle-orm';
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
    <div style={{ paddingBottom: 'var(--space-8)' }}>
      <BannerHeader
        title="Document vault"
        subtitle="Encrypted corporate repository and KYC verification."
      />

      <div className="wrap" style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <section className="card" aria-labelledby="kyc-heading" style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <h2 id="kyc-heading" style={{ margin: 0, fontSize: 18 }}>
                KYC verification and document intake
              </h2>
              <span className={`badge ${kycCompleted ? 'badge-success' : 'badge-accent'}`}>
                {kycCompleted ? 'KYC verified' : 'KYC under review'}
              </span>
            </div>
            <p style={{ margin: 'var(--space-2) 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
              {kycCompleted
                ? `Official identity verification complete${kycRef ? ` (Ref: ${kycRef})` : ''}. All entity files archived.`
                : 'Submit identification, proof of address, or incorporation filings for compliance certification.'}
            </p>
          </div>
          <VaultUploader />
        </section>

        <DocumentLocker
          documents={rows}
          jurisdiction={company?.jurisdiction ?? 'uae'}
          companyName={company?.company_name}
        />
      </div>
    </div>
  );
}
