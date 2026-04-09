import { useQuery } from "@tanstack/react-query"

import { fetchScheduleTimeStudyJobPoolsByDepartment } from "../api/api"
import { scheduleTimeStudyKeys } from "../keys"
import type { GetScheduleTimeStudyJobPoolsByDepartmentQueryParams } from "../types"

export function useGetScheduleTimeStudyJobPoolsByDepartment(
  params: GetScheduleTimeStudyJobPoolsByDepartmentQueryParams,
) {
  const departmentId = params.departmentId
  const enabled = (params.enabled ?? true) && departmentId != null && departmentId > 0

  return useQuery({
    queryKey: scheduleTimeStudyKeys.jobPoolsByDepartment({ departmentId: departmentId ?? 0 }),
    queryFn: async () => {
      if (departmentId == null || departmentId <= 0) return []
      return fetchScheduleTimeStudyJobPoolsByDepartment({ departmentId })
    },
    enabled,
  })
}

