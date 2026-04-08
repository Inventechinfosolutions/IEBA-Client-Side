import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/main"

import {
  assertAssignableActivityDepartmentIdsForUpdate,
  updateCostPool,
} from "../api/costPoolApi"
import { CostPoolStatus } from "../enums/cost-pool.enum"
import { costPoolKeys } from "../keys"
import type { CostPoolUpsertFormValues } from "../types"

type UpdateCostPoolInput = {
  id: number
  values: CostPoolUpsertFormValues
}

export function useUpdateCostPool() {
  return useMutation({
    mutationFn: async ({ id, values }: UpdateCostPoolInput) => {
      const activityDepartmentIds = await assertAssignableActivityDepartmentIdsForUpdate(
        id,
        values.departmentId,
        values.assignedActivityDepartmentIds,
      )
      return updateCostPool(id, {
        name: values.costPool.trim(),
        status: values.active ? CostPoolStatus.ACTIVE : CostPoolStatus.INACTIVE,
        departmentId: values.departmentId,
        activityDepartmentIds,
      })
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
