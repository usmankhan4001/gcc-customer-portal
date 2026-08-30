"use client";

import Link from 'next/link';
import { Home, Compass, FolderClosed, User, MessageSquare } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Only show the bottom nav on root authenticated screens
  const showBottomNav = ['/dashboard', '/services', '/vault', '/profile'].includes(pathname);

  return (
    <div className={`flex flex-col min-h-screen bg-gray-50 ${showBottomNav ? 'pb-20' : ''}`}>
      {/* Main Content Area */}
      <main className="flex-grow">{children}</main>

      {/* Bottom Navigation Bar */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-20 px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
          <Link href="/dashboard" className={`flex flex-col items-center gap-1 transition-colors group ${pathname === '/dashboard' ? 'text-red-600' : 'text-gray-500 hover:text-red-600'}`}>
            <Home className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Home</span>
          </Link>
          <Link href="/services" className={`flex flex-col items-center gap-1 transition-colors group ${pathname === '/services' ? 'text-red-600' : 'text-gray-500 hover:text-red-600'}`}>
            <Compass className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Services</span>
          </Link>
          <Link href="/vault" className={`flex flex-col items-center gap-1 transition-colors group ${pathname === '/vault' ? 'text-red-600' : 'text-gray-500 hover:text-red-600'}`}>
            <FolderClosed className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Vault</span>
          </Link>
          <Link href="/support" className={`flex flex-col items-center gap-1 transition-colors group ${pathname === '/support' ? 'text-red-600' : 'text-gray-500 hover:text-red-600'}`}>
            <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Support</span>
          </Link>
          <Link href="/profile" className={`flex flex-col items-center gap-1 transition-colors group ${pathname === '/profile' ? 'text-red-600' : 'text-gray-500 hover:text-red-600'}`}>
            <User className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </nav>
      )}
    </div>
  );
}
