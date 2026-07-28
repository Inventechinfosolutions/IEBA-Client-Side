import { useQuery } from "@tanstack/react-query"

import {
  getDepartmentReportConfig,
} from "../api/departmentReports"
import { departmentKeys } from "../keys"
import { mapRawReportsToReportOptions } from "@/features/settings/lib/reportOptions.utils"
import type { ReportOption } from "@/features/settings/types"

/** GET /departments/:departmentId/reports/:reportId/config → ReportOption buckets. */
export async function fetchDepartmentReportConfigOption(
  departmentId: string,
  reportId: number,
): Promise<ReportOption | null> {
  const row = await getDepartmentReportConfig(departmentId, reportId)
  if (!row || typeof row !== "object") return null
  return mapRawReportsToReportOptions([row])[0] ?? null
}

/** TanStack query for per-department report include/exclude config. */
export function useGetDepartmentReportConfig(
  departmentId: string | null | undefined,
  reportId: number | null | undefined,
  enabled = false,
) {
  const deptId = departmentId?.trim() ?? ""
  const id = typeof reportId === "number" && reportId >= 1 ? reportId : 0

  return useQuery({
    queryKey: departmentKeys.reportSettings.config(deptId, id),
    queryFn: () => fetchDepartmentReportConfigOption(deptId, id),
    enabled: enabled && deptId.length > 0 && id >= 1,
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}
