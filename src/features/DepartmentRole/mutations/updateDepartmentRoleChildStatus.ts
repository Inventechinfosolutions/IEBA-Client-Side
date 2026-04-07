import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateDepartmentRole } from "../api/departmentRoles"
import { departmentRoleKeys } from "../keys"
import type { DepartmentRolesListFilters, RoleStatus } from "../types"

type UpdateChildStatusInput = {
  childId: string
  status: RoleStatus
  listFilters: DepartmentRolesListFilters
}

export function useUpdateDepartmentRoleChildStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateChildStatusInput) => {
      await updateDepartmentRole(input.childId, {
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
