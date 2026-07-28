import { useQuery } from "@tanstack/react-query"

import { getCountyMappedReportOptions } from "@/features/settings/api/countyReports"
import { toDepartmentReportOptions } from "../lib/departmentReport.utils"
import { departmentKeys } from "../keys"

/**
 * County-mapped reports for Department Report Setting when creating a new department
 * (no department id yet). Same pool as Settings → Reports selected list.
 */
export function useGetDepartmentReportOptions(enabled = false) {
  return useQuery({
    queryKey: departmentKeys.reportSettings.options(),
    queryFn: async () => {
      const options = await getCountyMappedReportOptions()
      return toDepartmentReportOptions(
        options.map((o) => ({
          id: o.id,
          code: o.key,
          name: o.label.replace(new RegExp(`^${o.key}\\s*`), "").trim() || o.label,
        })),
      )
    },
    enabled,
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
