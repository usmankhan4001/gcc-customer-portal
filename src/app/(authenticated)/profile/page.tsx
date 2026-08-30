import { User, Settings, Bell, Shield, LogOut, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function Profile() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto pb-24">
      <header className="mb-8 mt-4">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Profile & Support</h1>
      </header>

      {/* User Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-inner shrink-0">
          <span className="text-white text-2xl font-bold">UK</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Usman Khan</h2>
          <p className="text-gray-500 font-medium mt-1">+973 37728231</p>
        </div>
      </div>

      {/* Concierge Support Block */}
      <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <h3 className="font-bold text-orange-900">Dedicated Concierge</h3>
          </div>
          <p className="text-sm text-orange-800 font-medium">Your assigned specialist, Abdullah K., is online and ready to help.</p>
        </div>
        <a 
          href="https://wa.me/97337728231" 
          target="_blank"
          rel="noreferrer"
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-xl font-bold transition-colors shadow-sm shrink-0"
        >
          <MessageSquare className="w-5 h-5" />
          WhatsApp Now
        </a>
      </div>

      {/* Settings Menu */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <button className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
          <div className="bg-gray-100 p-2.5 rounded-xl text-gray-600">
            <User className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-gray-900 text-sm">Personal Information</h4>
            <p className="text-xs text-gray-500 mt-0.5">Update your email, phone, and address</p>
          </div>
        </button>
        
        <div className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-gray-100 p-2.5 rounded-xl text-gray-600">
              <Bell className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-gray-900 text-sm">Notifications</h4>
              <p className="text-xs text-gray-500 mt-0.5">Push and email alerts</p>
            </div>
          </div>
          {/* Simple toggle switch UI */}
          <div className="w-11 h-6 bg-blue-600 rounded-full relative cursor-pointer">
            <div className="absolute right-1 top-1 bg-white w-4 h-4 rounded-full transition-transform"></div>
          </div>
        </div>
        
        <button className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
          <div className="bg-gray-100 p-2.5 rounded-xl text-gray-600">
            <Shield className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-gray-900 text-sm">Security</h4>
            <p className="text-xs text-gray-500 mt-0.5">Passkeys, 2FA, and sessions</p>
          </div>
        </button>
      </section>

      {/* Log out */}
      <Link href="/auth" className="flex items-center justify-center gap-2 w-full p-4 text-red-600 hover:bg-red-50 rounded-xl font-bold transition-colors">
        <LogOut className="w-5 h-5" />
        Log Out
      </Link>
    </div>
  );
}
