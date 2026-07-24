import { useQuery } from "@tanstack/react-query"
import { getDepartmentNotificationConfig } from "../api/departmentNotificationConfig"
import type { DepartmentNotificationConfigItem } from "../api/departmentNotificationConfig"

export const DEPT_NOTIFICATION_CONFIG_KEY = "department-notification-config"

export function useGetDepartmentNotificationConfig(departmentId: string | null) {
  return useQuery<DepartmentNotificationConfigItem[]>({
    queryKey: [DEPT_NOTIFICATION_CONFIG_KEY, departmentId],
    queryFn: async () => {
      if (!departmentId) return []
      const res = await getDepartmentNotificationConfig(departmentId)
      // Handle both envelope and direct array responses
      if (Array.isArray(res)) return res
      if (res?.data && Array.isArray(res.data)) return res.data
      return []
    },
    enabled: !!departmentId,
    staleTime: 30_000,
  })
}
