export type KycStatus = 'Pending' | 'Verified' | 'Rejected';
export type StatusFilter = 'All' | KycStatus;

export interface ClientRow {
  id: number;
  name: string;
  phone: string;
  company: string;
  status: KycStatus;
}

export const STATUS_FILTERS: StatusFilter[] = ['All', 'Pending', 'Verified', 'Rejected'];

const BADGE_BY_STATUS: Record<KycStatus, string> = {
  Verified: 'badge badge-success',
  Pending: 'badge badge-accent',
  Rejected: 'badge badge-danger',
};

export function statusBadgeClass(status: KycStatus): string {
  return BADGE_BY_STATUS[status];
}

export function formatClientId(id: number): string {
  return `ID: #${id.toString().padStart(4, '0')}`;
}

export function filterClients(clients: ClientRow[], searchTerm: string, statusFilter: StatusFilter): ClientRow[] {
  const q = searchTerm.toLowerCase();
  return clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q);
    return matchesSearch && (statusFilter === 'All' || c.status === statusFilter);
  });
}
