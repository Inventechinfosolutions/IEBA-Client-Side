import { useQuery } from "@tanstack/react-query"

import { ACTIVE_DEPARTMENTS_PAGE_PARAMS } from "@/features/department/constants"
import { getDepartments } from "@/features/department/api/departments"
import { departmentKeys } from "@/features/department/keys"
import { apiGetReportCatalog, apiGetReportsByDepartment, apiGetReportsDepartments } from "../api/reports"
import { reportKeys } from "../keys"
import { reportQueryOptions } from "../queryOptions"

/** Full catalog — used by department report settings, not the Reports screen. */
export function useGetReportCatalog(enabled = false) {
  return useQuery({
    queryKey: reportKeys.catalog(),
    queryFn: async () => await apiGetReportCatalog(),
    enabled,
    ...reportQueryOptions,
  })
}

/** Department-scoped reports for the Reports screen dropdown (includes criteria when API sends it). */
export function useGetReportsByDepartment(
  departmentId: string | undefined,
  enabled = false,
) {
  const id = departmentId?.trim() ?? ""
  return useQuery({
    queryKey: reportKeys.byDepartment(id),
    queryFn: () => apiGetReportsByDepartment(id),
    enabled: enabled && id.length > 0,
    ...reportQueryOptions,
  })
}

/** All active departments — loaded when the Reports screen opens. */
export function useGetReportDepartments(userId?: string, isSuperAdmin?: boolean, enabled = true) {
  return useQuery({
    queryKey: userId
      ? [...departmentKeys.paginatedList(ACTIVE_DEPARTMENTS_PAGE_PARAMS), userId, isSuperAdmin]
      : departmentKeys.paginatedList(ACTIVE_DEPARTMENTS_PAGE_PARAMS),
    queryFn: async () => {
      if (isSuperAdmin || !userId) {
        return await getDepartments(ACTIVE_DEPARTMENTS_PAGE_PARAMS)
      } else {
        const depts = await apiGetReportsDepartments(userId)
        return { items: depts }
      }
    },
    enabled: enabled && (isSuperAdmin || !!userId),
    ...reportQueryOptions,
  })
}
