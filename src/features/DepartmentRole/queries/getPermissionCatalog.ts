import { useQuery } from "@tanstack/react-query"

import { fetchPermissionCatalog } from "../api/departmentRoles"
import { departmentRoleKeys } from "../keys"

export function usePermissionCatalogQuery(enabled = true) {
  return useQuery({
    queryKey: departmentRoleKeys.catalog(),
    queryFn: fetchPermissionCatalog,
    enabled,
    staleTime: 0, // 5 min — catalog rarely changes
  })
}
