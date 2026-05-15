import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { queryClient } from "@/main"

import {
  updateUsersOnCostPool,
  unassignUserFromCostPool,
  updateActivitiesOnCostPool,
  unassignActivityFromCostPool,
  updateCostPool,
} from "../api/costPoolApi"
import { CostPoolStatus } from "../enums/cost-pool.enum"
import { costPoolKeys } from "../keys"
import type { CostPoolUpsertFormValues } from "../types"

type UpdateCostPoolInput = {
  id: number
  values: CostPoolUpsertFormValues
  oldAssignedUsers?: { id: string; assignmentId?: number }[]
  oldAssignedActivities?: { activityDepartmentId: number; id: number }[]
}

export function useUpdateCostPool() {
  return useMutation({
    mutationFn: async ({ id, values, oldAssignedUsers = [], oldAssignedActivities = [] }: UpdateCostPoolInput) => {
      const costPool = await updateCostPool(id, {
        name: values.costPool.trim(),
        status: values.active ? CostPoolStatus.ACTIVE : CostPoolStatus.INACTIVE,
        departmentId: values.departmentId,
      })

      // Handle individual DELETEs for removed activities
      const newActivityIds = new Set(values.assignedActivityDepartmentIds)
      const removedActivities = oldAssignedActivities.filter(a => a.id > 0 && !newActivityIds.has(a.activityDepartmentId))

      for (const a of removedActivities) {
        if (a.id > 0) {
          await unassignActivityFromCostPool(a.id)
        }
      }

      // Sync remaining/new activities using PUT
      await updateActivitiesOnCostPool({
        costPoolId: id,
        departmentId: values.departmentId,
        activityDepartmentIds: values.assignedActivityDepartmentIds,
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
      await updateUsersOnCostPool({
        costPoolId: id,
        departmentId: values.departmentId,
        users: values.assignedUserIds,
      })

      toast.success("Cost pool updated successfully")

      return costPool
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: costPoolKeys.lists() })
      queryClient.removeQueries({ queryKey: costPoolKeys.detail(variables.id) })
      queryClient.removeQueries({
        queryKey: costPoolKeys.activityPicklist(variables.values.departmentId),
      })
    },
  })
}
