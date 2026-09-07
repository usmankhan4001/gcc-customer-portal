'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Activity,
  Key,
  Webhook,
  ScrollText,
  Settings,
  Shield,
  Database,
  Mail,
  MessageSquare,
  LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/roles', label: 'Roles & Permissions', icon: Shield },
  { href: '/admin/api-keys', label: 'API Keys', icon: Key },
  { href: '/admin/webhooks', label: 'Webhooks', icon: Webhook },
  { href: '/admin/audit-log', label: 'Audit Log', icon: ScrollText },
  { href: '/admin/integrations', label: 'Integrations', icon: Settings },
  { href: '/admin/health', label: 'System Health', icon: Activity },
  { href: '/admin/database', label: 'Database', icon: Database },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-bg-secondary">
      <aside className="flex w-64 flex-col border-r border-border bg-bg">
        <div className="border-b border-border px-6 py-4">
          <Link href="/admin" className="text-lg font-bold text-text">
            GCC Platform
          </Link>
          <p className="text-xs text-text-secondary">Admin</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-bg-secondary hover:text-text'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border px-3 py-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-bg-secondary hover:text-text"
          >
            <LogOut className="h-4 w-4" />
            Back to App
          </Link>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-border bg-bg px-6">
          <h2 className="text-sm font-semibold text-text">Admin Panel</h2>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
