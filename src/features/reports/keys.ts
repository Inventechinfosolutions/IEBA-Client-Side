export const reportKeys = {
  all: ["reports"] as const,
  lists: () => [...reportKeys.all, "list"] as const,
  catalog: () => [...reportKeys.lists(), "catalog"] as const,
  /** Active departments for the Reports screen (loaded on page open). */
  departmentsList: () => [...reportKeys.all, "departments-list"] as const,
  /** Reports for a department (`GET /report/department/:departmentId/mapped`). */
  byDepartment: (departmentId: string) =>
    [...reportKeys.all, "by-department", departmentId] as const,
  /** @deprecated Use departmentsList — kept for query-cache compatibility during migration */
  departments: (reportKey: string) => [...reportKeys.all, "departments", reportKey] as const,
  maaEmployees: (types: string[], dept?: string) => [...reportKeys.all, "maa-employees", { types, dept }] as const,
  costPoolUsers: (pools: string[], user: string, status?: string[]) =>
    [...reportKeys.all, "cost-pool-users", { pools, user, status }] as const,
  maaTcmActivityDepartments: () => [...reportKeys.all, "maa-tcm-activity-departments"] as const,
  listAllPrograms: () => [...reportKeys.all, "list-all-programs"] as const,
}

