import { useQuery } from "@tanstack/react-query"
import { getNotifications } from "../api/notificationApi"
import { notificationKeys } from "../key"

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: getNotifications,
  })
}
