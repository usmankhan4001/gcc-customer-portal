import BannerHeader from '@/components/portal/BannerHeader';
import { User, Bell, Shield, LogOut, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function Profile() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <BannerHeader title="USER PROFILE" />
      
      <main className="flex-1 max-w-md w-full mx-auto p-4 -mt-6">
        {/* User Card */}
        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-lg font-bold">UK</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">Usman Khan</h2>
            <p className="text-gray-500 font-medium text-sm">+973 37728231</p>
          </div>
        </div>

        {/* Concierge Support Block */}
        <div className="bg-white border border-red-200 p-4 rounded-md shadow-sm mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <h3 className="font-bold text-red-700 text-sm">Dedicated Concierge</h3>
          </div>
          <p className="text-xs text-gray-600 font-medium mb-3">Your assigned specialist, Abdullah K., is online.</p>
          <a 
            href="https://wa.me/97337728231" 
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-bold transition-colors text-sm"
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp Now
          </a>
        </div>

        {/* Settings Menu */}
        <section className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden mb-6">
          <button className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-200">
            <div className="bg-gray-100 p-2 rounded-md text-gray-600">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-gray-900 text-sm">Personal Information</h4>
            </div>
          </button>
          
          <div className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-2 rounded-md text-gray-600">
                <Bell className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-gray-900 text-sm">Notifications</h4>
              </div>
            </div>
            <div className="w-9 h-5 bg-red-600 rounded-full relative cursor-pointer">
              <div className="absolute right-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform"></div>
            </div>
          </div>
          
          <button className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
            <div className="bg-gray-100 p-2 rounded-md text-gray-600">
              <Shield className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-gray-900 text-sm">Security</h4>
            </div>
          </button>
        </section>

        {/* Log out */}
        <Link href="/auth" className="flex items-center justify-center gap-2 w-full p-3 text-red-600 hover:bg-red-50 border border-red-100 rounded-md font-bold transition-colors text-sm">
          <LogOut className="w-4 h-4" />
          Log Out
        </Link>
      </main>
    </div>
  );
}
