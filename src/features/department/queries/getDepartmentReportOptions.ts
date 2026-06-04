import { useQuery } from "@tanstack/react-query"

import { getDepartmentReportOptions } from "../api/departmentReports"
import { departmentKeys } from "../keys"

/** GET /report — enabled only while Department Report Setting tab is active. */
export function useGetDepartmentReportOptions(enabled = false) {
  return useQuery({
    queryKey: departmentKeys.reportSettings.options(),
    queryFn: getDepartmentReportOptions,
    enabled,
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
