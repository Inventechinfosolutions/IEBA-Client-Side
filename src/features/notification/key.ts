export const notificationKeys = {
  all: ["notifications"] as const,
  filtered: (filter: string) => [...notificationKeys.all, { filter }] as const,
}
