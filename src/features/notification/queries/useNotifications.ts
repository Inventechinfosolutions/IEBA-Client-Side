import { useQuery } from "@tanstack/react-query"
import { usePermissions } from "@/hooks/usePermissions"
import { getNotifications } from "../api/notificationApi"
import type { NotificationFilter } from "../types"
import { notificationKeys } from "../key"

export function useNotifications(filter: NotificationFilter) {
  const { canView } = usePermissions()
  return useQuery({
    queryKey: notificationKeys.filtered(filter),
    queryFn: () => getNotifications(filter),
    enabled: canView("notification"),
    staleTime: 0,
    refetchOnMount: "always",
  })
}
