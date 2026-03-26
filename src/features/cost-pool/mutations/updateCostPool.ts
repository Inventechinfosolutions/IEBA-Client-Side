import { useMutation, useQueryClient } from "@tanstack/react-query"

import { costPoolKeys } from "../keys"
import { costPoolStoreUpdate } from "../queries/getCostPools"
import type { CostPoolRow, CostPoolUpsertFormValues } from "../types"

type UpdateCostPoolInput = {
  id: string
  values: CostPoolUpsertFormValues
}

export function useUpdateCostPool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateCostPoolInput) => input,
    onSuccess: ({ id, values }) => {
      costPoolStoreUpdate(id, {
        costPool: values.costPool,
        department: values.department,
        active: values.active,
        assignedActivityIds: values.assignedActivityIds,
      })

      queryClient.setQueryData<CostPoolRow[]>(costPoolKeys.lists(), (prev) => {
        if (!prev) return prev
        return prev.map((row) =>
          row.id === id
            ? {
                ...row,
                costPool: values.costPool,
                department: values.department,
                active: values.active,
                assignedActivityIds: values.assignedActivityIds,
              }
            : row
        )
      })
    },
  })
}

