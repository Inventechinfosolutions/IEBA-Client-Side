import { useQuery } from "@tanstack/react-query"

import { getAssignedAndUnassignedReports } from "../api/departmentReports"
import { departmentKeys } from "../keys"

/** GET /departments/:departmentId/reports/assigned-unassigned */
export function useGetAssignedAndUnassignedReports(
  departmentId: string | null | undefined,
  enabled = false,
) {
  const canFetch = enabled && !!departmentId

  return useQuery({
    queryKey: departmentKeys.reportSettings.assignedUnassigned(departmentId ?? ""),
    queryFn: () => getAssignedAndUnassignedReports(departmentId!),
    enabled: canFetch,
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
