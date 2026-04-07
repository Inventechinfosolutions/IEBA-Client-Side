import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/main"

import { assertAssignableActivityDepartmentIdsForCreate, createCostPool } from "../api/costPoolApi"
import { CostPoolStatus } from "../enums/cost-pool.enum"
import { costPoolKeys } from "../keys"
import type { CostPoolActivityPickRow, CostPoolUpsertFormValues } from "../types"

type CreateCostPoolInput = {
  values: CostPoolUpsertFormValues
}

export function useCreateCostPool() {
  return useMutation({
    mutationFn: async ({ values }: CreateCostPoolInput) => {
      const picklistKey = costPoolKeys.activityPicklist(values.departmentId)
      const cachedPicklist = queryClient.getQueryData<CostPoolActivityPickRow[]>(picklistKey)
      const activityDepartmentIds = await assertAssignableActivityDepartmentIdsForCreate(
        values.departmentId,
        values.assignedActivityDepartmentIds,
        cachedPicklist,
      )
      return createCostPool({
        name: values.costPool.trim(),
        status: values.active ? CostPoolStatus.ACTIVE : CostPoolStatus.INACTIVE,
        departmentId: values.departmentId,
        activityDepartmentIds,
      })
    },
    onSuccess: (data, { values }) => {
      // Do not use costPoolKeys.all — that also invalidates detail queries and can refetch GET /costpool/:id.
      void queryClient.invalidateQueries({ queryKey: costPoolKeys.lists() })
      void queryClient.invalidateQueries({
        queryKey: costPoolKeys.activityPicklist(values.departmentId),
      })
      if (data.id > 0) {
        queryClient.removeQueries({ queryKey: costPoolKeys.detail(data.id) })
      }
    },
  })
}
