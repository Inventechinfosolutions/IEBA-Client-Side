import { useMutation, useQueryClient } from "@tanstack/react-query"

import { costPoolKeys } from "../keys"
import { costPoolStoreAdd } from "../queries/getCostPools"
import type { CostPoolRow, CostPoolUpsertFormValues } from "../types"

type CreateCostPoolInput = {
  values: CostPoolUpsertFormValues
}

function buildId() {
  return `cost-pool-${Math.random().toString(16).slice(2)}`
}

export function useCreateCostPool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateCostPoolInput) => input,
    onSuccess: ({ values }) => {
      const nextRow: CostPoolRow = {
        id: buildId(),
        costPool: values.costPool,
        department: values.department,
        active: values.active,
        assignedActivityIds: values.assignedActivityIds,
      }

      costPoolStoreAdd(nextRow)
      queryClient.setQueryData<CostPoolRow[]>(costPoolKeys.lists(), (prev) =>
        prev ? [nextRow, ...prev] : [nextRow]
      )
    },
  })
}

