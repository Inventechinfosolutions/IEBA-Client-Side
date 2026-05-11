import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { queryClient } from "@/main"

import {
  updateUsersOnCostPool,
  unassignUserFromCostPool,
  assertAssignableActivityDepartmentIdsForUpdate,
  updateCostPool,
} from "../api/costPoolApi"
import { CostPoolStatus } from "../enums/cost-pool.enum"
import { costPoolKeys } from "../keys"
import type { CostPoolUpsertFormValues } from "../types"

type UpdateCostPoolInput = {
  id: number
  values: CostPoolUpsertFormValues
  oldAssignedUsers?: { id: string; assignmentId?: number }[]
}

export function useUpdateCostPool() {
  return useMutation({
    mutationFn: async ({ id, values, oldAssignedUsers = [] }: UpdateCostPoolInput) => {
      const activityDepartmentIds = await assertAssignableActivityDepartmentIdsForUpdate(
        id,
        values.departmentId,
        values.assignedActivityDepartmentIds,
      )
      const costPool = await updateCostPool(id, {
        name: values.costPool.trim(),
        status: values.active ? CostPoolStatus.ACTIVE : CostPoolStatus.INACTIVE,
        departmentId: values.departmentId,
        activityDepartmentIds,
      })

      // Handle individual DELETEs for removed users
      const newUserIds = new Set(values.assignedUserIds)
      const removedUsers = oldAssignedUsers.filter(u => u.assignmentId && !newUserIds.has(u.id))
      
      for (const u of removedUsers) {
        if (u.assignmentId) {
          await unassignUserFromCostPool(u.assignmentId)
        }
      }

      // Sync remaining/new users using PUT
      const res = await updateUsersOnCostPool({
        costPoolId: id,
        departmentId: values.departmentId,
        users: values.assignedUserIds,
      })

      toast.success("Cost pool updated successfully")

      return costPool
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: costPoolKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: costPoolKeys.detail(variables.id) })
      void queryClient.invalidateQueries({
        queryKey: costPoolKeys.activityPicklist(variables.values.departmentId),
      })
    },
  })
}
