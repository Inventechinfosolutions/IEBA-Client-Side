import { useQuery } from "@tanstack/react-query"

import { fetchScheduleTimeStudyJobPoolsByDepartment } from "../api/api"
import { scheduleTimeStudyKeys } from "../keys"
import type { GetScheduleTimeStudyJobPoolsByDepartmentQueryParams } from "../types"

export function useGetScheduleTimeStudyJobPoolsByDepartment(
  params: GetScheduleTimeStudyJobPoolsByDepartmentQueryParams,
) {
  const departmentId = params.departmentId
  const lazyEnabled = params.enabled ?? true
  const hasDepartment = departmentId != null && departmentId > 0

  return useQuery({
    queryKey: scheduleTimeStudyKeys.jobPoolsByDepartment({ departmentId: departmentId ?? 0 }),
    queryFn: async () => {
      if (!hasDepartment) return []
      return fetchScheduleTimeStudyJobPoolsByDepartment({ departmentId })
    },
    enabled: lazyEnabled && hasDepartment,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

