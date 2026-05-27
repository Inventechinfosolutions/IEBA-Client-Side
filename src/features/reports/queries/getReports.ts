import { useQuery } from "@tanstack/react-query"

import { getDepartments } from "@/features/department/api/departments"
import { apiGetReportCatalog } from "../api/reports"
import { reportKeys } from "../keys"
import { reportQueryOptions } from "../queryOptions"

const REPORT_DEPARTMENTS_PARAMS = {
  status: "active" as const,
  page: 1,
  limit: 100,
}

export function useGetReportCatalog() {
  return useQuery({
    queryKey: reportKeys.catalog(),
    queryFn: async () => await apiGetReportCatalog(),
    ...reportQueryOptions,
  })
}

/** Departments for Reports — refetches when report type changes (query key includes reportKey). */
export function useGetReportDepartments(reportKey: string, enabled = true) {
  const key = reportKey.trim()
  return useQuery({
    queryKey: reportKeys.departments(key),
    queryFn: () => getDepartments(REPORT_DEPARTMENTS_PARAMS),
    enabled: enabled && key.length > 0,
    ...reportQueryOptions,
  })
}
