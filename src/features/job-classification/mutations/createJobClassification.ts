import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/main"

import { jobClassificationKeys } from "../keys"
import { createJobClassification } from "../api/jobclassification"
import type { CreateJobClassificationInput, JobClassificationRow } from "../types"

async function createJobClassificationMutation(input: CreateJobClassificationInput): Promise<JobClassificationRow> {
  return createJobClassification(input.values)
}

export function useCreateJobClassification() {
  return useMutation({
    mutationFn: (input: CreateJobClassificationInput) => createJobClassificationMutation(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: jobClassificationKeys.lists(),
      })
    },
  })
}
