"use client";

import React, { useState } from 'react';
import BannerHeader from '@/components/portal/BannerHeader';
import { Copy, Check, FileText, Printer, Download, CircleNotch } from '@phosphor-icons/react';
import ContactCaptureGate from '@/components/portal/ContactCaptureGate';

export default function GenerateNDAPage() {
  const [yourCompany, setYourCompany] = useState('');
  const [otherParty, setOtherParty] = useState('');
  const [jurisdictionChoice, setJurisdictionChoice] = useState('DIFC (Dubai International Financial Centre)');
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yourCompany || !otherParty) return;
    setGenerated(true);
  };

  const getNDAText = () => {
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    return `MUTUAL NON-DISCLOSURE AGREEMENT (NDA)

This Non-Disclosure Agreement (the "Agreement") is entered into as of ${today} (the "Effective Date"), by and between:

PARTY A: ${yourCompany || '[YOUR COMPANY]'}
PARTY B: ${otherParty || '[OTHER PARTY]'}

1. PURPOSE
The Parties wish to explore a potential business relationship or transaction and, in connection therewith, each Party may disclose to the other Party certain confidential and proprietary information.

2. CONFIDENTIAL INFORMATION
"Confidential Information" means all non-public, proprietary, or confidential information disclosed by one Party ("Disclosing Party") to the other Party ("Receiving Party"), whether orally or in writing, including but not limited to business plans, financial data, customer lists, software code, and trade secrets.

3. OBLIGATIONS OF RECEIVING PARTY
The Receiving Party agrees to:
(a) Protect and safeguard the confidentiality of all Confidential Information with at least the same degree of care as it uses for its own confidential information, but in no event less than a reasonable degree of care;
(b) Use the Confidential Information solely for the Purpose;
(c) Restrict disclosure of Confidential Information strictly to employees, contractors, and legal advisors who need to know such information and are bound by confidentiality obligations.

4. TERM & SURVIVAL
This Agreement shall remain in effect for a period of two (2) years from the Effective Date.

5. GOVERNING LAW & JURISDICTION
This Agreement shall be governed by, construed, and enforced in accordance with the laws of ${jurisdictionChoice}. Any dispute arising hereunder shall be subject to the exclusive jurisdiction of the competent courts of the chosen jurisdiction.

IN WITNESS WHEREOF, the Parties have executed this Mutual Non-Disclosure Agreement as of the Effective Date.

___________________________                  ___________________________
For: ${yourCompany || '[Party A]'}            For: ${otherParty || '[Party B]'}
Authorized Signatory                         Authorized Signatory`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getNDAText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const res = await fetch('/api/pdf/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Mutual Non-Disclosure Agreement',
          subtitle: `${yourCompany} & ${otherParty}`,
          rows: [
            { label: 'Party A (Disclosing/Receiving)', value: yourCompany },
            { label: 'Party B (Disclosing/Receiving)', value: otherParty },
            { label: 'Governing Law', value: jurisdictionChoice },
            { label: 'Confidentiality Term', value: '2 Years from Effective Date' },
            { label: 'Agreement Type', value: 'Bilateral Mutual Non-Disclosure' },
          ],
          filename: `Mutual-NDA-${yourCompany.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
          disclaimer:
            'This standard mutual non-disclosure agreement is formatted for GCC and international commercial discussions under the specified governing law.',
        }),
      });

      if (!res.ok) throw new Error('PDF generation failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Mutual-NDA-${yourCompany.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('NDA PDF download error:', err);
      alert('Could not download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col font-sans">
      <BannerHeader title="Mutual NDA Generator" subtitle="Generate bilateral non-disclosure agreements for cross-border deals" />

      <main className="flex-1 p-4 flex justify-center items-start pt-8 pb-16">
        <div className="max-w-2xl w-full space-y-6">
          <div className="bg-[#FFFFFF] rounded-2xl sm:rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-[0_10px_25px_-5px_rgba(10,20,47,0.06)]">
            <div className="mb-5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#F26522] block mb-1">
                Legal Automation
              </span>
              <h2 className="text-xl font-bold text-[#0F172A]">Generate a Bilateral NDA</h2>
              <p className="text-xs text-[#64748B] mt-1">Instant, legally standard mutual non-disclosure agreement formatted for international and GCC business.</p>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label htmlFor="yourCompany" className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                  Your Company / Legal Name
                </label>
                <input
                  type="text"
                  id="yourCompany"
                  value={yourCompany}
                  onChange={(e) => {
                    setYourCompany(e.target.value);
                    setGenerated(false);
                  }}
                  placeholder="e.g. Apex Global Tech FZ-LLC"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/10 transition-all text-[#0F172A]"
                  required
                />
              </div>

              <div>
                <label htmlFor="otherParty" className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                  Counterparty Name
                </label>
                <input
                  type="text"
                  id="otherParty"
                  value={otherParty}
                  onChange={(e) => {
                    setOtherParty(e.target.value);
                    setGenerated(false);
                  }}
                  placeholder="e.g. Venture Capital Partners LLC"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/10 transition-all text-[#0F172A]"
                  required
                />
              </div>

              <div>
                <label htmlFor="jurisdictionChoice" className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                  Governing Law
                </label>
                <select
                  id="jurisdictionChoice"
                  value={jurisdictionChoice}
                  onChange={(e) => {
                    setJurisdictionChoice(e.target.value);
                    setGenerated(false);
                  }}
                  className="w-full px-3.5 py-2.5 text-sm border border-[#E2E8F0] rounded-xl bg-white focus:outline-none focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/10 transition-all text-[#0F172A]"
                >
                  <option value="DIFC (Dubai International Financial Centre)">DIFC (English Common Law / Dubai)</option>
                  <option value="ADGM (Abu Dhabi Global Market)">ADGM (English Common Law / Abu Dhabi)</option>
                  <option value="United Arab Emirates (Mainland Law)">United Arab Emirates (Civil Code)</option>
                  <option value="England & Wales">England &amp; Wales</option>
                  <option value="State of Delaware, USA">State of Delaware, USA</option>
                  <option value="Singapore">Singapore Law</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!yourCompany || !otherParty}
                className="w-full mt-2 bg-[#F26522] hover:bg-[#14204A] text-white text-sm font-bold py-3.5 px-6 rounded-full shadow-[0_4px_14px_rgba(242,101,34,0.25)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer"
              >
                Generate Mutual NDA
              </button>
            </form>
          </div>

          {generated && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="bg-[#FFFFFF] rounded-2xl sm:rounded-3xl border border-[#E2E8F0] overflow-hidden shadow-[0_10px_25px_-5px_rgba(10,20,47,0.06)]">
                <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
                    <FileText className="w-4 h-4 text-[#F26522]" />
                    Generated Mutual NDA Agreement
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] text-xs font-bold px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy Text'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      disabled={downloading}
                      className="flex items-center gap-1.5 bg-[#F26522] hover:bg-[#14204A] text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors shadow-xs cursor-pointer"
                    >
                      {downloading ? <CircleNotch className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      Download PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] text-xs font-bold px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <pre className="text-xs font-mono text-[#0F172A] whitespace-pre-wrap leading-relaxed bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] max-h-96 overflow-y-auto">
                    {getNDAText()}
                  </pre>
                </div>
              </div>

              <ContactCaptureGate
                sourceTool="nda_generator"
                toolInput={{ yourCompany, otherParty, jurisdictionChoice }}
                toolResult={{ generated: true, text: getNDAText() }}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
