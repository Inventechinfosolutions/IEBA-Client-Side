import { useMutation, useQueryClient } from "@tanstack/react-query"

import { jobClassificationKeys } from "../keys"
import { createMockJobClassification } from "../mock"
import type { CreateJobClassificationInput, JobClassificationRow } from "../types"

async function createJobClassification(input: CreateJobClassificationInput): Promise<JobClassificationRow> {
  return createMockJobClassification(input)
}

export function useCreateJobClassification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateJobClassificationInput) =>
      createJobClassification(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: jobClassificationKeys.lists(),
      })
    },
  })
}
