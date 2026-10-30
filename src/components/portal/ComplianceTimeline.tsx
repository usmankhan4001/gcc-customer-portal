'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Warning,
  CheckCircle,
  ArrowSquareOut,
  ShieldCheck,
  FileText,
  CircleNotch,
} from '@phosphor-icons/react';
import type {
  StatutoryDeadlineItem,
  ComplianceSummary,
  DeadlineStatus,
  ComplianceCategory,
} from '@/lib/compliance/stateful-calendar';

export interface ComplianceTimelineProps {
  companyId?: string;
  initialDeadlines?: StatutoryDeadlineItem[];
  initialSummary?: ComplianceSummary;
  className?: string;
}

const CATEGORY_LABELS: Record<ComplianceCategory, string> = {
  tax: 'Corporate Tax',
  vat: 'VAT / GST',
  license: 'Trade License / CR',
  annual_return: 'Annual Return',
  esr: 'Economic Substance',
  other: 'Statutory Obligation',
};

const CATEGORY_COLORS: Record<ComplianceCategory, string> = {
  tax: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  vat: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  license: 'bg-blue-50 text-blue-700 border-blue-200',
  annual_return: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  esr: 'bg-purple-50 text-purple-700 border-purple-200',
  other: 'bg-slate-50 text-slate-700 border-slate-200',
};

export default function ComplianceTimeline({
  companyId,
  initialDeadlines,
  initialSummary,
  className = '',
}: ComplianceTimelineProps) {
  const [deadlines, setDeadlines] = useState<StatutoryDeadlineItem[]>(initialDeadlines ?? []);
  const [summary, setSummary] = useState<ComplianceSummary | null>(initialSummary ?? null);
  const [loading, setLoading] = useState<boolean>(!initialDeadlines && !!companyId);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'action_required' | 'upcoming'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (!initialDeadlines && companyId) {
      setLoading(true);
      setError(null);
      fetch(`/api/companies/${companyId}/compliance`)
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to fetch statutory compliance schedule');
          }
          return res.json();
        })
        .then((data) => {
          setDeadlines(data.deadlines ?? []);
          setSummary(data.summary ?? null);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [companyId, initialDeadlines]);

  const filteredDeadlines = deadlines.filter((item) => {
    if (filter === 'action_required' && item.status === 'upcoming') {
      return false;
    }
    if (filter === 'upcoming' && item.status !== 'upcoming') {
      return false;
    }
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status: DeadlineStatus, daysRemaining: number) => {
    switch (status) {
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
            <Warning className="w-3.5 h-3.5 text-rose-600" weight="fill" />
            Overdue by {Math.abs(daysRemaining)} {Math.abs(daysRemaining) === 1 ? 'day' : 'days'}
          </span>
        );
      case 'due_soon':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" weight="fill" />
            {daysRemaining === 0
              ? 'Due today'
              : `Due in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`}
          </span>
        );
      case 'upcoming':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            In {daysRemaining} days
          </span>
        );
    }
  };

  const getOverallStatusBanner = (overallStatus?: 'compliant' | 'action_required' | 'critical') => {
    if (overallStatus === 'critical') {
      return (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
          <Warning className="w-5 h-5 text-rose-600 shrink-0" weight="fill" />
          <div className="text-xs">
            <span className="font-bold block text-sm">Critical Attention Required</span>
            One or more statutory filings are overdue. Filing late incurs immediate government penalties and potential registry suspension.
          </div>
        </div>
      );
    }
    if (overallStatus === 'action_required') {
      return (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" weight="fill" />
          <div className="text-xs">
            <span className="font-bold block text-sm">Action Imminent</span>
            You have statutory filings due within the next 30 days. Prepare documentation and initiate filings promptly.
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" weight="fill" />
        <div className="text-xs">
          <span className="font-bold block text-sm">Company In Good Standing</span>
          All statutory compliance obligations are on schedule. No imminent deadlines require immediate filing.
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`p-8 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center min-h-[300px] ${className}`}>
        <CircleNotch className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-600">Calculating statutory compliance calendar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 ${className}`}>
        <div className="flex items-center gap-2 mb-2 font-bold text-sm">
          <Warning className="w-4 h-4 text-rose-600" />
          Compliance Calendar Error
        </div>
        <p className="text-xs text-rose-700">{error}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Status Banner */}
      {summary && getOverallStatusBanner(summary.overallStatus)}

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Filings</div>
            <div className="text-2xl font-bold text-primary mt-1">{summary.total}</div>
          </div>
          <div className={`p-4 rounded-xl border shadow-xs ${summary.overdue > 0 ? 'bg-rose-50/70 border-rose-200' : 'bg-white border-slate-200'}`}>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Overdue</div>
            <div className={`text-2xl font-bold mt-1 ${summary.overdue > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{summary.overdue}</div>
          </div>
          <div className={`p-4 rounded-xl border shadow-xs ${summary.dueSoon > 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-slate-200'}`}>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Due Soon (≤30d)</div>
            <div className={`text-2xl font-bold mt-1 ${summary.dueSoon > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{summary.dueSoon}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Upcoming</div>
            <div className="text-2xl font-bold text-slate-700 mt-1">{summary.upcoming}</div>
          </div>
        </div>
      )}

      {/* Filter and Tab Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100/80 rounded-lg">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              filter === 'all'
                ? 'bg-white text-primary shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Deadlines ({deadlines.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('action_required')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              filter === 'action_required'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Action Required ({(summary?.overdue ?? 0) + (summary?.dueSoon ?? 0)})
          </button>
          <button
            type="button"
            onClick={() => setFilter('upcoming')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              filter === 'upcoming'
                ? 'bg-white text-primary shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upcoming ({summary?.upcoming ?? 0})
          </button>
        </div>

        {/* Category Select */}
        <div className="w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            aria-label="Filter by obligation category"
          >
            <option value="all">All Categories</option>
            <option value="tax">Corporate Tax</option>
            <option value="vat">VAT / GST</option>
            <option value="license">Trade License / CR</option>
            <option value="annual_return">Annual Return</option>
            <option value="esr">Economic Substance</option>
          </select>
        </div>
      </div>

      {/* Timeline Items List */}
      {filteredDeadlines.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-xs font-medium">No deadlines match the selected filter criteria.</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6 py-2">
          {filteredDeadlines.map((item) => {
            const isOverdue = item.status === 'overdue';
            const isDueSoon = item.status === 'due_soon';

            return (
              <div key={item.id} className="relative group">
                {/* Node marker on timeline */}
                <span
                  className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                    isOverdue
                      ? 'bg-rose-500 ring-4 ring-rose-100'
                      : isDueSoon
                      ? 'bg-amber-500 ring-4 ring-amber-100'
                      : 'bg-primary ring-4 ring-slate-100'
                  }`}
                />

                {/* Card Container */}
                <div
                  className={`p-5 rounded-xl border transition-all ${
                    isOverdue
                      ? 'bg-rose-50/30 border-rose-200 hover:border-rose-300'
                      : isDueSoon
                      ? 'bg-amber-50/20 border-amber-200 hover:border-amber-300'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other}`}>
                        {CATEGORY_LABELS[item.category] || 'Statutory'}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    </div>
                    <div>{getStatusBadge(item.status, item.daysRemaining)}</div>
                  </div>

                  {/* Target Date and Authority */}
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600 mb-3 font-mono">
                    <div className="flex items-center gap-1.5 font-semibold text-primary">
                      <Calendar className="w-3.5 h-3.5 text-cta" />
                      Statutory Due Date: {item.deadlineDate}
                    </div>
                    <div className="text-slate-400">•</div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Filing Authority: <span className="font-medium text-slate-700">{item.filingAuthority}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {item.description}
                  </p>

                  {/* Penalty Box */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 mb-3.5">
                    <div className="flex items-start gap-2">
                      <Warning className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-slate-700">
                        <span className="font-bold text-slate-900 mr-1">Statutory Non-Compliance Penalty:</span>
                        {item.penaltyExplanation}
                      </div>
                    </div>
                  </div>

                  {/* Action Link Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">
                      Requirement ID: <code className="text-slate-500 font-mono">{item.id}</code>
                    </span>
                    {item.filingPortalUrl && (
                      <a
                        href={item.filingPortalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-cta hover:text-cta-600 transition-colors"
                      >
                        Official Authority Portal
                        <ArrowSquareOut className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
