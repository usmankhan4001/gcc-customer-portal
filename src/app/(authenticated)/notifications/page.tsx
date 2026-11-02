import { desc, eq } from 'drizzle-orm';
import BannerHeader from '@/components/portal/BannerHeader';
import NotificationList from '@/components/portal/NotificationList';
import { getServerSession } from '@/lib/session';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';

export default async function NotificationsPage() {
  const session = await getServerSession();
  const rows = session
    ? await db
        .select()
        .from(notifications)
        .where(eq(notifications.user_id, session.userId))
        .orderBy(desc(notifications.created_at))
        .limit(50)
    : [];

  return (
    <div className="wrap admin-page pb-24">
      <BannerHeader title="Notifications" />
      <div style={{ maxWidth: 720 }}>
        <NotificationList
          initial={rows.map((n) => ({ ...n, created_at: n.created_at.toISOString() }))}
        />
      </div>
    </div>
  );
}
