import { useMutation, useQueryClient } from "@tanstack/react-query"

import { jobPoolKeys } from "../keys"
import { updateMockJobPool } from "../mock"
import type { UpdateJobPoolInput, JobPoolRow } from "../types"

async function updateJobPool(input: UpdateJobPoolInput): Promise<JobPoolRow> {
  return updateMockJobPool(input)
}

export function useUpdateJobPool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateJobPoolInput) => updateJobPool(input),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: jobPoolKeys.lists(),
      })
      await queryClient.invalidateQueries({
        queryKey: jobPoolKeys.detail(variables.id),
      })
    },
  })
}
