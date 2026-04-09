import { useQuery } from "@tanstack/react-query"

import { fetchRmtsGroupById } from "../api/api"
import { scheduleTimeStudyKeys } from "../keys"
import type { RmtsEntityByIdQueryParams, RmtsGroupApiDto } from "../types"

export function useGetRmtsGroupById(params: RmtsEntityByIdQueryParams) {
  const id = params.id
  const enabled = params.enabled ?? true

  return useQuery({
    queryKey: scheduleTimeStudyKeys.groupById(id ?? 0),
    queryFn: async (): Promise<RmtsGroupApiDto | null> => {
      if (id == null || id <= 0) return null
      return fetchRmtsGroupById(id)
    },
    enabled: enabled && id != null && id > 0,
  })
}

