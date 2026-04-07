import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateDepartmentRole } from "../api/departmentRoles"
import { departmentRoleKeys } from "../keys"
import type { DepartmentRolesListFilters, RoleStatus } from "../types"

type UpdateChildInput = {
  childId: string
  roleName: string
  status: RoleStatus
  listFilters: DepartmentRolesListFilters
}

export function useUpdateDepartmentRoleChild() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateChildInput) => {
      await updateDepartmentRole(input.childId, {
        roleName: input.roleName.trim(),
        status: input.status,
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
