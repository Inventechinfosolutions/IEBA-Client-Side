import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/main"
import { markAllNotificationsAsRead } from "../api/notificationApi"
import { notificationKeys } from "../key"

export function useMarkAllAsRead() {
  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
