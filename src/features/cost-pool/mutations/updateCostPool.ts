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
import type { CostPoolUpsertFormValues, CreateCostPoolRequestDto } from "../types"

type UpdateCostPoolInput = {
  id: number
  values: CostPoolUpsertFormValues
  initialValues: CostPoolUpsertFormValues
  oldAssignedUsers?: { id: string; assignmentId?: number }[]
  oldAssignedActivities?: { activityDepartmentId: number; id: number }[]
}

export function useUpdateCostPool() {
  return useMutation({
    mutationFn: async ({ id, values, initialValues, oldAssignedUsers = [], oldAssignedActivities = [] }: UpdateCostPoolInput) => {
      const updateBody: Partial<CreateCostPoolRequestDto> = {}

      if (values.costPool.trim() !== initialValues.costPool.trim()) {
        updateBody.name = values.costPool.trim()
      }

      const initialStatus = initialValues.active ? CostPoolStatus.ACTIVE : CostPoolStatus.INACTIVE
      const currentStatus = values.active ? CostPoolStatus.ACTIVE : CostPoolStatus.INACTIVE
      if (currentStatus !== initialStatus) {
        updateBody.status = currentStatus
      }

      if (values.departmentId !== initialValues.departmentId) {
        updateBody.departmentId = values.departmentId
      }

      let costPool = null
      if (Object.keys(updateBody).length > 0) {
        costPool = await updateCostPool(id, updateBody)
      }

      // Handle activities only if they changed
      const activitiesChanged =
        values.assignedActivityDepartmentIds.length !== initialValues.assignedActivityDepartmentIds.length ||
        !values.assignedActivityDepartmentIds.every((id) => initialValues.assignedActivityDepartmentIds.includes(id))

      if (activitiesChanged) {
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
      }

      // Handle users only if they changed
      const usersChanged =
        values.assignedUserIds.length !== initialValues.assignedUserIds.length ||
        !values.assignedUserIds.every((uid) => initialValues.assignedUserIds.includes(uid))

      if (usersChanged) {
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
      }

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
