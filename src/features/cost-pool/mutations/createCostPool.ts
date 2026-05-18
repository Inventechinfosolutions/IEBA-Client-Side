import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { queryClient } from "@/main"

import { createUsersOnCostPool, createCostPool } from "../api/costPoolApi"
import { CostPoolStatus } from "../enums/cost-pool.enum"
import { costPoolKeys } from "../keys"
import type { CostPoolUpsertFormValues } from "../types"

type CreateCostPoolInput = {
  values: CostPoolUpsertFormValues
}

export function useCreateCostPool() {
  return useMutation({
    mutationFn: async ({ values }: CreateCostPoolInput) => {
      const costPool = await createCostPool({
        name: values.costPool.trim(),
        status: values.active ? CostPoolStatus.ACTIVE : CostPoolStatus.INACTIVE,
        departmentId: values.departmentId,
        activityDepartmentIds: values.assignedActivityDepartmentIds,
        // users: values.assignedUserIds, // Removed from main call to satisfy separate API requirement
      })

      if (values.assignedUserIds.length > 0) {
        await createUsersOnCostPool({
          costPoolId: costPool.id,
          departmentId: values.departmentId,
          users: values.assignedUserIds,
        })
      }
      
      toast.success("Cost pool created successfully")

      return costPool
    },
    onSuccess: (data, { values }) => {
      void queryClient.invalidateQueries({ queryKey: costPoolKeys.lists() })
      queryClient.removeQueries({
        queryKey: costPoolKeys.activityPicklist(values.departmentId),
      })
      if (data.id > 0) {
        queryClient.removeQueries({ queryKey: costPoolKeys.detail(data.id) })
      }
    },
  })
}
