import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateDepartmentRole } from "../api/departmentRoles"
import { departmentRoleKeys } from "../keys"
import type {
  DepartmentRolesListFilters,
  DepartmentRolePermissionCatalog,
} from "../types"

type UpdateChildInput = {
  childId: string
  name?: string
  status?: string
  assignedPermissionLabels?: string[]
  permissionCatalogByModuleName?: DepartmentRolePermissionCatalog | null
  listFilters: DepartmentRolesListFilters
}

export function useUpdateDepartmentRoleChild() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateChildInput) => {
      await updateDepartmentRole(input.childId, {
        name: input.name,
        status: input.status,
        assignedPermissionLabels: input.assignedPermissionLabels,
        permissionCatalogByModuleName: input.permissionCatalogByModuleName,
      })
    },
    onSuccess: async (_void, variables) => {
      await queryClient.invalidateQueries({
        queryKey: departmentRoleKeys.list(variables.listFilters),
      })
      await queryClient.invalidateQueries({
        queryKey: departmentRoleKeys.detail(variables.childId),
      })
    },
  })
}
