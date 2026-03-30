import { useMutation, useQueryClient } from "@tanstack/react-query"

import { departmentRoleKeys } from "../keys"
import {
  getMockDepartmentRolesStore,
  setMockDepartmentRolesStore,
} from "../queries/getDepartmentRoles"
import type { DepartmentRoleWithChildren, RoleStatus } from "../types"

type UpdateChildInput = {
  childId: string
  roleName: string
  status: RoleStatus
}

function updateChild(
  prev: DepartmentRoleWithChildren[],
  input: UpdateChildInput
): DepartmentRoleWithChildren[] {
  return prev.map((dept) => {
    const children = dept.children ?? []
    const idx = children.findIndex((c) => c.id === input.childId)
    if (idx === -1) return dept

    const updatedChildren = children.map((c) =>
      c.id === input.childId ? { ...c, roleName: input.roleName, status: input.status } : c
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

export function useUpdateDepartmentRoleChild() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateChildInput) => {
      const current = getMockDepartmentRolesStore()
      const next = updateChild(current, input)
      setMockDepartmentRolesStore(next)
      return next
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: departmentRoleKeys.lists() })

      const previous =
        queryClient.getQueryData<DepartmentRoleWithChildren[]>(
          departmentRoleKeys.lists()
        ) ?? []

      const optimisticNext = updateChild(previous, input)
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
      setMockDepartmentRolesStore(next)
    },
  })
}

