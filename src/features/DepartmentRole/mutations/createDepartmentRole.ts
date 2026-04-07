import { useMutation, useQueryClient } from "@tanstack/react-query"

import { createDepartmentRole } from "../api/departmentRoles"
import { departmentRoleKeys } from "../keys"
import type { AddRoleFormValues, DepartmentRolesListFilters } from "../types"

type CreateInput = AddRoleFormValues & {
  departmentId: number
  listFilters: DepartmentRolesListFilters
}

export function useCreateDepartmentRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateInput) => {
      const status = input.active ? "active" : "inactive"
      return createDepartmentRole({
        departmentId: input.departmentId,
        status,
        role: { name: input.roleName.trim() },
        isAdmin: false,
        assignedPermissionLabels: input.assignedPermissions,
      })
    },
    onSuccess: async (_id, variables) => {
      await queryClient.invalidateQueries({
        queryKey: departmentRoleKeys.list(variables.listFilters),
      })
    },
  })
}
