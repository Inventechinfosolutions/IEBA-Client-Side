import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateAssignedAndUnassignedReports } from "../api/departmentReports"
import { departmentKeys } from "../keys"

export type UpdateAssignedUnassignedReportsPayload = {
  departmentId: string
  reportIds: number[]
}

export function useUpdateAssignedUnassignedReports() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ departmentId, reportIds }: UpdateAssignedUnassignedReportsPayload) =>
      updateAssignedAndUnassignedReports(departmentId, reportIds),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: departmentKeys.reportSettings.assignedUnassigned(variables.departmentId),
      })
    },
  })
}
