import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/main"
import { notificationKeys } from "../key"
import { updateNotification } from "../api/notificationApi"

export function useMarkNotificationAsRead() {

  return useMutation({
    mutationFn: async (id: string) => updateNotification(id, { read: true }),
    onSuccess: (_, id) => {
      queryClient.setQueriesData({ queryKey: notificationKeys.all }, (old: any) => {
        if (!old) return old

        let wasUnread = false
        const updateItems = (items: any[]) =>
          items.map((item: any) => {
            if (item.id === id) {
              if (!item.read) {
                wasUnread = true
              }
              return { ...item, read: true }
            }
            return item
          })

        if (old.data?.items) {
          const updatedItems = updateItems(old.data.items)
          const currentUnreadCount = old.data?.meta?.unreadCount
          const nextUnreadCount =
            typeof currentUnreadCount === "number" && wasUnread
              ? Math.max(0, currentUnreadCount - 1)
              : currentUnreadCount

          return {
            ...old,
            data: {
              ...old.data,
              items: updatedItems,
              meta: old.data.meta
                ? { ...old.data.meta, unreadCount: nextUnreadCount }
                : undefined,
            },
          }
        }

        if (Array.isArray(old.data)) {
          return { ...old, data: updateItems(old.data) }
        }

        if (Array.isArray(old)) {
          return updateItems(old)
        }

        return old
      })
    },
  })
}
