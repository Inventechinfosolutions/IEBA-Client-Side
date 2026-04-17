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

        const updateItems = (items: any[]) =>
          items.map((item: any) =>
            item.id === id ? { ...item, read: true } : item
          )

        if (old.data?.items) {
          return {
            ...old,
            data: { ...old.data, items: updateItems(old.data.items) },
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
