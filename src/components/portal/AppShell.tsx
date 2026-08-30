import { and, eq } from 'drizzle-orm';
import { getServerSession } from '@/lib/session';
import { db } from '@/lib/db';
import { notifications, users } from '@/lib/db/schema';
import TopBar from '@/components/portal/TopBar';
import NavLinks from '@/components/portal/NavLinks';

/**
 * Implements Decision 23 (device-adaptive, not just fluidly responsive):
 * below `lg`, the bottom tab bar (NavLinks variant="bottom"); at `lg` and
 * above, a left sidebar (NavLinks variant="sidebar") replaces it — both
 * driven by the same nav item list, sharing one navigation-state source.
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
    <div className="flex flex-col min-h-screen bg-gray-50 lg:flex-row">
      {/* NavLinks renders a fixed (out-of-flow) bottom bar below lg, and
          an in-flow sidebar at lg+ — placing it first here puts the
          sidebar on the left without needing row-reverse tricks. */}
      <NavLinks />

      {/* Bottom padding for the fixed mobile tab bar is handled per-page
          (pages already carry their own pb-20/pb-24 for this) since
          whether the bar even shows is a per-route decision NavLinks
          makes client-side. */}
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar name={name} unreadCount={unreadCount} />
        <main className="flex-grow">{children}</main>
      </div>
    </div>
  );
}
