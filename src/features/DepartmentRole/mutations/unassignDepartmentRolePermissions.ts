import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  unassignDepartmentRolePermissions,
  type MutateDepartmentRolePermissionsBody,
} from "../api/departmentRoles"
import { departmentRoleKeys } from "../keys"
import type { DepartmentRolesListFilters } from "../types"

type Input = MutateDepartmentRolePermissionsBody & {
  listFilters: DepartmentRolesListFilters
  detailId?: string | null
}

export function useUnassignDepartmentRolePermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      departmentRoleId,
      permissions,
    }: Input) => {
      await unassignDepartmentRolePermissions({ departmentRoleId, permissions })
    },
    onSuccess: async (_void, variables) => {
      await queryClient.invalidateQueries({
        queryKey: departmentRoleKeys.list(variables.listFilters),
      })
      if (variables.detailId) {
        await queryClient.invalidateQueries({
          queryKey: departmentRoleKeys.detail(variables.detailId),
        })
      }
    },
  })
}
