import { useQuery } from "@tanstack/react-query"

import { getDepartmentMappedReports } from "../api/departmentReports"
import { departmentKeys } from "../keys"

/** GET /departments/:departmentId/reports — enabled on report tab when department id exists. */
export function useGetDepartmentMappedReports(
  departmentId: string | null | undefined,
  enabled = false,
  options?: { method?: "reportscreen" },
) {
  const canFetch = enabled && !!departmentId
  const method = options?.method

  return useQuery({
    queryKey: [...departmentKeys.reportSettings.mapped(departmentId ?? ""), method ?? "full"] as const,
    queryFn: () => getDepartmentMappedReports(departmentId!, method ? { method } : undefined),
    enabled: canFetch,
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
