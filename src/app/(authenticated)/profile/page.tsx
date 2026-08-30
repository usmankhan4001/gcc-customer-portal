import { User, Bell, Shield, LogOut } from 'lucide-react';
import Link from 'next/link';
import BannerHeader from '@/components/portal/BannerHeader';

export default function Profile() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <BannerHeader title="Profile" subtitle="Manage your account settings" />
      
      <div className="max-w-4xl mx-auto px-4 md:px-6 -mt-8 relative z-10">
        {/* User Card */}
        <div className="bg-white p-5 rounded-md shadow-sm border border-gray-200 flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-inner shrink-0">
            <span className="text-white text-xl font-bold">UK</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Usman Khan</h2>
            <p className="text-sm text-gray-500 font-medium">+973 37728231</p>
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
            <div className="w-10 h-5 bg-red-600 rounded-full relative cursor-pointer">
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
        <Link href="/auth" className="flex items-center justify-center gap-2 w-full p-4 text-red-600 bg-white border border-red-100 hover:bg-red-50 rounded-md font-bold transition-colors shadow-sm">
          <LogOut className="w-4 h-4" />
          Log Out
        </Link>
      </div>
    </div>
  );
}
