import { NotificationStatus, NotificationType } from "./enums/notification.enum"

export interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: string
  type?: NotificationType
  sender?: string
  senderName?: string
}

export interface NotificationResponse {
  success: boolean
  message: string
  data: {
    items: Notification[]
    meta: {
      totalItems: number
      unreadCount: number
      [key: string]: any
    }
  }
}

export type NotificationFilter = NotificationStatus

export interface CreateNotificationRequest {
  recipientUserId: string
  title: string
  message: string
}

export interface NotificationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const formatTimestamp = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  } catch {
    return dateStr
  }
}

export const getNotificationItems = (data: any): Notification[] => {
  if (Array.isArray(data?.data?.items)) return data.data.items
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data)) return data
  return []
}
