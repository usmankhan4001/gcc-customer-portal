import Link from 'next/link';
import { Bell, WhatsappLogo, ShieldCheck } from '@phosphor-icons/react/dist/ssr';

interface TopBarProps {
  name: string;
  unreadCount: number;
}

export default function TopBar({ name, unreadCount }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#E2E8F0] h-16 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-3 truncate">
        <div className="w-8 h-8 rounded-full bg-[#14204A] text-white flex items-center justify-center font-bold text-xs">
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <span className="text-xs font-bold text-[#0F172A] block leading-tight">Welcome, {name}</span>
          <span className="text-[10px] text-[#64748B] font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] inline-block" /> Verified Member Account
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <a
          href="https://wa.me/97337728231"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 bg-[#DCFCE7] text-[#15803D] hover:bg-[#BBF7D0] text-xs font-bold px-3 py-1.5 rounded-full transition-colors cursor-pointer"
          aria-label="Contact us on WhatsApp"
        >
          <WhatsappLogo size={16} weight="fill" />
          <span className="hidden sm:inline">Concierge</span>
        </a>
        <Link
          href="/notifications"
          className="relative p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-full transition-colors"
          aria-label="Notifications"
        >
          <Bell size={20} weight={unreadCount > 0 ? 'fill' : 'regular'} className={unreadCount > 0 ? 'text-[#F26522]' : ''} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-[#F26522] text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
