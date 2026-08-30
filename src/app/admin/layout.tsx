import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  RefreshCcw, 
  Settings, 
  Search, 
  Bell, 
  UserCircle 
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <span className="text-white text-lg font-bold">GCC Admin</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            <li>
              <Link href="/admin" className="flex items-center px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
                <LayoutDashboard className="w-5 h-5 mr-3" />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/clients" className="flex items-center px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
                <Users className="w-5 h-5 mr-3" />
                <span className="text-sm font-medium">Clients & KYC</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/renewals" className="flex items-center px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
                <RefreshCcw className="w-5 h-5 mr-3" />
                <span className="text-sm font-medium">Renewals & Billing</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/settings" className="flex items-center px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
                <Settings className="w-5 h-5 mr-3" />
                <span className="text-sm font-medium">Staff Settings</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
          {/* Global Search */}
          <div className="flex-1 flex max-w-lg">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Global search..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 sm:text-sm transition-colors"
              />
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="ml-4 flex items-center space-x-4">
            <button className="text-gray-400 hover:text-gray-500 relative">
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
            </button>
            
            <div className="flex items-center">
              <button className="flex text-sm border-2 border-transparent rounded-full focus:outline-none focus:border-gray-300 transition">
                <UserCircle className="h-8 w-8 text-gray-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Children */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
