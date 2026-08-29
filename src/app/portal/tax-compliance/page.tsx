'use client';

import React, { useState } from 'react';
import { usePortalStore } from '@/lib/store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import {
  Receipt,
  Calculator,
  Plus,
  ArrowRight,
  FileText,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
} from 'lucide-react';

function EntitySelector({
  entities,
  activeId,
  onSelect,
}: {
  entities: { id: string; name: string; flag: string }[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  if (entities.length <= 1) return null;
  return (
    <div className="h-scroll" style={{ gap: 8, marginBottom: 20 }}>
      {entities.map((ent) => (
        <button
          key={ent.id}
          onClick={() => onSelect(ent.id)}
          className={`chip ${ent.id === activeId ? 'active' : ''}`}
          style={{ flexShrink: 0 }}
        >
          <span>{ent.flag}</span>
          <span className="truncate" style={{ maxWidth: 110 }}>{ent.name}</span>
        </button>
      ))}
    </div>
  );
}

type Tab = 'overview' | 'expenses' | 'vat' | 'corporate_tax';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'vat', label: 'VAT Returns' },
  { id: 'corporate_tax', label: 'Corporate Tax' },
];

export default function TaxCompliancePage() {
  const { taxRecords, expenses, addExpense, fileTaxReturn, entities, activeEntityId, setActiveEntityId } = usePortalStore();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [expenseModal, setExpenseModal] = useState(false);
  const [filingModal, setFilingModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);

  const [expDesc, setExpDesc] = useState('');
  const [expCategory, setExpCategory] = useState('Software & IT');
  const [expAmount, setExpAmount] = useState('');

  const entity = entities.find((e) => e.id === activeEntityId) || entities[0];
  const annualRevenue = entity?.annualRevenue ?? 650000;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amountAed, 0);
  const threshold = 375000;
  const netTaxable = Math.max(0, annualRevenue - totalExpenses);
  const profitAboveThreshold = Math.max(0, netTaxable - threshold);
  const estimatedTax = Math.round(profitAboveThreshold * 0.09);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDesc || !expAmount) return;
    addExpense({
      description: expDesc,
      category: expCategory,
      amountAed: Number(expAmount),
      date: new Date().toISOString().split('T')[0],
      status: 'verified',
    });
    setExpDesc('');
    setExpAmount('');
    setExpenseModal(false);
    showToast('success', 'Expense logged — tax deduction applied');
  };

  const handleFileReturn = () => {
    if (selectedRecord) {
      fileTaxReturn(selectedRecord);
      setFilingModal(false);
      setSelectedRecord(null);
      showToast('success', 'Return filed with FTA successfully');
    }
  };

  if (!entity) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><Receipt size={32} /></div>
        <h3 className="empty-state-title">No Active Entity</h3>
        <p className="empty-state-desc">Set up a company to manage tax compliance.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div className="animate-fade-in">
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.08em', marginBottom: 4 }}>
          UAE CORPORATE TAX & VAT MANAGEMENT
        </div>
        <h1 className="font-heading" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
          Tax <span style={{ color: 'var(--color-orange)' }}>Compliance</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 4 }}>
          UAE corporate tax & VAT management for your entities.
        </p>
      </div>

      {/* Entity Selector */}
      <EntitySelector
        entities={entities}
        activeId={entity.id}
        onSelect={setActiveEntityId}
      />

      {/* Tab Bar */}
      <div className="h-scroll" style={{ gap: 8 }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`chip ${activeTab === tab.id ? 'active' : ''}`}
            style={{ flexShrink: 0 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {[
              { label: 'NEXT FILING', value: taxRecords.find((t) => t.status === 'ready_to_file')?.dueDate || 'N/A', color: 'var(--color-text)' },
              { label: 'ESTIMATED LIABILITY', value: `AED ${estimatedTax.toLocaleString()}`, color: 'var(--color-orange)' },
              { label: 'TRN NUMBER', value: taxRecords[0]?.trnNumber || 'N/A', color: 'var(--color-text)' },
            ].map((item, i) => (
              <div key={i} className="card card-padded" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>{item.label}</span>
                <span className="font-heading truncate" style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Tax Records Summary */}
          <div className="section-header">
            <span className="section-title">Tax Returns Schedule</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {taxRecords.map((rec) => (
              <div key={rec.id} className="card card-padded" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-orange-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-orange)', flexShrink: 0,
                }}>
                  <FileText size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }} className="truncate">{rec.title}</span>
                    <Badge variant={
                      rec.status === 'filed' ? 'success' :
                      rec.status === 'ready_to_file' ? 'warning' :
                      rec.status === 'exempt_0_percent' ? 'info' : 'navy'
                    } size="sm">
                      {rec.status === 'filed' ? 'Filed' :
                       rec.status === 'ready_to_file' ? 'Ready to File' :
                       rec.status === 'exempt_0_percent' ? '0% Exempt' : 'Upcoming'}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                    <span><strong>Period:</strong> {rec.period}</span>
                    <span><strong>Due:</strong> {rec.dueDate}</span>
                  </div>
                </div>
                {rec.status === 'ready_to_file' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => { setSelectedRecord(rec.id); setFilingModal(true); }}
                  >
                    <span>File</span>
                    <ArrowRight size={14} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="section-header">
            <span className="section-title">Deductible Expenses</span>
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setExpenseModal(true)}>
              Add Expense
            </Button>
          </div>

          {expenses.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <div className="empty-state-icon"><TrendingDown size={28} /></div>
              <h3 className="empty-state-title" style={{ fontSize: '1rem' }}>No Expenses</h3>
              <p className="empty-state-desc" style={{ fontSize: 13 }}>Add deductible business expenses to reduce your tax liability.</p>
            </div>
          ) : (
            <div className="card card-bordered" style={{ overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 120px 100px', padding: '10px 16px', background: 'var(--color-surface-alt)', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}>
                <span>Date</span>
                <span>Description</span>
                <span>Category</span>
                <span style={{ textAlign: 'right' }}>Amount</span>
              </div>
              {expenses.map((exp, i) => (
                <div key={exp.id} style={{
                  display: 'grid', gridTemplateColumns: '100px 1fr 120px 100px',
                  padding: '12px 16px', alignItems: 'center',
                  borderBottom: i < expenses.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{exp.date}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }} className="truncate">{exp.description}</span>
                  <Badge variant="navy" size="sm">{exp.category}</Badge>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-success)', textAlign: 'right' }}>-AED {exp.amountAed.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VAT Returns Tab */}
      {activeTab === 'vat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="section-header">
            <span className="section-title">VAT Returns</span>
          </div>
          {taxRecords.filter((r) => r.title.toLowerCase().includes('vat')).length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <div className="empty-state-icon"><Receipt size={28} /></div>
              <h3 className="empty-state-title" style={{ fontSize: '1rem' }}>No VAT Returns</h3>
              <p className="empty-state-desc" style={{ fontSize: 13 }}>No VAT returns scheduled yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {taxRecords.filter((r) => r.title.toLowerCase().includes('vat')).map((rec) => (
                <div key={rec.id} className="card card-padded" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-orange-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-orange)', flexShrink: 0,
                  }}>
                    <Receipt size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }} className="truncate">{rec.title}</span>
                      <Badge variant={rec.status === 'filed' ? 'success' : 'warning'} size="sm">
                        {rec.status === 'filed' ? 'Filed' : 'Ready to File'}
                      </Badge>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                      Due: {rec.dueDate} — AED {rec.estimatedTaxLiability.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Corporate Tax Tab */}
      {activeTab === 'corporate_tax' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="section-header">
            <span className="section-title">UAE Corporate Tax Rules</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {[
              { variant: 'info' as const, badge: '0% BRACKET', title: 'First AED 375,000 Profit', desc: 'All UAE mainland and freezone taxable profits up to AED 375,000 (~$102,000 USD) are taxed at 0%.' },
              { variant: 'warning' as const, badge: '9% BRACKET', title: 'Profit Exceeding AED 375,000', desc: 'Profits exceeding AED 375,000 are subject to a flat 9% corporate tax rate, the lowest in the OECD.' },
              { variant: 'success' as const, badge: '0% QFZP STATUS', title: 'Freezone Qualifying Income', desc: 'Freezone companies transacting qualifying activities maintain a 0% tax rate on unlimited profit.' },
            ].map((rule, i) => (
              <div key={i} className="card card-padded" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Badge variant={rule.variant} size="sm">{rule.badge}</Badge>
                <h3 className="font-heading" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>{rule.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{rule.desc}</p>
              </div>
            ))}
          </div>

          {/* Annual Summary */}
          <div className="card card-flat card-padded" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>
              ANNUAL TAX SUMMARY — {entity.name}
            </div>
            {[
              { label: 'Annual Revenue', value: `AED ${annualRevenue.toLocaleString()}`, color: 'var(--color-text)' },
              { label: 'Deductible Expenses', value: `-AED ${totalExpenses.toLocaleString()}`, color: 'var(--color-success)' },
              { label: 'Net Taxable Profit', value: `AED ${netTaxable.toLocaleString()}`, color: 'var(--color-text)' },
              { label: 'Estimated 9% Liability', value: `AED ${estimatedTax.toLocaleString()}`, color: 'var(--color-orange)' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, paddingBottom: i < 3 ? 8 : 0, borderBottom: i < 3 ? '1px solid var(--color-border)' : 'none' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>{row.label}</span>
                <strong style={{ color: row.color }}>{row.value}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      <Modal isOpen={expenseModal} onClose={() => setExpenseModal(false)} title="Log Deductible Expense">
        <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="Description"
            placeholder="e.g. Google Cloud Hosting"
            value={expDesc}
            onChange={(e) => setExpDesc(e.target.value)}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="input-label">Category</label>
            <select
              className="input-field"
              value={expCategory}
              onChange={(e) => setExpCategory(e.target.value)}
            >
              <option value="Software & IT">Software & IT</option>
              <option value="Rent & Office">Rent & Office</option>
              <option value="Legal & Professional">Legal & Professional</option>
              <option value="Marketing">Marketing</option>
              <option value="Travel & Subsistence">Travel & Subsistence</option>
            </select>
          </div>
          <Input
            label="Amount (AED)"
            type="number"
            placeholder="e.g. 5000"
            value={expAmount}
            onChange={(e) => setExpAmount(e.target.value)}
          />
          <Button variant="primary" fullWidth type="submit">
            Save & Apply Tax Deduction
          </Button>
        </form>
      </Modal>

      {/* Filing Confirmation Modal */}
      <Modal isOpen={filingModal} onClose={() => setFilingModal(false)} title="Confirm FTA Filing">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            You are about to electronically file this return to the UAE Federal Tax Authority.
          </p>
          {selectedRecord && (() => {
            const rec = taxRecords.find((t) => t.id === selectedRecord);
            if (!rec) return null;
            return (
              <div className="card card-flat" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>TRN</span>
                  <strong style={{ color: 'var(--color-text)' }}>{rec.trnNumber}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Period</span>
                  <strong style={{ color: 'var(--color-text)' }}>{rec.period}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Estimated Liability</span>
                  <strong style={{ color: 'var(--color-orange)' }}>AED {rec.estimatedTaxLiability.toLocaleString()}</strong>
                </div>
              </div>
            );
          })()}
          <Button variant="primary" fullWidth onClick={handleFileReturn}>
            Transmit Filing to FTA
          </Button>
        </div>
      </Modal>
    </div>
  );
}
