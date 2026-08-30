'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCheck } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'action_required';
  category: string;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
}

const TYPE_DOT: Record<NotificationItem['type'], string> = {
  action_required: 'bg-red-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-400',
};

export default function NotificationList({ initial }: { initial: NotificationItem[] }) {
  const [items, setItems] = useState(initial);

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await fetch('/api/notifications/read-all', { method: 'PATCH' });
  };

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div>
      {unreadCount > 0 && (
        <div className="flex justify-end mb-3">
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all as read
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-200 p-8 text-center text-sm text-gray-400">
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const content = (
              <div
                className={`bg-white rounded-md border p-3 flex items-start gap-3 transition-colors ${
                  n.is_read ? 'border-gray-200' : 'border-primary/30 bg-primary/5'
                }`}
              >
                <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${TYPE_DOT[n.type]}`} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      markRead(n.id);
                    }}
                    className="text-[10px] font-semibold text-primary shrink-0"
                  >
                    Mark read
                  </button>
                )}
              </div>
            );

            return n.link_url ? (
              <Link key={n.id} href={n.link_url} onClick={() => !n.is_read && markRead(n.id)}>
                {content}
              </Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
