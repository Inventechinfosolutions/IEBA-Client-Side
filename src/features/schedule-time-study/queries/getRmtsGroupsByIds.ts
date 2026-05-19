import { useQuery } from "@tanstack/react-query"

import { fetchRmtsGroupsByIds } from "../api/api"
import { scheduleTimeStudyKeys } from "../keys"
import type { RmtsGroupApiDto } from "../types"

export function useGetRmtsGroupsByIds(ids: number[], enabled = true) {
  const sortedIds = [...new Set(ids.filter((id) => id > 0))].sort((a, b) => a - b)

  return useQuery({
    queryKey: scheduleTimeStudyKeys.groupsByIds(sortedIds),
    queryFn: async (): Promise<RmtsGroupApiDto[]> => {
      if (sortedIds.length === 0) return []
      return fetchRmtsGroupsByIds(sortedIds)
    },
    enabled: enabled && sortedIds.length > 0,
  })
}
