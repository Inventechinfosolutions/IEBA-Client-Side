import { NotificationStatus } from "./enums/notification.enum"

export const notificationKeys = {
  all: ["notifications"] as const,
  filtered: (filter: string) => [...notificationKeys.all, { filter }] as const,
}

export const filterOptions = [
  { value: NotificationStatus.ALL, label: "All Notifications" },
  { value: NotificationStatus.UNREAD, label: "Unread Notifications" },
  { value: NotificationStatus.READ, label: "Read Notifications" },
]
