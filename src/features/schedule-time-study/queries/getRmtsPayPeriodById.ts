import { useQuery } from "@tanstack/react-query"

import { fetchRmtsPayPeriodById } from "../api/api"
import { scheduleTimeStudyKeys } from "../keys"
import type { RmtsEntityByIdQueryParams } from "../types"

export function useGetRmtsPayPeriodById(params: RmtsEntityByIdQueryParams) {
  const id = params.id
  const enabled = params.enabled ?? true

  return useQuery({
    queryKey: scheduleTimeStudyKeys.payPeriodById(id ?? 0),
    queryFn: async () => {
      if (id == null || id <= 0) {
        throw new Error("Invalid pay period id")
      }
      return fetchRmtsPayPeriodById(id)
    },
    enabled: enabled && id != null && id > 0,
  })
}
