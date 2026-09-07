export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'action_required'

export type NotificationCategory =
  | 'system'
  | 'crm'
  | 'email'
  | 'whatsapp'
  | 'support'
  | 'billing'
  | 'compliance'

export type Notification = {
  id: string
  userId: string
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  linkUrl?: string
  isRead: boolean
  metadata?: Record<string, any>
  createdAt: Date
}

export type CreateNotificationInput = {
  userId: string
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  linkUrl?: string
  metadata?: Record<string, any>
}
