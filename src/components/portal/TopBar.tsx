import Link from 'next/link';
import { Bell, WhatsappLogo } from '@phosphor-icons/react/dist/ssr';

interface TopBarProps {
  name: string;
  unreadCount: number;
}

/**
 * Thin, persistent header (identity + notification bell + quick-contact),
 * distinct from the per-page BannerHeader hero — the "screens unification"
 * anchor: one identity/notification surface instead of each page
 * improvising its own header. Shown above the sidebar at lg+ and above
 * page content on mobile.
 */
export default function TopBar({ name, unreadCount }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 lg:px-6">
      <span className="text-sm font-bold text-gray-900 truncate">{name}</span>

      <div className="flex items-center gap-3">
        <a
          href="https://wa.me/97337728231"
          target="_blank"
          rel="noreferrer"
          className="text-gray-400 hover:text-green-600 transition-colors"
          aria-label="Contact us on WhatsApp"
        >
          <WhatsappLogo size={20} weight="duotone" />
        </a>
        <Link href="/notifications" className="relative text-gray-400 hover:text-primary transition-colors" aria-label="Notifications">
          <Bell size={20} weight={unreadCount > 0 ? 'fill' : 'regular'} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
