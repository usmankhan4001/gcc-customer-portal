'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Settings,
  Menu,
  Bell,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import Providers from './Providers';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const portalNav: NavItem[] = [
  { name: 'Dashboard', href: '/portal/dashboard', icon: LayoutDashboard },
  { name: 'Banking', href: '/portal/banking', icon: CreditCard },
  { name: 'Tax', href: '/portal/tax-compliance', icon: FileText },
  { name: 'Settings', href: '/portal/settings', icon: Settings },
];

const adminNav: NavItem[] = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Clients', href: '/admin/clients', icon: FileText },
  { name: 'Queue', href: '/admin/filing-queue', icon: CreditCard },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AppChrome({ children, isAdmin = false }: { children: React.ReactNode; isAdmin?: boolean }) {
  const pathname = usePathname();
  
  // Decide whether this route is in admin or portal space
  const isActuallyAdmin = pathname.startsWith('/admin') || isAdmin;
  const navItems = isActuallyAdmin ? adminNav : portalNav;
  
  const isBackEnabled = pathname.split('/').length > 3;

  return (
    <Providers>
      <div className="flex min-h-screen w-full flex-col bg-background md:flex-row">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 flex-col border-r bg-card md:flex">
          <div className="flex h-16 items-center border-b px-6">
            <span className="font-heading text-lg font-bold text-primary">
              {isActuallyAdmin ? 'GCC Admin' : 'GCC Portal'}
            </span>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href) && (item.href !== '/portal' || pathname === '/portal') && (item.href !== '/admin' || pathname === '/admin');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-muted',
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                <AvatarFallback>US</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Usman Khan</span>
                <span className="text-xs text-muted-foreground">usman@gcc.co</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col pb-16 md:pb-0">
          {/* Mobile Top Header */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
            {isBackEnabled ? (
              <Button variant="ghost" size="icon" className="shrink-0">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            ) : (
              <Sheet>
                <SheetTrigger render={
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                } />
                <SheetContent side="left" className="w-64 p-0">
                  <SheetHeader className="h-16 border-b px-6 flex items-start justify-center">
                    <SheetTitle className="font-heading text-lg font-bold text-primary">
                      {isActuallyAdmin ? 'GCC Admin' : 'GCC Portal'}
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="space-y-1 p-4">
                    {navItems.map((item) => {
                      const isActive = pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                            isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </nav>
                </SheetContent>
              </Sheet>
            )}
            <div className="flex w-full items-center justify-between">
              <span className="font-heading text-lg font-bold">
                {isActuallyAdmin ? 'Admin' : 'Portal'}
              </span>
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 md:p-6 w-full max-w-6xl mx-auto">
            {children}
          </main>

          {/* Mobile Bottom Tab Bar */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t bg-background px-4 pb-safe-area md:hidden">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </Providers>
  );
}
