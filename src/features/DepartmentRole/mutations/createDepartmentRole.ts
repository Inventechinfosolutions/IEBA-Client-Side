import { useMutation, useQueryClient } from "@tanstack/react-query"

import { departmentRoleKeys } from "../keys"
import {
  getMockDepartmentRolesStore,
  setMockDepartmentRolesStore,
} from "../queries/getDepartmentRoles"
import type { AddRoleFormValues, DepartmentRoleWithChildren } from "../types"

function getNextNumericId(values: readonly string[]): string {
  const nums = values
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n > 0)
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return String(next)
}

function upsertRole(
  prev: DepartmentRoleWithChildren[],
  input: AddRoleFormValues
): DepartmentRoleWithChildren[] {
  const desiredStatus = input.active ? "active" : "inactive"

  const existing = prev.find((d) => d.departmentName === input.department)
  if (!existing) {
    const newDeptId = getNextNumericId(prev.map((d) => d.id))
    return [
      ...prev,
      {
        id: newDeptId,
        departmentName: input.department,
        roles: [input.roleName],
        status: desiredStatus,
        children: [
          {
            id: `${newDeptId}-1`,
            roleName: input.roleName,
            status: desiredStatus,
            isCustom: true,
          },
        ],
      },
    ]
  }

  const existingChildren = existing.children ?? []
  const childExists = existingChildren.some((c) => c.roleName === input.roleName)
  const nextChildId = `${existing.id}-${existingChildren.length + 1}`

  return prev.map((d) => {
    if (d.id !== existing.id) return d

    return {
      ...d,
      roles: d.roles.includes(input.roleName) ? d.roles : [...d.roles, input.roleName],
      children: childExists
        ? existingChildren
        : [
            ...existingChildren,
            {
              id: nextChildId,
              roleName: input.roleName,
              status: desiredStatus,
              isCustom: true,
            },
          ],
    }
  })
}

export function useCreateDepartmentRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AddRoleFormValues) => {
      const current = getMockDepartmentRolesStore()
      const next = upsertRole(current, input)
      setMockDepartmentRolesStore(next)
      return next
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: departmentRoleKeys.lists() })

      const previous =
        queryClient.getQueryData<DepartmentRoleWithChildren[]>(
          departmentRoleKeys.lists()
        ) ?? []

      const optimisticNext = upsertRole(previous, input)
      setMockDepartmentRolesStore(optimisticNext)
      queryClient.setQueryData<DepartmentRoleWithChildren[]>(
        departmentRoleKeys.lists(),
        optimisticNext
      )

      return { previous }
    },
    onSuccess: (next) => {
      queryClient.setQueryData<DepartmentRoleWithChildren[]>(
        departmentRoleKeys.lists(),
        next
      )
      // Also keep the store aligned with whatever TanStack has as source of truth.
      setMockDepartmentRolesStore(next)
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) {
        setMockDepartmentRolesStore(ctx.previous)
        queryClient.setQueryData(departmentRoleKeys.lists(), ctx.previous)
      }
    },
    // No invalidation needed for mock store; keeps UI stable.
  })
}

