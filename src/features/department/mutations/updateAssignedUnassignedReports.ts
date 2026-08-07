import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateAssignedAndUnassignedReports } from "../api/departmentReports"
import { departmentKeys } from "../keys"
import { reportKeys } from "@/features/reports/keys"
import { dashboardKeys } from "@/features/dashboard/keys"

export type UpdateAssignedUnassignedReportsPayload = {
  departmentId: string
  reportIds: number[]
  reportVisibility?: Array<{ reportId: number; visibleToAdmin: boolean; visibleToUser: boolean }>
}

export function useUpdateAssignedUnassignedReports() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      departmentId,
      reportIds,
      reportVisibility,
    }: UpdateAssignedUnassignedReportsPayload) =>
      updateAssignedAndUnassignedReports(departmentId, reportIds, reportVisibility),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: departmentKeys.reportSettings.assignedUnassigned(variables.departmentId),
      })
      // Reports run screen dropdown uses the same department mapping.
      void queryClient.invalidateQueries({
        queryKey: reportKeys.byDepartment(variables.departmentId),
      })
      // History pills / A/U snapshot after Report Setting save.
      void queryClient.invalidateQueries({
        queryKey: [...departmentKeys.all, "history"],
      })
      // Dashboard report cards use BE A/U filter — refresh after visibility change.
      void queryClient.invalidateQueries({
        queryKey: dashboardKeys.reports(),
      })
    },
  })
}
