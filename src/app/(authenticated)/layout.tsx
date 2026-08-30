import Link from 'next/link';
import { Home, Compass, FolderClosed, User } from 'lucide-react';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Main Content Area */}
      <main className="flex-grow">{children}</main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-20 px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors group">
          <Home className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium">Home</span>
        </Link>
        <Link href="/services" className="flex flex-col items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors group">
          <Compass className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium">Services</span>
        </Link>
        <Link href="/vault" className="flex flex-col items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors group">
          <FolderClosed className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium">Vault</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors group">
          <User className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
