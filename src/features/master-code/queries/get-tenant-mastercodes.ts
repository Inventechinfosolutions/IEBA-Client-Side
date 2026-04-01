import { useQuery } from "@tanstack/react-query"

import { apiGetTenantMasterCodeByName } from "../api"
import { masterCodeKeys } from "../keys"
import type { MasterCodeTab } from "../types"

/** `GET /master-codes/by-name?name=` for the active tab (allowMulticode, id for PUT). */
export function useTenantMasterCodeByName(name: MasterCodeTab | "") {
  return useQuery({
    queryKey: masterCodeKeys.tenantByName(name || ""),
    queryFn: async () => await apiGetTenantMasterCodeByName(name as MasterCodeTab),
    enabled: Boolean(name),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
