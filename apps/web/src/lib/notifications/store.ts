import { Notification, CreateNotificationInput } from './types'

// In-memory notification store (will be replaced with database)
const notifications = new Map<string, Notification[]>()
let counter = 0

export function createNotification(input: CreateNotificationInput): Notification {
  const notification: Notification = {
    id: `notif-${++counter}`,
    ...input,
    isRead: false,
    createdAt: new Date(),
  }

  const userNotifications = notifications.get(input.userId) || []
  userNotifications.unshift(notification)
  notifications.set(input.userId, userNotifications.slice(0, 100)) // Keep last 100

  return notification
}

export function getNotifications(userId: string, options?: { unreadOnly?: boolean; limit?: number }): Notification[] {
  const userNotifications = notifications.get(userId) || []
  let result = options?.unreadOnly ? userNotifications.filter(n => !n.isRead) : userNotifications
  return result.slice(0, options?.limit || 50)
}

export function getUnreadCount(userId: string): number {
  const userNotifications = notifications.get(userId) || []
  return userNotifications.filter(n => !n.isRead).length
}

export function markAsRead(userId: string, notificationId: string): boolean {
  const userNotifications = notifications.get(userId) || []
  const notification = userNotifications.find(n => n.id === notificationId)
  if (notification) {
    notification.isRead = true
    return true
  }
  return false
}

export function markAllAsRead(userId: string): number {
  const userNotifications = notifications.get(userId) || []
  let count = 0
  for (const notification of userNotifications) {
    if (!notification.isRead) {
      notification.isRead = true
      count++
    }
  }
  return count
}
