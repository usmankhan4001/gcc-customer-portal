'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Checks } from '@phosphor-icons/react';

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

const TYPE_BADGE: Record<NotificationItem['type'], { cls: string; label: string }> = {
  action_required: { cls: 'badge-danger', label: 'Action needed' },
  success: { cls: 'badge-success', label: 'Success' },
  warning: { cls: 'badge-accent', label: 'Warning' },
  info: { cls: 'badge-info', label: 'Info' },
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-3)' }}>
          <button type="button" onClick={markAllRead} className="btn btn-ghost" style={{ minHeight: 44, fontSize: 14 }}>
            <Checks size={16} /> Mark all as read
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="cl-empty">
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          {items.map((n) => {
            const badge = TYPE_BADGE[n.type];
            const content = (
              <div
                className="card"
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', padding: 'var(--space-4)',
                  ...(n.is_read ? {} : { borderColor: 'var(--orange)', background: 'var(--orange-lt)' }),
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span className={`badge ${badge.cls}`}>{badge.label}</span>
                    <strong>{n.title}</strong>
                  </div>
                  <p style={{ margin: 'var(--space-2) 0 0', fontSize: 14 }}>{n.message}</p>
                  <p className="admin-form-note">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      markRead(n.id);
                    }}
                    className="btn btn-ghost"
                    style={{ minHeight: 44, fontSize: 14, flexShrink: 0 }}
                  >
                    Mark read
                  </button>
                )}
              </div>
            );

            return n.link_url ? (
              <Link key={n.id} href={n.link_url} onClick={() => !n.is_read && markRead(n.id)} style={{ textDecoration: 'none', color: 'inherit' }}>
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
