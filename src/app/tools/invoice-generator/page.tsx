'use client';

import { useState } from 'react';
import BannerHeader from '@/components/portal/BannerHeader';
import { FileText, Download, Copy, CircleNotch, CheckCircle, Buildings, Globe, Hash, User, Plus, Trash } from '@phosphor-icons/react';

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
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col font-sans">
      <BannerHeader title="INVOICE GENERATOR" subtitle="Create and export branded corporate invoices" />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="bg-[#FFFFFF] rounded-2xl sm:rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-[0_10px_25px_-5px_rgba(10,20,47,0.06)] space-y-6">
          {!generated ? (
            <form onSubmit={handleGenerate} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                    Your Company Name
                  </label>
                  <div className="relative">
                    <Buildings className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Apex Global FZ-LLC"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/10 transition-all text-[#0F172A]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                    Jurisdiction
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={jurisdiction}
                      onChange={(e) => setJurisdiction(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#E2E8F0] rounded-xl bg-white focus:outline-none focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/10 transition-all text-[#0F172A] appearance-none"
                    >
                      {jurisdictions.map((j) => (
                        <option key={j} value={j}>{j}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                    Trade License / Reg Number
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={tradeLicense}
                      onChange={(e) => setTradeLicense(e.target.value)}
                      placeholder="e.g. 1049284"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/10 transition-all text-[#0F172A]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                    Invoice Number
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="INV-001001"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/10 transition-all text-[#0F172A]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                  Client / Bill To
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Client Company Inc. or Name"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/10 transition-all text-[#0F172A]"
                  />
                </div>
              </div>

              <div className="border-t border-[#E2E8F0] pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                    Line Items
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-xs font-bold text-[#F26522] hover:text-[#C9511A] flex items-center gap-1 transition-colors"
                  >
                    <Plus size={14} /> Add Item
                  </button>
                </div>
                <div className="space-y-2.5">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        placeholder="Service description"
                        className="flex-1 px-3 py-2 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#F26522] text-[#0F172A]"
                      />
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                        placeholder="0.00"
                        className="w-32 px-3 py-2 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#F26522] font-mono text-right text-[#0F172A]"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-[#64748B] hover:text-[#DC2626] p-2 transition-colors"
                          title="Remove item"
                        >
                          <Trash size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#E2E8F0] pt-4 flex justify-end">
                <div className="text-right w-44 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                  <p className="text-xs text-[#64748B]">Subtotal</p>
                  <p className="text-base font-bold text-[#0F172A] font-mono">${subtotal.toFixed(2)}</p>
                  <p className="text-xs text-[#64748B] mt-2">Total</p>
                  <p className="text-xl font-bold text-[#14204A] font-mono">${total.toFixed(2)}</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !companyName.trim()}
                className="w-full bg-[#F26522] hover:bg-[#14204A] text-white font-bold py-3.5 px-6 rounded-full transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-[0_4px_14px_rgba(242,101,34,0.25)] cursor-pointer"
              >
                {loading ? <CircleNotch className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                {loading ? 'Generating & Downloading PDF...' : 'Generate & Download PDF'}
              </button>
            </form>
          ) : (
            <div className="text-center py-8 space-y-5">
              <div className="w-16 h-16 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mx-auto">
                <CheckCircle size={36} weight="bold" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#0F172A]">Invoice Generated &amp; Downloaded</h3>
                <p className="text-sm text-[#64748B] mt-1">Invoice {invoiceNumber} for {companyName} is ready.</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={downloadInvoicePdf}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#14204A] text-white text-sm font-bold px-6 py-3 rounded-full transition-all shadow-[0_4px_14px_rgba(242,101,34,0.25)] cursor-pointer"
                >
                  {downloading ? <CircleNotch className="w-4 h-4 animate-spin" /> : <Download size={18} />}
                  Download PDF Again
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-2 border border-[#E2E8F0] text-[#14204A] hover:bg-[#F8FAFC] text-sm font-bold px-6 py-3 rounded-full transition-all cursor-pointer"
                >
                  <Copy size={18} />
                  {copied ? 'Link Copied!' : 'Copy Tool Link'}
                </button>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setGenerated(false);
                    setItems([{ description: '', amount: '' }]);
                  }}
                  className="text-xs font-bold text-[#F26522] hover:underline"
                >
                  Create Another Invoice &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-[#64748B] text-center">
          Generated invoices feature official corporate structuring layout, jurisdiction tax details, and compliant itemized breakdown.
        </p>
      </main>
    </div>
  );
}
