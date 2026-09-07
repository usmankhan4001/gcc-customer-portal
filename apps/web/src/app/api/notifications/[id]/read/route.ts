import { NextRequest, NextResponse } from 'next/server'
import { markAsRead } from '@/lib/notifications'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = 'current-user'
  const success = markAsRead(userId, params.id)

  if (!success) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
