import { useMutation, useQueryClient } from "@tanstack/react-query"

import { assignUserDepartmentRoles, unassignUserDepartmentRoles } from "../api"
import { addEmployeeLookupKeys } from "../keys"
import type { UserDepartmentRoleDepartmentsBody } from "../types"

export function useAssignUserDepartmentRoles() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UserDepartmentRoleDepartmentsBody) => assignUserDepartmentRoles(body),
    onSuccess: (_void, body) => {
      const uid = body.userId.trim()
      if (!uid) return
      void queryClient.invalidateQueries({
        queryKey: addEmployeeLookupKeys.securityDepartmentRoles(uid),
      })
      void queryClient.invalidateQueries({
        queryKey: addEmployeeLookupKeys.userDetailsTab(uid, "tab2"),
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
        queryKey: addEmployeeLookupKeys.securityDepartmentRoles(uid),
      })
      void queryClient.invalidateQueries({
        queryKey: addEmployeeLookupKeys.userDetailsTab(uid, "tab2"),
      })
    },
  })
}
