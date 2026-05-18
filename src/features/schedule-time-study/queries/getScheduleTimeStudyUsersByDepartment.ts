import { useQuery } from "@tanstack/react-query"

import { scheduleTimeStudyKeys } from "../keys"
import { fetchScheduleTimeStudyDepartmentUsers } from "../api/api"
import type {
  GetScheduleTimeStudyUsersByDepartmentQueryParams,
  ScheduleTimeStudyDepartmentUserApiDto,
} from "../types"

export function useGetScheduleTimeStudyUsersByDepartment(
  params: GetScheduleTimeStudyUsersByDepartmentQueryParams,
) {
  const departmentId = params.departmentId
  const lazyEnabled = params.enabled ?? true
  const hasDepartment = departmentId != null && departmentId > 0

  return useQuery({
    queryKey: scheduleTimeStudyKeys.departmentUsersList({ departmentId: departmentId ?? 0 }),
    queryFn: async (): Promise<ScheduleTimeStudyDepartmentUserApiDto[]> => {
      if (!hasDepartment) return []
      return fetchScheduleTimeStudyDepartmentUsers({ departmentId })
    },
    enabled: lazyEnabled && hasDepartment,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

