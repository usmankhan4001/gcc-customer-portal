import { and, eq } from 'drizzle-orm';
import { getServerSession } from '@/lib/session';
import { db } from '@/lib/db';
import { notifications, users } from '@/lib/db/schema';
import ClientShell from '@/components/portal/ClientShell';

/**
 * Implements Decision 23 (device-adaptive, not just fluidly responsive):
 * below `lg`, a bottom tab bar; at `lg` and above, a left sidebar, both from client-nav.ts (see ClientShell).
 */
export default async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  const [user] = session
    ? await db.select().from(users).where(eq(users.id, session.userId)).limit(1)
    : [];

  const unreadCount = session
    ? (
        await db
          .select()
          .from(notifications)
          .where(and(eq(notifications.user_id, session.userId), eq(notifications.is_read, false)))
      ).length
    : 0;

  const name = user?.full_name?.split(' ')[0] || 'there';

  return (
    <ClientShell name={name} unreadCount={unreadCount}>
      {children}
    </ClientShell>
  );
}
