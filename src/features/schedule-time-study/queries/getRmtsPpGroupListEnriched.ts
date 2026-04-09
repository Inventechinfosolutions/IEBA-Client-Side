import { useQuery } from "@tanstack/react-query"

import { fetchRmtsPpGroupListEnriched } from "../api/api"
import { scheduleTimeStudyKeys } from "../keys"
import { mapEnrichedToScheduledRowEnriched } from "../utils/rmtsMappers"
import type {
  GetRmtsPpGroupListEnrichedQueryParams,
  ScheduledTimeStudyRowEnriched,
} from "../types"

export function useGetRmtsPpGroupListEnriched(params: GetRmtsPpGroupListEnrichedQueryParams) {
  const departmentId = params.departmentId
  const fiscalyear = params.fiscalyear.trim()

  return useQuery({
    queryKey: scheduleTimeStudyKeys.ppGroupListEnriched({
      departmentId: departmentId ?? 0,
      fiscalyear,
    }),
    queryFn: async (): Promise<ScheduledTimeStudyRowEnriched[]> => {
      if (departmentId == null || departmentId <= 0) {
        return []
      }
      const list = await fetchRmtsPpGroupListEnriched({ fiscalyear, departmentId })
      return list.map(mapEnrichedToScheduledRowEnriched)
    },
    enabled: departmentId != null && departmentId > 0 && fiscalyear.length > 0,
  })
}
