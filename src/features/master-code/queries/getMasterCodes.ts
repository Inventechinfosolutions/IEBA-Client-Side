import { useQuery } from "@tanstack/react-query"

import { apiGetActivityCodeById, apiGetActivityCodesPage } from "../api"
import { masterCodeKeys } from "../keys"
import type { GetMasterCodesParams } from "../types"

export function useGetMasterCodes(params: GetMasterCodesParams) {
  return useQuery({
    queryKey: masterCodeKeys.list(params),
    queryFn: () => {
      const { codeType, page, pageSize, inactiveOnly } = params
      if (!codeType) throw new Error("codeType is required")
      return apiGetActivityCodesPage({
        codeType,
        page,
        pageSize,
        inactiveOnly,
      })
    },
    enabled: Boolean(params.codeType),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

export type UseGetActivityCodeByIdOptions = {
  enabled?: boolean
}

/** Single activity-code row (`GET /activity-codes/:id`) — shared with county “Copy code” and detail cache. */
export function useGetActivityCodeById(
  id: string,
  options?: UseGetActivityCodeByIdOptions,
) {
  const enabled = options?.enabled ?? true
  const numericId = Number(id)
  return useQuery({
    queryKey: masterCodeKeys.detail(id),
    queryFn: () => apiGetActivityCodeById(id),
    enabled: enabled && id.length > 0 && !Number.isNaN(numericId) && numericId > 0,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}
