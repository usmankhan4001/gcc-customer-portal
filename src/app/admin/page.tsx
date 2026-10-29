'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Building,
  User,
  ArrowRight,
  Phone,
  Mail,
  ChevronRight,
  X,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

interface CompanyPipelineItem {
  id: string;
  company_name: string;
  jurisdiction: string;
  tier: string;
  track_type: string | null;
  status: string;
  official_kyc_completed: boolean;
  trade_license_number: string | null;
  created_at: string;
  updated_at: string;
  client_id: string | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  assigned_id: string | null;
  assigned_name: string | null;
  assigned_avatar: string | null;
  daysInStage: number;
  slaStatus: 'green' | 'yellow' | 'red';
  order: {
    amount_total: number;
    currency: string;
    payment_status: string;
  } | null;
}

const JURISDICTION_CONFIG: Record<string, { label: string; flag: string }> = {
  uae: { label: 'UAE Freezone', flag: '🇦🇪' },
  'hong-kong': { label: 'Hong Kong', flag: '🇭🇰' },
  singapore: { label: 'Singapore', flag: '🇸🇬' },
  bahrain: { label: 'Bahrain', flag: '🇧🇭' },
  ireland: { label: 'Ireland', flag: '🇮🇪' },
  bvi: { label: 'BVI / Cayman', flag: '🇻🇬' },
};

const TIER_LABELS: Record<string, string> = {
  tier_1_self: 'Self UBO',
  tier_2_nominee: 'Nominee UBO',
  tier_3_shelf: 'Shelf Entity',
};

const STAGE_ORDER: Record<string, string> = {
  lead: 'official_kyc_pending',
  onboarding: 'official_kyc_pending',
  official_kyc_pending: 'filing_in_progress',
  filing_in_progress: 'bank_opening',
  bank_opening: 'active',
  active: 'active',
};

const STATUS_SELECT_OPTIONS = [
  { value: 'lead', label: '1. New Lead' },
  { value: 'onboarding', label: '2. Onboarding' },
  { value: 'official_kyc_pending', label: '3. KYC Review' },
  { value: 'filing_in_progress', label: '4. Govt Filing' },
  { value: 'bank_opening', label: '5. Bank Setup' },
  { value: 'active', label: '6. Active & Complete' },
];

export default function AdminDashboard() {
  const [items, setItems] = useState<CompanyPipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [jurisdictionFilter, setJurisdictionFilter] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [submittingNew, setSubmittingNew] = useState(false);

  // New Order Form state
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formJurisdiction, setFormJurisdiction] = useState('uae');
  const [formTier, setFormTier] = useState('tier_1_self');
  const [formClientName, setFormClientName] = useState('');
  const [formClientEmail, setFormClientEmail] = useState('');
  const [formClientPhone, setFormClientPhone] = useState('');
  const [formStatus, setFormStatus] = useState('lead');

  const fetchPipeline = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/pipeline');
      if (res.ok) {
        const data = await res.json();
        setItems(data.companies || []);
      }
    } catch (err) {
      console.error('Failed to load pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  const handleUpdateStatus = async (companyId: string, newStatus: string) => {
    try {
      setUpdatingId(companyId);
      const res = await fetch('/api/admin/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, status: newStatus }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((c) =>
            c.id === companyId
              ? {
                  ...c,
                  status: newStatus,
                  daysInStage: 0,
                  slaStatus: 'green',
                  updated_at: new Date().toISOString(),
                }
              : c
          )
        );
      }
    } catch (err) {
      console.error('Failed to advance company stage:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompanyName.trim()) return;

    try {
      setSubmittingNew(true);
      const res = await fetch('/api/admin/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formCompanyName.trim(),
          jurisdiction: formJurisdiction,
          tier: formTier,
          clientName: formClientName.trim() || undefined,
          clientEmail: formClientEmail.trim() || undefined,
          clientPhone: formClientPhone.trim() || undefined,
          status: formStatus,
        }),
      });

      if (res.ok) {
        setShowNewModal(false);
        setFormCompanyName('');
        setFormClientName('');
        setFormClientEmail('');
        setFormClientPhone('');
        fetchPipeline();
      }
    } catch (err) {
      console.error('Failed to create company order:', err);
    } finally {
      setSubmittingNew(false);
    }
  };

  // Filtered dataset
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesJurisdiction =
        jurisdictionFilter === 'all' || item.jurisdiction === jurisdictionFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.company_name.toLowerCase().includes(q) ||
        (item.client_name && item.client_name.toLowerCase().includes(q)) ||
        (item.client_email && item.client_email.toLowerCase().includes(q)) ||
        (item.client_phone && item.client_phone.includes(q));

      return matchesJurisdiction && matchesQuery;
    });
  }, [items, jurisdictionFilter, searchQuery]);

  // Group into 4 distinct Kanban Columns
  const newLeads = useMemo(
    () => filteredItems.filter((i) => i.status === 'lead' || i.status === 'onboarding'),
    [filteredItems]
  );
  const kycReview = useMemo(
    () => filteredItems.filter((i) => i.status === 'official_kyc_pending'),
    [filteredItems]
  );
  const filingInProgress = useMemo(
    () => filteredItems.filter((i) => i.status === 'filing_in_progress' || i.status === 'bank_opening'),
    [filteredItems]
  );
  const activeDone = useMemo(
    () =>
      filteredItems.filter(
        (i) =>
          i.status === 'active' ||
          i.status === 'renewal_due' ||
          i.status === 'suspended' ||
          i.status === 'archived'
      ),
    [filteredItems]
  );

  // Total value in pipeline
  const totalPipelineRevenue = useMemo(() => {
    return items.reduce((acc, curr) => acc + (curr.order?.amount_total || 0), 0);
  }, [items]);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0 shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 max-w-[1700px] mx-auto w-full">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Operations Pipeline</h1>
              <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
                {items.length} Total Cases
              </span>
              {totalPipelineRevenue > 0 && (
                <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ${(totalPipelineRevenue / 100).toLocaleString()} Pipeline Vol.
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Live operational flow across global registries: Intake, KYC compliance, Registry filing & Bank opening.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 lg:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search company, client, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Jurisdiction filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={jurisdictionFilter}
                onChange={(e) => setJurisdictionFilter(e.target.value)}
                className="bg-transparent text-slate-700 text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">All Jurisdictions</option>
                <option value="uae">🇦🇪 UAE</option>
                <option value="hong-kong">🇭🇰 Hong Kong</option>
                <option value="singapore">🇸🇬 Singapore</option>
                <option value="bahrain">🇧🇭 Bahrain</option>
                <option value="ireland">🇮🇪 Ireland</option>
                <option value="bvi">🇻🇬 BVI / Cayman</option>
              </select>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchPipeline}
              disabled={loading}
              title="Refresh Pipeline"
              className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* New Order Button */}
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Order</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Kanban Content */}
      <main className="flex-1 overflow-x-auto p-6">
        <div className="flex space-x-5 h-[calc(100vh-140px)] min-w-[1280px] max-w-[1700px] mx-auto pb-4">
          <KanbanColumn
            title="1. New Leads & Intake"
            badgeColor="bg-amber-100 text-amber-800 border-amber-200"
            count={newLeads.length}
            cards={newLeads}
            loading={loading}
            updatingId={updatingId}
            onUpdateStatus={handleUpdateStatus}
          />
          <KanbanColumn
            title="2. KYC Review"
            badgeColor="bg-indigo-100 text-indigo-800 border-indigo-200"
            count={kycReview.length}
            cards={kycReview}
            loading={loading}
            updatingId={updatingId}
            onUpdateStatus={handleUpdateStatus}
          />
          <KanbanColumn
            title="3. Filing & Bank Opening"
            badgeColor="bg-sky-100 text-sky-800 border-sky-200"
            count={filingInProgress.length}
            cards={filingInProgress}
            loading={loading}
            updatingId={updatingId}
            onUpdateStatus={handleUpdateStatus}
          />
          <KanbanColumn
            title="4. Active & Complete"
            badgeColor="bg-emerald-100 text-emerald-800 border-emerald-200"
            count={activeDone.length}
            cards={activeDone}
            loading={loading}
            updatingId={updatingId}
            onUpdateStatus={handleUpdateStatus}
          />
        </div>
      </main>

      {/* New Order Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Create Company Order</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Horizon FZE"
                  value={formCompanyName}
                  onChange={(e) => setFormCompanyName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jurisdiction</label>
                  <select
                    value={formJurisdiction}
                    onChange={(e) => setFormJurisdiction(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="uae">🇦🇪 United Arab Emirates</option>
                    <option value="hong-kong">🇭🇰 Hong Kong</option>
                    <option value="singapore">🇸🇬 Singapore</option>
                    <option value="bahrain">🇧🇭 Bahrain</option>
                    <option value="ireland">🇮🇪 Ireland</option>
                    <option value="bvi">🇻🇬 BVI / Cayman</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tier</label>
                  <select
                    value={formTier}
                    onChange={(e) => setFormTier(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="tier_1_self">Tier 1: Self UBO</option>
                    <option value="tier_2_nominee">Tier 2: Nominee UBO</option>
                    <option value="tier_3_shelf">Tier 3: Shelf Entity</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Stage</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="lead">1. New Lead</option>
                    <option value="onboarding">2. Onboarding</option>
                    <option value="official_kyc_pending">3. KYC Review</option>
                    <option value="filing_in_progress">4. Govt Filing</option>
                    <option value="bank_opening">5. Bank Opening</option>
                    <option value="active">6. Active & Complete</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Tariq Mansoor"
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Email</label>
                  <input
                    type="email"
                    placeholder="client@domain.com"
                    value={formClientEmail}
                    onChange={(e) => setFormClientEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+971501234567"
                    value={formClientPhone}
                    onChange={(e) => setFormClientPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNew}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs disabled:opacity-50"
                >
                  {submittingNew ? 'Creating...' : 'Create Order Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kanban Column Component
// ---------------------------------------------------------------------------

function KanbanColumn({
  title,
  badgeColor,
  count,
  cards,
  loading,
  updatingId,
  onUpdateStatus,
}: {
  title: string;
  badgeColor: string;
  count: number;
  cards: CompanyPipelineItem[];
  loading: boolean;
  updatingId: string | null;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  return (
    <div className="flex flex-col bg-slate-100/70 rounded-xl border border-slate-200/80 w-full min-w-[320px] max-w-[380px] h-full flex-shrink-0 shadow-2xs">
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white rounded-t-xl">
        <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">{title}</h3>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border shadow-2xs ${badgeColor}`}>
          {count}
        </span>
      </div>

      {/* Cards Scroll Area */}
      <div className="p-3 flex-1 overflow-y-auto space-y-3">
        {loading && cards.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-slate-300" />
            Loading records...
          </div>
        ) : cards.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
            No companies currently in this stage.
          </div>
        ) : (
          cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              isUpdating={updatingId === card.id}
              onUpdateStatus={onUpdateStatus}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kanban Card Component
// ---------------------------------------------------------------------------

function KanbanCard({
  card,
  isUpdating,
  onUpdateStatus,
}: {
  card: CompanyPipelineItem;
  isUpdating: boolean;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const jInfo = JURISDICTION_CONFIG[card.jurisdiction] || {
    label: card.jurisdiction.toUpperCase(),
    flag: '🌐',
  };

  const nextStage = STAGE_ORDER[card.status];
  const canAdvance = nextStage && nextStage !== card.status;

  // SLA Color indicator
  const slaBadge =
    card.slaStatus === 'red'
      ? { label: `${card.daysInStage}d (SLA Overdue)`, bg: 'bg-red-50 text-red-700 border-red-200' }
      : card.slaStatus === 'yellow'
      ? { label: `${card.daysInStage}d in stage`, bg: 'bg-amber-50 text-amber-700 border-amber-200' }
      : { label: `${card.daysInStage}d in stage`, bg: 'bg-slate-50 text-slate-600 border-slate-200' };

  return (
    <div
      className={`bg-white p-4 rounded-xl shadow-xs border transition-all ${
        isUpdating ? 'opacity-50 pointer-events-none' : 'hover:shadow-md'
      } ${
        card.slaStatus === 'red' ? 'border-red-200' : 'border-slate-200'
      }`}
    >
      {/* Top Header: Company Name & SLA */}
      <div className="flex justify-between items-start gap-2 mb-2">
        <h4 className="font-bold text-sm text-slate-900 leading-snug break-words">
          {card.company_name}
        </h4>
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border flex-shrink-0 ${slaBadge.bg}`}
        >
          {card.slaStatus === 'red' && <AlertTriangle className="w-3 h-3 text-red-500" />}
          {card.slaStatus === 'yellow' && <Clock className="w-3 h-3 text-amber-500" />}
          {slaBadge.label}
        </span>
      </div>

      {/* Badges: Jurisdiction & Tier */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className="inline-flex items-center text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
          <span className="mr-1 text-sm leading-none">{jInfo.flag}</span>
          {jInfo.label}
        </span>
        <span className="inline-flex items-center text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
          {TIER_LABELS[card.tier] || card.tier}
        </span>
        {card.official_kyc_completed && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            KYC Verified
          </span>
        )}
      </div>

      {/* Client & Order Details */}
      <div className="bg-slate-50/70 rounded-lg p-2.5 mb-3 space-y-1 text-xs border border-slate-100">
        <div className="flex items-center text-slate-700 font-medium truncate">
          <User className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
          <span className="truncate">{card.client_name || 'No client name'}</span>
        </div>

        {card.client_phone && !card.client_phone.startsWith('temp_') && (
          <div className="flex items-center text-slate-500 text-[11px] truncate">
            <Phone className="w-3 h-3 mr-1.5 text-slate-400 flex-shrink-0" />
            <span>{card.client_phone}</span>
          </div>
        )}

        {card.order && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 mt-1">
            <span className="text-[11px] text-slate-500">Order value</span>
            <span className="font-semibold text-slate-800 text-[11px]">
              ${(card.order.amount_total / 100).toLocaleString()} (
              <span className={card.order.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}>
                {card.order.payment_status}
              </span>
              )
            </span>
          </div>
        )}
      </div>

      {/* Footer: Assigned Staff & Stage Transition Controls */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Assigned Staff */}
        <div className="flex items-center space-x-1.5 min-w-0">
          {card.assigned_avatar ? (
            <img
              src={card.assigned_avatar}
              alt={card.assigned_name || 'Staff'}
              className="w-5 h-5 rounded-full border border-slate-300"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center">
              {card.assigned_name ? card.assigned_name.charAt(0) : 'S'}
            </div>
          )}
          <span className="text-[11px] text-slate-600 font-medium truncate">
            {card.assigned_name || 'Unassigned'}
          </span>
        </div>

        {/* Stage Advance Actions */}
        <div className="relative flex items-center gap-1">
          {canAdvance && (
            <button
              onClick={() => onUpdateStatus(card.id, nextStage)}
              title="Advance to next stage"
              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold rounded-md transition-colors cursor-pointer"
            >
              <span>Advance</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}

          {/* Jump Stage Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              title="Change Status"
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showStatusMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowStatusMenu(false)}
                />
                <div className="absolute right-0 bottom-full mb-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-30 text-xs">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Move To Stage
                  </div>
                  {STATUS_SELECT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setShowStatusMenu(false);
                        if (opt.value !== card.status) {
                          onUpdateStatus(card.id, opt.value);
                        }
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors flex items-center justify-between ${
                        opt.value === card.status ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {opt.value === card.status && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
