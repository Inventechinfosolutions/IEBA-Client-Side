import { useMutation, useQueryClient } from "@tanstack/react-query"

import { assignUserDepartmentRoles, unassignUserDepartmentRoles } from "../api"
import { addEmployeeLookupKeys, departmentRolesUnassignedCacheUserKey } from "../keys"
import type { UserDepartmentRoleDepartmentsBody } from "../types"

export function useAssignUserDepartmentRoles() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UserDepartmentRoleDepartmentsBody) => assignUserDepartmentRoles(body),
    onSuccess: (_void, body) => {
      const uid = body.userId.trim()
      if (!uid) return
      void queryClient.invalidateQueries({
        queryKey: addEmployeeLookupKeys.departmentRolesUnassignedAdd(
          departmentRolesUnassignedCacheUserKey(uid, true),
        ),
      })
    },
  })
}

export function useUnassignUserDepartmentRoles() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UserDepartmentRoleDepartmentsBody) => unassignUserDepartmentRoles(body),
    onSuccess: (_void, body) => {
      const uid = body.userId.trim()
      if (!uid) return
      void queryClient.invalidateQueries({
        queryKey: addEmployeeLookupKeys.departmentRolesUnassignedAdd(
          departmentRolesUnassignedCacheUserKey(uid, true),
        ),
      })
    },
  })
}
