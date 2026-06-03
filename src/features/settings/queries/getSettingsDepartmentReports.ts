import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { ACTIVE_DEPARTMENTS_PAGE_PARAMS } from "@/features/department/constants"
import { getDepartments } from "@/features/department/api/departments"
import { departmentKeys } from "@/features/department/keys"
import { mapRawReportsToReportOptions } from "@/features/settings/lib/reportOptions.utils"
import type { ReportOption } from "@/features/settings/types"
import { settingsKeys } from "@/features/settings/keys"

const SETTINGS_REPORTS_QUERY_OPTIONS = {
  staleTime: 0,
  gcTime: 5 * 60_000,
  refetchOnMount: "always" as const,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
} as const

async function fetchDepartmentReportOptions(departmentId: string): Promise<ReportOption[]> {
  const res = await api.get<unknown>(
    `/report/department/${encodeURIComponent(departmentId)}/mapped`,
  )
  const body =
    (res as { data?: { reports?: unknown[] } })?.data ?? (res as { reports?: unknown[] })
  const reports = Array.isArray(body?.reports) ? body.reports : []
  return mapRawReportsToReportOptions(reports)
}

/** Departments for Settings → Reports (`GET /departments?...`). */
export function useSettingsReportDepartments(enabled = false) {
  return useQuery({
    queryKey: departmentKeys.paginatedList(ACTIVE_DEPARTMENTS_PAGE_PARAMS),
    queryFn: () => getDepartments(ACTIVE_DEPARTMENTS_PAGE_PARAMS),
    enabled,
    ...SETTINGS_REPORTS_QUERY_OPTIONS,
  })
}

/** Mapped reports for Settings → Reports (`GET /report/department/:id/mapped`). */
export function useSettingsDepartmentReports(
  departmentId: string | undefined,
  enabled = false,
) {
  const id = departmentId?.trim() ?? ""
  return useQuery({
    queryKey: settingsKeys.reports.byDepartment(id),
    queryFn: () => fetchDepartmentReportOptions(id),
    enabled: enabled && id.length > 0,
    ...SETTINGS_REPORTS_QUERY_OPTIONS,
  })
}
