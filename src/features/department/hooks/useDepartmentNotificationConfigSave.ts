import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  updateDepartmentNotificationConfig,
  type DepartmentNotificationType,
} from "../api/departmentNotificationConfig"
import { DEPT_NOTIFICATION_CONFIG_KEY } from "../queries/getDepartmentNotificationConfig"

export function useDepartmentNotificationConfigSave(departmentId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      configs: Array<{
        notificationType: DepartmentNotificationType
        emailEnabled: boolean
        inAppEnabled: boolean
        active: boolean
      }>,
    ) => {
      if (!departmentId) throw new Error("Department ID is required")
      return updateDepartmentNotificationConfig(departmentId, configs)
    },
    onSuccess: () => {
      toast.success("Notification settings saved successfully")
      queryClient.invalidateQueries({
        queryKey: [DEPT_NOTIFICATION_CONFIG_KEY, departmentId],
      })
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Failed to save notification settings")
    },
  })
}
