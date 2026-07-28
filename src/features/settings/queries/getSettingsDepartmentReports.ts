import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { ACTIVE_DEPARTMENTS_PAGE_PARAMS } from "@/features/department/constants"
import { getDepartments } from "@/features/department/api/departments"
import { useGetAssignedAndUnassignedReports } from "@/features/department/queries/getAssignedAndUnassignedReports"
import { departmentKeys } from "@/features/department/keys"
import { getCountyMappedReportOptions } from "@/features/settings/api/countyReports"
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

/** Full report metadata + buckets. With departmentId uses per-dept config. */
export async function fetchSettingsReportById(
  reportId: number,
  departmentId?: string,
): Promise<ReportOption | null> {
  const deptId = departmentId?.trim()
  if (deptId) {
    const res = await api.get<unknown>(
      `/departments/${encodeURIComponent(deptId)}/reports/${reportId}/config`,
    )
    const row = ((res as { data?: unknown })?.data ?? res) as Record<string, unknown> | null
    if (!row || typeof row !== "object") return null
    return mapRawReportsToReportOptions([row])[0] ?? null
  }
  const res = await api.get<unknown>(`/report/${reportId}`)
  const row = ((res as { data?: unknown })?.data ?? res) as Record<string, unknown> | null
  if (!row || typeof row !== "object") return null
  return mapRawReportsToReportOptions([row])[0] ?? null
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

/**
 * Reports already mapped on Department Report Setting (tab 3 Selected).
 * Same API + cache as tab 3: `GET /departments/:id/reports/assigned-unassigned` → `assigned`.
 * Does not call `GET /report` (full catalog).
 */
export function useSettingsDepartmentReports(
  departmentId: string | undefined,
  enabled = false,
) {
  const id = departmentId?.trim() ?? ""
  const query = useGetAssignedAndUnassignedReports(id || null, enabled && id.length > 0)

  const data = useMemo<ReportOption[]>(
    () =>
      (query.data?.assigned ?? []).map((r) => ({
        key: r.code,
        label: r.label,
        id: r.id,
      })),
    [query.data?.assigned],
  )

  return {
    ...query,
    data,
  }
}

/** County-mapped reports for Settings → Reports (`GET /report/county/mapped`). */
export function useSettingsCountyMappedReports(enabled = false) {
  return useQuery({
    queryKey: [...settingsKeys.reports.all(), "county-mapped-options"] as const,
    queryFn: getCountyMappedReportOptions,
    enabled,
    ...SETTINGS_REPORTS_QUERY_OPTIONS,
  })
}
