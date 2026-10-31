'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { House, FolderOpen, Compass, ChatCircleDots, User, ShieldCheck } from '@phosphor-icons/react';
import ConnectSheet from '@/components/portal/ConnectSheet';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: House },
  { href: '/vault', label: 'Document Vault', icon: FolderOpen },
  { href: '/services', label: 'Services & Addons', icon: Compass },
  { href: '/profile', label: 'Settings & Profile', icon: User },
] as const;

const BOTTOM_NAV_ROOTS = ['/dashboard', '/vault', '/services', '/support', '/profile', '/notifications'];

export default function NavLinks() {
  const pathname = usePathname();
  const [connectOpen, setConnectOpen] = useState(false);
  const showBottomNav = BOTTOM_NAV_ROOTS.includes(pathname);

  return (
    <>
      {/* Mobile bottom tab bar */}
      <nav
        className={`fixed bottom-0 left-0 right-0 bg-[#FFFFFF] border-t border-[#E2E8F0] justify-around items-center h-20 px-4 shadow-[0_-4px_16px_rgba(10,20,47,0.05)] z-40 lg:hidden ${
          showBottomNav ? 'flex' : 'hidden'
        }`}
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-colors group cursor-pointer ${
                active ? 'text-[#F26522]' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <item.icon size={22} weight={active ? 'fill' : 'regular'} className="group-hover:scale-110 transition-transform" />
              <span className={`text-[11px] ${active ? 'font-bold' : 'font-medium'}`}>{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setConnectOpen(true)}
          className="flex flex-col items-center gap-1 transition-colors group text-[#64748B] hover:text-[#0F172A] cursor-pointer"
        >
          <ChatCircleDots size={22} className="group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-medium">Support</span>
        </button>
      </nav>

      {/* Desktop sidebar */}
      <nav className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:py-6 lg:px-4 lg:border-r lg:border-[#E2E8F0] lg:bg-[#FFFFFF]">
        <div className="px-3 mb-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-[#14204A] font-heading">
              GCC<span className="text-[#F26522]">Startup</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FEF1E9] text-[#F26522] rounded-full border border-[#FDE4D3]">
              PORTAL
            </span>
          </Link>
          <p className="text-[11px] text-[#64748B] mt-1 font-medium">Global Corporate Concierge</p>
        </div>

        <div className="flex-1 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] px-3 block mb-2">
            Navigation
          </span>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#FEF1E9] text-[#F26522] shadow-[0_2px_8px_rgba(242,101,34,0.12)]'
                    : 'text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                <item.icon size={18} weight={active ? 'fill' : 'regular'} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
          <button
            onClick={() => setConnectOpen(true)}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors text-left cursor-pointer"
          >
            <ChatCircleDots size={18} className="text-[#16A34A]" />
            Live Concierge Support
          </button>
          <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] mt-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#14204A]">
              <ShieldCheck size={14} className="text-[#16A34A]" weight="fill" />
              Regulated Entity
            </div>
            <p className="text-[10px] text-[#64748B] mt-0.5 leading-tight">
              UAE, HK &amp; SG tier-1 corporate service provider network
            </p>
          </div>
        </div>
      </nav>

      <ConnectSheet open={connectOpen} onOpenChange={setConnectOpen} />
    </>
  );
}
