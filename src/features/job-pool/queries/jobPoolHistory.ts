import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { jobPoolKeys } from "../keys"

export type JobPoolHistoryRecord = {
  id: number | string
  jobTitle: string | null
  jobCode: string | null
  assignmentKind: string | null
  userId: string | null
  userName: string | null
  effectiveFrom: string | null
  effectiveTo: string | null
  [key: string]: unknown
}

export type JobPoolHistoryResponse = {
  data: JobPoolHistoryRecord[]
  meta: {
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  }
}

export type JobPoolHistoryParams = {
  page?: number
  limit?: number
  assignmentKind?: string
}

export function useJobPoolHistoryQuery(params: JobPoolHistoryParams) {
  const { 
    page = 1, 
    limit = 10, 
    assignmentKind = "" 
  } = params

  return useQuery({
    queryKey: jobPoolKeys.history({ page, limit, assignmentKind }),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.set("page", String(page))
      searchParams.set("limit", String(limit))
      if (assignmentKind.trim()) searchParams.set("assignmentKind", assignmentKind.trim())

      const res = await api.get<{ data: JobPoolHistoryResponse } | JobPoolHistoryResponse>(
        `/jobpool/history?${searchParams.toString()}`
      )
      const payload = (res as { data: JobPoolHistoryResponse }).data ?? (res as unknown as JobPoolHistoryResponse)
      return payload
    },
    staleTime: 0,
  })
}
