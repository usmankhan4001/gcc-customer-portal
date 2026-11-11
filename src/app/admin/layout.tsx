import { redirect } from 'next/navigation';
import { requireStaff } from '@/lib/staff/session';
import { ROLE_LABEL } from '@/lib/staff/roles';
import { AdminLayoutShell } from './AdminLayoutShell';

// The middleware lets any signed-in staff role reach /admin. This checks the account itself against the
// database on every page: still active, still staff, and what role it has now. Disabling an account
// therefore locks that person out of the next page they open, not when their cookie expires.
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  if (!staff) redirect('/auth?redirect=/admin');
  return (
    <AdminLayoutShell dbRole={staff.dbRole} person={{ name: staff.name ?? 'Staff', roleLabel: ROLE_LABEL[staff.role] }}>
      {children}
    </AdminLayoutShell>
  );
}
