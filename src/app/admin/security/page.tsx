import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { PageHeader } from '@/components/admin/PageHeader';
import { TotpSetup } from '@/components/admin/TotpSetup';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { requireStaff } from '@/lib/staff/session';
import { ROLE_LABEL } from '@/lib/staff/roles';

export const dynamic = 'force-dynamic';

export default async function SecurityPage() {
  const staff = await requireStaff();
  if (!staff) redirect('/auth?redirect=/admin/security');
  const [me] = await db.select({ enabled: users.totp_enabled, email: users.email }).from(users).where(eq(users.id, staff.userId)).limit(1);

  return (
    <div className="wrap admin-page admin-page-narrow">
      <PageHeader eyebrow={ROLE_LABEL[staff.role]} title="Your security" subtitle={me?.email ?? undefined} />
      <h2 className="admin-section-head">Two-factor sign-in</h2>
      <TotpSetup enabled={!!me?.enabled} />
    </div>
  );
}
