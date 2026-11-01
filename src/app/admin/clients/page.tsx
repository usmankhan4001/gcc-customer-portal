"use client";

import React, { useState } from 'react';
import { Search, MoreVertical, Check, X } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import {
  STATUS_FILTERS,
  filterClients,
  formatClientId,
  statusBadgeClass,
  type ClientRow,
  type KycStatus,
  type StatusFilter,
} from '@/lib/admin-ui/clients';

// Mock Data
const initialClients: ClientRow[] = [
  { id: 1, name: "Ali Al-Farsi", phone: "+971 50 123 4567", company: "Gulf Tech Solutions", status: "Verified" },
  { id: 2, name: "Sarah Ahmed", phone: "+971 55 987 6543", company: "Desert Sands LLC", status: "Pending" },
  { id: 3, name: "Mohammed Bin Rashid", phone: "+971 52 333 4444", company: "Oasis Enterprises", status: "Verified" },
  { id: 4, name: "Fatima Al-Zahra", phone: "+971 50 555 6666", company: "Crescent Trading", status: "Rejected" },
  { id: 5, name: "Omar Farooq", phone: "+971 54 111 2222", company: "Falcon Logistics", status: "Pending" },
];

export default function ClientsPage() {
  const [clients, setClients] = useState(initialClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const setStatus = (id: number, status: KycStatus) => {
    setClients(clients.map(c => c.id === id ? { ...c, status } : c));
  };

  const filteredClients = filterClients(clients, searchTerm, statusFilter);

  return (
    <div className="wrap admin-page">
      <PageHeader
        eyebrow="Operations"
        title="Client & KYC Management"
        subtitle="Manage registered clients and verify their KYC status."
      />

      <div className="admin-table-card">
        <div className="cl-toolbar">
          <label className="cl-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="text"
              aria-label="Search clients"
              placeholder="Search clients, phone, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>
          <select
            aria-label="Filter by KYC status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            {STATUS_FILTERS.map(s => (
              <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
            ))}
          </select>
        </div>

        {filteredClients.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Client Details</th>
                  <th className="hide-phone">Company</th>
                  <th className="hide-phone">Phone</th>
                  <th>KYC Status</th>
                  <th className="is-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <strong>{client.name}</strong>
                      <div>{formatClientId(client.id)}</div>
                    </td>
                    <td className="hide-phone">{client.company}</td>
                    <td className="hide-phone">{client.phone}</td>
                    <td><span className={statusBadgeClass(client.status)}>{client.status}</span></td>
                    <td className="cl-cell-menu">
                      {client.status === 'Pending' ? (
                        <>
                          <button type="button" className="btn btn-primary" onClick={() => setStatus(client.id, 'Verified')}>
                            <Check size={16} aria-hidden="true" /> Verify
                          </button>
                          <button type="button" className="btn" onClick={() => setStatus(client.id, 'Rejected')}>
                            <X size={16} aria-hidden="true" /> Reject
                          </button>
                        </>
                      ) : (
                        <button type="button" className="cl-icon-btn" aria-label={`More actions for ${client.name}`}>
                          <MoreVertical size={16} aria-hidden="true" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="cl-empty"><p>No clients found matching your criteria.</p></div>
        )}

        {/* Pagination mock */}
        <div className="admin-pager">
          <span>Showing 1 to {filteredClients.length} of {filteredClients.length} results</span>
          <button type="button" className="btn" disabled>Previous</button>
          <button type="button" className="btn" disabled>Next</button>
        </div>
      </div>
    </div>
  );
}
