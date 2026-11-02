import { eq } from 'drizzle-orm';
import { User, Bell, ShieldCheck } from '@phosphor-icons/react/dist/ssr';
import BannerHeader from '@/components/portal/BannerHeader';
import LogoutButton from '@/components/portal/LogoutButton';
import PushNotificationToggle from '@/components/portal/PushNotificationToggle';
import { getServerSession } from '@/lib/session';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

function initials(name: string | null, fallback: string): string {
  if (!name) return fallback.slice(0, 2).toUpperCase();
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-4)',
  width: '100%',
  minHeight: 64,
  padding: 'var(--space-4)',
  textAlign: 'left' as const,
  font: 'inherit',
  color: 'var(--text-primary)',
  cursor: 'pointer',
};

const iconStyle = { color: 'var(--text-tertiary)', flexShrink: 0 };

export default async function Profile() {
  const session = await getServerSession();
  const [user] = session
    ? await db.select().from(users).where(eq(users.id, session.userId)).limit(1)
    : [];

  const displayName = user?.full_name || 'Complete your profile';
  const displayPhone = user?.whatsapp_number || '';

  return (
    <div className="wrap admin-page pb-24">
      <BannerHeader title="Profile" subtitle="Manage your account settings" />

      <div style={{ display: 'grid', gap: 'var(--space-3)', maxWidth: 720 }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div
            aria-hidden="true"
            style={{
              width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--navy)', color: 'var(--white)', fontSize: 20, fontWeight: 700,
            }}
          >
            {initials(user?.full_name ?? null, displayPhone || 'GC')}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>{displayName}</h2>
            <p style={{ margin: 0, fontSize: 14 }}>{displayPhone}</p>
          </div>
        </div>

        <button type="button" className="card" style={rowStyle}>
          <User size={20} weight="duotone" style={iconStyle} />
          <span>
            <strong style={{ display: 'block' }}>Personal information</strong>
            <span className="admin-form-note" style={{ margin: 0 }}>Update your email, phone, and address</span>
          </span>
        </button>

        <div className="card" style={{ ...rowStyle, justifyContent: 'space-between', cursor: 'default' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <Bell size={20} weight="duotone" style={iconStyle} />
            <span>
              <strong style={{ display: 'block' }}>Push notifications</strong>
              <span className="admin-form-note" style={{ margin: 0 }}>Browser/PWA alerts, alongside WhatsApp and email</span>
            </span>
          </span>
          <PushNotificationToggle />
        </div>

        <button type="button" className="card" style={rowStyle}>
          <ShieldCheck size={20} weight="duotone" style={iconStyle} />
          <span>
            <strong style={{ display: 'block' }}>Security</strong>
            <span className="admin-form-note" style={{ margin: 0 }}>Passkeys, 2FA, and sessions</span>
          </span>
        </button>

        <LogoutButton />
      </div>
    </div>
  );
}
