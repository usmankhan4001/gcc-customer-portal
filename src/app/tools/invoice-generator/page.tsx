'use client';

import { useState } from 'react';
import BannerHeader from '@/components/portal/BannerHeader';
import { FileText, Download, Copy, CircleNotch, CheckCircle, Buildings, Globe, Hash, User } from '@phosphor-icons/react';

export default function InvoiceGenerator() {
  const [companyName, setCompanyName] = useState('');
  const [jurisdiction, setJurisdiction] = useState('UAE Freezone');
  const [tradeLicense, setTradeLicense] = useState('');
  const [clientName, setClientName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [items, setItems] = useState([{ description: '', amount: '' }]);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate generation — in production this would call @react-pdf/renderer
    // to create a branded PDF and upload to R2
    setTimeout(() => {
      setGenerated(true);
      setLoading(false);
    }, 800);
  };

  const jurisdictions = ['UAE Freezone', 'UAE Mainland', 'Hong Kong', 'Singapore', 'Bahrain', 'BVI', 'Cayman Islands'];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <BannerHeader title="INVOICE GENERATOR" subtitle="Create branded invoices for your company" />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
          {!generated ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Your Company Name</label>
                  <div className="relative">
                    <Buildings className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Global Ltd" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Jurisdiction</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none">
                      {jurisdictions.map((j) => <option key={j} value={j}>{j}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Trade License No.</label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" value={tradeLicense} onChange={(e) => setTradeLicense(e.target.value)} placeholder="1234567" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Invoice Number</label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="INV-000001" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Client / Bill To</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client Name or Company" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700">Line Items</label>
                  <button type="button" onClick={addItem} className="text-xs font-semibold text-primary hover:text-primary-600">+ Add Item</button>
                </div>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input type="text" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} placeholder="Service description" className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
                      <input type="number" value={item.amount} onChange={(e) => updateItem(idx, 'amount', e.target.value)} placeholder="0.00" className="w-28 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono text-right" />
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} className="text-gray-400 hover:text-destructive text-xs font-bold px-1">✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-end">
                <div className="text-right w-40">
                  <p className="text-xs text-gray-500">Subtotal</p>
                  <p className="text-lg font-bold text-gray-900">${subtotal.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">Total</p>
                  <p className="text-xl font-bold text-primary">${total.toFixed(2)}</p>
                </div>
              </div>

              <button type="submit" disabled={loading || !companyName} className="w-full bg-cta hover:bg-cta-600 disabled:opacity-60 text-cta-foreground font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-sm">
                {loading ? <CircleNotch className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {loading ? 'Generating...' : 'Generate Invoice PDF'}
              </button>
            </form>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-success-light flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-success" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Invoice Generated</h3>
              <p className="text-sm text-gray-500">Invoice {invoiceNumber} for {companyName} is ready.</p>
              <div className="flex items-center justify-center gap-3">
                <button className="inline-flex items-center gap-1.5 bg-cta hover:bg-cta-600 text-cta-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm">
                  <Download size={16} />
                  Download PDF
                </button>
                <button className="inline-flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <Copy size={16} />
                  Copy Link
                </button>
              </div>
              <button onClick={() => { setGenerated(false); setItems([{ description: '', amount: '' }]); }} className="text-xs text-gray-500 hover:text-primary font-medium">Create Another Invoice</button>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center">
          Your invoice includes your company name, jurisdiction, trade license, and a professional GCCStartup-branded layout.
        </p>
      </main>
    </div>
  );
}