import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { dashboardKeys } from "../keys"

export type AuditHistoryRecord = {
  id: number | string
  entityName: string | null
  entityId: string | null
  operation: string | null
  changedBy: string | null
  changedAt: string | null
  requestId: string | null
  [key: string]: unknown
}

export type AuditHistoryResponse = {
  data: AuditHistoryRecord[]
  meta: {
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  }
}

export type AuditHistoryParams = {
  page?: number
  limit?: number
  entityName?: string
}

export function useAuditHistoryQuery(params: AuditHistoryParams) {
  const { 
    page = 1, 
    limit = 10, 
    entityName = "" 
  } = params

  return useQuery({
    queryKey: dashboardKeys.auditHistory({ page, limit, entityName }),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.set("page", String(page))
      searchParams.set("limit", String(limit))
      if (entityName.trim()) searchParams.set("entityName", entityName.trim())

      const res = await api.get<{ data: AuditHistoryResponse } | AuditHistoryResponse>(
        `/audit-history?${searchParams.toString()}`
      )
      const payload = (res as { data: AuditHistoryResponse }).data ?? (res as unknown as AuditHistoryResponse)
      return payload
    },
    staleTime: 0,
  })
}
