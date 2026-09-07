'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  PenTool,
  Image,
  Search,
  ArrowRightLeft,
  Tool,
  Settings,
  LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/cms', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cms/pages', label: 'Pages', icon: FileText },
  { href: '/cms/posts', label: 'Posts', icon: PenTool },
  { href: '/cms/media', label: 'Media', icon: Image },
  { href: '/cms/seo', label: 'SEO', icon: Search },
  { href: '/cms/redirects', label: 'Redirects', icon: ArrowRightLeft },
  { href: '/cms/lead-gen', label: 'Lead Gen Tools', icon: Tool },
]

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-bg-secondary">
      <aside className="flex w-64 flex-col border-r border-border bg-bg">
        <div className="border-b border-border px-6 py-4">
          <Link href="/cms" className="text-lg font-bold text-text">
            GCC Platform
          </Link>
          <p className="text-xs text-text-secondary">CMS</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
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
            href="/cms/settings"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-bg-secondary hover:text-text"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-bg-secondary hover:text-text">
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-border bg-bg px-6">
          <h2 className="text-sm font-semibold text-text">CMS Dashboard</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary">user@gccstartup.com</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
