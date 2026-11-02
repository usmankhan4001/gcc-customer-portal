'use client';

import { useState } from 'react';
import BannerHeader from '@/components/portal/BannerHeader';
import { FileText, Download, Copy, CircleNotch, CheckCircle, Plus, Trash } from '@phosphor-icons/react';
import s from '../tools.module.css';

export default function InvoiceGenerator() {
  const [companyName, setCompanyName] = useState('');
  const [jurisdiction, setJurisdiction] = useState('UAE Freezone');
  const [tradeLicense, setTradeLicense] = useState('');
  const [clientName, setClientName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [items, setItems] = useState([{ description: '', amount: '' }]);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const addItem = () => setItems([...items, { description: '', amount: '' }]);

  const removeItem = (idx: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: 'description' | 'amount', value: string) => {
    const updated = [...items];
    updated[idx][field] = value;
    setItems(updated);
  };

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const total = subtotal;

  const getPdfPayload = () => {
    const rows = [
      { label: 'Issuer Company', value: companyName || 'Company' },
      { label: 'Jurisdiction', value: jurisdiction },
      { label: 'Trade License / Reg No', value: tradeLicense || 'N/A' },
      { label: 'Invoice Number', value: invoiceNumber },
      { label: 'Bill To / Client', value: clientName || 'Client' },
      ...items
        .filter((i) => i.description.trim() || i.amount)
        .map((i, idx) => ({
          label: `Item ${idx + 1}: ${i.description || 'Service'}`,
          value: `$${(parseFloat(i.amount) || 0).toFixed(2)}`,
        })),
      { label: 'Total Amount Due', value: `$${total.toFixed(2)}` },
    ];

    return {
      title: `Invoice ${invoiceNumber}`,
      subtitle: `${companyName} • ${jurisdiction}`,
      rows,
      filename: `${invoiceNumber}-${companyName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
      disclaimer:
        'This invoice was generated through GCC Startup business tools. Payment terms and bank details are governed by the underlying commercial agreement.',
    };
  };

  const downloadInvoicePdf = async () => {
    try {
      setDownloading(true);
      const res = await fetch('/api/pdf/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getPdfPayload()),
      });

      if (!res.ok) throw new Error('PDF generation failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Invoice PDF download error:', err);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    setLoading(true);
    // Trigger direct PDF generation
    try {
      await downloadInvoicePdf();
      setGenerated(true);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const jurisdictions = ['UAE Freezone', 'UAE Mainland', 'Hong Kong', 'Singapore', 'Bahrain', 'BVI', 'Cayman Islands'];

  return (
    <>
      <BannerHeader title="Invoice Generator" subtitle="Create and export branded corporate invoices" />

      <main className={`wrap ${s.main}`}>
        {!generated ? (
          <form onSubmit={handleGenerate} className={`card admin-form-card ${s.medium}`}>
            <div className="admin-form-stack">
              <div className="admin-form-grid-2">
                <div className="field">
                  <label htmlFor="companyName">Your company name</label>
                  <input
                    id="companyName"
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Global FZ-LLC"
                  />
                </div>
                <div className="field">
                  <label htmlFor="jurisdiction">Jurisdiction</label>
                  <select id="jurisdiction" value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)}>
                    {jurisdictions.map((j) => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="admin-form-grid-2">
                <div className="field">
                  <label htmlFor="tradeLicense">Trade license / reg number</label>
                  <input
                    id="tradeLicense"
                    type="text"
                    value={tradeLicense}
                    onChange={(e) => setTradeLicense(e.target.value)}
                    placeholder="e.g. 1049284"
                  />
                </div>
                <div className="field">
                  <label htmlFor="invoiceNumber">Invoice number</label>
                  <input
                    id="invoiceNumber"
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-001001"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="clientName">Client / bill to</label>
                <input
                  id="clientName"
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Client Company Inc. or name"
                />
              </div>

              <div className={s.stack}>
                <div className={s.row}>
                  <h2 className={s.h3}>Line items</h2>
                  <button type="button" onClick={addItem} className="btn btn-outline">
                    <Plus /> Add item
                  </button>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className={s.itemRow}>
                    <div className="field">
                      <input
                        type="text"
                        aria-label={`Item ${idx + 1} description`}
                        value={item.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        placeholder="Service description"
                      />
                    </div>
                    <div className="field">
                      <input
                        type="number"
                        inputMode="decimal"
                        aria-label={`Item ${idx + 1} amount`}
                        value={item.amount}
                        onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                        placeholder="0.00"
                        className={s.mono}
                        style={{ textAlign: 'right' }}
                      />
                    </div>
                    {items.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className={s.iconBtn}
                        aria-label={`Remove item ${idx + 1}`}
                      >
                        <Trash size={18} />
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                ))}
              </div>

              <div className={`${s.cell} ${s.totals}`}>
                <span className={s.metricLabel}>Subtotal</span>
                <span className={`${s.mono}`}>${subtotal.toFixed(2)}</span>
                <span className={s.metricLabel} style={{ marginTop: 'var(--space-2)' }}>Total</span>
                <span className={`${s.metricValue} ${s.mono}`}>${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="admin-form-actions">
              <button type="submit" disabled={loading || !companyName.trim()} className="btn btn-primary">
                {loading ? <CircleNotch className={s.spin} /> : <FileText />}
                {loading ? 'Generating & downloading PDF…' : 'Generate & download PDF'}
              </button>
            </div>
          </form>
        ) : (
          <div className={`card ${s.medium}`}>
            <div className={s.done}>
              <span className="badge badge-success"><CheckCircle size={16} weight="bold" /> Done</span>
              <div>
                <h2 className={s.h2}>Invoice generated &amp; downloaded</h2>
                <p className={s.muted}>Invoice {invoiceNumber} for {companyName} is ready.</p>
              </div>
              <div className={s.toolbar} style={{ justifyContent: 'center' }}>
                <button type="button" onClick={downloadInvoicePdf} disabled={downloading} className="btn btn-primary">
                  {downloading ? <CircleNotch className={s.spin} /> : <Download />}
                  Download PDF again
                </button>
                <button type="button" onClick={handleCopyLink} className="btn btn-outline">
                  <Copy />
                  {copied ? 'Link copied' : 'Copy tool link'}
                </button>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setGenerated(false);
                  setItems([{ description: '', amount: '' }]);
                }}
              >
                Create another invoice
              </button>
            </div>
          </div>
        )}

        <p className={`${s.muted} ${s.medium}`}>
          Generated invoices feature official corporate structuring layout, jurisdiction tax details, and compliant itemized breakdown.
        </p>
      </main>
    </>
  );
}
