import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { countyActivityCodeKeys } from "../keys"

export type ActivityHistoryRecord = {
  id: number | string
  activityId: number | string
  activityCode: string
  activityName: string
  userId: string | null
  userName: string | null
  effectiveFrom: string | null
  effectiveTo: string | null
  [key: string]: unknown
}

export type ActivityHistoryResponse = {
  data: ActivityHistoryRecord[]
  meta: {
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  }
}

export type ActivityHistoryParams = {
  page?: number
  limit?: number
  activityCode?: string
  activityName?: string
}

export function useActivityHistoryQuery(params: ActivityHistoryParams) {
  const { page = 1, limit = 10, activityCode = "", activityName = "" } = params

  return useQuery({
    queryKey: countyActivityCodeKeys.history({ page, limit, activityCode, activityName }),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.set("page", String(page))
      searchParams.set("limit", String(limit))
      if (activityCode.trim()) searchParams.set("activityCode", activityCode.trim())
      if (activityName.trim()) searchParams.set("activityName", activityName.trim())

      const res = await api.get<{ data: ActivityHistoryResponse } | ActivityHistoryResponse>(
        `/users/activity-history?${searchParams.toString()}`
      )
      // Handle both wrapped { data: ... } and unwrapped response shapes
      const payload = (res as { data: ActivityHistoryResponse }).data ?? (res as unknown as ActivityHistoryResponse)
      return payload
    },
    staleTime: 0,
  })
}
