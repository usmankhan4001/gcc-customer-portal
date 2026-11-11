import { redirect } from 'next/navigation';
import { inArray } from 'drizzle-orm';
import { PageHeader } from '@/components/admin/PageHeader';
import { StaffManager } from '@/components/admin/StaffManager';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { requireStaff } from '@/lib/staff/session';
import { can, ROLE_LABEL, STAFF_ROLES, toStaffRole } from '@/lib/staff/roles';
import { formatDateTime } from '@/lib/staff/ui';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const staff = await requireStaff();
  if (!staff) redirect('/auth?redirect=/admin/staff');
  if (!can(staff.dbRole, 'staff.manage')) redirect('/admin/dashboard');

  const people = await db
    .select()
    .from(users)
    .where(inArray(users.role, ['super_admin', 'admin', 'operations', 'staff', 'client_relations', 'incorporation_va', 'marketing_va']));

  const rows = people
    .map((u) => ({
      id: u.id,
      name: u.full_name,
      email: u.email,
      role: toStaffRole(u.role)!,
      disabled: u.account_status === 'disabled',
      totp: u.totp_enabled,
      lastLogin: u.last_login_at ? formatDateTime(u.last_login_at) : null,
      isMe: u.id === staff.userId,
    }))
    .sort((a, b) => Number(a.disabled) - Number(b.disabled) || (a.name ?? '').localeCompare(b.name ?? ''));

  return (
    <div className="wrap admin-page">
      <PageHeader eyebrow="Technical" title="Staff accounts" subtitle="Everyone signs in with their own account. Accounts are disabled, never deleted, so the history stays accurate." />
      <StaffManager rows={rows} roles={STAFF_ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))} />
    </div>
  );
}
