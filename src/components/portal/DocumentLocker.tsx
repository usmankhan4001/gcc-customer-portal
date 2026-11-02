'use client';

import { useMemo, useState } from 'react';
import { DownloadSimple, CircleNotch, MagnifyingGlass } from '@phosphor-icons/react';
import ShareButton from '@/components/portal/ShareButton';
import {
  categorizeDocuments,
  checkEssentialDocuments,
  formatFileSize,
  getDocumentCategoryLabel,
  sortDocumentsByDate,
  CORPORATE_FOLDERS,
  CorporateFolderCategory,
  DocumentBadgeStatus,
  DocumentItem,
} from '@/lib/vault/locker';

interface DocumentLockerProps {
  documents: DocumentItem[];
  jurisdiction?: string | null;
  companyName?: string | null;
}

type TabType = 'all' | CorporateFolderCategory;

const BADGES: Record<string, { cls: string; label: string }> = {
  verified: { cls: 'badge-success', label: 'Verified' },
  pending_review: { cls: 'badge-accent', label: 'Pending review' },
  expired: { cls: 'badge-danger', label: 'Expired' },
  missing_essential: { cls: 'badge-danger', label: 'Missing essential' },
};

function statusBadge(status: DocumentBadgeStatus) {
  const b = BADGES[status] ?? { cls: 'badge-neutral', label: 'Active' };
  return <span className={`badge ${b.cls}`}>{b.label}</span>;
}

// Same request as DownloadButton, restyled as a 44px icon button.
function DownloadAction({ documentId, name }: { documentId: string; name: string }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vault/${documentId}/download`);
      const data = await res.json();
      if (data.url) window.open(data.url, '_blank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="cl-icon-btn"
      aria-label={`Download ${name}`}
      title="Download"
    >
      {loading ? (
        <CircleNotch size={18} className="animate-spin" aria-hidden="true" />
      ) : (
        <DownloadSimple size={18} aria-hidden="true" />
      )}
    </button>
  );
}

export default function DocumentLocker({
  documents = [],
  jurisdiction,
  companyName,
}: DocumentLockerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const essentialsCheck = useMemo(
    () => checkEssentialDocuments(jurisdiction, documents),
    [jurisdiction, documents]
  );

  const categorized = useMemo(() => categorizeDocuments(documents), [documents]);

  const filteredDocuments = useMemo(() => {
    let list: DocumentItem[] = activeTab === 'all' ? documents : categorized[activeTab] || [];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((doc) => {
        const name = (doc.file_name || '').toLowerCase();
        const cat = (doc.category || '').toLowerCase();
        const label = getDocumentCategoryLabel(doc.category || doc.document_type).toLowerCase();
        return name.includes(q) || cat.includes(q) || label.includes(q);
      });
    }

    return sortDocumentsByDate(list, 'desc');
  }, [documents, categorized, activeTab, searchQuery]);

  const tabs: Array<{ id: TabType; name: string; count: number }> = [
    { id: 'all', name: 'All documents', count: documents.length },
    ...CORPORATE_FOLDERS.map((f) => ({
      id: f.id as TabType,
      name: f.name,
      count: (categorized[f.id] || []).length,
    })),
  ];

  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      {!essentialsCheck.isComplete && (
        <section className="card" aria-labelledby="missing-heading" role="status">
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            <h2 id="missing-heading" style={{ margin: 0, fontSize: 18 }}>
              Essential corporate kit documents missing
            </h2>
            <span className="badge badge-accent">Action required</span>
          </div>
          <p style={{ margin: 'var(--space-2) 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
            Your {companyName ? `company (${companyName})` : 'corporate file'} is missing official documents for{' '}
            <strong>{essentialsCheck.jurisdiction.toUpperCase()}</strong> registration. They are required for
            commercial contracts, tax registrations, and corporate bank compliance.
          </p>
          <ul
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
              margin: 'var(--space-3) 0 0',
              padding: 0,
              listStyle: 'none',
            }}
          >
            {essentialsCheck.missingDocuments.map((req) => (
              <li key={req.id} className="badge badge-neutral">
                {req.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="admin-table-card card" aria-labelledby="locker-heading">
        <div style={{ padding: 'var(--space-4) var(--space-4) 0' }}>
          <h2 id="locker-heading" style={{ margin: 0, fontSize: 18 }}>
            Corporate kit locker
          </h2>
          <p style={{ margin: 'var(--space-1) 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
            Encrypted document storage with one-tap downloads and expiring share links.
          </p>
        </div>

        <div className="cl-toolbar">
          <label className="cl-search">
            <MagnifyingGlass size={16} aria-hidden="true" />
            <input
              type="search"
              aria-label="Search documents"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
          <div className="cl-chips" role="group" aria-label="Document categories">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`cl-chip${activeTab === t.id ? ' is-on' : ''}`}
                aria-pressed={activeTab === t.id}
                onClick={() => setActiveTab(t.id)}
              >
                {t.name} <span className="cl-chip-count">{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="cl-empty">
            <p>
              {searchQuery
                ? `No files matched "${searchQuery}". Try a different keyword.`
                : activeTab === 'all'
                ? 'Your document locker is empty. Upload company records or KYC documents above.'
                : `No files in ${CORPORATE_FOLDERS.find((f) => f.id === activeTab)?.name || activeTab}.`}
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th className="hide-phone">Category</th>
                  <th>Status</th>
                  <th className="hide-phone">Size</th>
                  <th className="hide-phone">Date</th>
                  <th className="is-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => {
                  const categoryLabel = getDocumentCategoryLabel(doc.category || doc.document_type);
                  return (
                    <tr key={doc.id}>
                      <td>
                        <strong style={{ overflowWrap: 'anywhere' }}>{doc.file_name}</strong>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {categoryLabel} · {formatFileSize(doc.file_size_bytes)}
                        </div>
                      </td>
                      <td className="hide-phone">{categoryLabel}</td>
                      <td>{statusBadge(doc.badge_status || 'verified')}</td>
                      <td className="hide-phone">{formatFileSize(doc.file_size_bytes)}</td>
                      <td className="hide-phone">
                        {doc.created_at
                          ? new Date(doc.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="is-right">
                        <div style={{ display: 'inline-flex', gap: 'var(--space-1)' }}>
                          <ShareButton documentId={doc.id} />
                          <DownloadAction documentId={doc.id} name={doc.file_name} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
