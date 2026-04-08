import { useQuery } from "@tanstack/react-query"

import { fetchDepartmentRolesPage } from "../api/departmentRoles"
import { departmentRoleKeys } from "../keys"
import type { DepartmentRolesListFilters } from "../types"

export function useDepartmentRolesListQuery(filters: DepartmentRolesListFilters) {
  return useQuery({
    queryKey: departmentRoleKeys.list(filters),
    queryFn: () =>
      fetchDepartmentRolesPage({
        page: filters.page,
        limit: filters.pageSize,
        status: filters.status,
      }),
  })
}
