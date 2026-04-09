import { useQuery } from "@tanstack/react-query"

import { fetchRmtsPayPeriods } from "../api/api"
import { scheduleTimeStudyKeys } from "../keys"
import { mapPayPeriodToRow } from "../utils/rmtsMappers"
import type {
  FetchScheduleTimeStudyPeriodRowsParams,
  GetRmtsPayPeriodsQueryParams,
  ScheduleTimeStudyPeriodRow,
} from "../types"

export async function fetchScheduleTimeStudyPeriodRows(
  params: FetchScheduleTimeStudyPeriodRowsParams,
): Promise<ScheduleTimeStudyPeriodRow[]> {
  const list = await fetchRmtsPayPeriods({
    fiscalyear: params.fiscalyear.trim(),
    departmentId: params.departmentId,
  })
  return list.map(mapPayPeriodToRow)
}

export function useGetRmtsPayPeriods(params: GetRmtsPayPeriodsQueryParams) {
  const departmentId = params.departmentId
  const fiscalyear = params.fiscalyear.trim()
  const enabled = params.enabled ?? true

  return useQuery({
    queryKey: scheduleTimeStudyKeys.payPeriodList({
      departmentId: departmentId ?? 0,
      fiscalyear,
    }),
    queryFn: async (): Promise<ScheduleTimeStudyPeriodRow[]> => {
      if (departmentId == null || departmentId <= 0) {
        return []
      }
      return fetchScheduleTimeStudyPeriodRows({ fiscalyear, departmentId })
    },
    enabled: enabled && departmentId != null && departmentId > 0 && fiscalyear.length > 0,
  })
}
