export interface Notification {
  id: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  type?: "info" | "success" | "warning" | "error"
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
