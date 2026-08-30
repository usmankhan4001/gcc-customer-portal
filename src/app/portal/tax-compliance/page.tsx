'use client';

import React, { useState } from 'react';
import { usePortalStore } from '@/lib/store';
import PageHeader from '@/components/design-system/PageHeader';
import ProgressSteps from '@/components/design-system/ProgressSteps';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StickyFooter from '@/components/ui/StickyFooter';
import Modal from '@/components/ui/Modal';
import {
  Receipt,
  FileCheck,
  ShieldCheck,
  Plus,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Percent,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

const WIZARD_STEPS = [
  { label: 'Tax Overview' },
  { label: 'Returns & Expenses' },
  { label: 'Add Entry' },
];

export default function TaxCompliancePage() {
  const { taxRecords, expenses, addExpense, fileTaxReturn } = usePortalStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState<'returns' | 'expenses'>('returns');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseCat, setExpenseCat] = useState('Software & IT');
  const [expenseAmount, setExpenseAmount] = useState('');

  const totalSteps = WIZARD_STEPS.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

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

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="flex flex-col gap-4 animate-slide-up">
            <div className="section-title">Tax Summary</div>
            <div className="grid grid-cols-2 gap-2.5">
              <Card padding="md">
                <div className="text-[11px] text-tertiary">Total Deductibles Logged</div>
                <div className="text-xl font-extrabold text-navy mt-0.5">
                  AED {totalDeductible.toLocaleString()}
                </div>
                <div className="text-[10px] text-success mt-0.5">
                  4 verified receipts
                </div>
              </Card>

              <Card padding="md">
                <div className="text-[11px] text-tertiary">Estimated 9% Corp Tax</div>
                <div className="text-xl font-extrabold text-orange mt-0.5">
                  AED {corporateTaxLiability.toLocaleString()}
                </div>
                <div className="text-[10px] text-tertiary mt-0.5">
                  AED 375k threshold applied
                </div>
              </Card>
            </div>

            <Card padding="md">
              <div className="section-title mb-2">UAE Federal Corporate Tax Framework</div>
              <div className="flex flex-col gap-2 text-xs text-secondary leading-relaxed">
                <div>
                  <strong className="text-navy">1. 0% Tax on First AED 375,000:</strong> Taxable net profit up to AED 375,000 (approx. $102,000 USD) is taxed at exactly 0%.
                </div>
                <div>
                  <strong className="text-navy">2. 9% Tax on Excess:</strong> Only profits above AED 375,000 are subject to 9% corporate tax.
                </div>
                <div>
                  <strong className="text-navy">3. Qualifying Free Zone Person (QFZP):</strong> 0% corporate tax applies indefinitely on foreign transactions and qualifying intra-freezone trade.
                </div>
              </div>
            </Card>
          </div>
        );

      case 1:
        return (
          <div className="flex flex-col gap-3 animate-slide-up">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveTab('returns')}
                className={`btn ${activeTab === 'returns' ? 'btn-primary' : 'btn-secondary'} shrink-0 text-xs py-1.5 px-3.5`}
              >
                Tax Returns
              </button>
              <button
                onClick={() => setActiveTab('expenses')}
                className={`btn ${activeTab === 'expenses' ? 'btn-primary' : 'btn-secondary'} shrink-0 text-xs py-1.5 px-3.5`}
              >
                Expense Ledger
              </button>
            </div>

            {activeTab === 'returns' && (
              <div className="flex flex-col gap-2.5 animate-slide-up">
                {taxRecords.map((rec) => (
                  <div key={rec.id} className="card flex flex-col gap-2.5 p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-extrabold text-navy">{rec.title}</h3>
                        <div className="text-[11px] text-tertiary">{rec.period} - TRN: {rec.trnNumber}</div>
                      </div>
                      <Badge
                        variant={
                          rec.status === 'filed'
                            ? 'success'
                            : rec.status === 'exempt_0_percent'
                            ? 'info'
                            : 'warning'
                        }
                      >
                        {rec.status === 'filed'
                          ? 'Filed with FTA'
                          : rec.status === 'exempt_0_percent'
                          ? '0% QFZP Exempt'
                          : 'Ready to Submit'}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <div className="text-[11px] text-tertiary">
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

            {activeTab === 'expenses' && (
              <div className="flex flex-col gap-3 animate-slide-up">
                <div className="flex justify-between items-center">
                  <div className="section-title mb-0">Logged Business Expenses</div>
                  <button onClick={() => setIsExpenseModalOpen(true)} className="btn btn-primary btn-sm">
                    <Plus size={14} /> Add Receipt
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {expenses.map((exp) => (
                    <div key={exp.id} className="card flex justify-between items-center p-3">
                      <div>
                        <div className="text-[13px] font-bold text-navy">{exp.description}</div>
                        <div className="text-[11px] text-tertiary">{exp.category} - {exp.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-navy">AED {exp.amountAed.toLocaleString()}</div>
                        <Badge variant="success" size="sm">DEDUCTIBLE</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col gap-4 animate-slide-up">
            <div className="section-title">Add Entry</div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="btn btn-primary shrink-0 gap-2"
              >
                <Plus size={14} />
                Add Expense Receipt
              </button>
            </div>

            <Card padding="md">
              <div className="section-title mb-2">Quick Reference</div>
              <div className="flex flex-col gap-2 text-xs text-secondary">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-success shrink-0" />
                  <span>Expenses over AED 10,000 may require additional documentation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-success shrink-0" />
                  <span>All receipts must be dated within the current tax period</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-success shrink-0" />
                  <span>Keep original receipts for 5 years per FTA requirements</span>
                </div>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-24">
      <PageHeader
        eyebrow="FEDERAL TAX AUTHORITY"
        title="Tax & 9% FTA Compliance Hub"
        subtitle="Manage UAE corporate tax exemptions, track deductible business expenses, and submit quarterly VAT returns."
      />

      <div className="flex gap-2 mb-1">
        <Badge variant="success">9% CORPORATE TAX & VAT</Badge>
      </div>

      <div className="card card-sand px-4 py-3">
        <ProgressSteps steps={WIZARD_STEPS} currentStep={currentStep} />
      </div>

      {renderStep()}

      <StickyFooter
        primaryLabel={isLastStep ? 'Done' : 'Next'}
        primaryAction={() => {
          if (!isLastStep) setCurrentStep((s) => s + 1);
        }}
        primaryIcon={isLastStep ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
        secondaryLabel={isFirstStep ? undefined : 'Back'}
        secondaryAction={isFirstStep ? undefined : () => setCurrentStep((s) => s - 1)}
      />

      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Add Deductible Business Expense"
        badge="TAX DEDUCTION"
        badgeVariant="orange"
      >
        <form onSubmit={handleAddExpense} className="flex flex-col gap-3">
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

          <button type="submit" className="btn btn-primary w-full h-[42px] mt-1">
            Record Expense
          </button>
        </form>
      </Modal>
    </div>
  );
}
