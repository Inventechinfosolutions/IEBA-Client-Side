import { useQuery } from "@tanstack/react-query"

import {
  apiGetMasterCodesPage,
  apiGetMasterCodeById,
  apiGetTenantMasterCodeByName,
} from "../api"
import { masterCodeKeys } from "../keys"
import type { GetMasterCodesParams, MasterCodeTab } from "../types"

/** Fetches a paginated list of master codes for the current tab. */
export function useGetMasterCodes(params: GetMasterCodesParams) {
  return useQuery({
    queryKey: masterCodeKeys.list(params),
    queryFn: async () => {
      const { codeType, page, pageSize, inactiveOnly } = params
      if (!codeType) throw new Error("codeType is required")
      return await apiGetMasterCodesPage({
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
    queryFn: () => apiGetMasterCodeById(id),
    enabled: enabled && id.length > 0 && !Number.isNaN(numericId) && numericId > 0,
    staleTime: 60_000,
  })
}

/** Fetches a single master code by its system-wide ID for editing. */
export function useGetMasterCodeById(id: string | null) {
  return useQuery({
    queryKey: masterCodeKeys.detail(id || ""),
    queryFn: async () => {
      if (!id) throw new Error("ID is required")
      return await apiGetMasterCodeById(id)
    },
    enabled: Boolean(id),
    staleTime: 0,
    gcTime: 0,
  })
}

/** Fetches tenant-specific configuration for a master code by its name (tab). */
export function useTenantMasterCodeByName(name: MasterCodeTab | "") {
  return useQuery({
    queryKey: masterCodeKeys.tenantByName(name || ""),
    queryFn: async () => await apiGetTenantMasterCodeByName(name as MasterCodeTab),
    enabled: Boolean(name),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
