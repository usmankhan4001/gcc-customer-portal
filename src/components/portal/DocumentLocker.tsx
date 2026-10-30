'use client';

import { useMemo, useState } from 'react';
import {
  FileText,
  FolderOpen,
  Warning,
  CheckCircle,
  Clock,
  WarningCircle,
  MagnifyingGlass,
  ShieldCheck,
  Buildings,
  Receipt,
  IdentificationCard,
  Scales,
} from '@phosphor-icons/react';
import DownloadButton from '@/components/portal/DownloadButton';
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

export default function DocumentLocker({
  documents = [],
  jurisdiction,
  companyName,
}: DocumentLockerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Check essential document completeness
  const essentialsCheck = useMemo(
    () => checkEssentialDocuments(jurisdiction, documents),
    [jurisdiction, documents]
  );

  // 2. Categorize documents
  const categorized = useMemo(() => categorizeDocuments(documents), [documents]);

  // 3. Filter documents by active tab and search query
  const filteredDocuments = useMemo(() => {
    let list: DocumentItem[] = [];
    if (activeTab === 'all') {
      list = documents;
    } else {
      list = categorized[activeTab] || [];
    }

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

  // Folder icon mapping
  const getFolderIcon = (category: CorporateFolderCategory) => {
    switch (category) {
      case 'incorporation_kit':
        return <Buildings size={18} weight="duotone" className="text-primary" />;
      case 'tax_records':
        return <Receipt size={18} weight="duotone" className="text-primary" />;
      case 'kyc_identification':
        return <IdentificationCard size={18} weight="duotone" className="text-primary" />;
      case 'compliance_filings':
        return <Scales size={18} weight="duotone" className="text-primary" />;
    }
  };

  // Status badge styling
  const renderBadge = (status: DocumentBadgeStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle size={13} weight="fill" className="text-emerald-600" />
            Verified
          </span>
        );
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={13} weight="fill" className="text-amber-600" />
            Pending Review
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <WarningCircle size={13} weight="fill" className="text-rose-600" />
            Expired
          </span>
        );
      case 'missing_essential':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-800 border border-red-200">
            <Warning size={13} weight="fill" className="text-red-600" />
            Missing Essential
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            Active
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Missing Essential Incorporation Documents Warning Banner */}
      {!essentialsCheck.isComplete && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-4 md:p-5 shadow-sm text-gray-900 transition-all">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
              <Warning size={22} weight="bold" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-gray-900 text-sm md:text-base">
                  Essential Corporate Kit Documents Missing
                </h3>
                <span className="text-xs font-semibold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md">
                  Action Required
                </span>
              </div>
              <p className="text-xs md:text-sm text-gray-700 mt-1">
                Your {companyName ? `company (${companyName})` : 'corporate file'} is currently missing essential official documents for{' '}
                <span className="font-semibold">{essentialsCheck.jurisdiction.toUpperCase()}</span> registration.
                These are required for commercial contracts, tax registrations, and corporate bank compliance.
              </p>

              {/* List of missing essential documents */}
              <div className="mt-3 flex flex-wrap gap-2">
                {essentialsCheck.missingDocuments.map((req) => (
                  <div
                    key={req.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white/90 border border-amber-300 text-amber-900 shadow-2xs"
                  >
                    <WarningCircle size={14} weight="duotone" className="text-amber-600" />
                    <span>{req.name}</span>
                    <span className="text-[10px] text-amber-700 font-bold uppercase">(Missing)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Locker Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-gray-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck size={24} weight="duotone" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-primary tracking-tight">
                Official Corporate Kit Locker
              </h2>
              <p className="text-xs text-gray-500">
                Encrypted bank-grade document storage with 1-click presigned downloads and sharing.
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <MagnifyingGlass
              size={16}
              weight="bold"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs md:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-gray-50/60 px-4 pt-2 overflow-x-auto">
          <nav className="flex space-x-2 md:space-x-4 min-w-max" aria-label="Locker Categories">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 px-3 text-xs md:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'all'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <FolderOpen size={16} weight={activeTab === 'all' ? 'fill' : 'regular'} />
              <span>All Documents</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'all' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {documents.length}
              </span>
            </button>

            {CORPORATE_FOLDERS.map((folder) => {
              const count = (categorized[folder.id] || []).length;
              const isActive = activeTab === folder.id;
              return (
                <button
                  key={folder.id}
                  onClick={() => setActiveTab(folder.id)}
                  className={`pb-3 px-3 text-xs md:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
                    isActive
                      ? 'border-primary text-primary font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  {getFolderIcon(folder.id)}
                  <span>{folder.name}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Document List */}
        <div>
          {filteredDocuments.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400 mb-3">
                <FolderOpen size={24} weight="duotone" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">No documents found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                {searchQuery
                  ? `No files matched "${searchQuery}". Try a different keyword.`
                  : activeTab === 'all'
                  ? 'Your document locker is currently empty. Upload company records or KYC documents above.'
                  : `No files in ${CORPORATE_FOLDERS.find((f) => f.id === activeTab)?.name || activeTab}.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3 font-bold">Document Name</th>
                    <th className="px-4 py-3 font-bold hidden md:table-cell">Category</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold hidden sm:table-cell">File Size</th>
                    <th className="px-4 py-3 font-bold hidden sm:table-cell">Date</th>
                    <th className="px-4 py-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDocuments.map((doc) => {
                    const badge = doc.badge_status || 'verified';
                    const categoryLabel = getDocumentCategoryLabel(
                      doc.category || doc.document_type
                    );

                    return (
                      <tr
                        key={doc.id}
                        className="hover:bg-slate-50/80 transition-colors group text-sm"
                      >
                        {/* Name and Icon */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-md bg-primary-50 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                              <FileText size={18} weight="duotone" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 truncate max-w-xs md:max-w-md">
                                {doc.file_name}
                              </div>
                              <div className="md:hidden text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                                <span>{categoryLabel}</span>
                                <span>•</span>
                                <span>{formatFileSize(doc.file_size_bytes)}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                            {categoryLabel}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-3 whitespace-nowrap">{renderBadge(badge)}</td>

                        {/* Size */}
                        <td className="px-4 py-3 text-xs text-gray-600 font-medium hidden sm:table-cell whitespace-nowrap">
                          {formatFileSize(doc.file_size_bytes)}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-xs text-gray-600 font-medium hidden sm:table-cell whitespace-nowrap">
                          {doc.created_at
                            ? new Date(doc.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—'}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex justify-end items-center gap-1">
                            <ShareButton documentId={doc.id} />
                            <DownloadButton documentId={doc.id} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
