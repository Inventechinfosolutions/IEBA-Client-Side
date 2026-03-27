import { useMutation, useQueryClient } from "@tanstack/react-query"

import { departmentRoleKeys } from "../keys"
import {
  getMockDepartmentRolesStore,
  setMockDepartmentRolesStore,
} from "../queries/getDepartmentRoles"
import type { DepartmentRoleWithChildren, RoleStatus } from "../types"

type UpdateChildStatusInput = {
  childId: string
  status: RoleStatus
}

function updateChildStatus(
  prev: DepartmentRoleWithChildren[],
  input: UpdateChildStatusInput
): DepartmentRoleWithChildren[] {
  return prev.map((dept) => {
    const children = dept.children ?? []
    const idx = children.findIndex((c) => c.id === input.childId)
    if (idx === -1) return dept

    const updatedChildren = children.map((c) =>
      c.id === input.childId ? { ...c, status: input.status } : c
    )

    const activeRoles = updatedChildren
      .filter((c) => c.status === "active")
      .map((c) => c.roleName)

    return {
      ...dept,
      children: updatedChildren,
      roles: activeRoles,
    }
  })
}

export function useUpdateDepartmentRoleChildStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateChildStatusInput) => {
      const current = getMockDepartmentRolesStore()
      const next = updateChildStatus(current, input)
      setMockDepartmentRolesStore(next)
      return next
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: departmentRoleKeys.lists() })

      const previous =
        queryClient.getQueryData<DepartmentRoleWithChildren[]>(
          departmentRoleKeys.lists()
        ) ?? []

      const optimisticNext = updateChildStatus(previous, input)
      setMockDepartmentRolesStore(optimisticNext)
      queryClient.setQueryData<DepartmentRoleWithChildren[]>(
        departmentRoleKeys.lists(),
        optimisticNext
      )

      return { previous }
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) {
        setMockDepartmentRolesStore(ctx.previous)
        queryClient.setQueryData(departmentRoleKeys.lists(), ctx.previous)
      }
    },
    onSuccess: (next) => {
      queryClient.setQueryData<DepartmentRoleWithChildren[]>(
        departmentRoleKeys.lists(),
        next
      )
    },
  })
}

