import { useMutation, useQueryClient } from "@tanstack/react-query"

import { jobPoolKeys } from "../keys"
import { createMockJobPool } from "../mock"
import type { CreateJobPoolInput, JobPoolRow } from "../types"

async function createJobPool(input: CreateJobPoolInput): Promise<JobPoolRow> {
  return createMockJobPool(input)
}

export function useCreateJobPool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateJobPoolInput) => createJobPool(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: jobPoolKeys.lists(),
      })
    },
  })
}
