import { useQuery } from "@tanstack/react-query"

import { fetchDepartmentRoleById } from "../api/departmentRoles"
import { departmentRoleKeys } from "../keys"

export function useDepartmentRoleDetailQuery(
  id: string | null,
  options?: { enabled?: boolean }
) {
  const enabled = Boolean(id) && (options?.enabled ?? true)

  return useQuery({
    queryKey:
      id != null && id !== ""
        ? departmentRoleKeys.detail(id)
        : ([...departmentRoleKeys.all, "detail", "none"] as const),
    queryFn: () => fetchDepartmentRoleById(id as string),
    enabled,
  })
}
