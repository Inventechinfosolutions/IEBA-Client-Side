import { useMutation, useQueryClient } from "@tanstack/react-query"
import { markAllNotificationsAsRead } from "../api/notificationApi"
import { notificationKeys } from "../key"

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
