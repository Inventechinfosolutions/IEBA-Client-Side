import { useQuery } from "@tanstack/react-query"
import { getNotifications } from "../api/notificationApi"
import type { NotificationFilter } from "../types"
import { notificationKeys } from "../key"

export function useNotifications(filter: NotificationFilter) {
  return useQuery({
    queryKey: notificationKeys.filtered(filter),
    queryFn: () => getNotifications(filter),
    staleTime: 0,
    refetchOnMount: "always",
  })
}
