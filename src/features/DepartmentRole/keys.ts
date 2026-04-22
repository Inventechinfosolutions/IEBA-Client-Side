import type { DepartmentRolesListFilters } from "./types"

export const departmentRoleKeys = {
  all: ["departmentRole"] as const,
  lists: () => [...departmentRoleKeys.all, "list"] as const,
  list: (filters: DepartmentRolesListFilters) =>
    [...departmentRoleKeys.lists(), filters] as const,
  details: () => [...departmentRoleKeys.all, "detail"] as const,
  detail: (id: string) => [...departmentRoleKeys.details(), id] as const,
  catalog: () => [...departmentRoleKeys.all, "permissions", "catalog"] as const,
}
