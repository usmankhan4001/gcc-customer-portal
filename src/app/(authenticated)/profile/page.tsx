import { eq } from 'drizzle-orm';
import { User, Bell, Shield } from 'lucide-react';
import BannerHeader from '@/components/portal/BannerHeader';
import LogoutButton from '@/components/portal/LogoutButton';
import { getServerSession } from '@/lib/session';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

function initials(name: string | null, fallback: string): string {
  if (!name) return fallback.slice(0, 2).toUpperCase();
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

export default async function Profile() {
  const session = await getServerSession();
  const [user] = session
    ? await db.select().from(users).where(eq(users.id, session.userId)).limit(1)
    : [];

  const displayName = user?.full_name || 'Complete your profile';
  const displayPhone = user?.whatsapp_number || '';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <BannerHeader title="Profile" subtitle="Manage your account settings" />

      <div className="max-w-4xl mx-auto px-4 md:px-6 -mt-8 relative z-10">
        {/* User Card */}
        <div className="bg-white p-5 rounded-md shadow-sm border border-gray-200 flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-primary to-orange-700 rounded-full flex items-center justify-center shadow-inner shrink-0">
            <span className="text-white text-xl font-bold">{initials(user?.full_name ?? null, displayPhone || 'GC')}</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{displayName}</h2>
            <p className="text-sm text-gray-500 font-medium">{displayPhone}</p>
          </div>
        </div>

        {/* Settings Menu */}
        <section className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden mb-6">
          <button className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
            <div className="bg-gray-100 p-2 rounded-md text-gray-600">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-gray-900 text-sm">Personal Information</h4>
              <p className="text-xs text-gray-500 mt-0.5">Update your email, phone, and address</p>
            </div>
          </button>

          <div className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 p-2 rounded-md text-gray-600">
                <Bell className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-gray-900 text-sm">Notifications</h4>
                <p className="text-xs text-gray-500 mt-0.5">Push and email alerts</p>
              </div>
            </div>
            {/* Simple toggle switch UI */}
            <div className={`w-10 h-5 rounded-full relative cursor-pointer ${user?.whatsapp_alerts_enabled !== false ? 'bg-primary' : 'bg-gray-300'}`}>
              <div className="absolute right-1 top-0.5 bg-white w-4 h-4 rounded-full transition-transform"></div>
            </div>
          </div>

          <button className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
            <div className="bg-gray-100 p-2 rounded-md text-gray-600">
              <Shield className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-gray-900 text-sm">Security</h4>
              <p className="text-xs text-gray-500 mt-0.5">Passkeys, 2FA, and sessions</p>
            </div>
          </button>
        </section>

        {/* Log out */}
        <LogoutButton />
      </div>
    </div>
  );
}
