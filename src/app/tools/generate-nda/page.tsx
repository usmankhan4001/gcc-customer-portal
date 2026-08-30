"use client";

import React, { useState } from 'react';
import BannerHeader from '@/components/portal/BannerHeader';
import { Copy, Check, FileText, Printer } from '@phosphor-icons/react';

export default function GenerateNDAPage() {
  const [yourCompany, setYourCompany] = useState('');
  const [otherParty, setOtherParty] = useState('');
  const [jurisdictionChoice, setJurisdictionChoice] = useState('DIFC (Dubai International Financial Centre)');
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <BannerHeader title="Mutual NDA Generator" />

      <main className="flex-1 p-4 flex justify-center items-start pt-6">
        <div className="max-w-2xl w-full space-y-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-gray-900 mb-1">Generate a Bilateral NDA</h2>
              <p className="text-xs text-gray-500">Instant, legally standard mutual non-disclosure agreement formatted for international and GCC business.</p>
            </div>

            <form onSubmit={handleGenerate} className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label htmlFor="yourCompany" className="w-40 text-xs font-semibold text-gray-700">
                  Your Company / Legal Name
                </label>
                <input
                  type="text"
                  id="yourCompany"
                  value={yourCompany}
                  onChange={(e) => setYourCompany(e.target.value)}
                  placeholder="e.g. Apex Global Tech FZ-LLC"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label htmlFor="otherParty" className="w-40 text-xs font-semibold text-gray-700">
                  Counterparty Name
                </label>
                <input
                  type="text"
                  id="otherParty"
                  value={otherParty}
                  onChange={(e) => setOtherParty(e.target.value)}
                  placeholder="e.g. Venture Capital Partners LLC"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label htmlFor="jurisdictionChoice" className="w-40 text-xs font-semibold text-gray-700">
                  Governing Law
                </label>
                <select
                  id="jurisdictionChoice"
                  value={jurisdictionChoice}
                  onChange={(e) => setJurisdictionChoice(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                >
                  <option value="DIFC (Dubai International Financial Centre)">DIFC (English Common Law / Dubai)</option>
                  <option value="ADGM (Abu Dhabi Global Market)">ADGM (English Common Law / Abu Dhabi)</option>
                  <option value="United Arab Emirates (Mainland Law)">United Arab Emirates (Civil Code)</option>
                  <option value="England & Wales">England & Wales</option>
                  <option value="State of Delaware, USA">State of Delaware, USA</option>
                  <option value="Singapore">Singapore Law</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!yourCompany || !otherParty}
                className="w-full mt-2 bg-primary text-white text-xs font-semibold py-2.5 px-4 rounded-lg shadow-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Generate Mutual NDA
              </button>
            </form>
          </div>

          {generated && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300">
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                  <FileText className="w-4 h-4 text-primary" />
                  Generated Mutual NDA Agreement
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy Text'}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 bg-primary hover:bg-primary-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Agreement
                  </button>
                </div>
              </div>
              <div className="p-5">
                <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap leading-relaxed bg-gray-50/50 p-4 rounded-lg border border-gray-100 max-h-96 overflow-y-auto">
                  {getNDAText()}
                </pre>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
