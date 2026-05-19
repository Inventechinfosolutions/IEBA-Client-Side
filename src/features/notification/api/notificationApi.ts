import { api } from "@/lib/api"
import type { Notification, NotificationFilter, NotificationResponse } from "../types"
import { NotificationStatus } from "../enums/notification.enum"

export async function getNotifications(filter: NotificationFilter = NotificationStatus.ALL): Promise<NotificationResponse> {
  const search = new URLSearchParams()
  search.set("status", filter)

  const query = search.toString()
  return api.get<NotificationResponse>(`/notification?${query}`)
}

export async function updateNotification(
  id: string,
  data: Partial<Notification> | { read: boolean },
) {
  return api.put(`/notification/${id}`, data)
}

export async function markAllNotificationsAsRead(): Promise<void> {
  return api.put("/notification/unread")
}
