import { useMutation } from "@tanstack/react-query"

import { assignUserDepartmentRoles, unassignUserDepartmentRoles } from "../api"
import type { UserDepartmentRoleDepartmentsBody } from "../types"

export function useAssignUserDepartmentRoles() {
  return useMutation({
    mutationFn: (body: UserDepartmentRoleDepartmentsBody) => assignUserDepartmentRoles(body),
  })
}

export function useUnassignUserDepartmentRoles() {
  return useMutation({
    mutationFn: (body: UserDepartmentRoleDepartmentsBody) => unassignUserDepartmentRoles(body),
  })
}
