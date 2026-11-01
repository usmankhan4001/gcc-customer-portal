import React from 'react';
import { Bell, FileText } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SUMMARY_FIGURES, formatAmount, mockRenewals, renewalBadgeClass } from '@/lib/admin-ui/renewals';

export default function RenewalsDashboard() {
  return (
    <div className="wrap admin-page">
      <PageHeader
        eyebrow="Billing"
        title="Renewals & Billing"
        subtitle="Manage upcoming company license renewals and generate invoices."
        actions={
          <button type="button" className="btn btn-primary">
            <Bell size={16} /> Send Bulk Reminders
          </button>
        }
      />

      <div className="admin-metrics-grid">
        <div className="card">
          <p className="admin-form-note">Upcoming (30 days)</p>
          <h3>{SUMMARY_FIGURES.upcoming}</h3>
        </div>
        <div className="card">
          <p className="admin-form-note">Overdue</p>
          <h3>{SUMMARY_FIGURES.overdue}</h3>
        </div>
        <div className="card">
          <p className="admin-form-note">Expected Revenue</p>
          <h3>{SUMMARY_FIGURES.revenue}</h3>
        </div>
      </div>

      <div className="admin-section-head">
        <h2>Expiring Licenses</h2>
      </div>
      {mockRenewals.length === 0 ? (
        <div className="cl-empty"><p>No licenses are expiring.</p></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Company</th>
                <th className="hide-phone">Plan</th>
                <th>Expiry Date</th>
                <th className="hide-phone">Amount</th>
                <th>Status</th>
                <th className="is-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockRenewals.map((renewal) => (
                <tr key={renewal.id}>
                  <td>{renewal.company}</td>
                  <td className="hide-phone">{renewal.plan}</td>
                  <td>{renewal.expiryDate}</td>
                  <td className="hide-phone">{formatAmount(renewal.amount)}</td>
                  <td>
                    <span className={renewalBadgeClass(renewal.status)}>{renewal.status}</span>
                  </td>
                  <td className="is-right">
                    <button type="button" className="btn">
                      <FileText size={16} /> Generate Invoice & Notify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
