import type { DepartmentFilter, GetDepartmentsParams } from "./types"

export const departmentKeys = {
  all: ["departments"] as const,
  lists: () => [...departmentKeys.all, "list"] as const,
  list: (filter: DepartmentFilter) =>
    [...departmentKeys.lists(), filter] as const,
  /** Paginated `GET /departments` (Reports, Settings → Reports, etc.). */
  paginatedList: (params: GetDepartmentsParams) =>
    [...departmentKeys.all, "paginated", params] as const,
  /** GET /departments/all (no pagination). */
  allUnpaginated: (params: { status?: string; sort?: string; search?: string }) =>
    [...departmentKeys.all, "all-unpaginated", params] as const,
  details: () => [...departmentKeys.all, "detail"] as const,
  detail: (id: string) => [...departmentKeys.details(), id] as const,
  /** Active users for contact dropdowns (paginated API). */
  contactUsers: () => ["department-contact-users"] as const,
  reportSettings: {
    all: () => [...departmentKeys.all, "report-settings"] as const,
    options: () => [...departmentKeys.reportSettings.all(), "options"] as const,
    mapped: (departmentId: string) =>
      [...departmentKeys.reportSettings.all(), "mapped", departmentId] as const,
  },
}
