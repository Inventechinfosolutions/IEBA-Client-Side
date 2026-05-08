import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { costPoolKeys } from "../keys"

export type CostPoolHistoryRecord = {
  id: number | string
  activityCode: string | null
  activityName: string | null
  assignmentKind: string | null
  userId: string | null
  userName: string | null
  effectiveFrom: string | null
  effectiveTo: string | null
  [key: string]: unknown
}

export type CostPoolHistoryResponse = {
  data: CostPoolHistoryRecord[]
  meta: {
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  }
}

export type CostPoolHistoryParams = {
  page?: number
  limit?: number
  activityCode?: string
  assignmentKind?: string
}

export function useCostPoolHistoryQuery(params: CostPoolHistoryParams) {
  const { 
    page = 1, 
    limit = 10, 
    activityCode = "", 
    assignmentKind = "" 
  } = params

  return useQuery({
    queryKey: costPoolKeys.history({ page, limit, activityCode, assignmentKind }),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.set("page", String(page))
      searchParams.set("limit", String(limit))
      if (activityCode.trim()) searchParams.set("activityCode", activityCode.trim())
      if (assignmentKind.trim()) searchParams.set("assignmentKind", assignmentKind.trim())

      const res = await api.get<{ data: CostPoolHistoryResponse } | CostPoolHistoryResponse>(
        `/costpool/history?${searchParams.toString()}`
      )
      const payload = (res as { data: CostPoolHistoryResponse }).data ?? (res as unknown as CostPoolHistoryResponse)
      return payload
    },
    staleTime: 0,
  })
}
