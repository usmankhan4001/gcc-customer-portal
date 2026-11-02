"use client";

import React, { useState } from 'react';
import BannerHeader from '@/components/portal/BannerHeader';
import { Copy, Check, FileText, Printer, Download, CircleNotch } from '@phosphor-icons/react';
import ContactCaptureGate from '@/components/portal/ContactCaptureGate';
import s from '../tools.module.css';

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
    <>
      <BannerHeader title="Mutual NDA Generator" subtitle="Generate bilateral non-disclosure agreements for cross-border deals" />

      <main className={`wrap ${s.main}`}>
        <form onSubmit={handleGenerate} className={`card admin-form-card ${s.medium}`}>
          <div className="admin-form-stack">
            <div className="field">
              <label htmlFor="yourCompany">Your company / legal name</label>
              <input
                type="text"
                id="yourCompany"
                value={yourCompany}
                onChange={(e) => {
                  setYourCompany(e.target.value);
                  setGenerated(false);
                }}
                placeholder="e.g. Apex Global Tech FZ-LLC"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="otherParty">Counterparty name</label>
              <input
                type="text"
                id="otherParty"
                value={otherParty}
                onChange={(e) => {
                  setOtherParty(e.target.value);
                  setGenerated(false);
                }}
                placeholder="e.g. Venture Capital Partners LLC"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="jurisdictionChoice">Governing law</label>
              <select
                id="jurisdictionChoice"
                value={jurisdictionChoice}
                onChange={(e) => {
                  setJurisdictionChoice(e.target.value);
                  setGenerated(false);
                }}
              >
                <option value="DIFC (Dubai International Financial Centre)">DIFC (English Common Law / Dubai)</option>
                <option value="ADGM (Abu Dhabi Global Market)">ADGM (English Common Law / Abu Dhabi)</option>
                <option value="United Arab Emirates (Mainland Law)">United Arab Emirates (Civil Code)</option>
                <option value="England & Wales">England &amp; Wales</option>
                <option value="State of Delaware, USA">State of Delaware, USA</option>
                <option value="Singapore">Singapore Law</option>
              </select>
            </div>
            <p className="admin-form-note">An instant, standard mutual non-disclosure agreement formatted for international and GCC business.</p>
          </div>

          <div className="admin-form-actions">
            <button type="submit" disabled={!yourCompany || !otherParty} className="btn btn-primary">
              Generate mutual NDA
            </button>
          </div>
        </form>

        {generated && (
          <div className={`${s.stack} ${s.medium}`}>
            <div className="card">
              <div className={s.row} style={{ marginBottom: 'var(--space-4)' }}>
                <h2 className={s.h2}><FileText size={20} style={{ verticalAlign: '-4px' }} /> Generated mutual NDA</h2>
                <div className={`${s.toolbar} ${s.noPrint}`}>
                  <button type="button" onClick={handleCopy} className="btn btn-outline">
                    {copied ? <Check /> : <Copy />}
                    {copied ? 'Copied' : 'Copy text'}
                  </button>
                  <button type="button" onClick={handleDownloadPdf} disabled={downloading} className="btn btn-primary">
                    {downloading ? <CircleNotch className={s.spin} /> : <Download />}
                    Download PDF
                  </button>
                  <button type="button" onClick={() => window.print()} className="btn btn-outline">
                    <Printer />
                    Print
                  </button>
                </div>
              </div>
              <pre className={s.pre}>{getNDAText()}</pre>
            </div>

            <ContactCaptureGate
              sourceTool="nda_generator"
              toolInput={{ yourCompany, otherParty, jurisdictionChoice }}
              toolResult={{ generated: true, text: getNDAText() }}
            />
          </div>
        )}
      </main>
    </>
  );
}
