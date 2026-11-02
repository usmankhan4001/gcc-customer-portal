'use client';

import React, { useState } from 'react';
import BannerHeader from '@/components/portal/BannerHeader';
import { Printer } from '@phosphor-icons/react';
import { computeDeadlines, type DeadlineRow } from '@/lib/tools/compliance-calendar';
import ContactCaptureGate from '@/components/portal/ContactCaptureGate';
import s from '../tools.module.css';

const STATUS_BADGES = {
  Pending: 'badge-neutral',
  Upcoming: 'badge-accent',
  'Action Required': 'badge-danger',
};

export default function ComplianceCalendar() {
  const [formationDate, setFormationDate] = useState('');
  const [rows, setRows] = useState<DeadlineRow[] | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formationDate) return;
    setRows(computeDeadlines(new Date(formationDate)));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <BannerHeader
        title="Compliance Calendar"
        subtitle="Select your company incorporation or target license date to calculate all UAE statutory deadlines."
      />

      <main className={`wrap ${s.main}`}>
        <form onSubmit={handleSubmit} className={`card admin-form-card ${s.narrow}`}>
          <div className="admin-form-stack">
            <div className="field">
              <label htmlFor="formationDate">Company formation date</label>
              <input
                type="date"
                id="formationDate"
                value={formationDate}
                onChange={(e) => {
                  setFormationDate(e.target.value);
                  setRows(null);
                }}
                required
              />
            </div>
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="btn btn-primary">Generate deadlines</button>
          </div>
        </form>

        {rows && (
          <div className={`${s.stack} ${s.medium}`}>
            <div className="card admin-table-card">
              <div className={s.row} style={{ marginBottom: 'var(--space-4)' }}>
                <div>
                  <h2 className={s.h2}>Upcoming UAE statutory deadlines</h2>
                  <p className={s.muted}>Based on license date: {formationDate}</p>
                </div>
                <button type="button" onClick={handlePrint} className={`btn btn-outline ${s.noPrint}`}>
                  <Printer />
                  Print / save PDF
                </button>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Compliance requirement</th>
                      <th>Statutory deadline</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.requirement}>
                        <td data-label="Requirement">{row.requirement}</td>
                        <td data-label="Deadline" className={s.mono}>{row.deadlineLabel}</td>
                        <td data-label="Status">
                          <span className={`badge ${STATUS_BADGES[row.status]}`}>{row.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={s.muted} style={{ marginTop: 'var(--space-3)' }}>
                Note: Estimates based on UAE Federal Tax Authority (FTA) and Ministry of Economy timelines.
              </p>
            </div>

            <ContactCaptureGate
              sourceTool="compliance_calendar"
              toolInput={{ formationDate }}
              toolResult={{ deadlines: rows }}
            />
          </div>
        )}
      </main>
    </>
  );
}
