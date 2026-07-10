import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/main"
import { notificationKeys } from "../key"
import { deleteNotification } from "../api/notificationApi"

export function useDeleteNotification() {
  return useMutation({
    mutationFn: async (id: string) => deleteNotification(id),
    onSuccess: (_, id) => {
      queryClient.setQueriesData({ queryKey: notificationKeys.all }, (old: any) => {
        if (!old) return old

        let wasUnread = false
        const filterItems = (items: any[]) =>
          items.filter((item: any) => {
            if (item.id === id) {
              if (!item.read) {
                wasUnread = true
              }
              return false
            }
            return true
          })

        if (old.data?.items) {
          const updatedItems = filterItems(old.data.items)
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
          return { ...old, data: filterItems(old.data) }
        }

        if (Array.isArray(old)) {
          return filterItems(old)
        }

        return old
      })
    },
  })
}
