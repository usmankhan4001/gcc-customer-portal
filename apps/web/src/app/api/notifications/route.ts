import { NextRequest, NextResponse } from 'next/server'
import { getNotifications, getUnreadCount } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  // TODO: Get user from session
  const userId = 'current-user'

  const url = new URL(request.url)
  const unreadOnly = url.searchParams.get('unreadOnly') === 'true'
  const limit = parseInt(url.searchParams.get('limit') || '50')

  const notifications = getNotifications(userId, { unreadOnly, limit })
  const unreadCount = getUnreadCount(userId)

  return NextResponse.json({
    data: notifications,
    meta: { unreadCount, total: notifications.length },
  })
}
