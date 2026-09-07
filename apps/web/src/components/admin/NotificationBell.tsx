'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

type Notification = {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => {
        setNotifications(data.data || [])
        setUnreadCount(data.meta?.unreadCount || 0)
      })
      .catch(() => {})
  }, [])

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  async function markAllRead() {
    await fetch('/api/notifications/read-all', { method: 'POST' })
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-md p-2 text-text-secondary hover:bg-bg-secondary"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-bg shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-medium text-text">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-text-secondary">No notifications</p>
            ) : (
              notifications.slice(0, 10).map(n => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={cn(
                    'w-full border-b border-border px-4 py-3 text-left hover:bg-bg-secondary',
                    !n.isRead && 'bg-primary/5'
                  )}
                >
                  <p className="text-sm font-medium text-text">{n.title}</p>
                  <p className="text-xs text-text-secondary">{n.message}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
