'use client';

import React, { useState } from 'react';
import { usePortalStore } from '@/lib/store';
import Modal from '@/components/ui/Modal';
import {
  Receipt,
  FileCheck,
  ShieldCheck,
  Plus,
  ArrowRight,
  TrendingUp,
  Percent,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export default function TaxCompliancePage() {
  const { taxRecords, expenses, addExpense, fileTaxReturn } = usePortalStore();

  const [activeTab, setActiveTab] = useState<'returns' | 'expenses' | 'rules'>('returns');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseCat, setExpenseCat] = useState('Software & IT');
  const [expenseAmount, setExpenseAmount] = useState('');

  const totalDeductible = expenses.reduce((s, e) => s + e.amountAed, 0);
  const estimatedRevenue = 650000;
  const netTaxableProfit = Math.max(0, estimatedRevenue - totalDeductible - 375000);
  const corporateTaxLiability = Math.round(netTaxableProfit * 0.09);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc || !expenseAmount) return;

    addExpense({
      description: expenseDesc,
      category: expenseCat,
      amountAed: Number(expenseAmount),
      date: new Date().toISOString().split('T')[0],
      status: 'verified',
    });

    setExpenseDesc('');
    setExpenseAmount('');
    setIsExpenseModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span className="badge badge-navy">FEDERAL TAX AUTHORITY</span>
          <span className="badge badge-success">9% CORPORATE TAX & VAT</span>
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.65rem',
            fontWeight: 800,
            color: 'var(--navy)',
            letterSpacing: '-0.02em',
          }}
        >
          Tax & 9% FTA <span style={{ color: 'var(--orange)' }}>Compliance Hub</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
          Manage UAE corporate tax exemptions, track deductible business expenses, and submit quarterly VAT returns.
        </p>
      </div>

      {/* Tax Summary Metrics Band */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="card app-card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Total Deductibles Logged</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginTop: 2 }}>
            AED {totalDeductible.toLocaleString()}
          </div>
          <div style={{ fontSize: 10, color: 'var(--success)', marginTop: 2 }}>
            4 verified receipts
          </div>
        </div>

        <div className="card app-card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Estimated 9% Corp Tax</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--orange)', marginTop: 2 }}>
            AED {corporateTaxLiability.toLocaleString()}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
            AED 375k threshold applied
          </div>
        </div>
      </div>

      {/* Segmented Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { id: 'returns', label: 'Tax Returns Schedule' },
          { id: 'expenses', label: 'Deductible Expense Ledger' },
          { id: 'rules', label: 'UAE 9% Corporate Tax Rules' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flexShrink: 0, fontSize: 12, padding: '7px 14px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Tax Returns */}
      {activeTab === 'returns' && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {taxRecords.map((rec) => (
            <div key={rec.id} className="card app-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)' }}>{rec.title}</h3>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{rec.period} • TRN: {rec.trnNumber}</div>
                </div>
                <span
                  className={`badge ${
                    rec.status === 'filed'
                      ? 'badge-success'
                      : rec.status === 'exempt_0_percent'
                      ? 'badge-blue'
                      : 'badge-orange'
                  }`}
                >
                  {rec.status === 'filed'
                    ? 'Filed with FTA'
                    : rec.status === 'exempt_0_percent'
                    ? '0% QFZP Exempt'
                    : 'Ready to Submit'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  Due Date: <strong>{rec.dueDate}</strong>
                </div>

                {rec.status !== 'filed' && rec.status !== 'exempt_0_percent' && (
                  <button
                    onClick={() => fileTaxReturn(rec.id)}
                    className="btn btn-primary btn-sm"
                  >
                    <span>Submit & File</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Expense Ledger */}
      {activeTab === 'expenses' && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Logged Business Expenses</div>
            <button onClick={() => setIsExpenseModalOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={14} /> Add Receipt
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {expenses.map((exp) => (
              <div key={exp.id} className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{exp.description}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{exp.category} • {exp.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)' }}>AED {exp.amountAed.toLocaleString()}</div>
                  <span className="badge badge-success" style={{ fontSize: 9 }}>DEDUCTIBLE</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Tax Rules */}
      {activeTab === 'rules' && (
        <div className="card card-sand animate-slide-up" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="section-title">UAE Federal Corporate Tax Framework (Cabinet Decision No. 55/2023)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            <div>
              <strong style={{ color: 'var(--navy)' }}>1. 0% Tax on First AED 375,000:</strong> Taxable net profit up to AED 375,000 (approx. $102,000 USD) is taxed at exactly 0%.
            </div>
            <div>
              <strong style={{ color: 'var(--navy)' }}>2. 9% Tax on Excess:</strong> Only profits above AED 375,000 are subject to 9% corporate tax.
            </div>
            <div>
              <strong style={{ color: 'var(--navy)' }}>3. Qualifying Free Zone Person (QFZP):</strong> 0% corporate tax applies indefinitely on foreign transactions and qualifying intra-freezone trade.
            </div>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Add Deductible Business Expense"
        badge="TAX DEDUCTION"
        badgeVariant="orange"
      >
        <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="input-label">Expense Description:</label>
            <input
              type="text"
              required
              placeholder="e.g. Meta Ads, AWS Server, Client Travel"
              value={expenseDesc}
              onChange={(e) => setExpenseDesc(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">Category:</label>
            <select
              value={expenseCat}
              onChange={(e) => setExpenseCat(e.target.value)}
              className="input-field"
            >
              <option>Software & IT</option>
              <option>Marketing & Advertising</option>
              <option>Rent & Office</option>
              <option>Legal & Professional</option>
              <option>Travel & Hospitality</option>
            </select>
          </div>

          <div>
            <label className="input-label">Amount in AED:</label>
            <input
              type="number"
              required
              placeholder="e.g. 5000"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              className="input-field"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', height: 42, marginTop: 4 }}>
            Record Expense
          </button>
        </form>
      </Modal>
    </div>
  );
}
