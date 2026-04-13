import { api } from "@/lib/api"
import type { Notification, NotificationResponse } from "../types"

/**
 * Fetches the list of notifications for the current user.
 * GET /api/v1/notification
 */
export async function getNotifications(): Promise<NotificationResponse> {
  return api.get<NotificationResponse>("/notification")
}

/**
 * Creates a new in-app notification.
 * POST /api/v1/notification
 */
export async function createNotification(data: { recipientUserId: string; title: string; message: string }) {
  return api.post("/notification", data)
}

/**
 * Fetches a single notification by ID.
 * GET /api/v1/notification/{id}
 */
export async function getNotificationById(id: string): Promise<Notification> {
  return api.get<Notification>(`/notification/${id}`)
}

/**
 * Updates a notification (e.g., mark as read).
 * PUT /api/v1/notification/{id}
 */
export async function updateNotification(id: string, data: Partial<Notification>) {
  return api.put(`/notification/${id}`, data)
}

/**
 * Deletes a notification.
 * DELETE /api/v1/notification/{id}
 */
export async function deleteNotification(id: string) {
  return api.delete(`/notification/${id}`)
}

/**
 * Marks all notifications as read for the current user.
 * PUT /api/v1/notification/unread
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  return api.put("/notification/unread")
}
