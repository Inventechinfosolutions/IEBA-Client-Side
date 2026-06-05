import { useMutation, useQueryClient } from "@tanstack/react-query"

import { mapDepartmentReports } from "../api/departmentReports"
import { departmentKeys } from "../keys"
import type { MapDepartmentReportsReqDto } from "../types"

export function useMapDepartmentReports() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: MapDepartmentReportsReqDto) => mapDepartmentReports(body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: departmentKeys.reportSettings.mapped(String(variables.departmentId)),
      })
    },
  })
}
