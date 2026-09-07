import { NextResponse } from 'next/server'
import { markAllAsRead } from '@/lib/notifications'

export async function POST() {
  const userId = 'current-user'
  const count = markAllAsRead(userId)

  return NextResponse.json({ success: true, marked: count })
}
