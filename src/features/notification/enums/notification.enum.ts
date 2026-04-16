export const NotificationType = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
} as const

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType]

export const NotificationStatus = {
  ALL: "all",
  UNREAD: "unread",
  READ: "read",
} as const

export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus]
