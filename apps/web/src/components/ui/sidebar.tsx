'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { Settings, LogOut } from 'lucide-react'

export interface SidebarItem {
  href: string
  label: string
  icon: LucideIcon
}

interface SidebarProps {
  title: string
  subtitle: string
  items: SidebarItem[]
  settingsHref?: string
}

export function Sidebar({
  title,
  subtitle,
  items,
  settingsHref = '#',
}: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-bg">
      <div className="border-b border-border px-6 py-4">
        <Link href="/" className="text-lg font-bold text-text">
          {title}
        </Link>
        <p className="text-xs text-text-secondary">{subtitle}</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
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
          href={settingsHref}
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
  )
}
