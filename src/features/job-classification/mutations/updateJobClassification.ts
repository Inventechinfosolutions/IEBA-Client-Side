import { useMutation, useQueryClient } from "@tanstack/react-query"

import { jobClassificationKeys } from "../keys"
import { updateMockJobClassification } from "../mock"
import type { UpdateJobClassificationInput, JobClassificationRow } from "../types"

async function updateJobClassification(input: UpdateJobClassificationInput): Promise<JobClassificationRow> {
  return updateMockJobClassification(input)
}

export function useUpdateJobClassification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateJobClassificationInput) =>
      updateJobClassification(input),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: jobClassificationKeys.lists(),
      })
      await queryClient.invalidateQueries({
        queryKey: jobClassificationKeys.detail(variables.id),
      })
    },
  })
}
