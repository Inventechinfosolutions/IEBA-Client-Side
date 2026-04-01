import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/main"

import { jobClassificationKeys } from "../keys"
import { updateJobClassification } from "../api/jobclassification"
import type { UpdateJobClassificationInput, JobClassificationRow } from "../types"

async function updateJobClassificationMutation(input: UpdateJobClassificationInput): Promise<JobClassificationRow> {
  return updateJobClassification(input.id, input.values)
}

export function useUpdateJobClassification() {
  return useMutation({
    mutationFn: (input: UpdateJobClassificationInput) => updateJobClassificationMutation(input),
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
