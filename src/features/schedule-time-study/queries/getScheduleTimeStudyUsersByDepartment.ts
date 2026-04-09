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

  return useQuery({
    queryKey: scheduleTimeStudyKeys.departmentUsersList({ departmentId: departmentId ?? 0 }),
    queryFn: async (): Promise<ScheduleTimeStudyDepartmentUserApiDto[]> => {
      if (departmentId == null || departmentId <= 0) return []
      return fetchScheduleTimeStudyDepartmentUsers({ departmentId })
    },
    enabled: departmentId != null && departmentId > 0,
  })
}

