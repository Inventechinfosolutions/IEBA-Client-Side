import { useQuery } from "@tanstack/react-query"

import { apiListAllTenantMasterCodes } from "../api"
import { masterCodeKeys } from "../keys"

export function useTenantMasterCodesAll() {
  return useQuery({
    queryKey: masterCodeKeys.tenantMasterCodes(),
    queryFn: () => apiListAllTenantMasterCodes(),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
