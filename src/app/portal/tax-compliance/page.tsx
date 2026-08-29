'use client';

import React, { useState } from 'react';
import { usePortalStore, TaxRecord, ExpenseItem } from '@/lib/store';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import {
  Receipt,
  Calculator,
  ShieldCheck,
  Plus,
  ArrowRight,
  TrendingDown,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
} from 'lucide-react';

export default function TaxCompliancePage() {
  const { taxRecords, expenses, addExpense, fileTaxReturn } = usePortalStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'vat' | 'corporate_tax' | 'expenses'>('overview');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isFilingModalOpen, setIsFilingModalOpen] = useState(false);
  const [selectedTaxRecord, setSelectedTaxRecord] = useState<TaxRecord | null>(null);

  // New Expense form state
  const [expDesc, setExpDesc] = useState('');
  const [expCategory, setExpCategory] = useState('Software & IT');
  const [expAmount, setExpAmount] = useState('');

  // Taxable calculations
  const totalDeductibleExpenses = expenses.reduce((sum, item) => sum + item.amountAed, 0);
  const sampleAnnualRevenue = 650000; // AED
  const standardThreshold = 375000; // AED
  const netTaxableProfit = Math.max(0, sampleAnnualRevenue - totalDeductibleExpenses);
  const profitAboveThreshold = Math.max(0, netTaxableProfit - standardThreshold);
  const estimated9PercentTax = Math.round(profitAboveThreshold * 0.09);

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
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
    setIsExpenseModalOpen(false);
  };

  const handleFileConfirm = () => {
    if (selectedTaxRecord) {
      fileTaxReturn(selectedTaxRecord.id);
      setIsFilingModalOpen(false);
      setSelectedTaxRecord(null);
    }
  };

  return (
    <div className="tax-compliance-container">
      {/* Header */}
      <Card variant="sand" padding="md" className="tax-header">
        <div className="badge-row">
          <Badge variant="navy" icon={<Receipt className="w-3.5 h-3.5" />}>
            UAE FEDERAL TAX AUTHORITY (FTA) COMPLIANCE
          </Badge>
          <Badge variant="blue">TRN: 100482910400003</Badge>
        </div>
        <h1 className="header-title display-font">
          Corporate Tax (9%) & <span className="text-orange">Quarterly VAT Manager</span>
        </h1>
        <p className="header-desc">
          Monitor your corporate tax exemptions, calculate deductible expenses, and submit quarterly VAT returns directly to the UAE Federal Tax Authority.
        </p>
      </Card>

      {/* Tax Metrics Band */}
      <div className="tax-metrics-grid">
        <Card variant="surface" padding="sm" className="metric-box">
          <span className="metric-label text-tertiary">ESTIMATED FY REVENUE</span>
          <div className="metric-val display-font text-navy">AED {sampleAnnualRevenue.toLocaleString()}</div>
          <span className="metric-sub">Commercial Gross Inflow</span>
        </Card>

        <Card variant="surface" padding="sm" className="metric-box">
          <span className="metric-label text-tertiary">DEDUCTIBLE EXPENSES</span>
          <div className="metric-val display-font text-success">
            -AED {totalDeductibleExpenses.toLocaleString()}
          </div>
          <span className="metric-sub">{expenses.length} Verified Write-Offs</span>
        </Card>

        <Card variant="surface" padding="sm" className="metric-box">
          <span className="metric-label text-tertiary">NET TAXABLE PROFIT</span>
          <div className="metric-val display-font text-navy">
            AED {netTaxableProfit.toLocaleString()}
          </div>
          <span className="metric-sub">Threshold: AED 375,000 (0% Rate)</span>
        </Card>

        <Card variant="orange-lt" padding="sm" className="metric-box">
          <span className="metric-label text-orange font-bold">ESTIMATED 9% LIABILITY</span>
          <div className="metric-val display-font text-orange">
            AED {estimated9PercentTax.toLocaleString()}
          </div>
          <span className="metric-sub">0% on first AED 375k</span>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-row">
        {[
          { id: 'overview', label: '📊 Tax Returns Schedule' },
          { id: 'expenses', label: '🧾 Deductible Expense Ledger' },
          { id: 'corporate_tax', label: '🏛️ UAE 9% Corporate Tax Rules' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Tax Returns Schedule */}
      {activeTab === 'overview' && (
        <Card variant="surface" padding="md" className="returns-card">
          <div className="card-top-row">
            <div>
              <h2 className="section-title display-font">Statutory Returns & Filings</h2>
              <span className="text-xs text-tertiary">Official FTA Timetable</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5 text-navy" />}
            >
              <span>Export Tax Summary PDF</span>
            </Button>
          </div>

          <div className="returns-list">
            {taxRecords.map((rec) => (
              <div key={rec.id} className="return-row card-sand">
                <div className="return-icon-box">
                  <FileText className="w-5 h-5 text-orange" />
                </div>
                <div className="return-main">
                  <div className="return-title-row">
                    <strong className="text-navy text-sm">{rec.title}</strong>
                    <Badge
                      variant={
                        rec.status === 'filed'
                          ? 'success'
                          : rec.status === 'ready_to_file'
                          ? 'orange'
                          : 'sand'
                      }
                    >
                      {rec.status === 'filed'
                        ? '✅ Filed with FTA'
                        : rec.status === 'ready_to_file'
                        ? '⚠️ Ready to Submit'
                        : '0% QFZP Exempt'}
                    </Badge>
                  </div>
                  <div className="return-sub-row text-xs text-secondary">
                    <span><strong>Period:</strong> {rec.period}</span>
                    <span><strong>Due Date:</strong> {rec.dueDate}</span>
                    <span><strong>Estimated Due:</strong> AED {rec.estimatedTaxLiability.toLocaleString()}</span>
                  </div>
                </div>

                <div className="return-action">
                  {rec.status === 'ready_to_file' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedTaxRecord(rec);
                        setIsFilingModalOpen(true);
                      }}
                    >
                      <span>Submit to FTA</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {rec.status === 'filed' && (
                    <span className="text-xs text-success font-bold">
                      Confirmation #FTA-VAT-2026
                    </span>
                  )}
                  {rec.status === 'exempt_0_percent' && (
                    <Badge variant="blue">0% QFZP Exemption Active</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 2: Deductible Expense Ledger */}
      {activeTab === 'expenses' && (
        <Card variant="surface" padding="md" className="expenses-card">
          <div className="card-top-row">
            <div>
              <h2 className="section-title display-font">Deductible Business Expense Ledger</h2>
              <span className="text-xs text-tertiary">
                Legally reduce your 9% taxable base with verified operating expenses.
              </span>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsExpenseModalOpen(true)}
            >
              <span>Add Expense Receipt</span>
            </Button>
          </div>

          <div className="expenses-table">
            <div className="table-header card-sand">
              <span>Date</span>
              <span>Description</span>
              <span>Category</span>
              <span>Amount (AED)</span>
              <span>Status</span>
            </div>

            {expenses.map((exp) => (
              <div key={exp.id} className="table-row">
                <span className="text-xs text-tertiary">{exp.date}</span>
                <strong className="text-sm text-navy">{exp.description}</strong>
                <Badge variant="sand">{exp.category}</Badge>
                <span className="text-sm font-bold text-success">
                  -AED {exp.amountAed.toLocaleString()}
                </span>
                <Badge variant="success">Verified Write-Off</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 3: UAE 9% Corporate Tax Rules */}
      {activeTab === 'corporate_tax' && (
        <Card variant="surface" padding="md" className="rules-card">
          <h2 className="section-title display-font">UAE Corporate Tax Blueprint (Federal Decree-Law No. 47)</h2>
          <div className="rules-grid">
            <div className="rule-box card-sand">
              <span className="badge badge-navy mb-2">0% BRACKET</span>
              <h3 className="rule-title display-font">First AED 375,000 Profit</h3>
              <p className="rule-desc">All UAE mainland and freezone taxable profits up to AED 375,000 (~$102,000 USD) are taxed at 0%.</p>
            </div>

            <div className="rule-box card-sand">
              <span className="badge badge-orange mb-2">9% BRACKET</span>
              <h3 className="rule-title display-font">Profit Exceeding AED 375,000</h3>
              <p className="rule-desc">Profits exceeding AED 375,000 are subject to a flat 9% corporate tax rate, the lowest in the OECD.</p>
            </div>

            <div className="rule-box card-blue-lt">
              <span className="badge badge-blue mb-2">0% QFZP STATUS</span>
              <h3 className="rule-title display-font">Freezone Qualifying Income</h3>
              <p className="rule-desc">Freezone companies transacting qualifying activities with foreign non-residents maintain a 0% tax rate on unlimited profit.</p>
            </div>
          </div>
        </Card>
      )}

      {/* ADD EXPENSE MODAL */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Log Deductible Business Expense"
        badge="TAX WRITE-OFF INTAKE"
        badgeVariant="orange"
      >
        <form onSubmit={handleAddExpenseSubmit} className="expense-form">
          <Input
            label="Expense Description / Vendor:"
            placeholder="e.g. Google Cloud Hosting & Server Lease"
            required
            value={expDesc}
            onChange={(e) => setExpDesc(e.target.value)}
          />

          <Select
            label="Expense Category:"
            value={expCategory}
            onChange={(e) => setExpCategory(e.target.value)}
            options={[
              { value: 'Software & IT', label: 'Software & IT / Hosting' },
              { value: 'Rent & Office', label: 'Rent, Flex Desk & Utilities' },
              { value: 'Legal & Professional', label: 'Legal & Accounting Advisory' },
              { value: 'Marketing', label: 'Digital Advertising & Marketing' },
              { value: 'Travel & Subsistence', label: 'Business Travel & Flights' },
            ]}
          />

          <Input
            label="Amount in AED:"
            type="number"
            placeholder="e.g. 5000"
            required
            value={expAmount}
            onChange={(e) => setExpAmount(e.target.value)}
          />

          <Button variant="primary" size="lg" className="w-full mt-2">
            <span>Save & Apply Tax Deduction</span>
          </Button>
        </form>
      </Modal>

      {/* SUBMIT RETURN MODAL */}
      <Modal
        isOpen={isFilingModalOpen}
        onClose={() => setIsFilingModalOpen(false)}
        title="Confirm FTA Return Submission"
        badge="OFFICIAL TAX FILING"
        badgeVariant="navy"
      >
        <div className="filing-confirm-body">
          <p className="text-sm text-secondary">
            You are about to electronically file <strong>{selectedTaxRecord?.title}</strong> to the UAE Federal Tax Authority (FTA).
          </p>
          <div className="filing-summary card-sand">
            <div className="f-row">
              <span>TRN Number:</span>
              <strong className="text-navy">{selectedTaxRecord?.trnNumber}</strong>
            </div>
            <div className="f-row">
              <span>Period:</span>
              <strong className="text-navy">{selectedTaxRecord?.period}</strong>
            </div>
            <div className="f-row">
              <span>Estimated Liability:</span>
              <strong className="text-orange">AED {selectedTaxRecord?.estimatedTaxLiability.toLocaleString()}</strong>
            </div>
          </div>
          <Button variant="primary" size="lg" className="w-full" onClick={handleFileConfirm}>
            <span>Transmit Official Filing to FTA</span>
          </Button>
        </div>
      </Modal>

      <style jsx>{`
        .tax-compliance-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
        }

        .tax-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .badge-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-title {
          font-size: 2.2rem;
          font-weight: 700;
          color: var(--navy);
        }

        .header-desc {
          font-size: 15px;
          color: var(--text-secondary);
        }

        .tax-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
        }

        .metric-box {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .metric-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .metric-val {
          font-size: 1.6rem;
          font-weight: 700;
        }

        .metric-sub {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .tabs-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
        }

        .tab-btn {
          padding: 9px 18px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-pill);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .tab-btn.active {
          background: var(--navy);
          border-color: var(--navy);
          color: #FFFFFF;
        }

        .returns-card,
        .expenses-card,
        .rules-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .card-top-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .section-title {
          font-size: 1.3rem;
          color: var(--navy);
        }

        .returns-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .return-row {
          padding: 16px;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          gap: 14px;
        }

        @media (max-width: 768px) {
          .return-row {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        .return-icon-box {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-sm);
          background: var(--surface);
          display: flex;
          align-items: center;
          justify-content: center;
          shrink-0: 0;
        }

        .return-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .return-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .return-sub-row {
          display: flex;
          gap: 14px;
        }

        .expenses-table {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .table-header {
          padding: 10px 16px;
          border-radius: var(--radius-pill);
          display: grid;
          grid-template-columns: 100px 1.5fr 1fr 120px 140px;
          font-size: 12px;
          font-weight: 700;
          color: var(--navy);
        }

        .table-row {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          display: grid;
          grid-template-columns: 100px 1.5fr 1fr 120px 140px;
          align-items: center;
        }

        @media (max-width: 768px) {
          .table-header {
            display: none;
          }
          .table-row {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
        }

        .rules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 14px;
        }

        .rule-box {
          padding: 20px;
          border-radius: var(--radius);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .rule-title {
          font-size: 1.15rem;
          color: var(--navy);
        }

        .rule-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .expense-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .filing-confirm-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .filing-summary {
          padding: 16px;
          border-radius: var(--radius);
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 14px;
        }

        .f-row {
          display: flex;
          justify-content: space-between;
        }
      `}</style>
    </div>
  );
}
