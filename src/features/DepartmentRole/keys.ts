import type { DepartmentRolesListFilters } from "./types"

export const departmentRoleKeys = {
  all: ["departmentRole"] as const,
  lists: () => [...departmentRoleKeys.all, "list"] as const,
  list: (filters: DepartmentRolesListFilters) =>
    [...departmentRoleKeys.lists(), filters] as const,
  details: () => [...departmentRoleKeys.all, "detail"] as const,
  detail: (id: string) => [...departmentRoleKeys.details(), id] as const,
  catalog: () => [...departmentRoleKeys.all, "permissions", "catalog"] as const,
  /** `GET /users/department-role-history` — paginated department role history log. */
  history: (params: {
    page: number
    limit: number
    departmentCode: string
    departmentName: string
    roleName: string
    historyKind: string
    userId: string
  }) => [...departmentRoleKeys.all, "department-role-history", params] as const,
}
